'use client';

import { useState } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';

interface Household {
	id: string;
	name: string;
	createdAt: string | Date;
	updatedAt: string | Date;
	_count: {
		members: number;
		expenses: number;
	};
}

interface HouseholdsListProps {
	initialHouseholds: Household[];
	userId: string;
}

export default function HouseholdsList({
	initialHouseholds,
	userId,
}: HouseholdsListProps) {
	const [households] = useState<Household[]>(
		initialHouseholds.map((household) => ({
			...household,
			createdAt: new Date(household.createdAt),
			updatedAt: new Date(household.updatedAt),
		}))
	);

	const formatDate = (date: Date | string) => {
		return format(new Date(date), 'MMM d, yyyy');
	};

	return (
		<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
			{households.map((household) => (
				<div
					key={household.id}
					className='bg-white text-gray-600 rounded-lg shadow-sm overflow-hidden hover:shadow-lg transition-shadow'>
					<Link
						href={`/households/${household.id}`}
						className='text-blue-600 hover:text-blue-800'>
						<div className='px-4 py-2'>
							<h2 className='text-xl font-bold mb-1 truncate'>
								{household.name}
							</h2>
							<div className='text-sm text-gray-400 mb-4'>
								Created {formatDate(household.createdAt)}
							</div>

							<div className='flex justify-between mb-4'>
								<div>
									<div className='text-sm text-gray-500'>Members</div>
									<div className='font-semibold'>
										{household._count.members}
									</div>
								</div>
								<div>
									<div className='text-sm text-gray-500'>Expenses</div>
									<div className='font-semibold'>
										{household._count.expenses}
									</div>
								</div>
							</div>

							<div className='mt-4 flex justify-end'></div>
						</div>
					</Link>
				</div>
			))}
		</div>
	);
}
