'use client';

import { useState } from 'react';
import axios from 'axios';

interface AiRecommendationsProps {
	recommendations: string[];
	isLoading: boolean;
}

export default function AiRecommendations({
	recommendations,
	isLoading,
}: AiRecommendationsProps) {
	const [isRefreshing, setIsRefreshing] = useState(false);
	const [currentRecommendations, setCurrentRecommendations] =
		useState<string[]>(recommendations);

	const refreshRecommendations = async () => {
		setIsRefreshing(true);
		try {
			const response = await axios.get('/api/advice?refresh=true');
			setCurrentRecommendations(response.data.recommendations);
		} catch (error) {
			console.error('Failed to refresh recommendations:', error);
		} finally {
			setIsRefreshing(false);
		}
	};

	return (
		<div>
			{isLoading || isRefreshing ? (
				<div className='flex flex-col items-center justify-center py-8'>
					<div className='w-12 h-12 border-4 border-blue-200 dark:border-blue-700 border-t-blue-600 dark:border-t-blue-400 rounded-full animate-spin'></div>
					<p className='mt-4 text-gray-600 dark:text-gray-400'>
						{isRefreshing
							? 'Refreshing recommendations...'
							: 'Analyzing your spending habits...'}
					</p>
				</div>
			) : currentRecommendations.length === 0 ? (
				<div className='text-center py-8 text-gray-500 dark:text-gray-400'>
					<p>No personalized recommendations available yet.</p>
					<p className='mt-2'>
						Continue tracking your expenses for more insights.
					</p>
				</div>
			) : (
				<div className='space-y-4'>
					<ul className='space-y-2'>
						{currentRecommendations.map((recommendation, index) => (
							<li
								key={index}
								className='p-3 bg-gray-50 dark:bg-gray-700 rounded-md flex'>
								<span className='text-blue-600 dark:text-blue-400 mr-2'>
									💡
								</span>
								<span className='text-gray-800 dark:text-gray-200'>
									{recommendation}
								</span>
							</li>
						))}
					</ul>

					<div className='mt-6 flex justify-end'>
						<button
							onClick={refreshRecommendations}
							disabled={isRefreshing}
							className='px-4 py-2 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 disabled:text-gray-400 dark:disabled:text-gray-600'>
							{isRefreshing ? 'Refreshing...' : 'Get New Recommendations'}
						</button>
					</div>
				</div>
			)}
		</div>
	);
}
