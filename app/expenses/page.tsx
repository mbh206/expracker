import { Metadata } from 'next';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import prisma from '../../lib/prismadb';
import { authOptions } from '../../pages/api/auth/[...nextauth]';
import ExpenseList from './ExpenseList';
import { HouseholdMember } from '@prisma/client';

export const metadata: Metadata = {
	title: 'Expenses - Family Expense Tracker',
	description: 'View and manage your expenses',
};

export default async function ExpensesPage() {
	const session = await getServerSession(authOptions);

	if (!session) {
		redirect('/login');
	}

	// Get user's expenses
	const userExpenses = await prisma.expense.findMany({
		where: {
			userId: session.user.id as string,
		},
		orderBy: {
			date: 'desc',
		},
	});

	// Get user's households
	const userHouseholds = await prisma.householdMember.findMany({
		where: {
			userId: session.user.id as string,
		},
		include: {
			household: true,
		},
	});

	// Get expenses for each household
	const householdExpensesPromises = userHouseholds.map(
		async (member: HouseholdMember & { household: { name: string } }) => {
			const expenses = await prisma.expense.findMany({
				where: {
					householdId: member.householdId,
				},
				orderBy: {
					date: 'desc',
				},
			});
			return {
				householdId: member.householdId,
				householdName: member.household.name,
				expenses,
			};
		}
	);

	const householdExpensesResults = await Promise.all(householdExpensesPromises);

	// Combine all expenses for the initial view
	const allExpenses = [
		...userExpenses,
		...householdExpensesResults.flatMap((result) => result.expenses),
	];

	// Remove duplicates (in case a user's expense is also in a household)
	const uniqueExpenses = allExpenses.filter(
		(expense, index, self) =>
			index === self.findIndex((e) => e.id === expense.id)
	);

	return (
		<div className='max-w-6xl mx-auto'>
			<div className='flex justify-between items-center mb-6'>
				<h1 className='text-3xl font-bold'>My Expenses</h1>
				<Link
					href='/expenses/new'
					className='px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700'>
					Add New Expense
				</Link>
			</div>

			{uniqueExpenses.length === 0 ? (
				<div className='bg-white p-8 rounded-lg shadow-md text-center'>
					<h2 className='text-xl font-semibold mb-4'>No expenses yet</h2>
					<p className='text-gray-600 mb-6'>
						Start tracking your spending by adding your first expense.
					</p>
					<Link
						href='/expenses/new'
						className='px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700'>
						Add First Expense
					</Link>
				</div>
			) : (
				<ExpenseList
					expenses={uniqueExpenses}
					userExpenses={userExpenses}
					householdExpenses={householdExpensesResults}
				/>
			)}
		</div>
	);
}
