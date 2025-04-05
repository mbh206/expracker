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

	// Debug session data
	useEffect(() => {
		if (isLoggedIn) {
			console.log('Session data:', session);
			console.log('User image:', session?.user?.image);
		}
	}, [session, isLoggedIn]);

	// Profile dropdown state
	const [showProfileMenu, setShowProfileMenu] = useState(false);
	const profileMenuRef = useRef<HTMLDivElement>(null);

	// Mobile menu state
	const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
	const mobileMenuRef = useRef<HTMLDivElement>(null);

	// Close profile menu when clicking outside
	useEffect(() => {
		function handleClickOutside(event: MouseEvent) {
			// Check if the click is on a link
			const target = event.target as HTMLElement;
			const isLink = target.closest('a');

			// If it's a link click, let it process normally
			if (isLink) {
				return;
			}

			if (
				profileMenuRef.current &&
				!profileMenuRef.current.contains(event.target as Node)
			) {
				setShowProfileMenu(false);
			}

			if (
				mobileMenuRef.current &&
				!mobileMenuRef.current.contains(event.target as Node)
			) {
				setMobileMenuOpen(false);
			}
		}

		document.addEventListener('mousedown', handleClickOutside);
		return () => {
			document.removeEventListener('mousedown', handleClickOutside);
		};
	}, []);

	return (
		<nav className='bg-white shadow-sm'>
			<div className='px-4'>
				<div className='flex items-center justify-between h-16'>
					<Link
						href='/'
						className='text-xl font-semibold text-gray-900'>
						ExpenseTracker
					</Link>
					<div className='flex justify-end space-x-2'>
						<div className='hidden md:flex space-x-2'>
							{isLoggedIn ? (
								<>
									<Link
										href='/'
										className={`px-3 py-2 rounded-md ${
											pathname === '/'
												? 'text-blue-600'
												: 'text-gray-600 hover:text-blue-600'
										}`}>
										Home
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
										href='/insights'
										className={`px-3 py-2 rounded-md ${
											pathname === '/insights'
												? 'text-blue-600'
												: 'text-gray-600 hover:text-blue-600'
										}`}>
										Insights
									</Link>
								</>
							) : (
								<>
									<Link
										href='/auth/signin'
										className={`px-3 py-2 rounded-md ${
											pathname === '/auth/signin'
												? 'text-blue-600'
												: 'text-gray-600 hover:text-blue-600'
										}`}>
										Sign In
									</Link>
									<Link
										href='/auth/signup'
										className={`px-3 py-2 rounded-md ${
											pathname === '/auth/signup'
												? 'text-blue-600'
												: 'text-gray-600 hover:text-blue-600'
										}`}>
										Sign Up
									</Link>
								</>
							)}

							{/* Profile dropdown for logged in users */}
							{isLoggedIn && (
								<div
									className='relative ml-3'
									ref={profileMenuRef}>
									<div>
										<button
											onClick={() => setShowProfileMenu(!showProfileMenu)}
											className='flex rounded-full border-none bg-white focus:outline-none'
											id='user-menu-button'>
											<span className='sr-only'>Open user menu</span>
											{session?.user?.image ? (
												<div className='relative h-10 w-10 rounded-full overflow-hidden'>
													<Image
														src={session.user.image}
														alt={session.user.name || 'User'}
														fill
														className='object-cover'
														priority
													/>
												</div>
											) : (
												<div className='h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-medium'>
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
											className='absolute right-0 mt-2 pt-1 bg-white rounded-md shadow-lg z-50 border border-gray-200 min-w-[200px]'
											style={{ width: '200px', minWidth: '200px' }}
											role='menu'>
											<div className='px-4 py-2 text-xs text-gray-500'>
												Signed in as
											</div>
											<div className='px-4 py-1 text-sm font-medium truncate border-b border-gray-100 pb-2'>
												{session?.user?.name}
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

											<div className='border-t border-gray-100 my-0'></div>

											<button
												onClick={() => {
													setShowProfileMenu(false);
													signOut({ callbackUrl: '/' });
												}}
												className='w-full text-left border-none px-4 py-2 text-sm text-red-600 hover:bg-gray-100'>
												Sign Out
											</button>
										</div>
									)}
								</div>
							)}
						</div>

						{/* Mobile menu button */}
						<div className='md:hidden'>
							<button
								onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
								className='inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500'
								aria-expanded='false'>
								<span className='sr-only'>Open main menu</span>
								{/* Icon when menu is closed */}
								<svg
									className={`${mobileMenuOpen ? 'hidden' : 'block'} h-6 w-6`}
									xmlns='http://www.w3.org/2000/svg'
									fill='none'
									viewBox='0 0 24 24'
									stroke='currentColor'
									aria-hidden='true'>
									<path
										strokeLinecap='round'
										strokeLinejoin='round'
										strokeWidth='2'
										d='M4 6h16M4 12h16M4 18h16'
									/>
								</svg>
								{/* Icon when menu is open */}
								<svg
									className={`${mobileMenuOpen ? 'block' : 'hidden'} h-6 w-6`}
									xmlns='http://www.w3.org/2000/svg'
									fill='none'
									viewBox='0 0 24 24'
									stroke='currentColor'
									aria-hidden='true'>
									<path
										strokeLinecap='round'
										strokeLinejoin='round'
										strokeWidth='2'
										d='M6 18L18 6M6 6l12 12'
									/>
								</svg>
							</button>
						</div>
					</div>
				</div>
			</div>

			{/* Mobile menu */}
			<div
				className={`${mobileMenuOpen ? 'block' : 'hidden'} md:hidden`}
				ref={mobileMenuRef}>
				<div className='px-2 pt-2 pb-3 space-y-1'>
					{isLoggedIn ? (
						<>
							<Link
								href='/'
								className={`block px-3 py-2 rounded-md text-base font-medium ${
									pathname === '/'
										? 'text-blue-600 bg-blue-50'
										: 'text-gray-600 hover:text-blue-600 hover:bg-gray-50'
								}`}>
								Home
							</Link>
							<Link
								href='/expenses'
								className={`block px-3 py-2 rounded-md text-base font-medium ${
									pathname === '/expenses'
										? 'text-blue-600 bg-blue-50'
										: 'text-gray-600 hover:text-blue-600 hover:bg-gray-50'
								}`}>
								Expenses
							</Link>
							<Link
								href='/households'
								className={`block px-3 py-2 rounded-md text-base font-medium ${
									pathname === '/households'
										? 'text-blue-600 bg-blue-50'
										: 'text-gray-600 hover:text-blue-600 hover:bg-gray-50'
								}`}>
								Households
							</Link>
							<Link
								href='/insights'
								className={`block px-3 py-2 rounded-md text-base font-medium ${
									pathname === '/insights'
										? 'text-blue-600 bg-blue-50'
										: 'text-gray-600 hover:text-blue-600 hover:bg-gray-50'
								}`}>
								Insights
							</Link>
							<Link
								href='/profile'
								className={`block px-3 py-2 rounded-md text-base font-medium ${
									pathname === '/profile'
										? 'text-blue-600 bg-blue-50'
										: 'text-gray-600 hover:text-blue-600 hover:bg-gray-50'
								}`}>
								Profile
							</Link>
							<button
								onClick={() => signOut({ callbackUrl: '/' })}
								className='block w-full text-left px-3 py-2 rounded-md text-base font-medium text-red-600 hover:bg-gray-50'>
								Sign Out
							</button>
						</>
					) : (
						<>
							<Link
								href='/auth/signin'
								className={`block px-3 py-2 rounded-md text-base font-medium ${
									pathname === '/auth/signin'
										? 'text-blue-600 bg-blue-50'
										: 'text-gray-600 hover:text-blue-600 hover:bg-gray-50'
								}`}>
								Sign In
							</Link>
							<Link
								href='/auth/signup'
								className={`block px-3 py-2 rounded-md text-base font-medium ${
									pathname === '/auth/signup'
										? 'text-blue-600 bg-blue-50'
										: 'text-gray-600 hover:text-blue-600 hover:bg-gray-50'
								}`}>
								Sign Up
							</Link>
						</>
					)}
				</div>
			</div>
		</nav>
	);
}
