// components/Navbar.tsx - Update with profile dropdown
'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import Image from 'next/image';

export default function Navbar() {
	const pathname = usePathname();
	const { data: session, status } = useSession();
	const isLoggedIn = status === 'authenticated';

	// Profile dropdown state
	const [showProfileMenu, setShowProfileMenu] = useState(false);
	const profileMenuRef = useRef<HTMLDivElement>(null);

	// Close profile menu when clicking outside
	useEffect(() => {
		function handleClickOutside(event: MouseEvent) {
			if (
				profileMenuRef.current &&
				!profileMenuRef.current.contains(event.target as Node)
			) {
				setShowProfileMenu(false);
			}
		}

		document.addEventListener('mousedown', handleClickOutside);
		return () => {
			document.removeEventListener('mousedown', handleClickOutside);
		};
	}, []);

	return (
		<nav className='bg-white shadow-sm'>
			<div className='container mx-auto px-4'>
				<div className='flex items-center justify-between h-16'>
					<Link
						href='/'
						className='text-xl font-semibold text-gray-900'>
						ExpenseTracker
					</Link>
					<div className='flex items-center space-x-4'>
						<div className='hidden md:flex space-x-4'>
							<Link
								href='/'
								className={`px-3 py-2 rounded-md ${
									pathname === '/'
										? 'text-blue-600'
										: 'text-gray-600 hover:text-blue-600'
								}`}>
								Home
							</Link>
							{isLoggedIn ? (
								<>
									<Link
										href='/dashboard'
										className={`px-3 py-2 rounded-md ${
											pathname === '/dashboard'
												? 'text-blue-600'
												: 'text-gray-600 hover:text-blue-600'
										}`}>
										Dashboard
									</Link>
									<Link
										href='/expenses'
										className={`px-3 py-2 rounded-md ${
											pathname === '/expenses'
												? 'text-blue-600'
												: 'text-gray-600 hover:text-blue-600'
										}`}>
										Expenses
									</Link>
									<Link
										href='/households'
										className={`px-3 py-2 rounded-md ${
											pathname === '/households'
												? 'text-blue-600'
												: 'text-gray-600 hover:text-blue-600'
										}`}>
										Households
									</Link>
									<Link
										href='/advice'
										className={`px-3 py-2 rounded-md ${
											pathname === '/advice'
												? 'text-blue-600'
												: 'text-gray-600 hover:text-blue-600'
										}`}>
										Advice
									</Link>
								</>
							) : (
								<>
									<Link
										href='/login'
										className={`px-3 py-2 rounded-md ${
											pathname === '/login'
												? 'text-blue-600'
												: 'text-gray-600 hover:text-blue-600'
										}`}>
										Login
									</Link>
									<Link
										href='/register'
										className={`px-3 py-2 rounded-md ${
											pathname === '/register'
												? 'text-blue-600'
												: 'text-gray-600 hover:text-blue-600'
										}`}>
										Register
									</Link>
								</>
							)}
						</div>

						{/* Profile dropdown for logged in users */}
						{isLoggedIn && (
							<div
								className='relative ml-3'
								ref={profileMenuRef}>
								<div>
									<button
										onClick={() => setShowProfileMenu(!showProfileMenu)}
										className='flex text-sm rounded-full focus:outline-none'
										id='user-menu-button'>
										<span className='sr-only'>Open user menu</span>
										{session?.user?.image ? (
											<div className='relative h-8 w-8 rounded-full overflow-hidden'>
												<Image
													src={session.user.image}
													alt={session.user.name || 'User'}
													fill
													className='object-cover'
												/>
											</div>
										) : (
											<div className='h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-medium'>
												{session?.user?.name?.charAt(0) ||
													session?.user?.email?.charAt(0) ||
													'U'}
											</div>
										)}
									</button>
								</div>

								{/* Profile dropdown menu */}
								{showProfileMenu && (
									<div
										className='absolute right-0 mt-2 w-48 py-1 bg-white rounded-md shadow-lg z-50 border border-gray-200'
										role='menu'>
										<div className='px-4 py-2 text-xs text-gray-500'>
											Signed in as
										</div>
										<div className='px-4 py-1 text-sm font-medium truncate border-b border-gray-100 pb-2'>
											{session?.user?.email}
										</div>

										<Link
											href='/profile'
											className='block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100'
											onClick={() => setShowProfileMenu(false)}>
											Your Profile
										</Link>

										<Link
											href='/profile/settings'
											className='block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100'
											onClick={() => setShowProfileMenu(false)}>
											Account Settings
										</Link>

										<Link
											href='/expenses/new'
											className='block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100'
											onClick={() => setShowProfileMenu(false)}>
											Add Expense
										</Link>

										<div className='border-t border-gray-100 my-1'></div>

										<button
											onClick={() => {
												setShowProfileMenu(false);
												signOut({ callbackUrl: '/' });
											}}
											className='block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100'>
											Sign out
										</button>
									</div>
								)}
							</div>
						)}

						{/* Mobile menu button - You could implement a mobile menu here */}
						<div className='md:hidden'>{/* Menu button for mobile */}</div>
					</div>
				</div>
			</div>
		</nav>
	);
}
