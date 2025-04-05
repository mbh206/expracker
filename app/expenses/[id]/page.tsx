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

// Viewport configuration
export const viewport = {
	width: 'device-width',
	initialScale: 1,
	maximumScale: 1,
};

interface ExpenseDetailPageProps {
	params: { id: string };
}

export default async function ExpenseDetailPage({
	params,
}: ExpenseDetailPageProps) {
	const id = params.id; // Extract ID early to avoid awaiting params multiple times

	// Get session using the correct authOptions
	const session = await getServerSession(authOptions);

	if (!session || !session.user) {
		redirect('/login');
	}

	try {
		// Fetch expense with household details
		const expense = await prisma.expense.findUnique({
			where: {
				id: id,
			},
			include: {
				household: true,
			},
		});

		// Check if expense exists
		if (!expense) {
			notFound();
		}

		// Proper authorization check using session.user.id
		if (session.user.id && expense.userId !== session.user.id) {
			console.log('Authorization failed: User does not own this expense');
			console.log('- User ID from session:', session.user.id);
			console.log('- Expense owner ID:', expense.userId);
			notFound();
		}

		const formattedDate = format(new Date(expense.date), 'MMMM d, yyyy');
		const formattedCreatedAt = format(
			new Date(expense.createdAt),
			"MMMM d, yyyy 'at' h:mm a"
		);
		const formattedUpdatedAt = format(
			new Date(expense.updatedAt),
			"MMMM d, yyyy 'at' h:mm a"
		);

		return (
			<div className='max-w-3xl mx-auto p-4'>
				<div className='flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4'>
					<h1 className='text-2xl md:text-3xl font-bold text-gray-900'>
						Expense Details
					</h1>
					<div className='flex flex-wrap gap-2'>
						<Link
							href='/expenses'
							className='px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 text-sm md:text-base'>
							Back to List
						</Link>
						<Link
							href={`/expenses/${expense.id}/edit`}
							className='px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm md:text-base'>
							Edit Expense
						</Link>
					</div>
				</div>

				<div className='bg-white rounded-lg shadow-md overflow-hidden'>
					<div className='p-4 md:p-6'>
						<div className='flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-2'>
							<h2 className='text-xl md:text-2xl font-semibold break-words text-gray-900'>
								{expense.description}
							</h2>
							<span className='text-xl md:text-2xl font-bold whitespace-nowrap text-gray-900'>
								${expense.amount.toFixed(2)}
							</span>
						</div>

						<div className='grid grid-cols-1 md:grid-cols-2 gap-4 mb-6'>
							<div>
								<h3 className='text-sm font-medium text-gray-500'>Date</h3>
								<p className='mt-1 text-base md:text-lg text-gray-900'>
									{formattedDate}
								</p>
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
									<p className='mt-1 text-base md:text-lg'>
										<Link
											href={`/households/${expense.householdId}`}
											className='text-blue-600 hover:text-blue-800'>
											{expense.household.name}
										</Link>
									</p>
								</div>
							)}
						</div>

						<hr className='my-2 md:my-4 border-gray-200' />

						<div className='grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-gray-500'>
							<div>
								<p className='mb-0 pb-0'>Created: {formattedCreatedAt}</p>
								<p className='mt-0 pt-0'>Last updated: {formattedUpdatedAt}</p>
							</div>
							<div className='flex md:justify-end align-bottom mt-2'>
								<DeleteExpenseButton id={expense.id} />
							</div>
						</div>
					</div>
				</div>
			</div>
		);
	} catch (error) {
		console.error('Error fetching expense:', error);
		notFound();
	}
}
