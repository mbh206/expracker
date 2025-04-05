'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';
import { EXPENSE_CATEGORIES, getCategoryColor } from '../../lib/constants';

interface Expense {
	id: string;
	amount: number;
	description: string;
	date: string | Date;
	category: string;
	isRecurring: boolean;
	createdAt: string | Date;
	updatedAt: string | Date;
	userId: string;
	householdId: string | null;
}

interface HouseholdExpense {
	householdId: string;
	householdName: string;
	expenses: Expense[];
}

interface ExpenseListProps {
	expenses: Expense[];
	userExpenses: Expense[];
	householdExpenses: HouseholdExpense[];
}

export default function ExpenseList({
	expenses: initialExpenses = [],
	userExpenses = [],
	householdExpenses = [],
}: ExpenseListProps) {
	const [expenses, setExpenses] = useState<Expense[]>(initialExpenses);
	const [searchTerm, setSearchTerm] = useState('');
	const [selectedCategory, setSelectedCategory] = useState<string>('');
	const [dateFilter, setDateFilter] = useState<string>('all');
	const [sortBy, setSortBy] = useState<keyof Expense>('date');
	const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
	const [selectedView, setSelectedView] = useState<string>('all');
	const router = useRouter();

	// Update expenses when selected view changes
	useEffect(() => {
		if (selectedView === 'all') {
			setExpenses(initialExpenses);
		} else if (selectedView === 'personal') {
			setExpenses(userExpenses);
		} else {
			// Find the selected household expenses
			const selectedHousehold = householdExpenses.find(
				(h) => h.householdId === selectedView
			);
			setExpenses(selectedHousehold?.expenses || []);
		}
	}, [selectedView, initialExpenses, userExpenses, householdExpenses]);

	// Filter and sort expenses
	const filteredExpenses = expenses
		.filter((expense) => {
			// Search filter
			const searchMatch = expense.description
				.toLowerCase()
				.includes(searchTerm.toLowerCase());

			// Category filter
			const categoryMatch = selectedCategory
				? expense.category === selectedCategory
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

	const handleSort = (column: keyof Expense) => {
		if (sortBy === column) {
			setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
		} else {
			setSortBy(column);
			setSortOrder('desc');
		}
	};

	const clearFilters = () => {
		setSearchTerm('');
		setSelectedCategory('');
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

	// Handle row click to navigate to expense details
	const handleRowClick = (expenseId: string) => {
		router.push(`/expenses/${expenseId}`);
	};

	return (
		<div className='bg-gray-200 rounded-lg shadow-md'>
			<div className='p-2 border-b border-gray-200'>
				<div className='grid grid-cols-1 gap-3'>
					<div className='w-[100%] flex flex-col'>
						<label
							htmlFor='searchTerm'
							className='text-sm font-medium text-gray-700 mb-1'>
							Search
						</label>
						<input
							type='text'
							id='searchTerm'
							value={searchTerm}
							onChange={(e) => setSearchTerm(e.target.value)}
							placeholder='Search expenses...'
							className='p-2 border border-gray-300 rounded-md bg-white text-gray-900'
						/>
					</div>
					<div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
						<div>
							<label
								htmlFor='viewSelector'
								className='block text-sm font-medium text-gray-700 mb-1'>
								View
							</label>
							<select
								id='viewSelector'
								value={selectedView}
								onChange={(e) => setSelectedView(e.target.value)}
								className='w-full p-2 border border-gray-300 rounded-md bg-white text-gray-900'>
								<option value='all'>All Expenses</option>
								<option value='personal'>My Personal Expenses</option>
								{householdExpenses.map((household) => (
									<option
										key={household.householdId}
										value={household.householdId}>
										{household.householdName} Expenses
									</option>
								))}
							</select>
						</div>
						<div>
							<label
								htmlFor='categoryFilter'
								className='block text-sm font-medium text-gray-700 mb-1'>
								Category
							</label>
							<select
								id='categoryFilter'
								value={selectedCategory}
								onChange={(e) => setSelectedCategory(e.target.value)}
								className='w-full p-2 border border-gray-300 rounded-md bg-white text-gray-900'>
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
								className='block text-sm font-medium text-gray-700'>
								Date Range
							</label>
							<select
								id='dateFilter'
								value={dateFilter}
								onChange={(e) => setDateFilter(e.target.value)}
								className='w-full p-2 border border-gray-300 rounded-md bg-white text-gray-900'>
								<option value='all'>All Time</option>
								<option value='today'>Today</option>
								<option value='week'>This Week</option>
								<option value='month'>This Month</option>
								<option value='year'>This Year</option>
							</select>
						</div>
					</div>
				</div>
				<div className='flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mt-1'>
					<button
						onClick={clearFilters}
						className='px-4 py-2 bg-yellow-500 text-white border-none rounded-md hover:bg-blue-700'>
						Clear Filters
					</button>
					<div className='text-right w-full sm:w-auto'>
						<p className='text-sm text-gray-600'>
							Showing {filteredExpenses.length} of {expenses.length} expenses
						</p>
						<p className='font-semibold text-lg text-gray-900'>
							Total: ${totalAmount.toFixed(2)}
						</p>
					</div>
				</div>
			</div>

			<div className=''>
				<table className='w-full table-fixed border-collapse'>
					<colgroup>
						<col className='w-[20%]' />
						<col className='w-[25%]' />
						<col className='w-[20%]' />
						<col className='w-[15%]' />
						<col className='w-[20%]' />
					</colgroup>
					<thead className='bg-gray-50'>
						<tr>
							<th
								scope='col'
								className='px-2 py-3 text-[.6rem] font-medium text-gray-500 uppercase cursor-pointer text-left'
								onClick={() => handleSort('date')}>
								<div className='flex items-center'>
									<span>Date</span>
									{sortBy === 'date' && (
										<span className='ml-1'>
											{sortOrder === 'asc' ? '↑' : '↓'}
										</span>
									)}
								</div>
							</th>
							<th
								scope='col'
								className='px-2 py-3 text-[.6rem] font-medium text-gray-500 uppercase text-left'>
								Description
							</th>
							<th
								scope='col'
								className='px-2 py-3 text-[.6rem] font-medium text-gray-500 uppercase cursor-pointer text-left'
								onClick={() => handleSort('category')}>
								<div className='flex items-center'>
									<span>Category</span>
									{sortBy === 'category' && (
										<span className='ml-1'>
											{sortOrder === 'asc' ? '↑' : '↓'}
										</span>
									)}
								</div>
							</th>
							<th
								scope='col'
								className='px-2 py-3 text-[.6rem] font-medium text-gray-500 uppercase text-left'>
								Recurring
							</th>
							<th
								scope='col'
								className='px-2 py-3 text-[.6rem] font-medium text-gray-500 uppercase cursor-pointer text-right'
								onClick={() => handleSort('amount')}>
								<div className='flex items-center justify-end'>
									<span>Amount</span>
									{sortBy === 'amount' && (
										<span className='ml-1'>
											{sortOrder === 'asc' ? '↑' : '↓'}
										</span>
									)}
								</div>
							</th>
						</tr>
					</thead>
					<tbody className='bg-white divide-y divide-gray-200'>
						{filteredExpenses.length === 0 ? (
							<tr>
								<td
									colSpan={4}
									className='px-2 py-4 text-center text-gray-500'>
									No expenses found matching your filters.
								</td>
							</tr>
						) : (
							filteredExpenses.map((expense) => (
								<tr
									key={expense.id}
									onClick={() => handleRowClick(expense.id)}
									className='hover:bg-gray-50 cursor-pointer'>
									<td className='text-[.7rem] sm:text-[1rem] px-2 py-3 text-left'>
										<div className='text-gray-900'>
											{formatDate(expense.date)}
										</div>
										<div className='text-gray-400'>
											{formatTimeAgo(expense.createdAt)}
										</div>
									</td>
									<td className='text-[.7rem] sm:text-[1rem] px-2 py-3 text-left'>
										<div className='text-gray-900 truncate'>
											{expense.description}
										</div>
									</td>
									<td className='text-[.7rem] sm:text-[1rem] px-2 py-3 text-left'>
										<span
											className={`px-2 py-1 rounded-full ${getCategoryColor(
												expense.category
											)}`}>
											{expense.category}
										</span>
									</td>
									<td className='text-[.7rem] sm:text-[1rem] px-2 py-3 text-left'>
										{expense.isRecurring ? (
											<span className='inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800'>
												Recurring
											</span>
										) : (
											<span className='inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800'>
												One-time
											</span>
										)}
									</td>
									<td className='text-[.7rem] sm:text-[1rem] px-2 py-3 text-right'>
										<div className='text-gray-900'>
											${expense.amount.toFixed(2)}
										</div>
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
