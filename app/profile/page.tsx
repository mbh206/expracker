// app/profile/page.tsx
import { Metadata } from 'next';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import ProfileContent from './ProfileContent';
import prisma from '@/lib/prismadb';

export const metadata: Metadata = {
	title: 'Your Profile - Family Expense Tracker',
	description: 'View and edit your profile information',
};

export default async function ProfilePage() {
	const session = await getServerSession(authOptions);

	if (!session) {
		redirect('/login');
	}

	// Get user from session email
	const user = session.user?.email
		? await prisma.user.findUnique({
				where: { email: session.user.email },
				select: {
					id: true,
					name: true,
					email: true,
					image: true,
					// bio: true,
					// location: true,
					// lastUsernameChange: true,
					createdAt: true,
				},
		  })
		: null;

	if (!user) {
		redirect('/login');
	}

	// Get user's household memberships
	const householdMemberships = await prisma.householdMember.findMany({
		where: { userId: user.id },
		include: {
			household: {
				select: {
					id: true,
					name: true,
				},
			},
		},
	});

	return (
		<div className='max-w-4xl mx-auto'>
			<h1 className='text-3xl font-bold mb-6'>Your Profile</h1>
			<ProfileContent
				user={user}
				householdMemberships={householdMemberships}
			/>
		</div>
	);
}
