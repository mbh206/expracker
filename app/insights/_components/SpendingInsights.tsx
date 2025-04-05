'use client';

import { useState, useEffect } from 'react';
import {
	Chart as ChartJS,
	ArcElement,
	Tooltip,
	Legend,
	CategoryScale,
	LinearScale,
	BarElement,
	Title,
} from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';

ChartJS.register(
	ArcElement,
	CategoryScale,
	LinearScale,
	BarElement,
	Title,
	Tooltip,
	Legend
);

interface CategoryData {
	category: string;
	amount: number;
}

interface MonthlyData {
	month: string;
	amount: number;
}

interface SpendingInsightsProps {
	totalSpending: number;
	topCategories: CategoryData[];
	monthlyData: MonthlyData[];
}

export default function SpendingInsights({
	totalSpending,
	topCategories,
	monthlyData,
}: SpendingInsightsProps) {
	const [insights, setInsights] = useState<{
		monthlyAverage: number;
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
		monthlyAverage: 0,
		biggestExpense: { description: '', amount: 0, date: new Date() },
		monthOverMonthChange: { amount: 0, percentage: 0, increased: false },
		unusualSpending: null,
	});

	useEffect(() => {
		// Process data to generate insights
		if (monthlyData.length === 0) return;

		// Monthly average
		const monthlyAverage = totalSpending / monthlyData.length;

		// Month over month change
		if (monthlyData.length >= 2) {
			const currentMonth = monthlyData[monthlyData.length - 1];
			const previousMonth = monthlyData[monthlyData.length - 2];

			const amountChange = currentMonth.amount - previousMonth.amount;
			const percentageChange =
				previousMonth.amount > 0
					? (amountChange / previousMonth.amount) * 100
					: 0;

			setInsights((prev) => ({
				...prev,
				monthlyAverage,
				monthOverMonthChange: {
					amount: amountChange,
					percentage: percentageChange,
					increased: amountChange > 0,
				},
			}));
		} else {
			setInsights((prev) => ({
				...prev,
				monthlyAverage,
			}));
		}

		// Check for unusual spending
		if (topCategories.length > 0) {
			const topCategory = topCategories[0];
			const categoryPercentage = (topCategory.amount / totalSpending) * 100;

			if (categoryPercentage > 40) {
				setInsights((prev) => ({
					...prev,
					unusualSpending: {
						category: topCategory.category,
						amount: topCategory.amount,
						percentage: categoryPercentage,
					},
				}));
			}
		}
	}, [totalSpending, topCategories, monthlyData]);

	// Prepare data for pie chart
	const pieChartData = {
		labels: topCategories.map((cat) => cat.category),
		datasets: [
			{
				data: topCategories.map((cat) => cat.amount),
				backgroundColor: [
					'#FF6384',
					'#36A2EB',
					'#FFCE56',
					'#4BC0C0',
					'#9966FF',
				],
				hoverBackgroundColor: [
					'#FF6384',
					'#36A2EB',
					'#FFCE56',
					'#4BC0C0',
					'#9966FF',
				],
			},
		],
	};

	// Prepare data for bar chart
	const barChartData = {
		labels: monthlyData.map((data) => data.month),
		datasets: [
			{
				label: 'Monthly Spending',
				data: monthlyData.map((data) => data.amount),
				backgroundColor: '#36A2EB',
			},
		],
	};

	const barChartOptions = {
		responsive: true,
		plugins: {
			legend: {
				position: 'top' as const,
			},
			title: {
				display: true,
				text: 'Monthly Spending Trends',
			},
		},
	};

	return (
		<div className='bg-white p-6 rounded-lg shadow-md'>
			<h3 className='text-lg font-semibold mb-4'>Spending Insights</h3>

			<div className='grid grid-cols-1 md:grid-cols-2 gap-6 mb-8'>
				<div className='h-64'>
					<h4 className='font-medium mb-2 text-center'>Spending by Category</h4>
					<Pie data={pieChartData} />
				</div>
				<div className='h-64'>
					<Bar
						options={barChartOptions}
						data={barChartData}
					/>
				</div>
			</div>

			<div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
				<div>
					<h4 className='font-medium mb-2'>Overview</h4>
					<ul className='space-y-2'>
						<li className='flex justify-between'>
							<span className='text-gray-600'>Total Spending:</span>
							<span className='font-medium'>${totalSpending.toFixed(2)}</span>
						</li>
						<li className='flex justify-between'>
							<span className='text-gray-600'>Monthly Average:</span>
							<span className='font-medium'>
								${insights.monthlyAverage.toFixed(2)}
							</span>
						</li>

						{insights.monthOverMonthChange.amount !== 0 && (
							<li className='flex justify-between'>
								<span className='text-gray-600'>Month-over-Month Change:</span>
								<span
									className={`font-medium ${
										insights.monthOverMonthChange.increased
											? 'text-red-500'
											: 'text-green-500'
									}`}>
									{insights.monthOverMonthChange.increased ? '+' : ''}$
									{Math.abs(insights.monthOverMonthChange.amount).toFixed(2)}(
									{insights.monthOverMonthChange.increased ? '+' : ''}
									{insights.monthOverMonthChange.percentage.toFixed(1)}%)
								</span>
							</li>
						)}
					</ul>
				</div>

				<div>
					<h4 className='font-medium mb-2'>Top Categories</h4>
					<ul className='space-y-2'>
						{topCategories.slice(0, 3).map((category) => (
							<li
								key={category.category}
								className='flex justify-between'>
								<span className='text-gray-600'>{category.category}:</span>
								<span className='font-medium'>
									${category.amount.toFixed(2)}
								</span>
							</li>
						))}
					</ul>

					{insights.unusualSpending && (
						<div className='mt-4 p-3 bg-yellow-50 rounded-md'>
							<p className='text-sm text-yellow-800'>
								<strong>Unusual Spending:</strong>{' '}
								{insights.unusualSpending.category}
								accounts for {insights.unusualSpending.percentage.toFixed(1)}%
								of your total spending.
							</p>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
