'use client';

import Link from 'next/link';
import { useSession } from 'next-auth/react';

export default function DashboardContent() {
	const { data: session } = useSession();

	return (
		<div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
			<div className='bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md'>
				<h2 className='text-xl font-semibold mb-4 text-gray-900 dark:text-white'>
					Quick Actions
				</h2>
				<div className='space-y-2'>
					<Link
						href='/expenses/new'
						className='block w-full text-center py-2 px-4 bg-blue-600 dark:bg-blue-700 text-white rounded-md hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors'>
						Add New Expense
					</Link>
					<Link
						href='/expenses'
						className='block w-full text-center py-2 px-4 border border-blue-600 dark:border-blue-500 text-blue-600 dark:text-blue-400 rounded-md hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors'>
						View All Expenses
					</Link>
					<Link
						href='/households'
						className='block w-full text-center py-2 px-4 border border-blue-600 dark:border-blue-500 text-blue-600 dark:text-blue-400 rounded-md hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors'>
						Manage Households
					</Link>
				</div>
			</div>

			<div className='bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md'>
				<h2 className='text-xl font-semibold mb-4 text-gray-900 dark:text-white'>
					Account Overview
				</h2>
				<div className='space-y-4'>
					<div>
						<p className='text-gray-600 dark:text-gray-400'>Email</p>
						<p className='font-medium text-gray-900 dark:text-white'>
							{session?.user?.email}
						</p>
					</div>
					<div>
						<p className='text-gray-600 dark:text-gray-400'>Name</p>
						<p className='font-medium text-gray-900 dark:text-white'>
							{session?.user?.name || 'Not set'}
						</p>
					</div>
					<div className='pt-2'>
						<Link
							href='/profile'
							className='text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300'>
							Edit Profile
						</Link>
					</div>
				</div>
			</div>

			<div className='bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md md:col-span-2'>
				<div className='flex justify-between items-center mb-4'>
					<h2 className='text-xl font-semibold text-gray-900 dark:text-white'>
						AI Financial Insights
					</h2>
					<Link
						href='/advice'
						className='text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300'>
						View All Insights
					</Link>
				</div>
				<div className='bg-blue-50 dark:bg-blue-900/30 p-4 rounded-md mb-4'>
					<div className='flex items-start'>
						<span className='text-blue-600 dark:text-blue-400 mr-3 text-xl'>
							💡
						</span>
						<p className='text-gray-700 dark:text-gray-200'>
							Get personalized financial advice based on your spending patterns.
							Our AI analyzes your expenses to help you make better financial
							decisions.
						</p>
					</div>
				</div>
				<Link
					href='/advice'
					className='block w-full text-center py-2 px-4 bg-blue-600 dark:bg-blue-700 text-white rounded-md hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors'>
					View Financial Insights
				</Link>
			</div>
		</div>
	);
}
