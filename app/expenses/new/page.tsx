import { Metadata } from 'next';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '../../../pages/api/auth/[...nextauth]';
import ExpenseForm from '../_components/ExpenseForm';

export const metadata: Metadata = {
	title: 'Add New Expense - Family Expense Tracker',
	description: 'Track a new expense in your budget',
};

export default async function NewExpensePage() {
	const session = await getServerSession(authOptions);

	if (!session) {
		redirect('/login');
	}

	return (
		<div className='max-w-2xl mx-auto'>
			<h1 className='text-3xl font-bold mb-6'>Add New Expense</h1>
			<ExpenseForm />
		</div>
	);
}
