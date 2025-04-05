import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import prisma from '../../../lib/prismadb';
import { authOptions } from '../auth/[...nextauth]';
import { Expense } from '@prisma/client';
import { format } from 'date-fns';

export default async function handler(
	req: NextApiRequest,
	res: NextApiResponse
) {
	// Check for authorization header first
	const authHeader = req.headers.authorization;
	let userId: string | null = null;

	if (authHeader && authHeader.startsWith('Bearer ')) {
		userId = authHeader.substring(7);
		console.log('Using authorization header with userId:', userId);
		console.log('Full authorization header:', authHeader);
	} else {
		console.log('No authorization header found, falling back to session');
		// Fall back to session if no authorization header
		const session = await getServerSession(req, res, authOptions);
		if (!session?.user?.email) {
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

		userId = user.id;
		console.log('Using session with userId:', userId);
	}

	if (!userId) {
		return res.status(401).json({ error: 'Unauthorized' });
	}

	const householdId = req.query.householdId as string | undefined;

	// GET /api/advice - Get AI financial advice
	if (req.method === 'GET') {
		try {
			// Get expenses based on whether a household is selected
			let expenses: Expense[];
			if (householdId) {
				// Check if user is a member of the household
				const householdMember = await prisma.householdMember.findUnique({
					where: {
						userId_householdId: {
							userId,
							householdId,
						},
					},
				});

				if (!householdMember) {
					return res
						.status(403)
						.json({ error: 'Not a member of this household' });
				}

				// Get household expenses
				expenses = await prisma.expense.findMany({
					where: {
						householdId,
					},
					orderBy: {
						date: 'desc',
					},
				});
				console.log(
					`Found ${expenses.length} household expenses for household ${householdId}`
				);
			} else {
				// Get user's personal expenses
				console.log(`Fetching expenses for user ${userId}...`);
				expenses = await prisma.expense.findMany({
					where: {
						userId,
					},
					orderBy: {
						date: 'desc',
					},
				});
				console.log(
					`Found ${expenses.length} personal expenses for user ${userId}`
				);

				// Log the first few expenses for debugging
				if (expenses.length > 0) {
					console.log(
						'First few expenses:',
						expenses.slice(0, 3).map((e) => ({
							id: e.id,
							description: e.description,
							amount: e.amount,
							date: e.date,
							category: e.category,
							userId: e.userId,
							householdId: e.householdId,
						}))
					);
				}
			}

			// Log expense details for debugging
			if (expenses.length > 0) {
				console.log(
					'First few expenses:',
					expenses.slice(0, 3).map((e) => ({
						id: e.id,
						description: e.description,
						amount: e.amount,
						date: e.date,
						category: e.category,
					}))
				);
			}

			console.log('Expense details:', {
				count: expenses.length,
				categories: [...new Set(expenses.map((e) => e.category))],
				totalAmount: expenses.reduce((sum, e) => sum + e.amount, 0),
				dateRange:
					expenses.length > 0
						? {
								oldest: new Date(
									Math.min(...expenses.map((e) => new Date(e.date).getTime()))
								),
								newest: new Date(
									Math.max(...expenses.map((e) => new Date(e.date).getTime()))
								),
						  }
						: null,
			});

			// Add more detailed logging
			console.log(
				'Checking expense count:',
				expenses.length,
				'against minimum threshold of 5'
			);
			console.log('User ID:', userId);
			console.log('Household ID:', householdId || 'None (personal expenses)');

			if (expenses.length < 5) {
				console.log('Not enough expenses for personalized recommendations');
				return res.status(200).json({
					recommendations: [
						'Add at least 5 expenses to get personalized AI recommendations based on your spending patterns.',
					],
				});
			}

			// Generate insights using the Groq API
			try {
				// Gather data for analysis
				const analysisData = await gatherDataForAnalysis(expenses);
				console.log('Analysis data prepared for AI:', {
					totalSpent: analysisData.totalSpent,
					expenseCount: analysisData.expenseCount,
					categories: Object.keys(analysisData.categoryTotals).length,
				});

				// Structure the prompt for the LLM
				const messages = [
					{
						role: 'system',
						content: `You are a helpful financial advisor AI that analyzes expense data to provide actionable financial insights and recommendations.
            Your recommendations should be specific, practical, and based on the spending patterns you observe in the data.
            Format each recommendation as a separate insight. Focus on patterns, opportunities for savings, unusual spending, and budget optimizations.
            Make each recommendation specific, actionable, and focused on one aspect of financial behavior.`,
					},
					{
						role: 'user',
						content: `Here is the user's expense data:
            ${JSON.stringify(analysisData, null, 2)}

            Please provide 5-8 personalized financial recommendations based on this spending data.
            Make each recommendation specific, actionable, and insightful.
            Each recommendation should focus on a different aspect of the user's financial behavior.`,
					},
				];

				// Call the Groq API
				console.log('Calling Groq API for recommendations...');
				const response = await fetch(
					'https://api.groq.com/openai/v1/chat/completions',
					{
						method: 'POST',
						headers: {
							'Content-Type': 'application/json',
							Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
						},
						body: JSON.stringify({
							model: 'llama-3.1-8b-instant',
							messages: messages,
							temperature: 0.7,
							max_tokens: 800,
							stream: false,
						}),
					}
				);

				const responseData = await response.json();

				if (responseData.error) {
					console.error('Groq API error:', responseData.error);
					return res.status(500).json({
						error: 'Failed to generate recommendations',
						details: responseData.error,
					});
				}

				// Extract recommendations from LLM response
				const llmResponse = responseData.choices[0].message.content;
				console.log('Received response from Groq API');

				// Parse LLM response into separate recommendations
				let recommendations: string[] = [];

				// Using regex to find numbered patterns or bullet points
				const recRegex =
					/(?:\d+\.\s|\-\s|\*\s)(.*?)(?=(?:\d+\.\s|\-\s|\*\s|$))/g;
				const matches = [...llmResponse.matchAll(recRegex)];

				if (matches.length > 0) {
					recommendations = matches.map((match) => match[1].trim());
				} else {
					// If no pattern matches, split by double newlines
					recommendations = llmResponse
						.split(/\n\n+/)
						.filter((r: string) => r.trim().length > 0);
				}

				console.log(
					`Generated ${recommendations.length} personalized recommendations`
				);
				return res.status(200).json({ recommendations });
			} catch (error) {
				console.error('Error generating recommendations:', error);
				return res.status(500).json({
					error: 'Failed to generate recommendations',
					details: error instanceof Error ? error.message : 'Unknown error',
				});
			}
		} catch (error) {
			console.error('Error generating advice:', error);
			return res.status(500).json({ error: 'Failed to generate advice' });
		}
	}

	// Method not allowed
	return res.status(405).json({ error: 'Method not allowed' });
}

// Gather necessary data for LLM analysis
async function gatherDataForAnalysis(expenses: Expense[]) {
	// Calculate monthly totals
	const monthlyTotals: Record<string, number> = {};
	const categoryTotals: Record<string, number> = {};
	const dateCounts: Record<string, { count: number; total: number }> = {};
	const expenseData: Array<{
		category: string;
		description: string;
		amount: number;
		date: string;
		day: string;
	}> = [];

	expenses.forEach((expense) => {
		const date = new Date(expense.date);
		const month = format(date, 'yyyy-MM');
		const day = format(date, 'EEEE'); // Day of week

		// Monthly totals
		if (!monthlyTotals[month]) {
			monthlyTotals[month] = 0;
		}
		monthlyTotals[month] += expense.amount;

		// Category totals
		if (!categoryTotals[expense.category]) {
			categoryTotals[expense.category] = 0;
		}
		categoryTotals[expense.category] += expense.amount;

		// Day of week patterns
		if (!dateCounts[day]) {
			dateCounts[day] = { count: 0, total: 0 };
		}
		dateCounts[day].count++;
		dateCounts[day].total += expense.amount;

		// Add expense to data
		expenseData.push({
			category: expense.category,
			description: expense.description,
			amount: expense.amount,
			date: format(date, 'yyyy-MM-dd'),
			day: day,
		});
	});

	// Recent expenses (last 10)
	const recentExpenses = expenseData.slice(0, 10);

	// Get recurring expenses
	const recurringExpenses = findRecurringExpenses(expenseData);

	// Calculate total spent
	const totalSpent = expenses.reduce((sum, expense) => sum + expense.amount, 0);

	// Calculate category percentages
	const categoryPercentages: Record<string, string> = {};
	Object.entries(categoryTotals).forEach(([category, total]) => {
		categoryPercentages[category] =
			((total / totalSpent) * 100).toFixed(1) + '%';
	});

	// Calculate day averages
	const dayAverages: Record<string, number> = {};
	Object.entries(dateCounts).forEach(([day, data]) => {
		dayAverages[day] = data.total / data.count;
	});

	return {
		totalSpent,
		monthlyTotals,
		categoryTotals,
		categoryPercentages,
		recentExpenses,
		recurringExpenses,
		dayAverages,
		expenseCount: expenses.length,
	};
}

// Find recurring expenses (similar description and amount)
function findRecurringExpenses(
	expenses: Array<{
		description: string;
		amount: number;
		date: string;
	}>
) {
	const descriptionMap: Record<
		string,
		Array<{ amount: number; date: string }>
	> = {};

	// Group by description
	expenses.forEach((expense) => {
		const key = expense.description.toLowerCase();
		if (!descriptionMap[key]) {
			descriptionMap[key] = [];
		}
		descriptionMap[key].push({
			amount: expense.amount,
			date: expense.date,
		});
	});

	// Filter for recurring expenses (3+ occurrences)
	return Object.entries(descriptionMap)
		.filter(([, items]) => items.length >= 3)
		.map(([description, items]) => {
			const total = items.reduce((sum, exp) => sum + exp.amount, 0);
			const avg = total / items.length;
			return {
				description,
				occurrences: items.length,
				averageAmount: avg,
			};
		})
		.filter((item) => item.occurrences >= 3); // At least 3 occurrences
}
