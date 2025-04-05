import { Metadata } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../pages/api/auth/[...nextauth]';
import { redirect } from 'next/navigation';
import prisma from '../lib/prismadb';
import EnhancedDashboard from './_components/EnhancedDashboard';
import { ExpenseWithRecurring } from './types';

export const metadata: Metadata = {
	title: 'Expense Tracker - Dashboard',
	description:
		'View and manage your personal finances with our simple expense tracker',
};

export default async function Home() {
	const session = await getServerSession(authOptions);

	if (!session?.user) {
		redirect('/auth/signin');
	}

	// Get user from session email
	const user = session.user?.email
		? await prisma.user.findUnique({
				where: { email: session.user.email },
		  })
		: null;

	if (!user) {
		redirect('/auth/signin');
	}

	// Fetch user's expenses
	const expenses = (await prisma.expense.findMany({
		where: {
			userId: user.id,
		},
		orderBy: {
			date: 'desc',
		},
	})) as ExpenseWithRecurring[];

	// Get recurring expenses
	const recurringExpenses = expenses.filter(
		(expense: ExpenseWithRecurring) => expense.isRecurring
	);

	// Get upcoming bills (recurring expenses from the last 30 days)
	const thirtyDaysAgo = new Date();
	thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

	const upcomingBills = recurringExpenses.filter(
		(expense: ExpenseWithRecurring) => {
			const expenseDate = new Date(expense.date);
			return expenseDate >= thirtyDaysAgo;
		}
	);

	// Fetch AI recommendations
	let recommendations: string[] = [];
	try {
		const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
		const response = await fetch(`${baseUrl}/api/advice`, {
			method: 'GET',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${user.id}`,
			},
			cache: 'no-store',
		});

		if (response.ok) {
			const data = await response.json();
			recommendations = data.recommendations || [];
		}
	} catch (error) {
		console.error('Error fetching recommendations:', error);
	}

	// If we have fewer than 5 expenses, add a note about needing more data
	if (expenses.length < 5) {
		recommendations = [
			'Add at least 5 expenses to get personalized AI recommendations based on your spending patterns.',
		];
	} else if (recommendations.length === 0) {
		// If we have enough expenses but no recommendations, add a note
		recommendations = [
			'Unable to generate personalized recommendations at this time. Please try again later.',
		];
	}

	return (
		<div className='max-w-6xl mx-auto px-4'>
			<EnhancedDashboard
				expenses={expenses}
				recurringExpenses={recurringExpenses}
				upcomingBills={upcomingBills}
				recommendations={recommendations}
			/>
		</div>
	);
}
