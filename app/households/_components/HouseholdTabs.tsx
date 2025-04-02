'use client';

import { useState } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { getCategoryColor } from '../../../lib/constants';

interface Expense {
	id: string;
	description: string;
	amount: number;
	date: string | Date;
	category: string;
	userId: string;
	user: {
		id: string;
		name: string | null;
		email: string | null;
	};
}

interface HouseholdTabsProps {
	expenses: Expense[];
	householdId: string;
	isAdmin: boolean;
}

export default function HouseholdTabs({
	expenses,
	householdId,
	isAdmin,
}: HouseholdTabsProps) {
	const [activeTab, setActiveTab] = useState<'expenses' | 'summary'>(
		'expenses'
	);

	// Process expenses for display
	const formattedExpenses = expenses.map((expense) => ({
		...expense,
		date: new Date(expense.date),
		formattedDate: format(new Date(expense.date), 'MMM d, yyyy'),
		userName: expense.user.name || expense.user.email || 'Unknown User',
	}));

	// Calculate summary data
	const totalAmount = formattedExpenses.reduce(
		(sum, expense) => sum + expense.amount,
		0
	);

	// Group expenses by category
	const expensesByCategory = formattedExpenses.reduce((acc, expense) => {
		if (!acc[expense.category]) {
			acc[expense.category] = {
				total: 0,
				count: 0,
			};
		}
		acc[expense.category].total += expense.amount;
		acc[expense.category].count += 1;
		return acc;
	}, {} as Record<string, { total: number; count: number }>);

	// Sort categories by total amount
	const sortedCategories = Object.entries(expensesByCategory).sort(
		(a, b) => b[1].total - a[1].total
	);

	// Group expenses by user
	const expensesByUser = formattedExpenses.reduce((acc, expense) => {
		const userKey = expense.user.id;
		const userName = expense.userName;

		if (!acc[userKey]) {
			acc[userKey] = {
				name: userName,
				total: 0,
				count: 0,
			};
		}
		acc[userKey].total += expense.amount;
		acc[userKey].count += 1;
		return acc;
	}, {} as Record<string, { name: string; total: number; count: number }>);

	// Sort users by total amount
	const sortedUsers = Object.entries(expensesByUser).sort(
		(a, b) => b[1].total - a[1].total
	);

	return (
		<div className='bg-white rounded-lg shadow-md overflow-hidden'>
			<div className='flex border-b'>
				<button
					onClick={() => setActiveTab('expenses')}
					className={`flex-1 py-4 px-6 text-center font-medium ${
						activeTab === 'expenses'
							? 'text-blue-600 border-b-2 border-blue-600'
							: 'text-gray-500 hover:text-gray-700'
					}`}>
					Expenses
				</button>
				<button
					onClick={() => setActiveTab('summary')}
					className={`flex-1 py-4 px-6 text-center font-medium ${
						activeTab === 'summary'
							? 'text-blue-600 border-b-2 border-blue-600'
							: 'text-gray-500 hover:text-gray-700'
					}`}>
					Summary
				</button>
			</div>

			<div className='p-6'>
				{activeTab === 'expenses' && (
					<div>
						<div className='flex justify-between items-center mb-4'>
							<h3 className='text-lg font-semibold'>Household Expenses</h3>
							<Link
								href={`/expenses/new?householdId=${householdId}`}
								className='px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm'>
								Add Expense
							</Link>
						</div>

						{formattedExpenses.length === 0 ? (
							<div className='text-center py-8 text-gray-500'>
								<p>No expenses yet for this household.</p>
								<p className='mt-2'>
									<Link
										href={`/expenses/new?householdId=${householdId}`}
										className='text-blue-600 hover:text-blue-800'>
										Add the first expense
									</Link>{' '}
									to get started.
								</p>
							</div>
						) : (
							<div className='overflow-x-auto'>
								<table className='min-w-full divide-y divide-gray-200'>
									<thead className='bg-gray-50'>
										<tr>
											<th
												scope='col'
												className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
												Date
											</th>
											<th
												scope='col'
												className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
												Description
											</th>
											<th
												scope='col'
												className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
												Category
											</th>
											<th
												scope='col'
												className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
												Added By
											</th>
											<th
												scope='col'
												className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
												Amount
											</th>
											<th
												scope='col'
												className='px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider'>
												Actions
											</th>
										</tr>
									</thead>
									<tbody className='bg-white divide-y divide-gray-200'>
										{formattedExpenses.map((expense) => (
											<tr
												key={expense.id}
												className='hover:bg-gray-50'>
												<td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>
													{expense.formattedDate}
												</td>
												<td className='px-6 py-4 text-sm text-gray-900'>
													{expense.description}
												</td>
												<td className='px-6 py-4 whitespace-nowrap'>
													<span
														className={`px-2 py-1 text-xs rounded-full ${getCategoryColor(
															expense.category
														)}`}>
														{expense.category}
													</span>
												</td>
												<td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>
													{expense.userName}
												</td>
												<td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>
													${expense.amount.toFixed(2)}
												</td>
												<td className='px-6 py-4 whitespace-nowrap text-right text-sm font-medium'>
													<Link
														href={`/expenses/${expense.id}`}
														className='text-blue-600 hover:text-blue-900'>
														View
													</Link>
												</td>
											</tr>
										))}
									</tbody>
								</table>
							</div>
						)}
					</div>
				)}

				{activeTab === 'summary' && (
					<div>
						<h3 className='text-lg font-semibold mb-4'>Expense Summary</h3>

						<div className='bg-blue-50 p-4 rounded-md mb-6'>
							<div className='text-lg font-semibold'>
								Total Expenses: ${totalAmount.toFixed(2)}
							</div>
							<div className='text-sm text-gray-600'>
								{formattedExpenses.length} expense
								{formattedExpenses.length !== 1 ? 's' : ''}
							</div>
						</div>

						<div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
							<div>
								<h4 className='text-md font-semibold mb-3'>By Category</h4>
								<div className='space-y-2'>
									{sortedCategories.map(([category, data]) => (
										<div
											key={category}
											className='flex justify-between items-center p-3 bg-gray-50 rounded-md'>
											<div className='flex items-center'>
												<span
													className={`inline-block w-3 h-3 rounded-full mr-2 ${
														getCategoryColor(category).split(' ')[0]
													}`}></span>
												<span>
													{category}{' '}
													<span className='text-gray-500 text-sm'>
														({data.count})
													</span>
												</span>
											</div>
											<span className='font-medium'>
												${data.total.toFixed(2)}
											</span>
										</div>
									))}
								</div>
							</div>

							<div>
								<h4 className='text-md font-semibold mb-3'>By Member</h4>
								<div className='space-y-2'>
									{sortedUsers.map(([userId, data]) => (
										<div
											key={userId}
											className='flex justify-between items-center p-3 bg-gray-50 rounded-md'>
											<div>
												{data.name}{' '}
												<span className='text-gray-500 text-sm'>
													({data.count})
												</span>
											</div>
											<span className='font-medium'>
												${data.total.toFixed(2)}
											</span>
										</div>
									))}
								</div>
							</div>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}
