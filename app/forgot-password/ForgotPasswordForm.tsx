'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import axios from 'axios';

export default function ForgotPasswordForm() {
	const [email, setEmail] = useState('');
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState('');
	const [success, setSuccess] = useState(false);

	const handleSubmit = useCallback(
		async (e: React.FormEvent) => {
			e.preventDefault();
			setIsLoading(true);
			setError('');

			try {
				await axios.post('/api/forgot-password', { email });
				setSuccess(true);
			} catch (error: any) {
				if (axios.isAxiosError(error) && error.response) {
					setError(error.response.data.error || 'Request failed');
				} else {
					setError('Something went wrong. Please try again.');
				}
			} finally {
				setIsLoading(false);
			}
		},
		[email]
	);

	if (success) {
		return (
			<div className='bg-white p-8 rounded-lg shadow-md'>
				<div className='mb-4 p-4 text-green-700 bg-green-100 rounded-md'>
					If an account with that email exists, we&apos;ve sent password reset
					instructions. Please check your email.
				</div>
				<div className='mt-6 text-center'>
					<Link
						href='/login'
						className='text-blue-600 hover:text-blue-800'>
						Return to login
					</Link>
				</div>
			</div>
		);
	}

	return (
		<div className='bg-white p-8 rounded-lg shadow-md'>
			<p className='mb-4 text-gray-600'>
				Enter your email address and we&apos;ll send you instructions to reset
				your password.
			</p>
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
				<button
					type='submit'
					disabled={isLoading}
					className='w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed'>
					{isLoading ? 'Submitting...' : 'Send Reset Link'}
				</button>
			</form>
			<div className='mt-6 text-center'>
				<p className='text-sm text-gray-600'>
					Remember your password?{' '}
					<Link
						href='/login'
						className='text-blue-600 hover:text-blue-800'>
						Back to login
					</Link>
				</p>
			</div>
		</div>
	);
}
