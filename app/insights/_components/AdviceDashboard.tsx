'use client';

import { useState, useEffect } from 'react';
import {
	BarChart,
	Bar,
	XAxis,
	YAxis,
	CartesianGrid,
	Tooltip,
	ResponsiveContainer,
	PieChart,
	Pie,
	Cell,
	Legend,
} from 'recharts';
import SpendingInsights from './SpendingInsights';
import AiRecommendations from './AiRecommendations';
import axios from 'axios';
import { useTheme } from '@/contexts/ThemeContext';

// Define expense type
interface Expense {
	id: string;
	amount: number;
	description: string;
	date: string | Date;
	category: string;
	userId: string;
	householdId: string | null;
}

interface AdviceDashboardProps {
	initialExpenses: Expense[];
}

export default function AdviceDashboard({
	initialExpenses,
}: AdviceDashboardProps) {
	const { theme } = useTheme();
	const [expenses, setExpenses] = useState<Expense[]>(
		initialExpenses.map((expense) => ({
			...expense,
			date: new Date(expense.date),
		}))
	);
	const [recommendations, setRecommendations] = useState<string[]>([]);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		const loadRecommendations = async () => {
			try {
				const response = await axios.get('/api/advice');

				if (
					response.data.recommendations &&
					response.data.recommendations.length > 0
				) {
					setRecommendations(response.data.recommendations);
				} else {
					// If no recommendations are returned, force a refresh to generate some
					const refreshResponse = await axios.get('/api/advice?refresh=true');
					setRecommendations(refreshResponse.data.recommendations || []);
				}
			} catch (error) {
				console.error('Failed to fetch recommendations:', error);
			} finally {
				setIsLoading(false);
			}
		};

		loadRecommendations();
	}, []);

	// Calculate month-by-month spending
	const getMonthlyData = () => {
		const last6Months = new Array(6)
			.fill(0)
			.map((_, i) => {
				const date = new Date();
				date.setMonth(date.getMonth() - i);
				return {
					month: date.toLocaleDateString('en-US', {
						month: 'short',
						year: 'numeric',
					}),
					timestamp: date.getTime(),
					total: 0,
				};
			})
			.reverse();

		expenses.forEach((expense) => {
			const expenseDate = new Date(expense.date);
			const monthYear = expenseDate.toLocaleDateString('en-US', {
				month: 'short',
				year: 'numeric',
			});

			const monthData = last6Months.find((m) => m.month === monthYear);
			if (monthData) {
				monthData.total += expense.amount;
			}
		});

		return last6Months;
	};

	// Calculate category distribution
	const getCategoryData = () => {
		const categoryTotals: Record<string, number> = {};

		expenses.forEach((expense) => {
			if (!categoryTotals[expense.category]) {
				categoryTotals[expense.category] = 0;
			}
			categoryTotals[expense.category] += expense.amount;
		});

		return Object.entries(categoryTotals)
			.map(([name, value]) => ({ name, value }))
			.sort((a, b) => b.value - a.value);
	};

	const monthlyData = getMonthlyData();
	const categoryData = getCategoryData();

	// Colors for pie chart
	const COLORS = [
		'#0088FE',
		'#00C49F',
		'#FFBB28',
		'#FF8042',
		'#8884D8',
		'#82CA9D',
		'#FCCDE5',
		'#8DD1E1',
		'#FFFFB3',
		'#FB8072',
	];

	return (
		<div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
			{/* Monthly Spending Chart */}
			<div className='bg-gray-200 p-6 rounded-lg shadow-md'>
				<h2 className='text-xl font-semibold mb-4 text-gray-900'>
					Monthly Spending
				</h2>
				<div className='h-80'>
					<ResponsiveContainer
						width='100%'
						height='100%'>
						<BarChart
							data={monthlyData}
							margin={{ top: 20, right: 30, left: 20, bottom: 50 }}>
							<CartesianGrid
								strokeDasharray='3 3'
								stroke='#374151'
							/>
							<XAxis
								dataKey='month'
								angle={-45}
								textAnchor='end'
								height={60}
								fill='#1F2937'
							/>
							<YAxis
								tickFormatter={(value) => `$${value}`}
								label={{
									value: 'Amount ($)',
									angle: -90,
									position: 'left',
									fill: '#1F293760',
								}}
								tick={{
									fill: '#1F2937',
								}}
							/>
							<Tooltip
								formatter={(value) => [`$${value.toFixed(2)}`, 'Total']}
								contentStyle={{
									backgroundColor: '#F9FAFB',
									border: '1px solid #6B7280',
									color: '#111827',
								}}
							/>
							<Bar
								dataKey='total'
								fill='#2563EB'
								name='Amount'
							/>
						</BarChart>
					</ResponsiveContainer>
				</div>
			</div>

			{/* Spending by Category */}
			<div className='bg-gray-200 p-6 rounded-lg shadow-md'>
				<h2 className='text-xl font-semibold mb-4 text-gray-900'>
					Spending by Category
				</h2>
				<div className='h-80'>
					<ResponsiveContainer
						width='100%'
						height='100%'>
						<PieChart>
							<Pie
								data={categoryData}
								cx='50%'
								cy='50%'
								labelLine={false}
								outerRadius={80}
								fill='#8884d8'
								dataKey='value'
								label={({ name, percent }) =>
									`${name} ${(percent * 100).toFixed(0)}%`
								}>
								{categoryData.map((entry, index) => (
									<Cell
										key={`cell-${index}`}
										fill={COLORS[index % COLORS.length]}
									/>
								))}
							</Pie>
							<Tooltip
								formatter={(value) => [`$${value}`, 'Amount']}
								contentStyle={{
									backgroundColor: '#F9FAFB',
									border: '1px solid #6B7280',
									color: '#111827',
								}}
							/>
							<Legend
								formatter={(value) => (
									<span style={{ color: '#1F2937' }}>{value}</span>
								)}
							/>
						</PieChart>
					</ResponsiveContainer>
				</div>
			</div>

			{/* Spending Insights */}
			<div className='bg-gray-200 p-6 rounded-lg shadow-md'>
				<h2 className='text-xl font-semibold mb-4 text-gray-900'>
					Spending Insights
				</h2>
				<SpendingInsights expenses={expenses} />
			</div>

			{/* AI Recommendations */}
			<div className='bg-gray-200 p-6 rounded-lg shadow-md'>
				<h2 className='text-xl font-semibold mb-4 text-gray-900'>
					Recommendations
				</h2>
				<AiRecommendations
					recommendations={recommendations}
					isLoading={isLoading}
				/>
			</div>
		</div>
	);
}
