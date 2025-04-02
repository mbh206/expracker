'use client';

import { useState, useCallback } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginForm() {
	const router = useRouter();
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState('');

	const handleSubmit = useCallback(
		async (e: React.FormEvent) => {
			e.preventDefault();
			setIsLoading(true);
			setError('');

			try {
				const result = await signIn('credentials', {
					redirect: false,
					email,
					password,
				});

				if (result?.error) {
					setError('Invalid email or password');
					setIsLoading(false);
				} else {
					router.push('/dashboard');
				}
			} catch (error) {
				setError('Something went wrong. Please try again.');
				setIsLoading(false);
			}
		},
		[email, password, router]
	);

	const handleGoogleLogin = useCallback(async () => {
		setIsLoading(true);
		try {
			await signIn('google', { callbackUrl: '/dashboard' });
		} catch (error) {
			setError('Something went wrong with Google login. Please try again.');
			setIsLoading(false);
		}
	}, []);

	return (
		<div className='bg-white p-8 rounded-lg shadow-md'>
			{error && (
				<div className='mb-4 p-4 text-red-700 bg-red-100 rounded-md'>
					{error}
				</div>
			)}
			<form
				onSubmit={handleSubmit}
				className='space-y-4'>
				<div>
					<label
						htmlFor='email'
						className='block text-sm font-medium text-gray-700 mb-1'>
						Email
					</label>
					<input
						id='email'
						type='email'
						value={email}
						onChange={(e) => setEmail(e.target.value)}
						className='w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500'
						required
					/>
				</div>
				<div>
					<div className='flex justify-between'>
						<label
							htmlFor='password'
							className='block text-sm font-medium text-gray-700 mb-1'>
							Password
						</label>
						<Link
							href='/forgot-password'
							className='text-sm text-blue-600 hover:text-blue-800'>
							Forgot password?
						</Link>
					</div>
					<input
						id='password'
						type='password'
						value={password}
						onChange={(e) => setPassword(e.target.value)}
						className='w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500'
						required
					/>
				</div>
				<button
					type='submit'
					disabled={isLoading}
					className='w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed'>
					{isLoading ? 'Logging in...' : 'Login'}
				</button>
			</form>
			<div className='mt-6'>
				<div className='relative'>
					<div className='absolute inset-0 flex items-center'>
						<div className='w-full border-t border-gray-300'></div>
					</div>
					<div className='relative flex justify-center text-sm'>
						<span className='px-2 bg-white text-gray-500'>
							Or continue with
						</span>
					</div>
				</div>
				<div className='mt-6'>
					<button
						type='button'
						onClick={handleGoogleLogin}
						disabled={isLoading}
						className='w-full py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed'>
						<div className='flex items-center justify-center'>
							<svg
								xmlns='http://www.w3.org/2000/svg'
								viewBox='0 0 48 48'
								width='24px'
								height='24px'
								className='mr-2'>
								<path
									fill='#FFC107'
									d='M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z'
								/>
								<path
									fill='#FF3D00'
									d='M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z'
								/>
								<path
									fill='#4CAF50'
									d='M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z'
								/>
								<path
									fill='#1976D2'
									d='M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z'
								/>
							</svg>
							Google
						</div>
					</button>
				</div>
			</div>
			<div className='mt-6 text-center'>
				<p className='text-sm text-gray-600'>
					Don&apos;t have an account?{' '}
					<Link
						href='/register'
						className='text-blue-600 hover:text-blue-800'>
						Register
					</Link>
				</p>
			</div>
		</div>
	);
}
