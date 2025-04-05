import { Metadata } from 'next';
import { getServerSession } from 'next-auth';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';
import prisma from '../../../lib/prismadb';
import { authOptions } from '../../../pages/api/auth/[...nextauth]';
import HouseholdTabs from '../_components/HouseholdTabs';
import InviteMemberButton from '../_components/InviteMemberButton';
import MemberRoleSelector from '../_components/MemberRoleSelector';
import { HouseholdMember, Expense } from '@prisma/client';

export const metadata: Metadata = {
	title: 'Household Details - Family Expense Tracker',
	description: 'View and manage household details',
};

interface HouseholdDetailPageProps {
	params: { id: string };
}

interface MemberWithUser extends HouseholdMember {
	user: {
		id: string;
		name: string | null;
		email: string | null;
		image: string | null;
	};
}

interface ExpenseWithUser extends Expense {
	user: {
		id: string;
		name: string | null;
		email: string | null;
	};
}

interface HouseholdWithMembersAndExpenses {
	id: string;
	name: string;
	createdAt: Date;
	updatedAt: Date;
	members: MemberWithUser[];
	expenses: ExpenseWithUser[];
}

export default async function HouseholdDetailPage({
	params,
}: HouseholdDetailPageProps) {
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

	// Fetch household with members and expenses
	const household = (await prisma.household.findUnique({
		where: {
			id: params.id,
		},
		include: {
			members: {
				include: {
					user: {
						select: {
							id: true,
							name: true,
							email: true,
							image: true,
						},
					},
				},
			},
			expenses: {
				include: {
					user: {
						select: {
							id: true,
							name: true,
							email: true,
						},
					},
				},
				orderBy: {
					date: 'desc',
				},
			},
		},
	})) as HouseholdWithMembersAndExpenses | null;

	// Check if household exists and user is a member
	if (
		!household ||
		!household.members.some((member) => member.userId === user.id)
	) {
		notFound();
	}

	// Check if user is admin
	const isAdmin = household.members.some(
		(member) => member.userId === user.id && member.role === 'admin'
	);

	// Format creation date
	const formattedCreatedAt = format(household.createdAt, 'MMMM d, yyyy');

	// Calculate total expenses
	const totalExpenses = household.expenses.reduce(
		(sum: number, expense: ExpenseWithUser) => sum + expense.amount,
		0
	);

	return (
		<div className='max-w-6xl mx-auto'>
			<div className='flex justify-between items-center mb-6'>
				<h1 className='text-3xl font-bold'>{household.name}</h1>
				<div className='flex space-x-2'>
					<Link
						href='/households'
						className='px-4 py-2 border border-gray-300 text-gray-400 rounded-md hover:bg-gray-50'>
						Back to Households
					</Link>
					{isAdmin && (
						<Link
							href={`/households/${household.id}/edit`}
							className='px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700'>
							Edit Household
						</Link>
					)}
				</div>
			</div>

			<div className='rounded-lg shadow-md overflow-hidden mb-6'>
				<div className='p-6'>
					<div className='grid grid-cols-1 md:grid-cols-3 gap-4 mb-6'>
						<div>
							<h3 className='text-sm font-medium text-gray-500'>Created</h3>
							<p className='mt-1 text-lg'>{formattedCreatedAt}</p>
						</div>
						<div>
							<h3 className='text-sm font-medium text-gray-500'>Members</h3>
							<p className='mt-1 text-lg'>{household.members.length}</p>
						</div>
						<div>
							<h3 className='text-sm font-medium text-gray-500'>
								Total Expenses
							</h3>
							<p className='mt-1 text-lg'>${totalExpenses.toFixed(2)}</p>
						</div>
					</div>

					<div className='flex justify-between items-center'>
						<h3 className='text-lg font-semibold'>Members</h3>
						{isAdmin && <InviteMemberButton householdId={household.id} />}
					</div>

					<div className='mt-4 divide-y'>
						{household.members.map((member) => (
							<div
								key={member.userId}
								className='py-3 flex justify-between items-center'>
								<div className='flex items-center space-x-3'>
									{member.user.image ? (
										<img
											src={member.user.image}
											alt={member.user.name || 'User'}
											className='w-10 h-10 rounded-full'
										/>
									) : (
										<div className='w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center'>
											<span className='text-gray-500 font-semibold'>
												{member.user.name?.charAt(0) ||
													member.user.email?.charAt(0) ||
													'U'}
											</span>
										</div>
									)}
									<div>
										<div className='font-medium'>
											{member.user.name || 'Unnamed User'}
										</div>
										<div className='text-sm text-gray-500'>
											{member.user.email}
										</div>
									</div>
								</div>
								{isAdmin && (
									<MemberRoleSelector
										householdId={household.id}
										userId={member.userId}
										currentRole={member.role as 'admin' | 'member'}
										isCurrentUser={member.userId === user.id}
									/>
								)}
								{!isAdmin && (
									<span
										className={`px-2 py-1 text-xs rounded-full ${
											member.role === 'admin'
												? 'bg-yellow-200 text-gray-800'
												: 'bg-gray-200 text-gray-800'
										}`}>
										{member.role === 'admin' ? 'Admin' : 'Member'}
									</span>
								)}
							</div>
						))}
					</div>
				</div>
			</div>

			<HouseholdTabs
				expenses={household.expenses}
				householdId={household.id}
				isAdmin={isAdmin}
			/>
		</div>
	);
}
