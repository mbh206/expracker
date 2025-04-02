import { Metadata } from 'next';
import { getServerSession } from 'next-auth';
import { redirect, notFound } from 'next/navigation';
import prisma from '../../../../lib/prismadb';
import { authOptions } from '../../../../pages/api/auth/[...nextauth]';
import ExpenseForm from '../../_components/ExpenseForm';

export const metadata: Metadata = {
	title: 'Edit Expense - Family Expense Tracker',
	description: 'Edit an expense entry',
};

interface EditExpensePageProps {
	params: { id: string };
}

export default async function EditExpensePage({
	params,
}: EditExpensePageProps) {
	const session = await getServerSession(authOptions);

	if (!session) {
		redirect('/login');
	}

	// Fetch expense
	const expense = await prisma.expense.findUnique({
		where: {
			id: params.id,
		},
	});

	// Check if expense exists and belongs to the user
	if (!expense || expense.userId !== session.user.id) {
		notFound();
	}

	// Format data for the form
	const initialData = {
		description: expense.description,
		amount: expense.amount,
		date: expense.date.toISOString().split('T')[0],
		category: expense.category,
		householdId: expense.householdId,
	};

	return (
		<div className='max-w-2xl mx-auto'>
			<h1 className='text-3xl font-bold mb-6'>Edit Expense</h1>
			<ExpenseForm
				expenseId={params.id}
				initialData={initialData}
			/>
		</div>
	);
}
