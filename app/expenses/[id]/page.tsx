import { Metadata } from 'next';
import { getServerSession } from 'next-auth';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';
import prisma from '../../../lib/prismadb';
import { authOptions } from '../../../pages/api/auth/[...nextauth]';
import { getCategoryColor } from '../../../lib/constants';
import DeleteExpenseButton from '../_components/DeleteExpenseButton';

export const metadata: Metadata = {
	title: 'Expense Details - Family Expense Tracker',
	description: 'View expense details',
};

interface ExpenseDetailPageProps {
	params: { id: string };
}

export default async function ExpenseDetailPage({
	params,
}: ExpenseDetailPageProps) {
	const session = await getServerSession(authOptions);

	if (!session) {
		redirect('/login');
	}

	// Fetch expense with household details
	const expense = await prisma.expense.findUnique({
		where: {
			id: params.id,
		},
		include: {
			household: true,
		},
	});

	// Check if expense exists and belongs to the user
	if (!expense || expense.userId !== session.user.id) {
		notFound();
	}

	const formattedDate = format(expense.date, 'MMMM d, yyyy');
	const formattedCreatedAt = format(
		expense.createdAt,
		"MMMM d, yyyy 'at' h:mm a"
	);
	const formattedUpdatedAt = format(
		expense.updatedAt,
		"MMMM d, yyyy 'at' h:mm a"
	);

	return (
		<div className='max-w-3xl mx-auto'>
			<div className='flex justify-between items-center mb-6'>
				<h1 className='text-3xl font-bold'>Expense Details</h1>
				<div className='flex space-x-2'>
					<Link
						href='/expenses'
						className='px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50'>
						Back to List
					</Link>
					<Link
						href={`/expenses/${expense.id}/edit`}
						className='px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700'>
						Edit Expense
					</Link>
				</div>
			</div>

			<div className='bg-white rounded-lg shadow-md overflow-hidden'>
				<div className='p-6'>
					<div className='flex justify-between items-start mb-6'>
						<h2 className='text-2xl font-semibold'>{expense.description}</h2>
						<span className='text-2xl font-bold'>
							${expense.amount.toFixed(2)}
						</span>
					</div>

					<div className='grid grid-cols-1 md:grid-cols-2 gap-4 mb-6'>
						<div>
							<h3 className='text-sm font-medium text-gray-500'>Date</h3>
							<p className='mt-1 text-lg'>{formattedDate}</p>
						</div>
						<div>
							<h3 className='text-sm font-medium text-gray-500'>Category</h3>
							<p className='mt-1'>
								<span
									className={`px-2 py-1 text-sm rounded-full ${getCategoryColor(
										expense.category
									)}`}>
									{expense.category}
								</span>
							</p>
						</div>
						{expense.household && (
							<div className='md:col-span-2'>
								<h3 className='text-sm font-medium text-gray-500'>
									Shared with Household
								</h3>
								<p className='mt-1 text-lg'>
									<Link
										href={`/households/${expense.householdId}`}
										className='text-blue-600 hover:text-blue-800'>
										{expense.household.name}
									</Link>
								</p>
							</div>
						)}
					</div>

					<hr className='my-6' />

					<div className='grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-500'>
						<div>
							<p>Created: {formattedCreatedAt}</p>
							<p>Last updated: {formattedUpdatedAt}</p>
						</div>
						<div className='flex md:justify-end'>
							<DeleteExpenseButton id={expense.id} />
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
