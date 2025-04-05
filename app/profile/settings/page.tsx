// app/profile/settings/page.tsx
import { Metadata } from 'next';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import AccountSettingsContent from './AccountSettingsContent';
import prisma from '@/lib/prismadb';

export const metadata: Metadata = {
	title: 'Account Settings - Family Expense Tracker',
	description: 'Manage your account settings and preferences',
};

export default async function AccountSettingsPage() {
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
				},
		  })
		: null;

	if (!user) {
		redirect('/login');
	}

	return (
		<div className='max-w-4xl mx-auto'>
			<h1 className='text-3xl font-bold mb-6'>Account Settings</h1>
			<AccountSettingsContent user={user} />
		</div>
	);
}
