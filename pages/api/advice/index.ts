import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import prisma from '../../../lib/prismadb';
import { authOptions } from '../auth/[...nextauth]';
import {
	format,
	parseISO,
	startOfMonth,
	endOfMonth,
	subMonths,
} from 'date-fns';

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

	// GET /api/advice - Get AI financial advice
	if (req.method === 'GET') {
		try {
			// Get user's expenses
			const expenses = await prisma.expense.findMany({
				where: {
					userId,
				},
				orderBy: {
					date: 'desc',
				},
			});

			if (expenses.length < 5) {
				return res.status(200).json({
					recommendations: [],
					message: 'Not enough data to provide advice yet.',
				});
			}

			// Generate recommendations based on spending patterns
			const recommendations = await generateRecommendations(expenses);

			return res.status(200).json({ recommendations });
		} catch (error) {
			console.error('Error generating advice:', error);
			return res.status(500).json({ error: 'Failed to generate advice' });
		}
	}

	// Method not allowed
	return res.status(405).json({ error: 'Method not allowed' });
}

async function generateRecommendations(expenses: any[]): Promise<string[]> {
	// Calculate monthly totals
	const monthlyTotals: Record<string, number> = {};
	const categoryTotals: Record<string, number> = {};
	const categoryMonthlyAverages: Record<string, Record<string, number>> = {};

	expenses.forEach((expense) => {
		const date = new Date(expense.date);
		const month = format(date, 'yyyy-MM');

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

		// Category by month
		if (!categoryMonthlyAverages[month]) {
			categoryMonthlyAverages[month] = {};
		}
		if (!categoryMonthlyAverages[month][expense.category]) {
			categoryMonthlyAverages[month][expense.category] = 0;
		}
		categoryMonthlyAverages[month][expense.category] += expense.amount;
	});

	// Sort months for trend analysis
	const sortedMonths = Object.keys(monthlyTotals).sort();

	// Total spent
	const totalSpent = expenses.reduce((sum, expense) => sum + expense.amount, 0);

	// Get top spending categories
	const sortedCategories = Object.entries(categoryTotals)
		.sort((a, b) => b[1] - a[1])
		.map(([category, total]) => ({ category, total }));

	// Calculate month-over-month changes
	const monthlyChanges: Record<string, { amount: number; percentage: number }> =
		{};
	for (let i = 1; i < sortedMonths.length; i++) {
		const currentMonth = sortedMonths[i];
		const previousMonth = sortedMonths[i - 1];

		const change = monthlyTotals[currentMonth] - monthlyTotals[previousMonth];
		const percentage =
			monthlyTotals[previousMonth] > 0
				? (change / monthlyTotals[previousMonth]) * 100
				: 0;

		monthlyChanges[currentMonth] = {
			amount: change,
			percentage,
		};
	}

	// Generate recommendations
	const recommendations: string[] = [];

	// 1. General spending trend
	if (sortedMonths.length >= 2) {
		const lastMonth = sortedMonths[sortedMonths.length - 1];
		const lastMonthChange = monthlyChanges[lastMonth];

		if (lastMonthChange) {
			if (lastMonthChange.percentage > 15) {
				recommendations.push(
					`Your spending increased by ${lastMonthChange.percentage.toFixed(
						1
					)}% compared to the previous month. Try to identify non-essential expenses that could be reduced.`
				);
			} else if (lastMonthChange.percentage < -15) {
				recommendations.push(
					`Great job! You decreased your spending by ${Math.abs(
						lastMonthChange.percentage
					).toFixed(1)}% compared to the previous month. Keep up the good work!`
				);
			}
		}
	}

	// 2. Category-specific advice
	if (sortedCategories.length > 0) {
		const topCategory = sortedCategories[0];
		const totalPercentage = (topCategory.total / totalSpent) * 100;

		if (totalPercentage > 40) {
			recommendations.push(
				`${topCategory.category} accounts for ${totalPercentage.toFixed(
					1
				)}% of your total expenses. Consider if you can reduce spending in this category or balance your budget better.`
			);
		}

		// Check for unusual spending in specific categories
		const lastMonth = sortedMonths[sortedMonths.length - 1];
		if (lastMonth && Object.keys(categoryMonthlyAverages).length >= 2) {
			for (const category of Object.keys(categoryTotals)) {
				// Skip categories with low spending
				if (categoryTotals[category] < 100) continue;

				let categoryAvg = 0;
				let monthCount = 0;

				// Calculate average for this category (excluding the last month)
				for (let i = 0; i < sortedMonths.length - 1; i++) {
					const month = sortedMonths[i];
					if (
						categoryMonthlyAverages[month] &&
						categoryMonthlyAverages[month][category]
					) {
						categoryAvg += categoryMonthlyAverages[month][category];
						monthCount++;
					}
				}

				if (monthCount > 0) {
					categoryAvg /= monthCount;

					// Check if last month's spending in this category was much higher than average
					const lastMonthCategorySpend =
						categoryMonthlyAverages[lastMonth][category] || 0;
					if (
						lastMonthCategorySpend > categoryAvg * 1.5 &&
						lastMonthCategorySpend > 200
					) {
						const percentIncrease =
							(lastMonthCategorySpend / categoryAvg - 1) * 100;
						recommendations.push(
							`Your ${category} spending increased by ${percentIncrease.toFixed(
								1
							)}% compared to your average. Look for ways to bring this back in line with your normal spending.`
						);
					}
				}
			}
		}
	}

	// 3. Savings recommendation
	const totalMonths = sortedMonths.length;
	if (totalMonths > 0) {
		const monthlyAverage = totalSpent / totalMonths;
		const savingsTarget = monthlyAverage * 0.15;

		recommendations.push(
			`Based on your average monthly spending of ${monthlyAverage.toFixed(
				2
			)}, consider setting aside ${savingsTarget.toFixed(
				2
			)} each month for savings or emergency fund.`
		);
	}

	// 4. Budget distribution advice
	const recommendedDistribution: Record<string, [number, number]> = {
		Housing: [25, 35],
		Transportation: [10, 15],
		Food: [10, 15],
		Utilities: [5, 10],
		Insurance: [10, 15],
		Debt: [0, 15],
		Personal: [5, 10],
		Entertainment: [5, 10],
		Savings: [15, 20],
	};

	for (const category of sortedCategories) {
		const categoryName = category.category;
		const percentage = (category.total / totalSpent) * 100;

		if (recommendedDistribution[categoryName]) {
			const [min, max] = recommendedDistribution[categoryName];

			if (percentage > max) {
				recommendations.push(
					`Your ${categoryName} expenses (${percentage.toFixed(
						1
					)}% of total) are higher than the recommended ${max}%. Look for ways to reduce these costs if possible.`
				);
			} else if (percentage < min && min > 5) {
				// Only suggest increasing spending in important categories
				recommendations.push(
					`Consider if you're allocating enough for ${categoryName} (${percentage.toFixed(
						1
					)}% of total). The recommended range is ${min}-${max}% of your budget.`
				);
			}
		}
	}

	// 5. Recurring expense detection
	const potentialSubscriptions = detectRecurringExpenses(expenses);
	if (potentialSubscriptions.length > 0) {
		const subscriptionTotal = potentialSubscriptions.reduce(
			(sum, sub) => sum + sub.amount,
			0
		);
		if (subscriptionTotal > 100) {
			recommendations.push(
				`You're spending approximately ${subscriptionTotal.toFixed(
					2
				)} monthly on subscriptions and recurring expenses. Review these to ensure you're using all services you pay for.`
			);
		}
	}

	// 6. Generic advice based on spending level
	if (recommendations.length < 3) {
		recommendations.push(
			'Consider using a 50/30/20 budget: 50% of income for needs, 30% for wants, and 20% for savings and debt repayment.'
		);
		recommendations.push(
			'Track your expenses regularly to identify patterns and opportunities for saving.'
		);
		recommendations.push(
			'Set specific financial goals to stay motivated with your budget.'
		);
	}

	return recommendations;
}

function detectRecurringExpenses(
	expenses: any[]
): Array<{ description: string; amount: number }> {
	const recurring: Record<
		string,
		{ count: number; amount: number; months: Set<string> }
	> = {};

	// Group by similar descriptions and amounts
	expenses.forEach((expense) => {
		const date = new Date(expense.date);
		const month = format(date, 'yyyy-MM');
		const key = expense.description.toLowerCase().trim();

		if (!recurring[key]) {
			recurring[key] = { count: 0, amount: expense.amount, months: new Set() };
		}

		recurring[key].count++;
		recurring[key].months.add(month);
	});

	// Filter potential subscriptions (same description, similar amount, different months)
	const potentialSubscriptions = Object.entries(recurring)
		.filter(([_, data]) => data.count >= 2 && data.months.size >= 2)
		.map(([description, data]) => ({
			description,
			amount: data.amount,
		}));

	return potentialSubscriptions;
}
