/* eslint-disable @typescript-eslint/no-explicit-any */
import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import prisma from '../../../lib/prismadb';
import { authOptions } from '../auth/[...nextauth]';
import { startOfMonth, endOfMonth, format, subMonths } from 'date-fns';

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
		const { expenseId } = req.body;

		if (!expenseId) {
			return res.status(400).json({ error: 'Expense ID is required' });
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

		// Generate insights specific to this expense
		const insights = await generateExpenseInsights(expense, userId);

		return res.status(200).json({ insights });
	} catch (error) {
		console.error('Error generating expense insights:', error);
		return res.status(500).json({ error: 'Failed to generate insights' });
	}
}

async function generateExpenseInsights(
	expense: any,
	userId: string
): Promise<string[]> {
	const insights: string[] = [];
	const expenseDate = new Date(expense.date);
	const expenseCategory = expense.category;
	const expenseAmount = expense.amount;
	const expenseDescription = expense.description;

	// 1. Compare with past similar expenses
	const similarExpenses = await prisma.expense.findMany({
		where: {
			userId,
			category: expenseCategory,
			description: {
				contains: expenseDescription.split(' ')[0], // Use the first word to find similar descriptions
			},
			id: {
				not: expense.id, // Exclude the current expense
			},
		},
		orderBy: {
			date: 'desc',
		},
		take: 10,
	});

	if (similarExpenses.length > 0) {
		const averageAmount =
			similarExpenses.reduce(
				(sum: any, exp: { amount: any }) => sum + exp.amount,
				0
			) / similarExpenses.length;

		if (expenseAmount > averageAmount * 1.2) {
			insights.push(
				`This ${expenseCategory} expense is ${Math.round(
					(expenseAmount / averageAmount - 1) * 100
				)}% higher than your average for similar expenses ($${averageAmount.toFixed(
					2
				)}).`
			);
		} else if (expenseAmount < averageAmount * 0.8) {
			insights.push(
				`Great job! This ${expenseCategory} expense is ${Math.round(
					(1 - expenseAmount / averageAmount) * 100
				)}% lower than your average for similar expenses ($${averageAmount.toFixed(
					2
				)}).`
			);
		} else {
			insights.push(
				`This ${expenseCategory} expense is in line with your typical spending in this category (average: $${averageAmount.toFixed(
					2
				)}).`
			);
		}
	}

	// 2. For recurring expenses (like lunch), check for patterns
	if (
		expenseDescription.toLowerCase().includes('lunch') ||
		expenseDescription.toLowerCase().includes('coffee') ||
		expenseDescription.toLowerCase().includes('breakfast') ||
		expenseDescription.toLowerCase().includes('dinner')
	) {
		// Check if same place
		const samePlaceExpenses = await prisma.expense.findMany({
			where: {
				userId,
				description: expense.description,
				id: {
					not: expense.id,
				},
			},
			orderBy: {
				date: 'desc',
			},
			take: 10,
		});

		if (samePlaceExpenses.length >= 3) {
			const dayOfWeek = format(expenseDate, 'EEEE');
			const averageAmount =
				samePlaceExpenses.reduce(
					(sum: any, exp: { amount: any }) => sum + exp.amount,
					0
				) / samePlaceExpenses.length;

			// Check if this day of week is typically cheaper/more expensive
			const sameDayExpenses = samePlaceExpenses.filter(
				(exp: { date: string | number | Date }) =>
					format(new Date(exp.date), 'EEEE') === dayOfWeek
			);

			if (sameDayExpenses.length >= 2) {
				const sameDayAverage =
					sameDayExpenses.reduce(
						(sum: any, exp: { amount: any }) => sum + exp.amount,
						0
					) / sameDayExpenses.length;

				if (sameDayAverage < averageAmount * 0.9) {
					insights.push(
						`You typically spend less at ${expenseDescription} on ${dayOfWeek}s ($${sameDayAverage.toFixed(
							2
						)} vs. overall average of $${averageAmount.toFixed(
							2
						)}). Good choice of day!`
					);
				} else if (sameDayAverage > averageAmount * 1.1) {
					insights.push(
						`You typically spend more at ${expenseDescription} on ${dayOfWeek}s ($${sameDayAverage.toFixed(
							2
						)} vs. overall average of $${averageAmount.toFixed(
							2
						)}). Consider visiting on other days to save money.`
					);
				}
			}

			// Check frequency
			const oldestDate = new Date(
				samePlaceExpenses[samePlaceExpenses.length - 1].date
			);
			const daysSinceOldest = Math.round(
				(expenseDate.getTime() - oldestDate.getTime()) / (1000 * 60 * 60 * 24)
			);
			const frequency = daysSinceOldest / (samePlaceExpenses.length + 1); // Add 1 to include current expense

			if (frequency < 7 && samePlaceExpenses.length >= 4) {
				const monthlySpend = (averageAmount * 30) / frequency;
				insights.push(
					`You visit ${expenseDescription} approximately every ${Math.round(
						frequency
					)} days. That's about $${monthlySpend.toFixed(2)} per month.`
				);
			}
		}
	}

	// 3. Monthly budget impact
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

	const categoryExpensesThisMonth = monthlyExpenses
		.filter((exp: { category: any }) => exp.category === expenseCategory)
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		.reduce((sum: any, exp: { amount: any }) => sum + exp.amount, 0);

	const totalExpensesThisMonth = monthlyExpenses.reduce(
		(sum: any, exp: { amount: any }) => sum + exp.amount,
		0
	);

	// Calculate percentage of monthly category spending
	const categoryPercentage = (expenseAmount / categoryExpensesThisMonth) * 100;

	if (categoryPercentage > 50 && expenseAmount > 100) {
		insights.push(
			`This single expense accounts for ${Math.round(
				categoryPercentage
			)}% of your ${expenseCategory} spending this month.`
		);
	}

	// Calculate percentage of total monthly spending
	const totalPercentage = (expenseAmount / totalExpensesThisMonth) * 100;

	if (totalPercentage > 15 && expenseAmount > 100) {
		insights.push(
			`This expense represents ${Math.round(
				totalPercentage
			)}% of your total spending this month.`
		);
	}

	// 4. Analyze spending trend for this category
	const sixMonthsAgo = subMonths(startOfMonth(expenseDate), 5);

	const recentMonthlyExpenses = await prisma.expense.findMany({
		where: {
			userId,
			category: expenseCategory,
			date: {
				gte: sixMonthsAgo,
			},
		},
	});

	// Group by month
	const monthlyTotals: Record<string, number> = {};

	recentMonthlyExpenses.forEach(
		(exp: { date: string | number | Date; amount: number }) => {
			const month = format(new Date(exp.date), 'yyyy-MM');
			if (!monthlyTotals[month]) {
				monthlyTotals[month] = 0;
			}
			monthlyTotals[month] += exp.amount;
		}
	);

	// Calculate average (excluding current month)
	const currentMonth = format(expenseDate, 'yyyy-MM');
	let sum = 0;
	let count = 0;

	Object.entries(monthlyTotals).forEach(([month, total]) => {
		if (month !== currentMonth) {
			sum += total;
			count++;
		}
	});

	if (count > 0) {
		const historicalMonthlyAverage = sum / count;
		const currentProjected =
			(categoryExpensesThisMonth / expenseDate.getDate()) *
			new Date(endOfCurrentMonth).getDate();

		if (currentProjected > historicalMonthlyAverage * 1.3) {
			insights.push(
				`Based on your current spending, you're on track to spend $${currentProjected.toFixed(
					2
				)} on ${expenseCategory} this month, which is ${Math.round(
					(currentProjected / historicalMonthlyAverage - 1) * 100
				)}% higher than your monthly average of $${historicalMonthlyAverage.toFixed(
					2
				)}.`
			);
		}
	}

	// 5. Generic insights if we don't have enough data
	if (insights.length === 0) {
		if (expenseAmount > 100) {
			insights.push(
				`This is a significant expense in your ${expenseCategory} category.`
			);
		}

		insights.push(
			`Keep tracking your expenses to receive more personalized insights.`
		);
	}

	return insights;
}
