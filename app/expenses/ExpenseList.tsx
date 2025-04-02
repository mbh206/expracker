'use client';

import { useState } from 'react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { EXPENSE_CATEGORIES, getCategoryColor } from '../../lib/constants';
import { useTheme } from '@/contexts/ThemeContext';

interface Expense {
	id: string;
	amount: number;
	description: string;
	date: string | Date;
	category: string;
	createdAt: string | Date;
	updatedAt: string | Date;
	userId: string;
	householdId: string | null;
}

interface ExpenseListProps {
	initialExpenses: Expense[];
}

export default function ExpenseList({ initialExpenses }: ExpenseListProps) {
	const { theme } = useTheme();
	const [expenses] = useState<Expense[]>(
		initialExpenses.map((expense) => ({
			...expense,
			date: new Date(expense.date),
			createdAt: new Date(expense.createdAt),
			updatedAt: new Date(expense.updatedAt),
		}))
	);
	const [searchTerm, setSearchTerm] = useState('');
	const [categoryFilter, setCategoryFilter] = useState<string>('');
	const [dateFilter, setDateFilter] = useState<string>('all');
	const [sortBy, setSortBy] = useState<string>('date');
	const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

	// Filter and sort expenses
	const filteredExpenses = expenses
		.filter((expense) => {
			// Search filter
			const searchMatch = expense.description
				.toLowerCase()
				.includes(searchTerm.toLowerCase());

			// Category filter
			const categoryMatch = categoryFilter
				? expense.category === categoryFilter
				: true;

			// Date filter
			let dateMatch = true;
			const today = new Date();
			const expenseDate = new Date(expense.date);

			if (dateFilter === 'today') {
				dateMatch =
					expenseDate.getDate() === today.getDate() &&
					expenseDate.getMonth() === today.getMonth() &&
					expenseDate.getFullYear() === today.getFullYear();
			} else if (dateFilter === 'week') {
				const weekAgo = new Date();
				weekAgo.setDate(today.getDate() - 7);
				dateMatch = expenseDate >= weekAgo;
			} else if (dateFilter === 'month') {
				const monthAgo = new Date();
				monthAgo.setMonth(today.getMonth() - 1);
				dateMatch = expenseDate >= monthAgo;
			} else if (dateFilter === 'year') {
				const yearAgo = new Date();
				yearAgo.setFullYear(today.getFullYear() - 1);
				dateMatch = expenseDate >= yearAgo;
			}

			return searchMatch && categoryMatch && dateMatch;
		})
		.sort((a, b) => {
			if (sortBy === 'date') {
				return sortOrder === 'asc'
					? new Date(a.date).getTime() - new Date(b.date).getTime()
					: new Date(b.date).getTime() - new Date(a.date).getTime();
			} else if (sortBy === 'amount') {
				return sortOrder === 'asc' ? a.amount - b.amount : b.amount - a.amount;
			} else if (sortBy === 'category') {
				return sortOrder === 'asc'
					? a.category.localeCompare(b.category)
					: b.category.localeCompare(a.category);
			} else {
				return 0;
			}
		});

	// Calculate total
	const totalAmount = filteredExpenses.reduce(
		(sum, expense) => sum + expense.amount,
		0
	);

	const handleSort = (column: string) => {
		if (sortBy === column) {
			setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
		} else {
			setSortBy(column);
			setSortOrder('desc');
		}
	};

	const clearFilters = () => {
		setSearchTerm('');
		setCategoryFilter('');
		setDateFilter('all');
		setSortBy('date');
		setSortOrder('desc');
	};

	const formatDate = (date: Date | string) => {
		const d = new Date(date);
		return d.toLocaleDateString();
	};

	const formatTimeAgo = (date: Date | string) => {
		return formatDistanceToNow(new Date(date), { addSuffix: true });
	};

	return (
		<div className='bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden'>
			<div className='p-4 border-b border-gray-200 dark:border-gray-700'>
				<div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
					<div>
						<label
							htmlFor='searchTerm'
							className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
							Search
						</label>
						<input
							type='text'
							id='searchTerm'
							value={searchTerm}
							onChange={(e) => setSearchTerm(e.target.value)}
							placeholder='Search expenses...'
							className='w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100'
						/>
					</div>
					<div>
						<label
							htmlFor='categoryFilter'
							className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
							Category
						</label>
						<select
							id='categoryFilter'
							value={categoryFilter}
							onChange={(e) => setCategoryFilter(e.target.value)}
							className='w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100'>
							<option value=''>All Categories</option>
							{EXPENSE_CATEGORIES.map((category) => (
								<option
									key={category}
									value={category}>
									{category}
								</option>
							))}
						</select>
					</div>
					<div>
						<label
							htmlFor='dateFilter'
							className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
							Date Range
						</label>
						<select
							id='dateFilter'
							value={dateFilter}
							onChange={(e) => setDateFilter(e.target.value)}
							className='w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100'>
							<option value='all'>All Time</option>
							<option value='today'>Today</option>
							<option value='week'>This Week</option>
							<option value='month'>This Month</option>
							<option value='year'>This Year</option>
						</select>
					</div>
				</div>
				<div className='mt-4 flex justify-between items-center'>
					<button
						onClick={clearFilters}
						className='text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300'>
						Clear Filters
					</button>
					<div className='text-right'>
						<p className='text-sm text-gray-600 dark:text-gray-400'>
							Showing {filteredExpenses.length} of {expenses.length} expenses
						</p>
						<p className='font-semibold text-lg text-gray-900 dark:text-white'>
							Total: ${totalAmount.toFixed(2)}
						</p>
					</div>
				</div>
			</div>

			<div className='overflow-x-auto'>
				<table className='min-w-full divide-y divide-gray-200 dark:divide-gray-700'>
					<thead className='bg-gray-50 dark:bg-gray-700'>
						<tr>
							<th
								scope='col'
								className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer'
								onClick={() => handleSort('date')}>
								Date
								{sortBy === 'date' && (
									<span className='ml-1'>
										{sortOrder === 'asc' ? '↑' : '↓'}
									</span>
								)}
							</th>
							<th
								scope='col'
								className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider'>
								Description
							</th>
							<th
								scope='col'
								className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer'
								onClick={() => handleSort('category')}>
								Category
								{sortBy === 'category' && (
									<span className='ml-1'>
										{sortOrder === 'asc' ? '↑' : '↓'}
									</span>
								)}
							</th>
							<th
								scope='col'
								className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer'
								onClick={() => handleSort('amount')}>
								Amount
								{sortBy === 'amount' && (
									<span className='ml-1'>
										{sortOrder === 'asc' ? '↑' : '↓'}
									</span>
								)}
							</th>
							<th
								scope='col'
								className='px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider'>
								Actions
							</th>
						</tr>
					</thead>
					<tbody className='bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700'>
						{filteredExpenses.length === 0 ? (
							<tr>
								<td
									colSpan={5}
									className='px-6 py-4 text-center text-gray-500 dark:text-gray-400 whitespace-nowrap'>
									No expenses found matching your filters.
								</td>
							</tr>
						) : (
							filteredExpenses.map((expense) => (
								<tr
									key={expense.id}
									className='hover:bg-gray-50 dark:hover:bg-gray-700'>
									<td className='px-6 py-4 whitespace-nowrap'>
										<div className='text-sm text-gray-900 dark:text-gray-200'>
											{formatDate(expense.date)}
										</div>
										<div className='text-xs text-gray-500 dark:text-gray-400'>
											{formatTimeAgo(expense.createdAt)}
										</div>
									</td>
									<td className='px-6 py-4'>
										<div className='text-sm text-gray-900 dark:text-gray-200'>
											{expense.description}
										</div>
									</td>
									<td className='px-6 py-4 whitespace-nowrap'>
										<span
											className={`px-2 py-1 text-xs rounded-full ${getCategoryColor(
												expense.category,
												theme === 'dark'
											)}`}>
											{expense.category}
										</span>
									</td>
									<td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-200'>
										${expense.amount.toFixed(2)}
									</td>
									<td className='px-6 py-4 whitespace-nowrap text-right text-sm font-medium'>
										<Link
											href={`/expenses/${expense.id}`}
											className='text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 mr-4'>
											View
										</Link>
										<Link
											href={`/expenses/${expense.id}/edit`}
											className='text-indigo-600 dark:text-indigo-400 hover:text-indigo-900 dark:hover:text-indigo-300'>
											Edit
										</Link>
									</td>
								</tr>
							))
						)}
					</tbody>
				</table>
			</div>
		</div>
	);
}
