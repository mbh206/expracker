// app/expenses/_components/ExpenseAiInsight.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRateLimitedApi } from '../../../lib/hooks/useRateLimitApi'; // Fixed import path
import RateLimitAlert from '@/components/RateLimitAlert';

interface Expense {
	id: string;
	amount: number;
	description: string;
	date: string | Date;
	category: string;
}

interface ExpenseAiInsightProps {
	expense: Expense;
	onClose: () => void;
}

export default function ExpenseAiInsight({
	expense,
	onClose,
}: ExpenseAiInsightProps) {
	const [insights, setInsights] = useState<string[]>([]);
	const [userQuestion, setUserQuestion] = useState('');
	const [conversation, setConversation] = useState<
		{ role: string; content: string }[]
	>([]);
	// Prevent multiple API calls with one ref
	const [initialFetchCompleted, setInitialFetchCompleted] = useState(false);

	// Use our custom hook for the initial insights
	const {
		data: initialInsightsData,
		loading: initialInsightsLoading,
		error: initialInsightsError,
		rateLimitState: initialInsightsRateLimit,
		executeRequest: fetchInitialInsights,
	} = useRateLimitedApi<{ answer: string }>('/api/advice/llm-analyze');

	// Use our custom hook for asking questions
	const {
		data: questionData,
		loading: questionLoading,
		error: questionError,
		rateLimitState: questionRateLimit,
		executeRequest: askQuestion,
	} = useRateLimitedApi<{ answer: string }>('/api/advice/llm-analyze');

	// Combine rate limit states
	const isRateLimited =
		initialInsightsRateLimit.isRateLimited || questionRateLimit.isRateLimited;
	const rateLimitReset = Math.max(
		initialInsightsRateLimit.rateLimitReset || 0,
		questionRateLimit.rateLimitReset || 0
	);
	const retryAfter = rateLimitReset
		? Math.max(rateLimitReset - Math.floor(Date.now() / 1000), 0)
		: 3600; // Default to 1 hour

	// Fetch initial insights - using useCallback to prevent recreation on each render
	const loadInitialInsights = useCallback(() => {
		if (!initialFetchCompleted && expense?.id) {
			setInitialFetchCompleted(true); // Mark as completed to prevent additional calls
			fetchInitialInsights({
				method: 'POST',
				data: {
					expenseId: expense.id,
					question:
						'What are the key insights about this expense? How does it compare to my typical spending?',
				},
			});
		}
	}, [expense?.id, fetchInitialInsights, initialFetchCompleted]);

	// Fetch insights when component mounts
	useEffect(() => {
		loadInitialInsights();
	}, [loadInitialInsights]);

	// Update insights when data changes
	useEffect(() => {
		if (initialInsightsData && !initialInsightsLoading) {
			// Check if the response contains an array or a string
			if (typeof initialInsightsData.answer === 'string') {
				// Split on double newlines or handle as a single string
				const insightArray = initialInsightsData.answer.includes('\n\n')
					? initialInsightsData.answer
							.split('\n\n')
							.filter((line) => line.trim() !== '')
					: [initialInsightsData.answer];
				setInsights(insightArray);
			} else if (Array.isArray(initialInsightsData.answer)) {
				setInsights(initialInsightsData.answer);
			} else {
				setInsights([
					'Analysis complete. Ask questions about this expense below.',
				]);
			}
		}
	}, [initialInsightsData, initialInsightsLoading]);

	// Update conversation when question data changes
	useEffect(() => {
		if (
			questionData &&
			!questionLoading &&
			conversation.length > 0 &&
			conversation[conversation.length - 1].role === 'user'
		) {
			// Add AI response to conversation
			setConversation((prev) => [
				...prev,
				{ role: 'assistant', content: questionData.answer },
			]);
		}
	}, [questionData, questionLoading, conversation]);

	const handleSubmitQuestion = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!userQuestion.trim() || isRateLimited || questionLoading) return;

		const question = userQuestion.trim();
		setUserQuestion('');

		// Add user question to conversation
		setConversation((prev) => [...prev, { role: 'user', content: question }]);

		// Use our rate-limited API hook
		await askQuestion({
			method: 'POST',
			data: {
				expenseId: expense.id,
				question,
				conversationHistory: conversation,
			},
		});
	};

	return (
		<div className='fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4'>
			<div className='bg-white rounded-lg max-w-2xl w-full max-h-[80vh] flex flex-col'>
				<div className='p-4 border-b border-gray-200 flex justify-between items-center'>
					<h2 className='text-xl font-semibold text-gray-900'>
						AI Insights for Your Expense
					</h2>
					<button
						onClick={onClose}
						className='text-gray-500 hover:text-gray-700'>
						<svg
							className='w-5 h-5'
							fill='none'
							stroke='currentColor'
							viewBox='0 0 24 24'
							xmlns='http://www.w3.org/2000/svg'>
							<path
								strokeLinecap='round'
								strokeLinejoin='round'
								strokeWidth={2}
								d='M6 18L18 6M6 6l12 12'
							/>
						</svg>
					</button>
				</div>

				<div className='p-4 border-b border-gray-200'>
					<div className='flex justify-between mb-2'>
						<span className='font-medium text-gray-700'>Description:</span>
						<span className='text-gray-900'>{expense.description}</span>
					</div>
					<div className='flex justify-between mb-2'>
						<span className='font-medium text-gray-700'>Amount:</span>
						<span className='text-gray-900'>${expense.amount.toFixed(2)}</span>
					</div>
					<div className='flex justify-between mb-2'>
						<span className='font-medium text-gray-700'>Category:</span>
						<span className='text-gray-900'>{expense.category}</span>
					</div>
					<div className='flex justify-between mb-2'>
						<span className='font-medium text-gray-700'>Date:</span>
						<span className='text-gray-900'>
							{new Date(expense.date).toLocaleDateString()}
						</span>
					</div>
				</div>

				<div className='flex-grow overflow-auto p-4'>
					{/* Rate Limit Alert - Show when rate limited */}
					{isRateLimited && (
						<RateLimitAlert
							retryAfter={retryAfter}
							message="You've reached the maximum number of AI analysis requests for now."
						/>
					)}

					{initialInsightsLoading ? (
						<div className='flex items-center justify-center h-full'>
							<div className='w-8 h-8 border-4 border-blue-200 dark:border-blue-700 border-t-blue-600 rounded-full animate-spin'></div>
							<p className='ml-2 text-gray-600'>Analyzing your expense...</p>
						</div>
					) : initialInsightsError ? (
						<div className='text-center py-8 text-gray-500'>
							<p>There was an error analyzing your expense.</p>
							<p className='mt-2 text-sm text-red-500'>
								{initialInsightsError.message}
							</p>
						</div>
					) : (
						<div className='space-y-4'>
							<h3 className='font-semibold text-lg'>Generated Insights:</h3>
							<ul className='space-y-2 p-0'>
								{insights.map((insight, index) => (
									<li
										key={index}
										className='p-3 bg-blue-50 rounded-md flex'>
										<span className='text-blue-600'>💡</span>
										<span className='text-gray-800'>{insight}</span>
									</li>
								))}
							</ul>

							<div className='mt-6'>
								<h3 className='font-semibold text-lg mb-2'>
									Ask about this expense:
								</h3>
								<div className='bg-gray-50 p-4 rounded-md max-h-60 overflow-auto mb-3'>
									{conversation.length === 0 ? (
										<p className='text-gray-500 italic'>
											Ask questions like "How does this compare to my other
											expenses?" or "Is this a normal amount to spend on{' '}
											{expense.category}?"
										</p>
									) : (
										<div className='space-y-3'>
											{conversation.map((message, index) => (
												<div
													key={index}
													className={`flex ${
														message.role === 'user'
															? 'justify-end'
															: 'justify-start'
													}`}>
													<div
														className={`max-w-[80%] p-3 rounded-lg ${
															message.role === 'user'
																? 'bg-blue-100 text-blue-800'
																: 'bg-gray-100 text-gray-800'
														}`}>
														{message.content}
													</div>
												</div>
											))}

											{/* Show loading state for question */}
											{questionLoading && (
												<div className='flex justify-start'>
													<div className='max-w-[80%] p-3 rounded-lg bg-gray-100'>
														<div className='flex items-center space-x-2'>
															<div
																className='w-2 h-2 bg-gray-400 rounded-full animate-bounce'
																style={{ animationDelay: '0ms' }}></div>
															<div
																className='w-2 h-2 bg-gray-400 rounded-full animate-bounce'
																style={{ animationDelay: '150ms' }}></div>
															<div
																className='w-2 h-2 bg-gray-400 rounded-full animate-bounce'
																style={{ animationDelay: '300ms' }}></div>
														</div>
													</div>
												</div>
											)}

											{/* Show error message if asking question fails */}
											{questionError &&
												!questionLoading &&
												conversation[conversation.length - 1].role ===
													'user' && (
													<div className='flex justify-start'>
														<div className='max-w-[80%] p-3 rounded-lg bg-red-100 text-red-800'>
															Sorry, I couldn't process your question.{' '}
															{questionError.message}
														</div>
													</div>
												)}
										</div>
									)}
								</div>
								<form
									onSubmit={handleSubmitQuestion}
									className='flex'>
									<input
										type='text'
										value={userQuestion}
										onChange={(e) => setUserQuestion(e.target.value)}
										className='flex-grow p-2 border border-gray-300 rounded-l-md bg-white text-gray-900'
										placeholder={
											isRateLimited
												? 'Rate limit reached. Try again later.'
												: 'Ask a question about this expense...'
										}
										disabled={questionLoading || isRateLimited}
									/>
									<button
										type='submit'
										disabled={
											questionLoading || !userQuestion.trim() || isRateLimited
										}
										className='px-4 py-2 bg-blue-600 text-white border-none rounded-r-md hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed'>
										{questionLoading ? '...' : 'Ask'}
									</button>
								</form>
							</div>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
