/* eslint-disable @typescript-eslint/no-explicit-any */
import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import prisma from '../../../lib/prismadb';
import { authOptions } from '../auth/[...nextauth]';
import { startOfMonth, endOfMonth, format } from 'date-fns';

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
		const { expenseId, question } = req.body;

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

		// Generate answer to user's question
		const answer = await generateAnswer(question, expense, userId);

		return res.status(200).json({ answer });
	} catch (error) {
		console.error('Error generating answer:', error);
		return res.status(500).json({ error: 'Failed to generate answer' });
	}
}

async function generateAnswer(
	question: string,
	expense: any,
	userId: string
): Promise<string> {
	// Extract key expense info
	const expenseDate = new Date(expense.date);
	const expenseCategory = expense.category;
	const expenseAmount = expense.amount;
	const expenseDescription = expense.description;

	// Normalize question for easier matching
	const normalizedQuestion = question.toLowerCase();

	// Process different types of questions

	// 1. Compare to other expenses
	if (
		normalizedQuestion.includes('compare') ||
		normalizedQuestion.includes('other expenses') ||
		normalizedQuestion.includes('typical') ||
		normalizedQuestion.includes('average') ||
		normalizedQuestion.includes('normal')
	) {
		// Check if question is about this category
		if (
			normalizedQuestion.includes('category') ||
			normalizedQuestion.includes(expenseCategory.toLowerCase())
		) {
			const categoryExpenses = await prisma.expense.findMany({
				where: {
					userId,
					category: expenseCategory,
					id: {
						not: expense.id, // Exclude current expense
					},
				},
				orderBy: {
					date: 'desc',
				},
				take: 100,
			});

			if (categoryExpenses.length === 0) {
				return `I don't have enough data yet to compare this expense with other ${expenseCategory} expenses. This appears to be your first expense in this category.`;
			}

			const averageAmount =
				categoryExpenses.reduce(
					(sum: any, exp: { amount: any }) => sum + exp.amount,
					0
				) / categoryExpenses.length;
			const percentDiff =
				((expenseAmount - averageAmount) / averageAmount) * 100;

			if (Math.abs(percentDiff) < 10) {
				return `This ${expenseCategory} expense of $${expenseAmount.toFixed(
					2
				)} is very close to your average of $${averageAmount.toFixed(
					2
				)} for this category. You have ${
					categoryExpenses.length
				} other expenses in this category.`;
			} else if (percentDiff > 0) {
				return `This ${expenseCategory} expense of $${expenseAmount.toFixed(
					2
				)} is ${Math.abs(
					Math.round(percentDiff)
				)}% higher than your average of $${averageAmount.toFixed(
					2
				)} for this category. You have ${
					categoryExpenses.length
				} other expenses in this category.`;
			} else {
				return `This ${expenseCategory} expense of $${expenseAmount.toFixed(
					2
				)} is ${Math.abs(
					Math.round(percentDiff)
				)}% lower than your average of $${averageAmount.toFixed(
					2
				)} for this category. You have ${
					categoryExpenses.length
				} other expenses in this category.`;
			}
		}

		// Check if question is about this specific expense description
		if (
			normalizedQuestion.includes(expenseDescription.toLowerCase()) ||
			normalizedQuestion.includes('this place')
		) {
			const similarExpenses = await prisma.expense.findMany({
				where: {
					userId,
					description: {
						contains: expenseDescription.split(' ')[0], // Match first word
					},
					id: {
						not: expense.id,
					},
				},
				orderBy: {
					date: 'desc',
				},
				take: 20,
			});

			if (similarExpenses.length === 0) {
				return `This appears to be your first expense at ${expenseDescription}. I don't have any historical data to compare it with yet.`;
			}

			const averageAmount =
				similarExpenses.reduce(
					(sum: any, exp: { amount: any }) => sum + exp.amount,
					0
				) / similarExpenses.length;
			const percentDiff =
				((expenseAmount - averageAmount) / averageAmount) * 100;

			if (Math.abs(percentDiff) < 10) {
				return `This expense of $${expenseAmount.toFixed(
					2
				)} at ${expenseDescription} is very close to your average of $${averageAmount.toFixed(
					2
				)} for similar expenses. You've been here ${
					similarExpenses.length
				} times before.`;
			} else if (percentDiff > 0) {
				return `This expense of $${expenseAmount.toFixed(
					2
				)} at ${expenseDescription} is ${Math.abs(
					Math.round(percentDiff)
				)}% higher than your average of $${averageAmount.toFixed(
					2
				)} for similar expenses. You've been here ${
					similarExpenses.length
				} times before.`;
			} else {
				return `This expense of $${expenseAmount.toFixed(
					2
				)} at ${expenseDescription} is ${Math.abs(
					Math.round(percentDiff)
				)}% lower than your average of $${averageAmount.toFixed(
					2
				)} for similar expenses. You've been here ${
					similarExpenses.length
				} times before.`;
			}
		}

		// General comparison
		return `This ${expenseCategory} expense of $${expenseAmount.toFixed(
			2
		)} at ${expenseDescription} is on ${format(
			expenseDate,
			'MMMM d, yyyy'
		)}. To compare it with specific expenses, you can ask about this category or similar places.`;
	}

	// 2. Monthly spending questions
	if (
		normalizedQuestion.includes('month') ||
		normalizedQuestion.includes('budget')
	) {
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
			(sum: any, exp: { amount: any }) => sum + exp.amount,
			0
		);
		const categoryMonthlySpending = monthlyExpenses
			.filter((exp: { category: any }) => exp.category === expenseCategory)
			.reduce((sum: any, exp: { amount: any }) => sum + exp.amount, 0);

		const monthlyBudgetInfo = `For ${format(
			expenseDate,
			'MMMM yyyy'
		)}, you've spent $${totalMonthlySpending.toFixed(
			2
		)} in total, with $${categoryMonthlySpending.toFixed(
			2
		)} in the ${expenseCategory} category.`;

		if (
			normalizedQuestion.includes('budget impact') ||
			normalizedQuestion.includes('affect my budget')
		) {
			const expensePercentage = (expenseAmount / totalMonthlySpending) * 100;
			return `This expense represents ${Math.round(
				expensePercentage
			)}% of your total spending this month. ${monthlyBudgetInfo}`;
		}

		if (
			normalizedQuestion.includes('category') &&
			normalizedQuestion.includes('month')
		) {
			const expenseCategoryPercentage =
				(expenseAmount / categoryMonthlySpending) * 100;
			return `This expense represents ${Math.round(
				expenseCategoryPercentage
			)}% of your ${expenseCategory} spending this month. ${monthlyBudgetInfo}`;
		}

		// General monthly question
		return monthlyBudgetInfo;
	}

	// 3. Pattern or frequency questions
	if (
		normalizedQuestion.includes('pattern') ||
		normalizedQuestion.includes('frequent') ||
		normalizedQuestion.includes('often') ||
		normalizedQuestion.includes('regular')
	) {
		// Look for similar expenses
		const similarExpenses = await prisma.expense.findMany({
			where: {
				userId,
				description: {
					contains: expenseDescription.split(' ')[0], // Match first word
				},
			},
			orderBy: {
				date: 'desc',
			},
			take: 20,
		});

		if (similarExpenses.length <= 1) {
			return `I don't see a pattern yet for expenses at ${expenseDescription}. You need more similar expenses to establish a pattern.`;
		}

		// Sort by date to find frequency
		const sortedDates = similarExpenses
			.map((exp: { date: string | number | Date }) => new Date(exp.date))
			.sort(
				(a: { getTime: () => number }, b: { getTime: () => number }) =>
					a.getTime() - b.getTime()
			);

		// Calculate average days between visits
		let totalDaysBetween = 0;
		for (let i = 1; i < sortedDates.length; i++) {
			const daysDiff =
				(sortedDates[i].getTime() - sortedDates[i - 1].getTime()) /
				(1000 * 60 * 60 * 24);
			totalDaysBetween += daysDiff;
		}

		const avgDaysBetween = Math.round(
			totalDaysBetween / (sortedDates.length - 1)
		);

		// Check for day of week pattern
		const dayOfWeekCounts: Record<string, number> = {};
		sortedDates.forEach((date: string | number | Date) => {
			const dayOfWeek = format(date, 'EEEE');
			dayOfWeekCounts[dayOfWeek] = (dayOfWeekCounts[dayOfWeek] || 0) + 1;
		});

		const mostFrequentDay = Object.entries(dayOfWeekCounts).sort(
			(a, b) => b[1] - a[1]
		)[0];

		const dayPattern =
			mostFrequentDay[1] > sortedDates.length * 0.4
				? `You tend to visit ${expenseDescription} most often on ${mostFrequentDay[0]}s (${mostFrequentDay[1]} out of ${sortedDates.length} visits).`
				: `There's no strong pattern for which day of the week you visit ${expenseDescription}.`;

		// Analyze amounts
		const amounts = similarExpenses.map((exp: { amount: any }) => exp.amount);
		const avgAmount =
			amounts.reduce((sum: any, amt: any) => sum + amt, 0) / amounts.length;
		const consistentAmount =
			Math.max(...amounts) - Math.min(...amounts) < avgAmount * 0.2;

		const amountPattern = consistentAmount
			? `Your spending at ${expenseDescription} is fairly consistent, around $${avgAmount.toFixed(
					2
			  )} per visit.`
			: `Your spending at ${expenseDescription} varies between $${Math.min(
					...amounts
			  ).toFixed(2)} and $${Math.max(...amounts).toFixed(2)}.`;

		if (avgDaysBetween < 14) {
			return `You visit ${expenseDescription} approximately every ${avgDaysBetween} days. ${dayPattern} ${amountPattern}`;
		} else if (avgDaysBetween < 35) {
			return `You visit ${expenseDescription} approximately monthly (every ${avgDaysBetween} days on average). ${dayPattern} ${amountPattern}`;
		} else {
			return `You visit ${expenseDescription} occasionally, with an average of ${avgDaysBetween} days between visits. ${dayPattern} ${amountPattern}`;
		}
	}

	// 4. Day-of-week specific questions
	if (
		normalizedQuestion.includes('day') ||
		normalizedQuestion.includes('weekday') ||
		normalizedQuestion.includes('weekend')
	) {
		const dayOfWeek = format(expenseDate, 'EEEE');
		const isWeekend = dayOfWeek === 'Saturday' || dayOfWeek === 'Sunday';

		// Find similar expenses
		const similarExpenses = await prisma.expense.findMany({
			where: {
				userId,
				description: {
					contains: expenseDescription.split(' ')[0],
				},
				id: {
					not: expense.id,
				},
			},
		});

		if (similarExpenses.length === 0) {
			return `This is your first recorded expense at ${expenseDescription}. It was on a ${dayOfWeek}, which is a ${
				isWeekend ? 'weekend' : 'weekday'
			}.`;
		}

		// Group by day of week
		const dayAmounts: Record<string, number[]> = {};
		const dayFrequency: Record<string, number> = {};

		similarExpenses.forEach(
			(exp: { date: string | number | Date; amount: number }) => {
				const day = format(new Date(exp.date), 'EEEE');
				if (!dayAmounts[day]) {
					dayAmounts[day] = [];
				}
				dayAmounts[day].push(exp.amount);
				dayFrequency[day] = (dayFrequency[day] || 0) + 1;
			}
		);

		// Calculate average for this day vs other days
		const thisDayAmounts = dayAmounts[dayOfWeek] || [];
		const thisDayAvg =
			thisDayAmounts.length > 0
				? thisDayAmounts.reduce((sum, amt) => sum + amt, 0) /
				  thisDayAmounts.length
				: 0;

		// Other days' averages
		let otherDaysTotal = 0;
		let otherDaysCount = 0;
		Object.entries(dayAmounts).forEach(([day, amounts]) => {
			if (day !== dayOfWeek) {
				otherDaysTotal += amounts.reduce((sum, amt) => sum + amt, 0);
				otherDaysCount += amounts.length;
			}
		});

		const otherDaysAvg =
			otherDaysCount > 0 ? otherDaysTotal / otherDaysCount : 0;

		if (thisDayAvg === 0) {
			return `This is your first expense at ${expenseDescription} on a ${dayOfWeek}. You've visited ${similarExpenses.length} times on other days of the week.`;
		}

		if (otherDaysAvg === 0) {
			return `All your expenses at ${expenseDescription} have been on ${dayOfWeek}s.`;
		}

		const percentDiff = ((thisDayAvg - otherDaysAvg) / otherDaysAvg) * 100;

		if (Math.abs(percentDiff) < 10) {
			return `Your spending at ${expenseDescription} on ${dayOfWeek}s ($${thisDayAvg.toFixed(
				2
			)} on average) is similar to other days of the week ($${otherDaysAvg.toFixed(
				2
			)} on average).`;
		} else if (percentDiff > 0) {
			return `You tend to spend ${Math.round(
				percentDiff
			)}% more at ${expenseDescription} on ${dayOfWeek}s ($${thisDayAvg.toFixed(
				2
			)}) compared to other days of the week ($${otherDaysAvg.toFixed(2)}).`;
		} else {
			return `You tend to spend ${Math.abs(
				Math.round(percentDiff)
			)}% less at ${expenseDescription} on ${dayOfWeek}s ($${thisDayAvg.toFixed(
				2
			)}) compared to other days of the week ($${otherDaysAvg.toFixed(2)}).`;
		}
	}

	// 5. Save/reduce questions
	if (
		normalizedQuestion.includes('save') ||
		normalizedQuestion.includes('reduce') ||
		normalizedQuestion.includes('cheaper') ||
		normalizedQuestion.includes('less')
	) {
		if (
			normalizedQuestion.includes('similar') ||
			normalizedQuestion.includes('alternative') ||
			normalizedQuestion.includes('instead') ||
			normalizedQuestion.includes('other place')
		) {
			// Find similar category expenses with lower average cost
			const categoryExpenses = await prisma.expense.findMany({
				where: {
					userId,
					category: expenseCategory,
					description: {
						not: {
							contains: expenseDescription.split(' ')[0],
						},
					},
				},
			});

			// Group by description
			const descriptionGroups: Record<
				string,
				{ count: number; total: number }
			> = {};

			categoryExpenses.forEach(
				(exp: { description: string; amount: number }) => {
					const desc = exp.description.split(' ')[0]; // Use first word as key
					if (!descriptionGroups[desc]) {
						descriptionGroups[desc] = { count: 0, total: 0 };
					}
					descriptionGroups[desc].count++;
					descriptionGroups[desc].total += exp.amount;
				}
			);

			// Get places with at least 2 visits and lower average cost
			const alternatives = Object.entries(descriptionGroups)
				.filter(([, data]) => {
					return data.count >= 2 && data.total / data.count < expenseAmount;
				})
				.map(([desc, data]) => ({
					description: desc,
					averageAmount: data.total / data.count,
					visits: data.count,
				}))
				.sort((a, b) => a.averageAmount - b.averageAmount)
				.slice(0, 3);

			if (alternatives.length === 0) {
				return `I don't see any cheaper alternatives in your ${expenseCategory} expenses. You might want to explore new options or look for deals at ${expenseDescription}.`;
			}

			let response = `Here are some cheaper alternatives based on your spending history:`;
			alternatives.forEach((alt) => {
				response += `\n• ${alt.description}: $${alt.averageAmount.toFixed(
					2
				)} on average (visited ${alt.visits} times)`;
			});

			const potentialSavings = expenseAmount - alternatives[0].averageAmount;
			response += `\n\nChoosing ${
				alternatives[0].description
			} instead could save you approximately $${potentialSavings.toFixed(
				2
			)} per visit.`;

			return response;
		}

		// Check if we can find a cheaper day for this place
		if (
			normalizedQuestion.includes('day') ||
			normalizedQuestion.includes('time') ||
			normalizedQuestion.includes('when')
		) {
			const similarExpenses = await prisma.expense.findMany({
				where: {
					userId,
					description: {
						contains: expenseDescription.split(' ')[0],
					},
				},
			});

			if (similarExpenses.length < 3) {
				return `I don't have enough data yet to suggest cheaper days to visit ${expenseDescription}. Keep tracking your expenses to get better insights.`;
			}

			// Group by day of week
			const dayAverages: Record<string, { total: number; count: number }> = {};

			similarExpenses.forEach(
				(exp: { date: string | number | Date; amount: number }) => {
					const day = format(new Date(exp.date), 'EEEE');
					if (!dayAverages[day]) {
						dayAverages[day] = { total: 0, count: 0 };
					}
					dayAverages[day].total += exp.amount;
					dayAverages[day].count++;
				}
			);

			// Find cheapest day with at least 2 visits
			let cheapestDay = '';
			let cheapestAvg = Infinity;

			Object.entries(dayAverages).forEach(([day, data]) => {
				if (data.count >= 2) {
					const avg = data.total / data.count;
					if (avg < cheapestAvg) {
						cheapestDay = day;
						cheapestAvg = avg;
					}
				}
			});

			if (!cheapestDay) {
				return `I don't see a clear pattern of cheaper days to visit ${expenseDescription} yet. Keep tracking your expenses to get better insights.`;
			}

			const currentDayOfWeek = format(expenseDate, 'EEEE');
			const currentDayAvg =
				dayAverages[currentDayOfWeek]?.total /
					dayAverages[currentDayOfWeek]?.count || expenseAmount;

			if (currentDayOfWeek === cheapestDay) {
				return `You're already visiting ${expenseDescription} on the cheapest day (${cheapestDay}), with an average cost of $${cheapestAvg.toFixed(
					2
				)}.`;
			}

			const potentialSavings = currentDayAvg - cheapestAvg;
			return `Based on your history, ${cheapestDay} seems to be the cheapest day to visit ${expenseDescription}, with an average cost of ${cheapestAvg.toFixed(
				2
			)}. Switching from ${currentDayOfWeek} to ${cheapestDay} could save you about ${potentialSavings.toFixed(
				2
			)} per visit.`;
		}

		// Generic saving advice
		return `To save on ${expenseCategory} expenses like ${expenseDescription}, consider:
1. Looking for discounts or promotions
2. Visiting at different times or days of the week
3. Comparing prices with similar options
4. Setting a budget for this category and tracking your spending`;
	}

	// Fallback for unrecognized questions
	return `This is a ${expenseCategory} expense of ${expenseAmount.toFixed(
		2
	)} at ${expenseDescription} on ${format(
		expenseDate,
		'MMMM d, yyyy'
	)}. You can ask more specific questions about how it compares to your other expenses, its impact on your monthly budget, spending patterns, or how to save money.`;
}
