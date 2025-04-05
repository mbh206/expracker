'use client';

import { useState, useEffect } from 'react';
import { Expense } from '@prisma/client';
import HouseholdSelector from './HouseholdSelector';
import SpendingInsights from './SpendingInsights';
import AiRecommendations from './AiRecommendations';

interface AdviceDashboardProps {
	initialExpenses: Expense[];
}

export default function AdviceDashboard({
	initialExpenses,
}: AdviceDashboardProps) {
	const [expenses, setExpenses] = useState<Expense[]>(initialExpenses);
	const [selectedHouseholdId, setSelectedHouseholdId] = useState<string | null>(
		null
	);
	const [selectedHouseholdName, setSelectedHouseholdName] =
		useState<string>('Personal');
	const [recommendations, setRecommendations] = useState<string[]>([]);
	const [isLoadingExpenses, setIsLoadingExpenses] = useState(false);

	// Fetch initial recommendations
	useEffect(() => {
		const fetchInitialRecommendations = async () => {
			try {
				const response = await fetch('/api/advice');
				if (!response.ok) throw new Error('Failed to fetch recommendations');
				const data = await response.json();
				setRecommendations(data.recommendations);
			} catch (error) {
				console.error('Error fetching initial recommendations:', error);
			}
		};

		fetchInitialRecommendations();
	}, []);

	// Handle household selection
	const handleHouseholdSelect = async (householdId: string | null) => {
		setSelectedHouseholdId(householdId);
		setSelectedHouseholdName(householdId ? 'Household' : 'Personal');
		setIsLoadingExpenses(true);

		try {
			// Fetch expenses for the selected household
			const response = await fetch(
				`/api/expenses?householdId=${householdId || ''}`
			);
			if (!response.ok) throw new Error('Failed to fetch expenses');
			const data = await response.json();
			setExpenses(
				data.map((expense: Expense) => ({
					...expense,
					date: new Date(expense.date),
				}))
			);

			// Fetch recommendations
			const recResponse = await fetch(
				`/api/advice?householdId=${householdId || ''}`
			);
			if (!recResponse.ok) throw new Error('Failed to fetch recommendations');
			const recData = await recResponse.json();
			setRecommendations(recData.recommendations);
		} catch (error) {
			console.error('Error fetching data:', error);
		} finally {
			setIsLoadingExpenses(false);
		}
	};

	// Calculate total spending
	const totalSpending = expenses.reduce(
		(sum, expense) => sum + expense.amount,
		0
	);

	// Calculate spending by category
	const spendingByCategory = expenses.reduce((acc, expense) => {
		acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
		return acc;
	}, {} as Record<string, number>);

	// Convert to array for chart
	const categoryData = Object.entries(spendingByCategory).map(
		([category, amount]) => ({
			category,
			amount,
		})
	);

	// Sort by amount and get top 5
	const topCategories = categoryData
		.sort((a, b) => b.amount - a.amount)
		.slice(0, 5);

	// Calculate monthly spending
	const monthlySpending = expenses.reduce((acc, expense) => {
		const month = new Date(expense.date).toLocaleString('default', {
			month: 'short',
		});
		acc[month] = (acc[month] || 0) + expense.amount;
		return acc;
	}, {} as Record<string, number>);

	// Convert to array for chart
	const monthlyData = Object.entries(monthlySpending).map(
		([month, amount]) => ({
			month,
			amount,
		})
	);

	// Sort by date
	monthlyData.sort((a, b) => {
		const months = [
			'Jan',
			'Feb',
			'Mar',
			'Apr',
			'May',
			'Jun',
			'Jul',
			'Aug',
			'Sep',
			'Oct',
			'Nov',
			'Dec',
		];
		return months.indexOf(a.month) - months.indexOf(b.month);
	});

	// Check if we have enough data to show insights
	const hasEnoughData = expenses.length >= 5;

	return (
		<div className='space-y-8'>
			<div className='flex justify-between items-center'>
				<h2 className='text-2xl font-bold'>
					{selectedHouseholdName}&apos;s Insights
				</h2>
				<HouseholdSelector
					onSelect={handleHouseholdSelect}
					selectedHouseholdId={selectedHouseholdId}
				/>
			</div>

			{isLoadingExpenses ? (
				<div className='flex justify-center items-center h-64'>
					<div className='animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500'></div>
				</div>
			) : hasEnoughData ? (
				<>
					<SpendingInsights
						totalSpending={totalSpending}
						topCategories={topCategories}
						monthlyData={monthlyData}
					/>
					<AiRecommendations
						recommendations={recommendations}
						isLoading={isLoadingExpenses}
					/>
				</>
			) : (
				<div className='bg-white p-8 rounded-lg shadow-md text-center'>
					<h2 className='text-xl font-semibold mb-4'>Not Enough Data</h2>
					<p className='text-gray-600'>
						We need at least 5 expenses to provide meaningful insights.
					</p>
				</div>
			)}
		</div>
	);
}
