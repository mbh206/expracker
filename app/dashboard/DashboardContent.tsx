'use client';

import Link from 'next/link';
import { useSession } from 'next-auth/react';

export default function DashboardContent() {
	const { data: session } = useSession();

	return (
		<div className='flex flex-col gap-4'>
			<div className='flex gap-4 flex-wrap md:flex-nowrap'>
				<div className='w-full md:w-[48%] bg-gray-200 p-6 rounded-lg shadow-md overflow-hidden'>
					<h2 className='text-xl font-semibold mb-4 text-gray-900'>
						Quick Actions
					</h2>
					<div className='space-y-3'>
						<Link
							href='/expenses/new'
							className='flex justify-center items-center py-2 px-4 bg-blue-600 dark:bg-blue-700 text-white rounded-md hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900'>
							Add New Expense
						</Link>
						<Link
							href='/expenses'
							className='flex justify-center items-center py-2 px-4 border border-blue-600 dark:border-blue-500 text-blue-600 rounded-md hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors'>
							View All Expenses
						</Link>
						<Link
							href='/households'
							className='flex justify-center items-center py-2 px-4 border border-blue-600 dark:border-blue-500 text-blue-600 rounded-md hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors'>
							Manage Households
						</Link>
					</div>
				</div>
				<div className='w-full md:w-[48%] bg-gray-200 p-6 rounded-lg shadow-md'>
					<h2 className='text-xl font-semibold mb-4 text-gray-900'>
						Account Overview
					</h2>
					<div className='space-y-4'>
						<div>
							<p className='text-gray-600'>Email</p>
							<p className='font-medium text-gray-900 truncate'>
								{session?.user?.email}
							</p>
						</div>
						<div>
							<p className='text-gray-600'>Name</p>
							<p className='font-medium text-gray-900'>
								{session?.user?.name || 'Not set'}
							</p>
						</div>
						<div className='pt-2'>
							<Link
								href='/profile'
								className='text-blue-600 hover:text-blue-800'>
								Edit Profile
							</Link>
						</div>
					</div>
				</div>
			</div>
			<div className='flex-grow-1 bg-gray-200 p-6 rounded-lg shadow-md md:col-span-2 lg:col-span-1'>
				<div className='flex justify-between items-center mb-4'>
					<h2 className='text-xl font-semibold text-gray-900'>
						AI Financial Insights
					</h2>
					<Link
						href='/insights'
						className='text-blue-600 hover:text-blue-800'>
						View All
					</Link>
				</div>
				<div className='bg-blue-50 dark:bg-blue-900/30 p-4 rounded-md mb-4'>
					<div className='flex items-start'>
						<span className='text-blue-600 mr-3 text-xl'>💡</span>
						<p className='text-gray-700'>
							Get personalized financial advice based on your spending patterns.
							Our AI analyzes your expenses to help you make better financial
							decisions.
						</p>
					</div>
				</div>
				<Link
					href='/insights'
					className='flex justify-center items-center py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'>
					View Financial Insights
				</Link>
			</div>
		</div>
	);
}
