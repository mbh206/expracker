'use client';

import { useState, useEffect } from 'react';
import { format, startOfMonth, endOfMonth, isSameMonth } from 'date-fns';

interface Expense {
	id: string;
	amount: number;
	description: string;
	date: string | Date;
	category: string;
	userId: string;
	householdId: string | null;
}

interface SpendingInsightsProps {
	expenses: Expense[];
}

export default function SpendingInsights({ expenses }: SpendingInsightsProps) {
	const [insights, setInsights] = useState<{
		totalSpent: number;
		monthlyAverage: number;
		topCategory: { name: string; amount: number };
		biggestExpense: { description: string; amount: number; date: Date };
		monthOverMonthChange: {
			amount: number;
			percentage: number;
			increased: boolean;
		};
		unusualSpending: {
			category: string;
			amount: number;
			percentage: number;
		} | null;
	}>({
		totalSpent: 0,
		monthlyAverage: 0,
		topCategory: { name: '', amount: 0 },
		biggestExpense: { description: '', amount: 0, date: new Date() },
		monthOverMonthChange: { amount: 0, percentage: 0, increased: false },
		unusualSpending: null,
	});

	useEffect(() => {
		// Process expenses to generate insights
		if (expenses.length === 0) return;

		// Total spent
		const totalSpent = expenses.reduce((sum, exp) => sum + exp.amount, 0);

		// Get unique months
		const monthsSet = new Set<string>();
		expenses.forEach((exp) => {
			const expDate = new Date(exp.date);
			const monthYear = format(expDate, 'yyyy-MM');
			monthsSet.add(monthYear);
		});
		const uniqueMonths = monthsSet.size;

		// Monthly average
		const monthlyAverage =
			uniqueMonths > 0 ? totalSpent / uniqueMonths : totalSpent;

		// Top category
		const categoryTotals: Record<string, number> = {};
		expenses.forEach((exp) => {
			if (!categoryTotals[exp.category]) {
				categoryTotals[exp.category] = 0;
			}
			categoryTotals[exp.category] += exp.amount;
		});

		let topCategory = { name: '', amount: 0 };
		Object.entries(categoryTotals).forEach(([category, amount]) => {
			if (amount > topCategory.amount) {
				topCategory = { name: category, amount };
			}
		});

		// Biggest expense
		let biggestExpense = { description: '', amount: 0, date: new Date() };
		expenses.forEach((exp) => {
			if (exp.amount > biggestExpense.amount) {
				biggestExpense = {
					description: exp.description,
					amount: exp.amount,
					date: new Date(exp.date),
				};
			}
		});

		// Month over month change
		const currentDate = new Date();
		const currentMonth = startOfMonth(currentDate);
		const previousMonth = startOfMonth(
			new Date(currentDate.setMonth(currentDate.getMonth() - 1))
		);

		const currentMonthExpenses = expenses.filter((exp) =>
			isSameMonth(new Date(exp.date), currentMonth)
		);
		const previousMonthExpenses = expenses.filter((exp) =>
			isSameMonth(new Date(exp.date), previousMonth)
		);

		const currentMonthTotal = currentMonthExpenses.reduce(
			(sum, exp) => sum + exp.amount,
			0
		);
		const previousMonthTotal = previousMonthExpenses.reduce(
			(sum, exp) => sum + exp.amount,
			0
		);

		let monthOverMonthChange = { amount: 0, percentage: 0, increased: false };

		if (previousMonthTotal > 0) {
			const difference = currentMonthTotal - previousMonthTotal;
			const percentage = (Math.abs(difference) / previousMonthTotal) * 100;

			monthOverMonthChange = {
				amount: Math.abs(difference),
				percentage,
				increased: difference > 0,
			};
		}

		// Detect unusual spending
		let unusualSpending = null;
		if (uniqueMonths >= 2) {
			// Calculate average spending per category per month
			const categoryMonthlyAverages: Record<string, number> = {};
			Object.keys(categoryTotals).forEach((category) => {
				categoryMonthlyAverages[category] =
					categoryTotals[category] / uniqueMonths;
			});

			// Check for unusual spending in current month
			Object.keys(categoryTotals).forEach((category) => {
				const currentMonthCategoryTotal = currentMonthExpenses
					.filter((exp) => exp.category === category)
					.reduce((sum, exp) => sum + exp.amount, 0);

				if (
					currentMonthCategoryTotal > categoryMonthlyAverages[category] * 1.5 &&
					currentMonthCategoryTotal > 100
				) {
					const percentage =
						(currentMonthCategoryTotal / categoryMonthlyAverages[category] -
							1) *
						100;
					if (!unusualSpending || percentage > unusualSpending.percentage) {
						unusualSpending = {
							category,
							amount: currentMonthCategoryTotal,
							percentage,
						};
					}
				}
			});
		}

		setInsights({
			totalSpent,
			monthlyAverage,
			topCategory,
			biggestExpense,
			monthOverMonthChange,
			unusualSpending,
		});
	}, [expenses]);

	return (
		<div className='space-y-4'>
			<div className='grid grid-cols-2 gap-4'>
				<div className='p-4 bg-blue-50 rounded-lg'>
					<div className='text-sm text-gray-500'>Total Spent</div>
					<div className='text-xl font-bold text-gray-900'>
						${insights.totalSpent.toFixed(2)}
					</div>
				</div>
				<div className='p-4 bg-green-50 rounded-lg'>
					<div className='text-sm text-gray-500'>Monthly Average</div>
					<div className='text-xl font-bold text-gray-900'>
						${insights.monthlyAverage.toFixed(2)}
					</div>
				</div>
			</div>

			<div className='p-4 bg-gray-50 rounded-lg'>
				<div className='text-sm text-gray-500'>Top Spending Category</div>
				<div className='text-xl font-bold text-gray-900'>
					{insights.topCategory.name}
				</div>
				<div className='text-sm text-gray-700'>
					${insights.topCategory.amount.toFixed(2)}
				</div>
			</div>

			<div className='p-4 bg-gray-50 rounded-lg'>
				<div className='text-sm text-gray-500'>Biggest Expense</div>
				<div className='text-xl font-bold text-gray-900 truncate'>
					{insights.biggestExpense.description}
				</div>
				<div className='flex justify-between text-sm text-gray-700'>
					<span>${insights.biggestExpense.amount.toFixed(2)}</span>
					<span>{format(insights.biggestExpense.date, 'MMM d, yyyy')}</span>
				</div>
			</div>

			{insights.monthOverMonthChange.amount > 0 && (
				<div
					className={`p-4 rounded-lg ${
						insights.monthOverMonthChange.increased
							? 'bg-red-50'
							: 'bg-green-50'
					}`}>
					<div className='text-sm text-gray-500'>Month-over-Month Change</div>
					<div className='text-xl font-bold flex items-center'>
						<span
							className={
								insights.monthOverMonthChange.increased
									? 'text-red-600'
									: 'text-green-600'
							}>
							{insights.monthOverMonthChange.increased ? '↑' : '↓'}{' '}
							{insights.monthOverMonthChange.percentage.toFixed(1)}%
						</span>
					</div>
					<div className='text-sm text-gray-700'>
						{insights.monthOverMonthChange.increased
							? 'Spending increased by'
							: 'Spending decreased by'}{' '}
						${insights.monthOverMonthChange.amount.toFixed(2)} compared to last
						month
					</div>
				</div>
			)}

			{insights.unusualSpending && (
				<div className='p-4 bg-yellow-50 rounded-lg'>
					<div className='text-sm text-gray-500'>Unusual Spending Detected</div>
					<div className='text-xl font-bold text-gray-900'>
						{insights.unusualSpending.category}
					</div>
					<div className='text-sm text-gray-700'>
						Spending is up {insights.unusualSpending.percentage.toFixed(1)}%
						compared to your monthly average
					</div>
				</div>
			)}
		</div>
	);
}
