'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function AuthError() {
	const searchParams = useSearchParams();
	const error = searchParams?.get('error') || '';

	useEffect(() => {
		// Log the error for debugging
		if (error) {
			console.error('Authentication error:', error);
		}
	}, [error]);

	const getErrorMessage = () => {
		switch (error) {
			case 'Configuration':
				return 'There is a problem with the server configuration.';
			case 'AccessDenied':
				return 'You do not have permission to sign in.';
			case 'Verification':
				return 'The verification token has expired or has already been used.';
			case 'OAuthSignin':
				return 'Error in constructing an authorization URL.';
			case 'OAuthCallback':
				return 'Error in handling the response from an OAuth provider.';
			case 'OAuthCreateAccount':
				return 'Could not create OAuth provider user in the database.';
			case 'EmailCreateAccount':
				return 'Could not create email provider user in the database.';
			case 'Callback':
				return 'Error in the OAuth callback handler route.';
			case 'OAuthAccountNotLinked':
				return 'Email on the account already exists with different credentials.';
			case 'EmailSignin':
				return 'Check your email address.';
			case 'CredentialsSignin':
				return 'Sign in failed. Check the details you provided are correct.';
			case 'SessionRequired':
				return 'Please sign in to access this page.';
			default:
				return 'An unknown error occurred.';
		}
	};

	return (
		<div className='flex min-h-screen flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8'>
			<div className='w-full max-w-md space-y-8'>
				<div>
					<h2 className='mt-6 text-center text-3xl font-bold tracking-tight text-gray-900'>
						Authentication Error
					</h2>
					<p className='mt-2 text-center text-sm text-gray-600'>
						{getErrorMessage()}
					</p>
				</div>

				<div className='mt-8 space-y-6'>
					<div className='rounded-md bg-red-50 p-4'>
						<div className='flex'>
							<div className='ml-3'>
								<h3 className='text-sm font-medium text-red-800'>
									Error: {error || 'Unknown'}
								</h3>
							</div>
						</div>
					</div>

					<div className='flex flex-col space-y-4'>
						<Link
							href='/auth/signin'
							className='group relative flex w-full justify-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600'>
							Return to Sign In
						</Link>
						<Link
							href='/'
							className='group relative flex w-full justify-center rounded-md border border-blue-600 px-3 py-2 text-sm font-semibold text-blue-600 hover:bg-blue-50'>
							Go to Homepage
						</Link>
					</div>
				</div>
			</div>
		</div>
	);
}
