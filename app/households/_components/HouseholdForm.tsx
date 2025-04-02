'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import axios from 'axios';

interface HouseholdFormProps {
	householdId?: string;
	initialData?: {
		name: string;
	};
	userId: string;
}

export default function HouseholdForm({
	householdId,
	initialData,
	userId,
}: HouseholdFormProps) {
	const router = useRouter();
	const isEditing = !!householdId;

	// State for form fields
	const [name, setName] = useState(initialData?.name || '');
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState('');

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsLoading(true);
		setError('');

		try {
			// Validate inputs
			if (!name.trim()) {
				throw new Error('Household name is required');
			}

			const householdData = {
				name,
				userId,
			};

			if (isEditing) {
				// Update existing household
				await axios.put(`/api/households/${householdId}`, householdData);
			} else {
				// Create new household
				await axios.post('/api/households', householdData);
			}

			// Redirect to households list
			router.push('/households');
			router.refresh();
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
		<div className='bg-white p-6 rounded-lg shadow-md'>
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
						htmlFor='name'
						className='block text-sm font-medium text-gray-700 mb-1'>
						Household Name
					</label>
					<input
						id='name'
						type='text'
						value={name}
						onChange={(e) => setName(e.target.value)}
						className='w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500'
						placeholder='e.g., Family Budget, Roommates, Vacation Fund'
						required
					/>
				</div>
				<div className='flex justify-between pt-4'>
					<Link
						href='/households'
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
							? 'Update Household'
							: 'Create Household'}
					</button>
				</div>
			</form>
		</div>
	);
}
