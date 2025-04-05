'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';

interface InviteMemberButtonProps {
	householdId: string;
}

export default function InviteMemberButton({
	householdId,
}: InviteMemberButtonProps) {
	const router = useRouter();
	const [isOpen, setIsOpen] = useState(false);
	const [email, setEmail] = useState('');
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState('');
	const [success, setSuccess] = useState(false);

	const handleInvite = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsLoading(true);
		setError('');
		setSuccess(false);

		try {
			await axios.post(`/api/households/${householdId}/invite`, { email });
			setSuccess(true);
			setEmail('');
			setTimeout(() => {
				setIsOpen(false);
				setSuccess(false);
			}, 3000);
		} catch (error: any) {
			if (axios.isAxiosError(error) && error.response) {
				setError(error.response.data.error || 'Failed to send invitation');
			} else {
				setError('Something went wrong. Please try again.');
			}
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<>
			<div
				onClick={() => setIsOpen(true)}
				className='text-md font-bold text-blue-400 hover:text-blue-600 cursor-pointer'>
				+ Invite Member
			</div>

			{isOpen && (
				<div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
					<div className='bg-white rounded-lg p-6 w-full max-w-md'>
						<h3 className='text-lg font-semibold mb-4'>Invite Member</h3>

						{success ? (
							<div className='mb-4 p-4 text-green-700 bg-green-100 rounded-md'>
								Invitation sent successfully!
							</div>
						) : (
							<form
								onSubmit={handleInvite}
								className='space-y-4'>
								{error && (
									<div className='mb-4 p-4 text-red-700 bg-red-100 rounded-md'>
										{error}
									</div>
								)}
								<div>
									<label
										htmlFor='email'
										className='block text-sm font-medium text-gray-700 mb-1'>
										Email Address
									</label>
									<input
										id='email'
										type='email'
										value={email}
										onChange={(e) => setEmail(e.target.value)}
										className='w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500'
										placeholder='Enter email address'
										required
									/>
								</div>
								<p className='text-sm text-gray-500'>
									An invitation will be sent to this email address. If they
									don&apos;t have an account, they&apos;ll need to register
									first.
								</p>
								<div className='flex justify-end space-x-2 pt-4'>
									<button
										type='button'
										onClick={() => setIsOpen(false)}
										className='px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50'>
										Cancel
									</button>
									<button
										type='submit'
										disabled={isLoading}
										className='px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50'>
										{isLoading ? 'Sending...' : 'Send Invitation'}
									</button>
								</div>
							</form>
						)}
					</div>
				</div>
			)}
		</>
	);
}
