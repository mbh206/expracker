import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import prisma from '../../../lib/prismadb';
import { authOptions } from '../auth/[...nextauth]';
import {
	format,
	startOfMonth,
	endOfMonth,
	startOfWeek,
	endOfWeek,
	subMonths,
} from 'date-fns';
import {
	generateFallbackAdvice,
	generateFallbackAnswer,
} from '../../../lib/generateFallbackAdvice';

export default async function handler(
	req: NextApiRequest,
	res: NextApiResponse
) {
	const session = await getServerSession(req, res, authOptions);

	if (!session || !session.user?.email) {
		return res.status(401).json({ error: 'Unauthorized' });
	}

	// Get user ID from email
	const user = await prisma.user.findUnique({
		where: {
			email: session.user.email,
		},
		select: {
			id: true,
		},
	});

	if (!user) {
		return res.status(401).json({ error: 'User not found' });
	}

	const userId = user.id;

	// Only accept POST requests
	if (req.method !== 'POST') {
		return res.status(405).json({ error: 'Method not allowed' });
	}

	try {
		const { expenseId, question, conversationHistory = [] } = req.body;

		if (!expenseId || !question) {
			return res
				.status(400)
				.json({ error: 'Expense ID and question are required' });
		}

		// Get the specific expense
		const expense = await prisma.expense.findUnique({
			where: {
				id: expenseId,
			},
		});

		if (!expense) {
			return res.status(404).json({ error: 'Expense not found' });
		}

		if (expense.userId !== userId) {
			return res
				.status(403)
				.json({ error: 'Forbidden - you do not have access to this expense' });
		}

		// Gather relevant data for the LLM
		console.log('Gathering expense data for LLM...');
		const data = await gatherExpenseData(expense, userId);
		console.log('Data gathered successfully');

		// Format the message for the LLM
		const messages = [
			{
				role: 'system',
				content: `You are a helpful financial advisor AI that analyzes expense data to provide insights.
You'll be given details about an expense and related financial data, along with a question from the user.
Provide concise, helpful insights based on the data. Focus on patterns, comparisons, and actionable advice.
Keep responses under 150 words and be specific to the expense and data provided.`,
			},
			{
				role: 'user',
				content: `Here is the expense data:
${JSON.stringify(data.expenseData, null, 2)}

Here is the user's relevant financial history:
${JSON.stringify(data.relevantData, null, 2)}

The user's question about this expense is: "${question}"

Please provide a helpful analysis and answer the question directly.`,
			},
		];

		// Add conversation history if available
		if (conversationHistory.length > 0) {
			// Insert the conversation history before the current question
			messages.splice(1, 0, ...conversationHistory);
		}

		console.log('Calling Groq API...');
		console.log('API Key exists:', !!process.env.GROQ_API_KEY);

		try {
			// Call the Groq API - corrected URL and parameters
			const response = await fetch(
				'https://api.groq.com/openai/v1/chat/completions',
				{
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
						Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
					},
					body: JSON.stringify({
						model: 'llama-3.1-8b-instant', // Check for the correct model name
						messages: messages,
						temperature: 0.7,
						max_tokens: 300,
						stream: false, // Changed to false to handle the response normally
					}),
				}
			);

			console.log('Groq API response status:', response.status);

			const responseText = await response.text();
			console.log('Groq API raw response:', responseText);

			let responseData;
			try {
				responseData = JSON.parse(responseText);
			} catch (parseError) {
				console.error('Error parsing JSON response:', parseError);
				console.log('Falling back to built-in advice generation');

				// Generate fallback advice
				if (
					question.toLowerCase().includes('key insights') ||
					question.toLowerCase().includes('how does it compare')
				) {
					// This is the initial insights request
					const insights = generateFallbackAdvice(
						expense,
						{
							average: data.relevantData.categoryAverage,
							count: data.relevantData.categoryExpenseCount,
						},
						data.relevantData.similarExpensesCount > 0
							? await prisma.expense.findMany({
									where: {
										userId,
										description: {
											contains: expense.description.split(' ')[0],
										},
										id: { not: expense.id },
									},
									take: 10,
							  })
							: []
					);
					return res.status(200).json({ answer: insights.join('\n\n') });
				} else {
					// This is a user question
					const answer = generateFallbackAnswer(
						question,
						expense,
						{
							average: data.relevantData.categoryAverage,
							count: data.relevantData.categoryExpenseCount,
						},
						data.relevantData.similarExpensesCount > 0
							? await prisma.expense.findMany({
									where: {
										userId,
										description: {
											contains: expense.description.split(' ')[0],
										},
										id: { not: expense.id },
									},
									take: 10,
							  })
							: []
					);
					return res.status(200).json({ answer });
				}
			}

			if (responseData.error) {
				console.error('Groq API error:', responseData.error);
				console.log('Falling back to built-in advice generation');

				// Generate fallback advice
				if (
					question.toLowerCase().includes('key insights') ||
					question.toLowerCase().includes('how does it compare')
				) {
					// This is the initial insights request
					const insights = generateFallbackAdvice(
						expense,
						{
							average: data.relevantData.categoryAverage,
							count: data.relevantData.categoryExpenseCount,
						},
						data.relevantData.similarExpensesCount > 0
							? await prisma.expense.findMany({
									where: {
										userId,
										description: {
											contains: expense.description.split(' ')[0],
										},
										id: { not: expense.id },
									},
									take: 10,
							  })
							: []
					);
					return res.status(200).json({ answer: insights.join('\n\n') });
				} else {
					// This is a user question
					const answer = generateFallbackAnswer(
						question,
						expense,
						{
							average: data.relevantData.categoryAverage,
							count: data.relevantData.categoryExpenseCount,
						},
						data.relevantData.similarExpensesCount > 0
							? await prisma.expense.findMany({
									where: {
										userId,
										description: {
											contains: expense.description.split(' ')[0],
										},
										id: { not: expense.id },
									},
									take: 10,
							  })
							: []
					);
					return res.status(200).json({ answer });
				}
			}

			// Extract the response from the correct field in the API response
			const llmResponse = responseData.choices[0].message.content;
			console.log('Successfully received LLM response');
			return res.status(200).json({ answer: llmResponse });
		} catch (apiError) {
			console.error('API call error:', apiError);
			console.log('Falling back to built-in advice generation');

			// Generate fallback advice
			if (
				question.toLowerCase().includes('key insights') ||
				question.toLowerCase().includes('how does it compare')
			) {
				// This is the initial insights request
				const insights = generateFallbackAdvice(
					expense,
					{
						average: data.relevantData.categoryAverage,
						count: data.relevantData.categoryExpenseCount,
					},
					data.relevantData.similarExpensesCount > 0
						? await prisma.expense.findMany({
								where: {
									userId,
									description: { contains: expense.description.split(' ')[0] },
									id: { not: expense.id },
								},
								take: 10,
						  })
						: []
				);
				return res.status(200).json({ answer: insights.join('\n\n') });
			} else {
				// This is a user question
				const answer = generateFallbackAnswer(
					question,
					expense,
					{
						average: data.relevantData.categoryAverage,
						count: data.relevantData.categoryExpenseCount,
					},
					data.relevantData.similarExpensesCount > 0
						? await prisma.expense.findMany({
								where: {
									userId,
									description: { contains: expense.description.split(' ')[0] },
									id: { not: expense.id },
								},
								take: 10,
						  })
						: []
				);
				return res.status(200).json({ answer });
			}
		}
	} catch (error) {
		console.error('Error generating answer:', error);
		return res.status(500).json({
			error: 'Failed to generate answer',
			details: error.message,
		});
	}
}

async function gatherExpenseData(expense: any, userId: string) {
	const expenseDate = new Date(expense.date);

	// 1. Basic expense data
	const expenseData = {
		amount: expense.amount,
		description: expense.description,
		category: expense.category,
		date: format(expenseDate, 'MMMM d, yyyy'),
		isShared: !!expense.householdId,
	};

	// 2. Category averages
	const categoryExpenses = await prisma.expense.findMany({
		where: {
			userId,
			category: expense.category,
			id: { not: expense.id }, // Exclude current expense
		},
		orderBy: { date: 'desc' },
		take: 50,
	});

	const categoryAvg =
		categoryExpenses.length > 0
			? categoryExpenses.reduce((sum, e) => sum + e.amount, 0) /
			  categoryExpenses.length
			: 0;

	// 3. Similar expenses (by description)
	const similarExpenses = await prisma.expense.findMany({
		where: {
			userId,
			description: { contains: expense.description.split(' ')[0] }, // First word match
			id: { not: expense.id },
		},
		orderBy: { date: 'desc' },
		take: 20,
	});

	const similarAvg =
		similarExpenses.length > 0
			? similarExpenses.reduce((sum, e) => sum + e.amount, 0) /
			  similarExpenses.length
			: 0;

	// 4. Monthly spending
	const startOfCurrentMonth = startOfMonth(expenseDate);
	const endOfCurrentMonth = endOfMonth(expenseDate);

	const monthlyExpenses = await prisma.expense.findMany({
		where: {
			userId,
			date: {
				gte: startOfCurrentMonth,
				lte: endOfCurrentMonth,
			},
		},
	});

	const totalMonthlySpending = monthlyExpenses.reduce(
		(sum, e) => sum + e.amount,
		0
	);
	const categoryMonthlySpending = monthlyExpenses
		.filter((e) => e.category === expense.category)
		.reduce((sum, e) => sum + e.amount, 0);

	// 5. Weekly spending
	const startOfCurrentWeek = startOfWeek(expenseDate);
	const endOfCurrentWeek = endOfWeek(expenseDate);

	const weeklyExpenses = await prisma.expense.findMany({
		where: {
			userId,
			date: {
				gte: startOfCurrentWeek,
				lte: endOfCurrentWeek,
			},
		},
	});

	const totalWeeklySpending = weeklyExpenses.reduce(
		(sum, e) => sum + e.amount,
		0
	);

	// 6. Day of week patterns (for recurring expenses)
	const dayOfWeekPatterns = {};

	if (similarExpenses.length >= 3) {
		// Group similar expenses by day of week
		const byDayOfWeek = {};
		similarExpenses.forEach((e) => {
			const day = format(new Date(e.date), 'EEEE');
			if (!byDayOfWeek[day]) {
				byDayOfWeek[day] = [];
			}
			byDayOfWeek[day].push(e.amount);
		});

		// Calculate averages by day of week
		Object.entries(byDayOfWeek).forEach(([day, amounts]) => {
			const avg = amounts.reduce((sum, a) => sum + a, 0) / amounts.length;
			dayOfWeekPatterns[day] = {
				count: amounts.length,
				average: avg,
			};
		});
	}

	// 7. Historical monthly averages
	const sixMonthsAgo = subMonths(startOfMonth(expenseDate), 5);

	const historicalExpenses = await prisma.expense.findMany({
		where: {
			userId,
			date: { gte: sixMonthsAgo },
		},
	});

	// Group by month and category
	const monthlyAverages = {};
	historicalExpenses.forEach((e) => {
		const month = format(new Date(e.date), 'yyyy-MM');
		if (!monthlyAverages[month]) {
			monthlyAverages[month] = { total: 0, byCategory: {} };
		}

		monthlyAverages[month].total += e.amount;

		if (!monthlyAverages[month].byCategory[e.category]) {
			monthlyAverages[month].byCategory[e.category] = 0;
		}
		monthlyAverages[month].byCategory[e.category] += e.amount;
	});

	return {
		expenseData,
		relevantData: {
			categoryAverage: categoryAvg,
			categoryExpenseCount: categoryExpenses.length,
			similarExpensesAverage: similarAvg,
			similarExpensesCount: similarExpenses.length,
			monthlyTotal: totalMonthlySpending,
			monthlyCategory: categoryMonthlySpending,
			weeklyTotal: totalWeeklySpending,
			dayOfWeekPatterns,
			monthlyAverages,
		},
	};
}
