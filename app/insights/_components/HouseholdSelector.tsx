'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';

interface Household {
	id: string;
	name: string;
}

interface HouseholdSelectorProps {
	onSelect: (householdId: string | null, householdName: string | null) => void;
	selectedHouseholdId: string | null;
}

export default function HouseholdSelector({
	onSelect,
	selectedHouseholdId,
}: HouseholdSelectorProps) {
	const [households, setHouseholds] = useState<Household[]>([]);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		const fetchHouseholds = async () => {
			try {
				const response = await axios.get('/api/households');
				setHouseholds(response.data);
			} catch (error) {
				console.error('Failed to fetch households:', error);
			} finally {
				setIsLoading(false);
			}
		};

		fetchHouseholds();
	}, []);

	if (isLoading) {
		return (
			<div className='animate-pulse h-10 bg-gray-200 rounded-md w-full max-w-xs'></div>
		);
	}

	return (
		<div className='flex flex-col space-y-2'>
			<label
				htmlFor='household-selector'
				className='text-sm font-medium text-gray-700'>
				View insights for:
			</label>
			<select
				id='household-selector'
				value={selectedHouseholdId || 'personal'}
				onChange={(e) => {
					const value = e.target.value;
					if (value === 'personal') {
						onSelect(null, null);
					} else {
						const selectedHousehold = households.find((h) => h.id === value);
						onSelect(value, selectedHousehold?.name || null);
					}
				}}
				className='block w-full max-w-xs rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm'>
				<option value='personal'>Your Personal Expenses</option>
				{households.map((household) => (
					<option
						key={household.id}
						value={household.id}>
						{household.name} Household
					</option>
				))}
			</select>
		</div>
	);
}
