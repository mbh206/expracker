'use client';

import Link from 'next/link';

export default function HouseholdCard({ household, isOwner = false }) {
	// If you need any additional checks or data transformations, do them here

	return (
		<div className='bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden'>
			<div className='p-4 border-b border-gray-200 dark:border-gray-700'>
				<h3 className='text-lg font-semibold text-gray-900 dark:text-white mb-1'>
					{household.name}
				</h3>
				<p className='text-sm text-gray-600 dark:text-gray-400'>
					{household.members?.length || 0}{' '}
					{household.members?.length === 1 ? 'member' : 'members'}
				</p>
			</div>

			<div className='p-4'>
				<div className='mb-4'>
					<p className='text-sm text-gray-600 dark:text-gray-400 mb-1'>
						Description
					</p>
					<p className='text-gray-800 dark:text-gray-200'>
						{household.description || 'No description provided.'}
					</p>
				</div>

				<div className='flex justify-between items-center'>
					<span className='text-sm text-gray-600 dark:text-gray-400'>
						{isOwner ? 'You are the owner' : 'Member'}
					</span>
					<Link
						href={`/households/${household.id}`}
						className='px-3 py-1 bg-blue-600 dark:bg-blue-700 text-white text-sm rounded hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors'>
						View Details
					</Link>
				</div>
			</div>
		</div>
	);
}
