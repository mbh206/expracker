'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';

interface DeleteExpenseButtonProps {
	id: string;
}

export default function DeleteExpenseButton({ id }: DeleteExpenseButtonProps) {
	const router = useRouter();
	const [isConfirming, setIsConfirming] = useState(false);
	const [isDeleting, setIsDeleting] = useState(false);
	const [error, setError] = useState('');

	const handleDelete = async () => {
		setIsDeleting(true);
		setError('');

		try {
			await axios.delete(`/api/expenses/${id}`);
			router.push('/expenses');
			router.refresh();
		} catch (error: any) {
			if (axios.isAxiosError(error) && error.response) {
				setError(error.response.data.error || 'Failed to delete expense');
			} else {
				setError('Something went wrong. Please try again.');
			}
			setIsDeleting(false);
			setIsConfirming(false);
		}
	};

	if (isConfirming) {
		return (
			<div className='flex flex-col space-y-2'>
				{error && <p className='text-sm text-red-600'>{error}</p>}
				<p className='text-sm text-gray-700'>
					Are you sure you want to delete this expense?
				</p>
				<div className='flex space-x-2'>
					<button
						onClick={() => setIsConfirming(false)}
						className='px-3 py-1 text-xs border border-gray-300 text-gray-700 rounded hover:bg-gray-50'
						disabled={isDeleting}>
						Cancel
					</button>
					<button
						onClick={handleDelete}
						className='px-3 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700'
						disabled={isDeleting}>
						{isDeleting ? 'Deleting...' : 'Confirm Delete'}
					</button>
				</div>
			</div>
		);
	}

	return (
		<button
			onClick={() => setIsConfirming(true)}
			className='text-red-600 hover:text-red-800'>
			Delete Expense
		</button>
	);
}
