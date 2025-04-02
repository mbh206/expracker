'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import axios from 'axios';

interface ResetPasswordFormProps {
	token: string;
}

export default function ResetPasswordForm({ token }: ResetPasswordFormProps) {
	const router = useRouter();
	const [password, setPassword] = useState('');
	const [confirmPassword, setConfirmPassword] = useState('');
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState('');
	const [success, setSuccess] = useState(false);

	const handleSubmit = useCallback(
		async (e: React.FormEvent) => {
			e.preventDefault();
			setIsLoading(true);
			setError('');

			if (password !== confirmPassword) {
				setError('Passwords do not match');
				setIsLoading(false);
				return;
			}

			if (password.length < 8) {
				setError('Password must be at least 8 characters long');
				setIsLoading(false);
				return;
			}

			try {
				await axios.post('/api/reset-password', {
					token,
					password,
				});
				setSuccess(true);
			} catch (error: any) {
				if (axios.isAxiosError(error) && error.response) {
					setError(error.response.data.error || 'Password reset failed');
				} else {
					setError('Something went wrong. Please try again.');
				}
			} finally {
				setIsLoading(false);
			}
		},
		[token, password, confirmPassword]
	);

	if (success) {
		return (
			<div className='bg-white p-8 rounded-lg shadow-md'>
				<div className='mb-4 p-4 text-green-700 bg-green-100 rounded-md'>
					Your password has been reset successfully!
				</div>
				<div className='mt-6 text-center'>
					<Link
						href='/login'
						className='text-blue-600 hover:text-blue-800'>
						Go to login
					</Link>
				</div>
			</div>
		);
	}

	if (!token) {
		return (
			<div className='bg-white p-8 rounded-lg shadow-md'>
				<div className='mb-4 p-4 text-red-700 bg-red-100 rounded-md'>
					Invalid or missing reset token. Please request a new password reset
					link.
				</div>
				<div className='mt-6 text-center'>
					<Link
						href='/forgot-password'
						className='text-blue-600 hover:text-blue-800'>
						Request new reset link
					</Link>
				</div>
			</div>
		);
	}

	return (
		<div className='bg-white p-8 rounded-lg shadow-md'>
			<p className='mb-4 text-gray-600'>
				Please enter your new password below.
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
						htmlFor='password'
						className='block text-sm font-medium text-gray-700 mb-1'>
						New Password
					</label>
					<input
						id='password'
						type='password'
						value={password}
						onChange={(e) => setPassword(e.target.value)}
						className='w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500'
						required
						minLength={8}
					/>
					<p className='text-xs text-gray-500 mt-1'>
						Password must be at least 8 characters
					</p>
				</div>
				<div>
					<label
						htmlFor='confirmPassword'
						className='block text-sm font-medium text-gray-700 mb-1'>
						Confirm New Password
					</label>
					<input
						id='confirmPassword'
						type='password'
						value={confirmPassword}
						onChange={(e) => setConfirmPassword(e.target.value)}
						className='w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500'
						required
					/>
				</div>
				<button
					type='submit'
					disabled={isLoading}
					className='w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed'>
					{isLoading ? 'Resetting...' : 'Reset Password'}
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
