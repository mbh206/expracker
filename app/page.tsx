import { Metadata } from 'next';
import Link from 'next/link';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../pages/api/auth/[...nextauth]';

export const metadata: Metadata = {
	title: 'Family Expense Tracker - Home',
	description: 'Track, share, and get AI advice on your family expenses',
};

export default async function Home() {
	const session = await getServerSession(authOptions);

	return (
		<div className='flex flex-col items-center justify-center min-h-[80vh] text-center'>
			<h1 className='text-5xl font-bold mb-6'>Family Expense Tracker</h1>
			<p className='text-xl mb-8 max-w-2xl'>
				Track your expenses, share with family members, and get AI-powered
				insights to improve your financial habits.
			</p>
			<div className='flex gap-4'>
				{session ? (
					<Link
						href='/dashboard'
						className='px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition'>
						Go to Dashboard
					</Link>
				) : (
					<>
						<Link
							href='/login'
							className='px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition'>
							Login
						</Link>
						<Link
							href='/register'
							className='px-6 py-3 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition'>
							Register
						</Link>
					</>
				)}
			</div>
		</div>
	);
}
