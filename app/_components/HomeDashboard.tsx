'use client';

import { useState } from 'react';
import Link from 'next/link';
import AiRecommendations from '../insights/_components/AiRecommendations';
import { HomeDashboardProps } from '../types';

export default function HomeDashboard({
	expenses,
	recurringExpenses,
	upcomingBills,
	recommendations,
}: HomeDashboardProps) {
	const [activeTab, setActiveTab] = useState<'overview' | 'bills' | 'insights'>(
		'overview'
	);

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

	// Convert to array and sort by amount
	const categoryData = Object.entries(spendingByCategory)
		.map(([category, amount]) => ({
			category,
			amount,
		}))
		.sort((a, b) => b.amount - a.amount)
		.slice(0, 5);

	// Format currency
	const formatCurrency = (amount: number) => {
		return new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: 'USD',
		}).format(amount);
	};

	// Format date
	const formatDate = (date: Date) => {
		return new Date(date).toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric',
		});
	};

	return (
		<div className='space-y-6'>
			{/* Tabs */}
			<div className='flex border-b border-gray-200'>
				<button
					onClick={() => setActiveTab('overview')}
					className={`px-4 py-2 font-medium text-sm ${
						activeTab === 'overview'
							? 'border-b-2 border-blue-500 text-blue-600'
							: 'text-gray-500 hover:text-gray-700'
					}`}>
					Overview
				</button>
				<button
					onClick={() => setActiveTab('bills')}
					className={`px-4 py-2 font-medium text-sm ${
						activeTab === 'bills'
							? 'border-b-2 border-blue-500 text-blue-600'
							: 'text-gray-500 hover:text-gray-700'
					}`}>
					Upcoming Bills
				</button>
				<button
					onClick={() => setActiveTab('insights')}
					className={`px-4 py-2 font-medium text-sm ${
						activeTab === 'insights'
							? 'border-b-2 border-blue-500 text-blue-600'
							: 'text-gray-500 hover:text-gray-700'
					}`}>
					AI Insights
				</button>
			</div>

			{/* Overview Tab */}
			{activeTab === 'overview' && (
				<div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
					<div className='bg-white p-6 rounded-lg shadow-md'>
						<h2 className='text-xl font-semibold mb-4'>Quick Actions</h2>
						<div className='space-y-3'>
							<Link
								href='/expenses/new'
								className='flex justify-center items-center py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors'>
								Add New Expense
							</Link>
							<Link
								href='/expenses'
								className='flex justify-center items-center py-2 px-4 border border-blue-600 text-blue-600 rounded-md hover:bg-blue-50 transition-colors'>
								View All Expenses
							</Link>
							<Link
								href='/households'
								className='flex justify-center items-center py-2 px-4 border border-blue-600 text-blue-600 rounded-md hover:bg-blue-50 transition-colors'>
								Manage Households
							</Link>
						</div>
					</div>

					<div className='bg-white p-6 rounded-lg shadow-md'>
						<h2 className='text-xl font-semibold mb-4'>Spending Summary</h2>
						<div className='space-y-4'>
							<div className='flex justify-between items-center'>
								<span className='text-gray-600'>Total Spending:</span>
								<span className='font-medium text-lg'>
									{formatCurrency(totalSpending)}
								</span>
							</div>
							<div className='flex justify-between items-center'>
								<span className='text-gray-600'>Recurring Expenses:</span>
								<span className='font-medium'>{recurringExpenses.length}</span>
							</div>
							<div className='flex justify-between items-center'>
								<span className='text-gray-600'>Upcoming Bills:</span>
								<span className='font-medium'>{upcomingBills.length}</span>
							</div>
						</div>
					</div>

					<div className='bg-white p-6 rounded-lg shadow-md md:col-span-2'>
						<h2 className='text-xl font-semibold mb-4'>
							Top Spending Categories
						</h2>
						<div className='space-y-3'>
							{categoryData.map((category) => (
								<div
									key={category.category}
									className='flex justify-between items-center'>
									<span className='text-gray-600'>{category.category}:</span>
									<span className='font-medium'>
										{formatCurrency(category.amount)}
									</span>
								</div>
							))}
						</div>
					</div>
				</div>
			)}

			{/* Bills Tab */}
			{activeTab === 'bills' && (
				<div className='bg-white p-6 rounded-lg shadow-md'>
					<div className='flex justify-between items-center mb-4'>
						<h2 className='text-xl font-semibold'>Upcoming Bills</h2>
						<Link
							href='/expenses'
							className='text-blue-600 hover:text-blue-800'>
							View All
						</Link>
					</div>

					{upcomingBills.length === 0 ? (
						<div className='text-center py-8'>
							<p className='text-gray-500'>No upcoming bills found.</p>
							<p className='text-gray-500 mt-2'>
								Add recurring expenses to see them here.
							</p>
						</div>
					) : (
						<div className='overflow-x-auto'>
							<table className='min-w-full divide-y divide-gray-200'>
								<thead className='bg-gray-50'>
									<tr>
										<th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
											Description
										</th>
										<th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
											Category
										</th>
										<th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
											Amount
										</th>
										<th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
											Date
										</th>
									</tr>
								</thead>
								<tbody className='bg-white divide-y divide-gray-200'>
									{upcomingBills.map((bill) => (
										<tr key={bill.id}>
											<td className='px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900'>
												{bill.description}
											</td>
											<td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500'>
												{bill.category}
											</td>
											<td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500'>
												{formatCurrency(bill.amount)}
											</td>
											<td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500'>
												{formatDate(bill.date)}
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					)}
				</div>
			)}

			{/* Insights Tab */}
			{activeTab === 'insights' && (
				<div className='bg-white p-6 rounded-lg shadow-md'>
					<h2 className='text-xl font-semibold mb-4'>AI Financial Insights</h2>
					<AiRecommendations recommendations={recommendations} />
				</div>
			)}
		</div>
	);
}
