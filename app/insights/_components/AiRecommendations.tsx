// app/advice/_components/AiRecommendations.tsx
'use client';

import { useState } from 'react';

interface AiRecommendationsProps {
	recommendations: string[];
	isLoading?: boolean;
}

export default function AiRecommendations({
	recommendations,
	isLoading = false,
}: AiRecommendationsProps) {
	const [activeTab, setActiveTab] = useState<
		'savings' | 'trends' | 'budget' | 'all'
	>('all');

	// Group recommendations by category
	const categorizedRecommendations = {
		savings: recommendations.filter(
			(rec) =>
				rec.toLowerCase().includes('saving') ||
				rec.toLowerCase().includes('reduc') ||
				rec.toLowerCase().includes('cut') ||
				rec.toLowerCase().includes('emergency fund')
		),
		trends: recommendations.filter(
			(rec) =>
				rec.toLowerCase().includes('increas') ||
				rec.toLowerCase().includes('decreas') ||
				rec.toLowerCase().includes('pattern') ||
				rec.toLowerCase().includes('spend')
		),
		budget: recommendations.filter(
			(rec) =>
				rec.toLowerCase().includes('budget') ||
				rec.toLowerCase().includes('allocat') ||
				rec.toLowerCase().includes('percent') ||
				rec.toLowerCase().includes('recommend')
		),
	};

	// Get recommendations based on active tab
	const getFilteredRecommendations = () => {
		if (activeTab === 'all') return recommendations;
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
			return '👍';
		if (lower.includes('increase') || lower.includes('increased')) return '📈';
		if (lower.includes('decrease') || lower.includes('decreased')) return '📉';
		if (lower.includes('budget')) return '💰';
		if (lower.includes('saving') || lower.includes('save')) return '🏦';
		if (lower.includes('emergency')) return '🚨';
		return '💡';
	};

	// Get background color class based on recommendation content
	const getBackgroundColorClass = (recommendation: string) => {
		const lower = recommendation.toLowerCase();
		if (
			lower.includes('great job') ||
			lower.includes('good job') ||
			lower.includes('reduced')
		)
			return 'bg-green-50';
		if (lower.includes('increase') || lower.includes('increased'))
			return 'bg-yellow-50';
		if (lower.includes('decrease') || lower.includes('decreased'))
			return 'bg-blue-50';
		if (lower.includes('budget')) return 'bg-purple-50';
		if (lower.includes('saving') || lower.includes('save')) return 'bg-teal-50';
		if (lower.includes('emergency')) return 'bg-red-50';
		return 'bg-gray-50';
	};

	return (
		<div className='bg-white p-6 rounded-lg shadow-md'>
			<div className='flex justify-between items-center mb-4'>
				<h3 className='text-lg font-semibold'>AI Recommendations</h3>
				<div className='flex space-x-2'>
					<button
						onClick={() => setActiveTab('all')}
						className={`px-3 py-1 rounded-md text-sm ${
							activeTab === 'all'
								? 'bg-blue-100 text-blue-800'
								: 'bg-gray-100 text-gray-700'
						}`}>
						All
					</button>
					<button
						onClick={() => setActiveTab('savings')}
						className={`px-3 py-1 rounded-md text-sm ${
							activeTab === 'savings'
								? 'bg-blue-100 text-blue-800'
								: 'bg-gray-100 text-gray-700'
						}`}>
						Savings
					</button>
					<button
						onClick={() => setActiveTab('trends')}
						className={`px-3 py-1 rounded-md text-sm ${
							activeTab === 'trends'
								? 'bg-blue-100 text-blue-800'
								: 'bg-gray-100 text-gray-700'
						}`}>
						Trends
					</button>
					<button
						onClick={() => setActiveTab('budget')}
						className={`px-3 py-1 rounded-md text-sm ${
							activeTab === 'budget'
								? 'bg-blue-100 text-blue-800'
								: 'bg-gray-100 text-gray-700'
						}`}>
						Budget
					</button>
				</div>
			</div>

			{isLoading ? (
				<div className='flex justify-center items-center h-64'>
					<div className='animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500'></div>
				</div>
			) : recommendations.length === 0 ? (
				<div className='text-center py-8'>
					<p className='text-gray-500'>No recommendations available yet.</p>
					<p className='text-gray-500 mt-2'>
						Add more expenses to get personalized AI insights.
					</p>
				</div>
			) : (
				<div className='space-y-4'>
					{getFilteredRecommendations().map((recommendation, index) => (
						<div
							key={index}
							className={`p-4 rounded-lg ${getBackgroundColorClass(
								recommendation
							)}`}>
							<div className='flex items-start'>
								<span className='text-2xl mr-3'>
									{getRecommendationIcon(recommendation)}
								</span>
								<p className='text-gray-800'>{recommendation}</p>
							</div>
						</div>
					))}
				</div>
			)}
		</div>
	);
}
