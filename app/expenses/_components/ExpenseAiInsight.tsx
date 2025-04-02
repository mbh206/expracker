'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';

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
	const [isLoading, setIsLoading] = useState(true);
	const [userQuestion, setUserQuestion] = useState('');
	const [conversation, setConversation] = useState<
		{ role: string; content: string }[]
	>([]);
	const [isAskingQuestion, setIsAskingQuestion] = useState(false);

	useEffect(() => {
		fetchInsights();
	}, [expense]);

	const fetchInsights = async () => {
		setIsLoading(true);
		try {
			// Use the new LLM endpoint instead of the old one
			const response = await axios.post('/api/advice/llm-analyze', {
				expenseId: expense.id,
				question:
					'What are the key insights about this expense? How does it compare to my typical spending?',
			});

			// Check if the response contains an array or a string
			if (typeof response.data.answer === 'string') {
				// Split on double newlines or handle as a single string
				const insightArray = response.data.answer.includes('\n\n')
					? response.data.answer
							.split('\n\n')
							.filter((line) => line.trim() !== '')
					: [response.data.answer];
				setInsights(insightArray);
			} else if (Array.isArray(response.data.answer)) {
				setInsights(response.data.answer);
			} else {
				setInsights([
					'Analysis complete. Ask questions about this expense below.',
				]);
			}
		} catch (error) {
			console.error('Failed to fetch insights:', error);
			setInsights([
				"I'm currently having trouble analyzing this expense.",
				'You can still ask questions about it below or try again later.',
			]);
		} finally {
			setIsLoading(false);
		}
	};

	const handleSubmitQuestion = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!userQuestion.trim()) return;

		const question = userQuestion.trim();
		setUserQuestion('');
		setIsAskingQuestion(true);

		// Add user question to conversation
		setConversation((prev) => [...prev, { role: 'user', content: question }]);

		try {
			// Use the LLM endpoint
			const response = await axios.post('/api/advice/llm-analyze', {
				expenseId: expense.id,
				question,
				conversationHistory: conversation,
			});

			// Add AI response to conversation
			setConversation((prev) => [
				...prev,
				{ role: 'assistant', content: response.data.answer },
			]);
		} catch (error) {
			console.error('Failed to get answer:', error);
			setConversation((prev) => [
				...prev,
				{
					role: 'assistant',
					content:
						"I'm sorry, I couldn't process your question. Please try again.",
				},
			]);
		} finally {
			setIsAskingQuestion(false);
		}
	};

	return (
		<div className='fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 p-4'>
			<div className='bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[80vh] flex flex-col'>
				<div className='p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center'>
					<h2 className='text-xl font-semibold text-gray-900 dark:text-white'>
						AI Insights for Your Expense
					</h2>
					<button
						onClick={onClose}
						className='text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'>
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

				<div className='p-4 border-b border-gray-200 dark:border-gray-700'>
					<div className='flex justify-between mb-2'>
						<span className='font-medium text-gray-700 dark:text-gray-300'>
							Description:
						</span>
						<span className='text-gray-900 dark:text-white'>
							{expense.description}
						</span>
					</div>
					<div className='flex justify-between mb-2'>
						<span className='font-medium text-gray-700 dark:text-gray-300'>
							Amount:
						</span>
						<span className='text-gray-900 dark:text-white'>
							${expense.amount.toFixed(2)}
						</span>
					</div>
					<div className='flex justify-between mb-2'>
						<span className='font-medium text-gray-700 dark:text-gray-300'>
							Category:
						</span>
						<span className='text-gray-900 dark:text-white'>
							{expense.category}
						</span>
					</div>
					<div className='flex justify-between mb-2'>
						<span className='font-medium text-gray-700 dark:text-gray-300'>
							Date:
						</span>
						<span className='text-gray-900 dark:text-white'>
							{new Date(expense.date).toLocaleDateString()}
						</span>
					</div>
				</div>

				<div className='flex-grow overflow-auto p-4'>
					{isLoading ? (
						<div className='flex items-center justify-center h-full'>
							<div className='w-8 h-8 border-4 border-blue-200 dark:border-blue-700 border-t-blue-600 dark:border-t-blue-400 rounded-full animate-spin'></div>
							<p className='ml-2 text-gray-600 dark:text-gray-400'>
								Analyzing your expense...
							</p>
						</div>
					) : (
						<div className='space-y-4'>
							<h3 className='font-semibold text-lg'>Generated Insights:</h3>
							<ul className='space-y-2'>
								{insights.map((insight, index) => (
									<li
										key={index}
										className='p-3 bg-blue-50 dark:bg-blue-950/50 rounded-md flex'>
										<span className='text-blue-600 dark:text-blue-400 mr-2'>
											💡
										</span>
										<span className='text-gray-800 dark:text-gray-200'>
											{insight}
										</span>
									</li>
								))}
							</ul>

							<div className='mt-6'>
								<h3 className='font-semibold text-lg mb-2'>
									Ask about this expense:
								</h3>
								<div className='bg-gray-50 dark:bg-gray-900 p-4 rounded-md max-h-60 overflow-auto mb-3'>
									{conversation.length === 0 ? (
										<p className='text-gray-500 dark:text-gray-400 italic'>
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
																? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200'
																: 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200'
														}`}>
														{message.content}
													</div>
												</div>
											))}
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
										className='flex-grow p-2 border border-gray-300 dark:border-gray-600 rounded-l-md focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100'
										placeholder='Ask a question about this expense...'
										disabled={isAskingQuestion}
									/>
									<button
										type='submit'
										disabled={isAskingQuestion || !userQuestion.trim()}
										className='px-4 py-2 bg-blue-600 dark:bg-blue-700 text-white rounded-r-md hover:bg-blue-700 dark:hover:bg-blue-600 disabled:bg-blue-300 dark:disabled:bg-blue-800 disabled:cursor-not-allowed'>
										{isAskingQuestion ? '...' : 'Ask'}
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
