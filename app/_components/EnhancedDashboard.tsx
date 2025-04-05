'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import {
	BarChart,
	Bar,
	XAxis,
	YAxis,
	Tooltip,
	ResponsiveContainer,
	PieChart,
	Pie,
	Cell,
} from 'recharts';
import { ExpenseWithRecurring } from '../types';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

interface EnhancedDashboardProps {
	expenses: ExpenseWithRecurring[];
	recurringExpenses: ExpenseWithRecurring[];
	upcomingBills: ExpenseWithRecurring[];
	recommendations: string[];
}

export default function EnhancedDashboard({
	expenses,
	recurringExpenses,
	upcomingBills,
	recommendations,
}: EnhancedDashboardProps) {
	const { data: session } = useSession();
	const [totalThisMonth, setTotalThisMonth] = useState(0);
	const [recentExpenses, setRecentExpenses] = useState<ExpenseWithRecurring[]>(
		[]
	);
	const [topCategories, setTopCategories] = useState<
		{ name: string; value: number }[]
	>([]);
	const [monthlyData, setMonthlyData] = useState<
		{ month: string; amount: number }[]
	>([]);
	const [monthlyLimit, setMonthlyLimit] = useState(2000); // Default budget limit
	const [monthlyProgress, setMonthlyProgress] = useState(0);

	useEffect(() => {
		if (expenses && expenses.length > 0) {
			// Calculate total spending this month
			const currentMonth = new Date().getMonth();
			const currentYear = new Date().getFullYear();

			const thisMonthExpenses = expenses.filter((expense) => {
				const expenseDate = new Date(expense.date);
				return (
					expenseDate.getMonth() === currentMonth &&
					expenseDate.getFullYear() === currentYear
				);
			});

			const monthTotal = thisMonthExpenses.reduce(
				(sum, expense) => sum + expense.amount,
				0
			);
			setTotalThisMonth(monthTotal);
			setMonthlyProgress(Math.min((monthTotal / monthlyLimit) * 100, 100));

			// Get recent expenses (most recent 5)
			const sorted = [...expenses].sort(
				(a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
			);
			setRecentExpenses(sorted.slice(0, 5));

			// Calculate top spending categories
			const categoryTotals = expenses.reduce((acc, expense) => {
				acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
				return acc;
			}, {} as Record<string, number>);

			const categoryData = Object.entries(categoryTotals)
				.map(([name, value]) => ({ name, value }))
				.sort((a, b) => b.value - a.value)
				.slice(0, 5);

			setTopCategories(categoryData);

			// Calculate monthly spending data
			const monthlyTotals = expenses.reduce((acc, expense) => {
				const date = new Date(expense.date);
				const month = new Date(date).toLocaleString('default', {
					month: 'short',
				});
				acc[month] = (acc[month] || 0) + expense.amount;
				return acc;
			}, {} as Record<string, number>);

			const monthlyChartData = Object.entries(monthlyTotals)
				.map(([month, amount]) => ({ month, amount }))
				.slice(-6); // Last 6 months

			setMonthlyData(monthlyChartData);
		}
	}, [expenses, monthlyLimit]);

	// Format currency
	const formatCurrency = (amount: number) => {
		return new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: 'USD',
			minimumFractionDigits: 0,
			maximumFractionDigits: 0,
		}).format(amount);
	};

	// Format date
	const formatDate = (dateString: string | Date) => {
		const date = new Date(dateString);
		return date.toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric',
			year: 'numeric',
		});
	};

	// Get current month and year
	const getCurrentMonthYear = () => {
		const date = new Date();
		return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
	};

	return (
		<div className='space-y-6'>
			<div className='flex flex-col md:flex-row items-start justify-between mb-6'>
				<div>
					<h1 className='text-2xl md:text-3xl font-bold'>
						Welcome, {session?.user?.name?.split(' ')[0] || 'User'}
					</h1>
					<p className='text-gray-600'>Here's your financial overview</p>
				</div>
				<div className='mt-4 md:mt-0 flex space-x-2'>
					<Link
						href='/expenses/new'
						className='px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700'>
						Add Expense
					</Link>
				</div>
			</div>

			{/* Summary Cards */}
			<div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
				<div className='bg-white p-4 md:p-6 rounded-lg shadow-md'>
					<div className='flex items-center justify-between mb-3'>
						<h2 className='text-lg font-semibold text-gray-900'>This Month</h2>
						<span className='text-sm text-gray-500'>
							{getCurrentMonthYear()}
						</span>
					</div>
					<p className='text-3xl font-bold mb-2'>
						{formatCurrency(totalThisMonth)}
					</p>
					<div className='w-full bg-gray-200 rounded-full h-2.5 mb-1'>
						<div
							className={`h-2.5 rounded-full ${
								monthlyProgress > 85
									? 'bg-red-500'
									: monthlyProgress > 65
									? 'bg-yellow-500'
									: 'bg-green-500'
							}`}
							style={{ width: `${monthlyProgress}%` }}></div>
					</div>
					<p className='text-sm text-gray-600'>
						{formatCurrency(totalThisMonth)} of {formatCurrency(monthlyLimit)}{' '}
						budget
					</p>
				</div>

				<div className='bg-white p-4 md:p-6 rounded-lg shadow-md'>
					<h2 className='text-lg font-semibold text-gray-900 mb-3'>
						Upcoming Bills
					</h2>
					<p className='text-3xl font-bold mb-2'>{upcomingBills.length}</p>
					<p className='text-sm text-gray-600'>Recurring expenses due soon</p>
					<div className='mt-3'>
						<Link
							href='/expenses?filter=recurring'
							className='text-blue-600 hover:text-blue-800 text-sm'>
							View all recurring expenses
						</Link>
					</div>
				</div>

				<div className='bg-white p-4 md:p-6 rounded-lg shadow-md'>
					<h2 className='text-lg font-semibold text-gray-900 mb-3'>
						Top Category
					</h2>
					{topCategories.length > 0 ? (
						<>
							<p className='text-lg font-bold mb-1'>{topCategories[0].name}</p>
							<p className='text-2xl font-bold mb-2'>
								{formatCurrency(topCategories[0].value)}
							</p>
							<p className='text-sm text-gray-600'>
								{totalThisMonth > 0
									? `${Math.round(
											(topCategories[0].value / totalThisMonth) * 100
									  )}% of your spending`
									: 'Most frequent expense category'}
							</p>
						</>
					) : (
						<p className='text-gray-500'>No data available</p>
					)}
				</div>
			</div>

			{/* Recent Transactions and Chart */}
			<div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
				<div className='bg-white p-4 md:p-6 rounded-lg shadow-md'>
					<div className='flex justify-between items-center mb-4'>
						<h2 className='text-lg font-semibold text-gray-900'>
							Recent Transactions
						</h2>
						<Link
							href='/expenses'
							className='text-blue-600 hover:text-blue-800 text-sm'>
							View All
						</Link>
					</div>
					{recentExpenses.length > 0 ? (
						<div className='space-y-3'>
							{recentExpenses.map((expense) => (
								<Link
									href={`/expenses/${expense.id}`}
									key={expense.id}>
									<div className='flex items-center justify-between p-3 hover:bg-gray-50 rounded-md cursor-pointer'>
										<div className='flex items-center space-x-3'>
											<div
												className={`w-10 h-10 rounded-full flex items-center justify-center ${
													expense.category === 'Food'
														? 'bg-green-100 text-green-600'
														: expense.category === 'Transportation'
														? 'bg-blue-100 text-blue-600'
														: expense.category === 'Housing'
														? 'bg-red-100 text-red-600'
														: expense.category === 'Entertainment'
														? 'bg-purple-100 text-purple-600'
														: 'bg-gray-100 text-gray-600'
												}`}>
												{expense.category.charAt(0)}
											</div>
											<div>
												<p className='font-medium text-gray-900'>
													{expense.description}
												</p>
												<p className='text-xs text-gray-500'>
													{formatDate(expense.date)}
												</p>
											</div>
										</div>
										<span className='font-medium'>
											${expense.amount.toFixed(2)}
										</span>
									</div>
								</Link>
							))}
						</div>
					) : (
						<div className='text-center py-6'>
							<p className='text-gray-500'>No recent transactions</p>
							<Link
								href='/expenses/new'
								className='text-blue-600 hover:text-blue-800 mt-2 inline-block'>
								Add your first expense
							</Link>
						</div>
					)}
				</div>

				<div className='bg-white p-4 md:p-6 rounded-lg shadow-md'>
					<h2 className='text-lg font-semibold text-gray-900 mb-4'>
						Monthly Spending
					</h2>
					{monthlyData.length > 0 ? (
						<div className='h-64'>
							<ResponsiveContainer
								width='100%'
								height='100%'>
								<BarChart
									data={monthlyData}
									margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
									<XAxis dataKey='month' />
									<YAxis />
									<Tooltip formatter={(value) => [`$${value}`, 'Amount']} />
									<Bar
										dataKey='amount'
										fill='#3B82F6'
									/>
								</BarChart>
							</ResponsiveContainer>
						</div>
					) : (
						<div className='h-64 flex items-center justify-center'>
							<p className='text-gray-500'>Not enough data to display chart</p>
						</div>
					)}
				</div>
			</div>

			{/* Spending Distribution and Insights */}
			<div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
				<div className='bg-white p-4 md:p-6 rounded-lg shadow-md'>
					<h2 className='text-lg font-semibold text-gray-900 mb-4'>
						Spending Distribution
					</h2>
					{topCategories.length > 0 ? (
						<div className='h-64'>
							<ResponsiveContainer
								width='100%'
								height='100%'>
								<PieChart>
									<Pie
										data={topCategories}
										cx='50%'
										cy='50%'
										labelLine={false}
										outerRadius={80}
										fill='#8884d8'
										dataKey='value'
										label={({ name, percent }) =>
											`${name} ${(percent * 100).toFixed(0)}%`
										}>
										{topCategories.map((entry, index) => (
											<Cell
												key={`cell-${index}`}
												fill={COLORS[index % COLORS.length]}
											/>
										))}
									</Pie>
									<Tooltip formatter={(value) => [`$${value}`, 'Amount']} />
								</PieChart>
							</ResponsiveContainer>
						</div>
					) : (
						<div className='h-64 flex items-center justify-center'>
							<p className='text-gray-500'>Not enough data to display chart</p>
						</div>
					)}
				</div>

				<div className='bg-white p-4 md:p-6 rounded-lg shadow-md'>
					<div className='flex justify-between items-center mb-4'>
						<h2 className='text-lg font-semibold text-gray-900'>
							Financial Insights
						</h2>
						<Link
							href='/insights'
							className='text-blue-600 hover:text-blue-800 text-sm'>
							View All
						</Link>
					</div>

					{recommendations && recommendations.length > 0 ? (
						<div className='space-y-3'>
							{recommendations.slice(0, 3).map((recommendation, index) => (
								<div
									key={index}
									className='p-3 bg-blue-50 rounded-md flex items-start'>
									<span className='text-blue-600 mr-2 text-xl'>💡</span>
									<p className='text-gray-800 text-sm'>{recommendation}</p>
								</div>
							))}
						</div>
					) : (
						<div className='p-3 bg-blue-50 rounded-md'>
							<p className='text-gray-800 text-sm'>
								Add more expenses to get personalized financial insights.
							</p>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
