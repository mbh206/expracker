import { Metadata } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../pages/api/auth/[...nextauth]';
import { redirect } from 'next/navigation';
import prisma from '../lib/prismadb';
import HomeDashboard from './_components/HomeDashboard';

export const metadata: Metadata = {
	title: 'Family Expense Tracker - Home',
	description: 'Track, share, and get AI advice on your family expenses',
};

export default async function Home() {
	const session = await getServerSession(authOptions);

	if (!session?.user) {
		redirect('/auth/signin');
	}

	// Fetch user's expenses
	const expenses = await prisma.expense.findMany({
		where: {
			userId: session.user.id,
		},
		orderBy: {
			date: 'desc',
		},
	});

	// Get recurring expenses
	const recurringExpenses = expenses.filter(
		(expense: any) => expense.isRecurring
	);

	// Get upcoming bills (recurring expenses from the last 30 days)
	const thirtyDaysAgo = new Date();
	thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

	const upcomingBills = recurringExpenses.filter((expense: any) => {
		const expenseDate = new Date(expense.date);
		return expenseDate >= thirtyDaysAgo;
	});

	// Fetch AI recommendations
	let recommendations: string[] = [];
	try {
		const response = await fetch(`${process.env.NEXTAUTH_URL}/api/advice`, {
			method: 'GET',
			headers: {
				'Content-Type': 'application/json',
			},
		});

		if (response.ok) {
			const data = await response.json();
			recommendations = data.recommendations;
		}
	} catch (error) {
		console.error('Error fetching recommendations:', error);
	}

	return (
		<main className='container mx-auto px-4 py-8'>
			<h1 className='text-3xl font-bold mb-8'>
				Welcome to Your Financial Dashboard
			</h1>
			<HomeDashboard
				expenses={expenses}
				recurringExpenses={recurringExpenses}
				upcomingBills={upcomingBills}
				recommendations={recommendations}
			/>
		</main>
	);
}
