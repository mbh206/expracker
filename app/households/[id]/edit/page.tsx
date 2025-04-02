import { Metadata } from 'next';
import { getServerSession } from 'next-auth';
import { redirect, notFound } from 'next/navigation';
import prisma from '../../../../lib/prismadb';
import { authOptions } from '../../../../pages/api/auth/[...nextauth]';
import HouseholdForm from '../../_components/HouseholdForm';

export const metadata: Metadata = {
	title: 'Edit Household - Family Expense Tracker',
	description: 'Edit a household',
};

interface EditHouseholdPageProps {
	params: { id: string };
}

export default async function EditHouseholdPage({
	params,
}: EditHouseholdPageProps) {
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

	// Fetch household
	const household = await prisma.household.findUnique({
		where: {
			id: params.id,
		},
		include: {
			members: true,
		},
	});

	// Check if household exists and user is an admin
	if (
		!household ||
		!household.members.some(
			(member) => member.userId === user.id && member.role === 'admin'
		)
	) {
		notFound();
	}

	// Format data for the form
	const initialData = {
		name: household.name,
	};

	return (
		<div className='max-w-2xl mx-auto'>
			<h1 className='text-3xl font-bold mb-6'>Edit Household</h1>
			<HouseholdForm
				householdId={params.id}
				initialData={initialData}
				userId={user.id}
			/>
		</div>
	);
}
