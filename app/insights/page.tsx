import { Metadata } from 'next';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import prisma from '../../lib/prismadb';
import { authOptions } from '../../pages/api/auth/[...nextauth]';
import AdviceDashboard from './_components/AdviceDashboard';

export const metadata: Metadata = {
	title: 'Financial Advice - Family Expense Tracker',
	description: 'Get personalized financial insights and recommendations',
};

export default async function AdvicePage() {
	const session = await getServerSession(authOptions);

	if (!session) {
		redirect('/login');
	}

	// Get user from session email
	const user = session.user?.email
		? await prisma.user.findUnique({
				where: { email: session.user.email },
		  })
		: null;

	if (!user) {
		redirect('/login');
	}

	// Get all user's expenses (personal + household)
	const userExpenses = await prisma.expense.findMany({
		where: {
			userId: user.id,
		},
		orderBy: {
			date: 'desc',
		},
	});

	// Need at least 5 expenses to provide meaningful advice
	const hasEnoughData = userExpenses.length >= 5;

	return (
		<div className='max-w-6xl mx-auto'>
			<div className='mb-6'>
				<h1 className='text-3xl font-bold'>Financial Insights</h1>
				<p className='text-gray-600'>
					Get personalized advice based on your spending patterns
				</p>
			</div>

			<AdviceDashboard initialExpenses={userExpenses} />

			{!hasEnoughData && (
				<div className='bg-white p-8 rounded-lg shadow-md text-center mt-8'>
					<h2 className='text-xl font-semibold mb-4'>Not Enough Data</h2>
					<p className='text-gray-600 mb-6'>
						We need at least 5 expenses to provide meaningful financial
						insights. Keep tracking your expenses, and we&apos;ll have
						personalized advice for you soon.
					</p>
				</div>
			)}
		</div>
	);
}
