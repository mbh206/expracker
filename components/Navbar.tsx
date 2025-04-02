'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import ThemeToggle from './ThemeToggle';

export default function Navbar() {
	const pathname = usePathname();
	const { data: session, status } = useSession();
	const isLoggedIn = status === 'authenticated';

	return (
		<nav className='bg-white dark:bg-gray-800 shadow-sm transition-colors'>
			<div className='container mx-auto px-4'>
				<div className='flex items-center justify-between h-16'>
					<Link
						href='/'
						className='text-xl font-semibold text-gray-900 dark:text-white'>
						ExpenseTracker
					</Link>
					<div className='flex items-center space-x-4'>
						<div className='hidden md:flex space-x-4'>
							<Link
								href='/'
								className={`px-3 py-2 rounded-md ${
									pathname === '/'
										? 'text-blue-600 dark:text-blue-400'
										: 'text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400'
								}`}>
								Home
							</Link>
							{isLoggedIn ? (
								<>
									<Link
										href='/dashboard'
										className={`px-3 py-2 rounded-md ${
											pathname === '/dashboard'
												? 'text-blue-600 dark:text-blue-400'
												: 'text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400'
										}`}>
										Dashboard
									</Link>
									<Link
										href='/expenses'
										className={`px-3 py-2 rounded-md ${
											pathname === '/expenses'
												? 'text-blue-600 dark:text-blue-400'
												: 'text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400'
										}`}>
										Expenses
									</Link>
									<Link
										href='/households'
										className={`px-3 py-2 rounded-md ${
											pathname === '/households'
												? 'text-blue-600 dark:text-blue-400'
												: 'text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400'
										}`}>
										Households
									</Link>
									<Link
										href='/advice'
										className={`px-3 py-2 rounded-md ${
											pathname === '/advice'
												? 'text-blue-600 dark:text-blue-400'
												: 'text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400'
										}`}>
										Advice
									</Link>
									<button
										onClick={() => signOut()}
										className='px-3 py-2 text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 rounded-md'>
										Logout
									</button>
								</>
							) : (
								<>
									<Link
										href='/login'
										className={`px-3 py-2 rounded-md ${
											pathname === '/login'
												? 'text-blue-600 dark:text-blue-400'
												: 'text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400'
										}`}>
										Login
									</Link>
									<Link
										href='/register'
										className={`px-3 py-2 rounded-md ${
											pathname === '/register'
												? 'text-blue-600 dark:text-blue-400'
												: 'text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400'
										}`}>
										Register
									</Link>
								</>
							)}
						</div>

						{/* Theme toggle */}
						<ThemeToggle />

						{/* Mobile menu button - You could implement a mobile menu here */}
						<div className='md:hidden'>{/* Menu button for mobile */}</div>
					</div>
				</div>
			</div>
		</nav>
	);
}
