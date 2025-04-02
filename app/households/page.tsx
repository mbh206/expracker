import { Metadata } from 'next';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import prisma from '../../lib/prismadb';
import { authOptions } from '../../pages/api/auth/[...nextauth]';
import HouseholdsList from './HouseholdsList';

export const metadata: Metadata = {
	title: 'Households - Family Expense Tracker',
	description: 'Manage your shared expense households',
};

export default async function HouseholdsPage() {
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

	// Get user's households
	const households = await prisma.household.findMany({
		where: {
			members: {
				some: {
					userId: user.id,
				},
			},
		},
		include: {
			_count: {
				select: {
					members: true,
					expenses: true,
				},
			},
		},
	});

	return (
		<div className='max-w-6xl mx-auto'>
			<div className='flex justify-between items-center mb-6'>
				<h1 className='text-3xl font-bold'>My Households</h1>
				<Link
					href='/households/new'
					className='px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700'>
					Create Household
				</Link>
			</div>

			{households.length === 0 ? (
				<div className='bg-white p-8 rounded-lg shadow-md text-center'>
					<h2 className='text-xl font-semibold mb-4'>No households yet</h2>
					<p className='text-gray-600 mb-6'>
						Create a household to start sharing expenses with family or friends.
					</p>
					<Link
						href='/households/new'
						className='px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700'>
						Create First Household
					</Link>
				</div>
			) : (
				<HouseholdsList
					initialHouseholds={households}
					userId={user.id}
				/>
			)}
		</div>
	);
}
