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
			} else {
				// Get user's personal expenses
				expenses = await prisma.expense.findMany({
					where: {
						userId,
						householdId: null,
					},
					orderBy: {
						date: 'desc',
					},
				});
			}

			if (expenses.length < 5) {
				return res.status(200).json({
					recommendations: [
						'Consider using a 50/30/20 budget: 50% of income for needs, 30% for wants, and 20% for savings.',
						'Track your expenses consistently to identify spending patterns and areas for improvement.',
						'Build an emergency fund that covers 3-6 months of essential expenses.',
						"Review your subscriptions regularly and cancel those you don't use frequently.",
						'Try the 24-hour rule for non-essential purchases to reduce impulse spending.',
					],
					isDemo: true,
				});
			}

			// Generate insights using the Groq API
			try {
				// Gather data for analysis
				const analysisData = await gatherDataForAnalysis(expenses);

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
					throw new Error('Groq API request failed');
				}

				// Extract recommendations from LLM response
				const llmResponse = responseData.choices[0].message.content;

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

				return res.status(200).json({ recommendations });
			} catch (llmError) {
				console.error('LLM processing error:', llmError);
				// Fall back to basic recommendations if LLM fails
				const fallbackRecommendations =
					generateFallbackRecommendations(expenses);
				return res
					.status(200)
					.json({ recommendations: fallbackRecommendations });
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

// Generate fallback recommendations if LLM fails
function generateFallbackRecommendations(expenses: Expense[]) {
	// Calculate category totals
	const categoryTotals: Record<string, number> = {};
	let totalSpent = 0;

	expenses.forEach((expense) => {
		if (!categoryTotals[expense.category]) {
			categoryTotals[expense.category] = 0;
		}
		categoryTotals[expense.category] += expense.amount;
		totalSpent += expense.amount;
	});

	// Sort categories by spending
	const sortedCategories = Object.entries(categoryTotals)
		.sort((a, b) => b[1] - a[1])
		.map(([category, total]) => ({
			category,
			total,
			percentage: ((total / totalSpent) * 100).toFixed(1),
		}));

	const recommendations = [];

	// Add category-specific recommendations
	if (sortedCategories.length > 0) {
		const topCategory = sortedCategories[0];
		if (
			topCategory.category === 'Housing' &&
			parseFloat(topCategory.percentage) > 30
		) {
			recommendations.push(
				`Your housing expenses are ${topCategory.percentage}% of your budget. While this is a fixed expense, consider if there are ways to optimize other housing-related costs like utilities or insurance.`
			);
		} else if (
			topCategory.category === 'Food' &&
			parseFloat(topCategory.percentage) > 15
		) {
			recommendations.push(
				`Food expenses make up ${topCategory.percentage}% of your budget. Consider meal planning, buying in bulk, or reducing dining out to lower this category.`
			);
		} else if (parseFloat(topCategory.percentage) > 30) {
			recommendations.push(
				`${topCategory.category} is your largest expense category at ${topCategory.percentage}% of your total. Consider ways to reduce spending in this area if possible.`
			);
		}

		// Add recommendation for second highest category if it exists
		if (sortedCategories.length > 1) {
			const secondCategory = sortedCategories[1];
			if (parseFloat(secondCategory.percentage) > 15) {
				recommendations.push(
					`Your second highest expense category is ${secondCategory.category} at ${secondCategory.percentage}% of your budget. Review these expenses for potential savings.`
				);
			}
		}
	}

	// Add general recommendations
	recommendations.push(
		'Consider using a 50/30/20 budget: 50% for needs, 30% for wants, 20% for savings.'
	);
	recommendations.push(
		"Review your recurring subscriptions monthly and cancel those you don't use regularly."
	);
	recommendations.push(
		'Build an emergency fund with 3-6 months of essential expenses.'
	);
	recommendations.push(
		'Track your expenses consistently to identify spending patterns and saving opportunities.'
	);
	recommendations.push(
		'For non-essential purchases, try waiting 24 hours before buying to reduce impulse spending.'
	);

	return recommendations;
}
