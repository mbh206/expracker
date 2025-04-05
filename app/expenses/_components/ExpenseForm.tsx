'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import axios from 'axios';
import { EXPENSE_CATEGORIES } from '../../../lib/constants';
import ExpenseAiInsight from './ExpenseAiInsight';

interface ExpenseFormProps {
	expenseId?: string;
	initialData?: {
		description: string;
		amount: number;
		date: string;
		category: string;
		householdId?: string | null;
	};
}

export default function ExpenseForm({
	expenseId,
	initialData,
}: ExpenseFormProps) {
	const router = useRouter();
	const isEditing = !!expenseId;

	// State for form fields
	const [description, setDescription] = useState(
		initialData?.description || ''
	);
	const [amount, setAmount] = useState(initialData?.amount?.toString() || '');
	const [date, setDate] = useState(
		initialData?.date
			? new Date(initialData.date).toISOString().split('T')[0]
			: new Date().toISOString().split('T')[0]
	);
	const [category, setCategory] = useState(
		initialData?.category || 'Miscellaneous'
	);
	const [householdId, setHouseholdId] = useState(
		initialData?.householdId || ''
	);

	// State for loading and errors
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState('');
	const [households, setHouseholds] = useState<
		Array<{ id: string; name: string }>
	>([]);
	const [newExpense, setNewExpense] = useState(null);
	const [showAiInsight, setShowAiInsight] = useState(false);

	// Check URL for householdId parameter
	useEffect(() => {
		const searchParams = new URLSearchParams(window.location.search);
		const urlHouseholdId = searchParams.get('householdId');
		if (urlHouseholdId) {
			setHouseholdId(urlHouseholdId);
		}
	}, []);

	// Fetch user's households
	useEffect(() => {
		const fetchHouseholds = async () => {
			try {
				const response = await axios.get('/api/households');
				setHouseholds(response.data);
			} catch (error) {
				console.error('Failed to fetch households:', error);
			}
		};

		fetchHouseholds();
	}, []);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsLoading(true);
		setError('');

		try {
			// Validate inputs
			if (!description.trim()) {
				throw new Error('Description is required');
			}

			const amountValue = parseFloat(amount);
			if (isNaN(amountValue) || amountValue <= 0) {
				throw new Error('Please enter a valid amount');
			}

			if (!date) {
				throw new Error('Date is required');
			}

			if (!category) {
				throw new Error('Category is required');
			}

			const expenseData = {
				description,
				amount: amountValue,
				date,
				category,
				householdId: householdId || null,
			};

			if (isEditing) {
				// Update existing expense
				await axios.put(`/api/expenses/${expenseId}`, expenseData);

				// Redirect to expenses list
				router.push('/expenses');
				router.refresh();
			} else {
				// Create new expense
				const response = await axios.post('/api/expenses', expenseData);

				// Save the created expense for AI insights
				setNewExpense(response.data);

				// Show AI insights modal
				setShowAiInsight(true);
				setIsLoading(false);
			}
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
		} catch (error: any) {
			if (axios.isAxiosError(error) && error.response) {
				setError(error.response.data.error || 'Something went wrong');
			} else {
				setError(error.message || 'Something went wrong');
			}
			setIsLoading(false);
		}
	};

	return (
		<div className='bg-gray-200 p-6 rounded-lg shadow-md'>
			{error && (
				<div className='mb-4 p-4 text-red-700 bg-red-100 rounded-md'>
					{error}
				</div>
			)}
			<form
				onSubmit={handleSubmit}
				className='space-y-4'>
				<div>
					<label
						htmlFor='description'
						className='block text-sm font-medium text-gray-700 mb-1'>
						Description
					</label>
					<input
						id='description'
						type='text'
						value={description}
						onChange={(e) => setDescription(e.target.value)}
						className='w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500'
						placeholder='e.g., Grocery shopping, Rent payment'
						required
					/>
				</div>
				<div>
					<label
						htmlFor='amount'
						className='block text-sm font-medium text-gray-700 mb-1'>
						Amount ($)
					</label>
					<input
						id='amount'
						type='number'
						value={amount}
						onChange={(e) => setAmount(e.target.value)}
						step='0.01'
						min='0.01'
						className='w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500'
						placeholder='0.00'
						required
					/>
				</div>
				<div>
					<label
						htmlFor='date'
						className='block text-sm font-medium text-gray-700 mb-1'>
						Date
					</label>
					<input
						id='date'
						type='date'
						value={date}
						onChange={(e) => setDate(e.target.value)}
						className='w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500'
						required
					/>
				</div>
				<div>
					<label
						htmlFor='category'
						className='block text-sm font-medium text-gray-700 mb-1'>
						Category
					</label>
					<select
						id='category'
						value={category}
						onChange={(e) => setCategory(e.target.value)}
						className='w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500'
						required>
						{EXPENSE_CATEGORIES.map((cat) => (
							<option
								key={cat}
								value={cat}>
								{cat}
							</option>
						))}
					</select>
				</div>
				<div>
					<label
						htmlFor='householdId'
						className='block text-sm font-medium text-gray-700 mb-1'>
						Household (Optional)
					</label>
					<select
						id='householdId'
						value={householdId}
						onChange={(e) => setHouseholdId(e.target.value)}
						className='w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500'>
						<option value=''>Personal Expense (Not Shared)</option>
						{households.map((household) => (
							<option
								key={household.id}
								value={household.id}>
								{household.name}
							</option>
						))}
					</select>
					<p className='text-xs text-gray-500 mt-1'>
						Share this expense with members of a household
					</p>
				</div>
				<div className='flex justify-between pt-4'>
					<Link
						href='/expenses'
						className='px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50'>
						Cancel
					</Link>
					<button
						type='submit'
						disabled={isLoading}
						className='px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50'>
						{isLoading
							? isEditing
								? 'Updating...'
								: 'Creating...'
							: isEditing
							? 'Update Expense'
							: 'Add Expense'}
					</button>
				</div>
			</form>

			{showAiInsight && newExpense && (
				<ExpenseAiInsight
					expense={newExpense}
					onClose={() => {
						setShowAiInsight(false);
						router.push('/expenses');
						router.refresh();
					}}
				/>
			)}
		</div>
	);
}
