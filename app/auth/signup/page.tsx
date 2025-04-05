'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function SignUp() {
	const router = useRouter();
	const [name, setName] = useState('');
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [error, setError] = useState('');
	const [isLoading, setIsLoading] = useState(false);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsLoading(true);
		setError('');

		try {
			const response = await fetch('/api/register', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					name,
					email,
					password,
				}),
			});

			const data = await response.json();

			if (!response.ok) {
				throw new Error(data.message || 'Something went wrong');
			}

			// Redirect to sign in page after successful registration
			router.push('/auth/signin?registered=true');
		} catch (error) {
			if (error instanceof Error) {
				setError(error.message);
			} else {
				setError('An error occurred during registration');
			}
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div className='flex min-h-screen flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8'>
			<div className='w-full max-w-md space-y-8'>
				<div>
					<h2 className='mt-6 text-center text-3xl font-bold tracking-tight text-gray-900'>
						Create your account
					</h2>
					<p className='mt-2 text-center text-sm text-gray-600'>
						Or{' '}
						<Link
							href='/auth/signin'
							className='font-medium text-blue-600 hover:text-blue-500'>
							sign in to your existing account
						</Link>
					</p>
				</div>

				{error && (
					<div className='rounded-md bg-red-50 p-4'>
						<div className='flex'>
							<div className='ml-3'>
								<h3 className='text-sm font-medium text-red-800'>{error}</h3>
							</div>
						</div>
					</div>
				)}

				<form
					className='mt-8 space-y-6'
					onSubmit={handleSubmit}>
					<div className='space-y-4 rounded-md shadow-sm'>
						<div>
							<label
								htmlFor='name'
								className='sr-only'>
								Full Name
							</label>
							<input
								id='name'
								name='name'
								type='text'
								required
								className='relative block w-full rounded-md border-0 py-1.5 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6'
								placeholder='Full Name'
								value={name}
								onChange={(e) => setName(e.target.value)}
							/>
						</div>
						<div>
							<label
								htmlFor='email-address'
								className='sr-only'>
								Email address
							</label>
							<input
								id='email-address'
								name='email'
								type='email'
								autoComplete='email'
								required
								className='relative block w-full rounded-md border-0 py-1.5 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6'
								placeholder='Email address'
								value={email}
								onChange={(e) => setEmail(e.target.value)}
							/>
						</div>
						<div>
							<label
								htmlFor='password'
								className='sr-only'>
								Password
							</label>
							<input
								id='password'
								name='password'
								type='password'
								autoComplete='new-password'
								required
								className='relative block w-full rounded-md border-0 py-1.5 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6'
								placeholder='Password'
								value={password}
								onChange={(e) => setPassword(e.target.value)}
							/>
						</div>
					</div>

					<div>
						<button
							type='submit'
							disabled={isLoading}
							className='group relative flex w-full justify-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-50'>
							{isLoading ? 'Creating account...' : 'Create account'}
						</button>
					</div>
				</form>
			</div>
		</div>
	);
}
