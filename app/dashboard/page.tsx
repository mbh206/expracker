import { Metadata } from 'next';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '../../pages/api/auth/[...nextauth]';
import DashboardContent from './DashboardContent';

export const metadata: Metadata = {
	title: 'Dashboard - Family Expense Tracker',
	description: 'View and manage your expenses',
};

export default async function DashboardPage() {
	const session = await getServerSession(authOptions);

	if (!session) {
		redirect('/login');
	}

	return (
		<div className='max-w-6xl mx-auto'>
			<div className='mb-8'>
				<h1 className='text-3xl font-bold'>Dashboard</h1>
				<p className='text-gray-600'>
					Welcome back, {session.user?.name || 'User'}
				</p>
			</div>

			<DashboardContent />
		</div>
	);
}
