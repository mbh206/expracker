// app/advice/_components/AiRecommendations.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRateLimitedApi } from '../../../lib/hooks/useRateLimitApi';
import RateLimitAlert from '@/components/RateLimitAlert';
import { useTheme } from '@/contexts/ThemeContext';

interface AiRecommendationsProps {
	recommendations: string[];
	isLoading: boolean;
}

export default function AiRecommendations({
	recommendations,
	isLoading,
}: AiRecommendationsProps) {
	const { theme } = useTheme();
	const [currentRecommendations, setCurrentRecommendations] =
		useState<string[]>(recommendations);
	const [activeTab, setActiveTab] = useState<
		'savings' | 'trends' | 'budget' | 'all'
	>('all');

	// Use our custom hook for API requests with rate limiting
	const {
		data,
		loading: isRefreshing,
		rateLimitState,
		executeRequest: refreshRecommendations,
	} = useRateLimitedApi<{ recommendations: string[] }>('/api/advice');

	// Calculate retry seconds from rate limit reset time
	const retryAfter = rateLimitState.rateLimitReset
		? Math.max(rateLimitState.rateLimitReset - Math.floor(Date.now() / 1000), 0)
		: 3600; // Default to 1 hour

	// Update recommendations when the prop changes
	useEffect(() => {
		if (recommendations && recommendations.length > 0) {
			setCurrentRecommendations(recommendations);
		}
	}, [recommendations]);

	// Update recommendations when data from API changes
	useEffect(() => {
		if (data?.recommendations && data.recommendations.length > 0) {
			setCurrentRecommendations(data.recommendations);
		}
	}, [data]);

	// Handle refresh request
	const handleRefresh = async () => {
		if (rateLimitState.isRateLimited) return;

		await refreshRecommendations({
			method: 'GET',
			params: { refresh: 'true' },
		});
	};

	// Group recommendations by category
	const categorizedRecommendations = {
		savings: currentRecommendations.filter(
			(rec) =>
				rec.toLowerCase().includes('saving') ||
				rec.toLowerCase().includes('reduc') ||
				rec.toLowerCase().includes('cut') ||
				rec.toLowerCase().includes('emergency fund')
		),
		trends: currentRecommendations.filter(
			(rec) =>
				rec.toLowerCase().includes('increas') ||
				rec.toLowerCase().includes('decreas') ||
				rec.toLowerCase().includes('pattern') ||
				rec.toLowerCase().includes('spend')
		),
		budget: currentRecommendations.filter(
			(rec) =>
				rec.toLowerCase().includes('budget') ||
				rec.toLowerCase().includes('allocat') ||
				rec.toLowerCase().includes('percent') ||
				rec.toLowerCase().includes('recommend')
		),
	};

	// Get recommendations based on active tab
	const getFilteredRecommendations = () => {
		if (activeTab === 'all') return currentRecommendations;
		return categorizedRecommendations[activeTab];
	};

	// Get recommendation icon based on content
	const getRecommendationIcon = (recommendation: string) => {
		const lower = recommendation.toLowerCase();
		if (
			lower.includes('great job') ||
			lower.includes('good job') ||
			lower.includes('reduced')
		)
			return '🎉';
		if (lower.includes('increas') && !lower.includes('decreased')) return '📈';
		if (lower.includes('decreas')) return '📉';
		if (lower.includes('subscription') || lower.includes('recurring'))
			return '🔄';
		if (lower.includes('goal') || lower.includes('target')) return '🎯';
		if (lower.includes('save') || lower.includes('saving')) return '💰';
		if (lower.includes('budget')) return '📊';
		if (lower.includes('pattern') || lower.includes('habit')) return '📆';
		return '💡';
	};

	// Get background color class based on recommendation content
	const getBackgroundColorClass = (recommendation: string) => {
		const lower = recommendation.toLowerCase();
		// Positive recommendations
		if (
			lower.includes('great job') ||
			lower.includes('good job') ||
			lower.includes('reduced')
		)
			return 'bg-green-50';
		// Warning recommendations
		if (
			lower.includes('higher than the recommended') ||
			lower.includes('increased by')
		)
			return 'bg-yellow-50';
		// Default
		return 'bg-gray-50';
	};

	return (
		<div>
			{/* Show rate limit alert if needed */}
			{rateLimitState.isRateLimited && (
				<RateLimitAlert
					retryAfter={retryAfter}
					message="You've reached the maximum number of recommendation refresh requests."
				/>
			)}

			{isLoading || isRefreshing ? (
				<div className='flex flex-col items-center justify-center py-8'>
					<div className='w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin'></div>
					<p className='mt-4 text-gray-600'>
						{isRefreshing
							? 'Refreshing recommendations...'
							: 'Analyzing your spending habits...'}
					</p>
				</div>
			) : currentRecommendations.length === 0 ? (
				<div className='text-center py-8 text-gray-500'>
					<p>No personalized recommendations available yet.</p>
					<p className='mt-2'>
						Continue tracking your expenses for more insights.
					</p>
				</div>
			) : (
				<div className='space-y-4'>
					{/* Category tabs */}
					<div className='flex flex-wrap rounded-md overflow-hidden'>
						<button
							onClick={() => setActiveTab('all')}
							className={`flex-1 min-w-[25%] px-2 py-2 text-xs md:text-sm font-medium ${
								activeTab === 'all'
									? 'bg-blue-300 text-blue-700'
									: 'text-gray-600 hover:bg-gray-50 '
							}`}>
							All
						</button>
						<button
							onClick={() => setActiveTab('savings')}
							className={`flex-1 min-w-[25%] px-2 py-2 text-xs md:text-sm font-medium ${
								activeTab === 'savings'
									? 'bg-blue-300 text-blue-700'
									: 'text-gray-600 hover:bg-gray-50 '
							}`}>
							Savings
						</button>
						<button
							onClick={() => setActiveTab('trends')}
							className={`flex-1 min-w-[25%] px-2 py-2 text-xs md:text-sm font-medium ${
								activeTab === 'trends'
									? 'bg-blue-300 text-blue-700'
									: 'text-gray-600 hover:bg-gray-50 '
							}`}>
							Trends
						</button>
						<button
							onClick={() => setActiveTab('budget')}
							className={`flex-1 min-w-[25%] px-2 py-2 text-xs md:text-sm font-medium ${
								activeTab === 'budget'
									? 'bg-blue-300 text-blue-700'
									: 'text-gray-600 hover:bg-gray-50 '
							}`}>
							Budget
						</button>
					</div>

					{/* Count badges */}
					<div className='flex flex-wrap gap-2 text-xs'>
						<span className='px-2 py-1 bg-blue-200 text-blue-800 rounded-full'>
							All: {currentRecommendations.length}
						</span>
						<span className='px-2 py-1 bg-green-100 text-green-800 rounded-full'>
							Savings: {categorizedRecommendations.savings.length}
						</span>
						<span className='px-2 py-1 bg-purple-100 text-purple-800 rounded-full'>
							Trends: {categorizedRecommendations.trends.length}
						</span>
						<span className='px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full'>
							Budget: {categorizedRecommendations.budget.length}
						</span>
					</div>

					{/* Recommendations list */}
					<ul className='space-y-3 pl-0'>
						{getFilteredRecommendations().map((recommendation, index) => (
							<li
								key={index}
								className={`p-3 ${getBackgroundColorClass(
									recommendation
								)} rounded-md transition-all duration-200 hover:shadow-md list-none`}>
								<div className='flex items-start'>
									<span className='text-blue-600 mr-2 mt-0.5 text-xl'>
										{getRecommendationIcon(recommendation)}
									</span>
									<span className='text-gray-800'>{recommendation}</span>
								</div>
							</li>
						))}
					</ul>

					{/* Usage info */}
					{rateLimitState.rateLimitRemaining !== null && (
						<div className='text-xs text-gray-500 mt-2 text-right'>
							Refreshes remaining: {rateLimitState.rateLimitRemaining}
						</div>
					)}

					{/* Refresh button */}
					<div className='mt-6 flex justify-end'>
						<button
							onClick={handleRefresh}
							disabled={isRefreshing || rateLimitState.isRateLimited}
							className='px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors'>
							{isRefreshing ? 'Refreshing...' : 'Get New Recommendations'}
						</button>
					</div>
				</div>
			)}
		</div>
	);
}
