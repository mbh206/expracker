import { Metadata } from 'next';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '../../../pages/api/auth/[...nextauth]';
import HouseholdForm from '../_components/HouseholdForm';
import prisma from '../../../lib/prismadb';

export const metadata: Metadata = {
	title: 'Create Household - Family Expense Tracker',
	description: 'Create a new household for shared expenses',
};

export default async function CreateHouseholdPage() {
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

	return (
		<div className='max-w-2xl mx-auto'>
			<h1 className='text-3xl font-bold mb-6'>Create Household</h1>
			<HouseholdForm userId={user.id} />
		</div>
	);
}
