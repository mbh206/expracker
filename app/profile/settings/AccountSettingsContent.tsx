// app/profile/settings/AccountSettingsContent.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import axios from 'axios';

interface User {
	id: string;
	name?: string | null;
	email: string;
}

interface AccountSettingsContentProps {
	user: User;
}

export default function AccountSettingsContent({
	user,
}: AccountSettingsContentProps) {
	const router = useRouter();

	// State variables
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState('');
	const [success, setSuccess] = useState('');

	// Password change state
	const [currentPassword, setCurrentPassword] = useState('');
	const [newPassword, setNewPassword] = useState('');
	const [confirmPassword, setConfirmPassword] = useState('');
	const [showPasswordSection, setShowPasswordSection] = useState(false);

	// Email preferences state
	const [emailPreferences, setEmailPreferences] = useState({
		receiveUpdates: true,
		receiveNotifications: true,
		receiveWeeklySummary: false,
	});

	// Privacy settings state
	const [privacySettings, setPrivacySettings] = useState({
		makeProfilePublic: false,
		shareExpensesWithHousehold: true,
		allowDataAnalysis: true,
	});

	// Handle password change
	const handlePasswordChange = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsLoading(true);
		setError('');
		setSuccess('');

		if (newPassword !== confirmPassword) {
			setError('New passwords do not match');
			setIsLoading(false);
			return;
		}

		if (newPassword.length < 8) {
			setError('Password must be at least 8 characters');
			setIsLoading(false);
			return;
		}

		try {
			await axios.post('/api/user/change-password', {
				currentPassword,
				newPassword,
			});

			setSuccess('Password changed successfully');
			setCurrentPassword('');
			setNewPassword('');
			setConfirmPassword('');
			setShowPasswordSection(false);
		} catch (error: any) {
			if (axios.isAxiosError(error) && error.response) {
				setError(error.response.data.error || 'Failed to change password');
			} else {
				setError('Something went wrong. Please try again.');
			}
		} finally {
			setIsLoading(false);
		}
	};

	// Handle preferences update
	const handlePreferencesUpdate = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsLoading(true);
		setError('');
		setSuccess('');

		try {
			await axios.put('/api/user/preferences', {
				emailPreferences,
				privacySettings,
			});

			setSuccess('Preferences updated successfully');
		} catch (error: any) {
			if (axios.isAxiosError(error) && error.response) {
				setError(error.response.data.error || 'Failed to update preferences');
			} else {
				setError('Something went wrong. Please try again.');
			}
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div className='space-y-6'>
			{error && (
				<div className='p-4 bg-red-100 text-red-700 rounded-md'>{error}</div>
			)}

			{success && (
				<div className='p-4 bg-green-100 text-green-700 rounded-md'>
					{success}
				</div>
			)}

			{/* Navigation tabs */}
			<div className='border-b border-gray-200 mb-2'>
				<div className='flex'>
					<Link
						href='/profile'
						className='py-2 px-4 border-b-2 border-transparent hover:text-blue-600 hover:border-blue-600'>
						Profile
					</Link>
					<Link
						href='/profile/settings'
						className='py-2 px-4 border-b-2 border-blue-600 text-blue-600'>
						Account Settings
					</Link>
				</div>
			</div>

			{/* Account Info */}
			<div className='bg-white rounded-lg shadow-md overflow-hidden'>
				<div className='p-4 border-b border-gray-200'>
					<h2 className='text-xl font-semibold'>Account Information</h2>
				</div>

				<div className='p-4'>
					<div className='grid md:grid-cols-2 gap-4'>
						<div>
							<p className='text-sm text-gray-500 mb-1'>Email Address</p>
							<p className='font-medium'>{user.email}</p>
						</div>

						<div>
							<p className='text-sm text-gray-500 mb-1'>Username</p>
							<p className='font-medium'>{user.name || 'Not set'}</p>
						</div>
					</div>

					<div className='mt-4 pt-4 border-t border-gray-100'>
						{!showPasswordSection ? (
							<button
								onClick={() => setShowPasswordSection(true)}
								className='text-blue-600 hover:text-blue-800'>
								Change Password
							</button>
						) : (
							<form
								onSubmit={handlePasswordChange}
								className='space-y-3'>
								<div>
									<label className='block text-sm font-medium text-gray-700 mb-1'>
										Current Password
									</label>
									<input
										type='password'
										value={currentPassword}
										onChange={(e) => setCurrentPassword(e.target.value)}
										className='w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500'
										required
									/>
								</div>

								<div>
									<label className='block text-sm font-medium text-gray-700 mb-1'>
										New Password
									</label>
									<input
										type='password'
										value={newPassword}
										onChange={(e) => setNewPassword(e.target.value)}
										className='w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500'
										minLength={8}
										required
									/>
									<p className='text-xs text-gray-500 mt-1'>
										Password must be at least 8 characters long
									</p>
								</div>

								<div>
									<label className='block text-sm font-medium text-gray-700 mb-1'>
										Confirm New Password
									</label>
									<input
										type='password'
										value={confirmPassword}
										onChange={(e) => setConfirmPassword(e.target.value)}
										className='w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500'
										required
									/>
								</div>

								<div className='flex items-center justify-end space-x-2'>
									<button
										type='button'
										onClick={() => {
											setShowPasswordSection(false);
											setCurrentPassword('');
											setNewPassword('');
											setConfirmPassword('');
										}}
										className='px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50'>
										Cancel
									</button>

									<button
										type='submit'
										disabled={isLoading}
										className='px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50'>
										{isLoading ? 'Changing...' : 'Change Password'}
									</button>
								</div>
							</form>
						)}
					</div>
				</div>
			</div>

			{/* Email Preferences */}
			<div className='bg-white rounded-lg shadow-md overflow-hidden'>
				<div className='p-4 border-b border-gray-200'>
					<h2 className='text-xl font-semibold'>Email Preferences</h2>
				</div>

				<div className='p-4'>
					<form onSubmit={handlePreferencesUpdate}>
						<div className='space-y-3'>
							<div className='flex items-start'>
								<div className='flex items-center h-5'>
									<input
										id='receiveUpdates'
										type='checkbox'
										checked={emailPreferences.receiveUpdates}
										onChange={(e) =>
											setEmailPreferences({
												...emailPreferences,
												receiveUpdates: e.target.checked,
											})
										}
										className='h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500'
									/>
								</div>
								<div className='ml-3 text-sm'>
									<label
										htmlFor='receiveUpdates'
										className='font-medium text-gray-700'>
										Product Updates
									</label>
									<p className='text-gray-500'>
										Receive emails about new features and improvements
									</p>
								</div>
							</div>

							<div className='flex items-start'>
								<div className='flex items-center h-5'>
									<input
										id='receiveNotifications'
										type='checkbox'
										checked={emailPreferences.receiveNotifications}
										onChange={(e) =>
											setEmailPreferences({
												...emailPreferences,
												receiveNotifications: e.target.checked,
											})
										}
										className='h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500'
									/>
								</div>
								<div className='ml-3 text-sm'>
									<label
										htmlFor='receiveNotifications'
										className='font-medium text-gray-700'>
										Household Notifications
									</label>
									<p className='text-gray-500'>
										Receive emails when you're invited to households or expenses
										are shared with you
									</p>
								</div>
							</div>

							<div className='flex items-start'>
								<div className='flex items-center h-5'>
									<input
										id='receiveWeeklySummary'
										type='checkbox'
										checked={emailPreferences.receiveWeeklySummary}
										onChange={(e) =>
											setEmailPreferences({
												...emailPreferences,
												receiveWeeklySummary: e.target.checked,
											})
										}
										className='h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500'
									/>
								</div>
								<div className='ml-3 text-sm'>
									<label
										htmlFor='receiveWeeklySummary'
										className='font-medium text-gray-700'>
										Weekly Summary
									</label>
									<p className='text-gray-500'>
										Receive a weekly summary of your expenses and insights
									</p>
								</div>
							</div>
						</div>

						<div className='mt-4 flex justify-end'>
							<button
								type='submit'
								disabled={isLoading}
								className='px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50'>
								{isLoading ? 'Updating...' : 'Update Email Preferences'}
							</button>
						</div>
					</form>
				</div>
			</div>

			{/* Privacy Settings */}
			<div className='bg-white rounded-lg shadow-md overflow-hidden'>
				<div className='p-4 border-b border-gray-200'>
					<h2 className='text-xl font-semibold'>Privacy Settings</h2>
				</div>

				<div className='p-4'>
					<form onSubmit={handlePreferencesUpdate}>
						<div className='space-y-3'>
							<div className='flex items-start'>
								<div className='flex items-center h-5'>
									<input
										id='makeProfilePublic'
										type='checkbox'
										checked={privacySettings.makeProfilePublic}
										onChange={(e) =>
											setPrivacySettings({
												...privacySettings,
												makeProfilePublic: e.target.checked,
											})
										}
										className='h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500'
									/>
								</div>
								<div className='ml-3 text-sm'>
									<label
										htmlFor='makeProfilePublic'
										className='font-medium text-gray-700'>
										Public Profile
									</label>
									<p className='text-gray-500'>
										Make your profile visible to other users outside your
										households
									</p>
								</div>
							</div>

							<div className='flex items-start'>
								<div className='flex items-center h-5'>
									<input
										id='shareExpensesWithHousehold'
										type='checkbox'
										checked={privacySettings.shareExpensesWithHousehold}
										onChange={(e) =>
											setPrivacySettings({
												...privacySettings,
												shareExpensesWithHousehold: e.target.checked,
											})
										}
										className='h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500'
									/>
								</div>
								<div className='ml-3 text-sm'>
									<label
										htmlFor='shareExpensesWithHousehold'
										className='font-medium text-gray-700'>
										Share Expenses by Default
									</label>
									<p className='text-gray-500'>
										Automatically share new expenses with your households
									</p>
								</div>
							</div>

							<div className='flex items-start'>
								<div className='flex items-center h-5'>
									<input
										id='allowDataAnalysis'
										type='checkbox'
										checked={privacySettings.allowDataAnalysis}
										onChange={(e) =>
											setPrivacySettings({
												...privacySettings,
												allowDataAnalysis: e.target.checked,
											})
										}
										className='h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500'
									/>
								</div>
								<div className='ml-3 text-sm'>
									<label
										htmlFor='allowDataAnalysis'
										className='font-medium text-gray-700'>
										AI Financial Insights
									</label>
									<p className='text-gray-500'>
										Allow analysis of your spending patterns for personalized
										financial insights
									</p>
								</div>
							</div>
						</div>

						<div className='mt-4 flex justify-end'>
							<button
								type='submit'
								disabled={isLoading}
								className='px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50'>
								{isLoading ? 'Updating...' : 'Update Privacy Settings'}
							</button>
						</div>
					</form>
				</div>
			</div>

			{/* Danger Zone */}
			<div className='bg-white rounded-lg shadow-md overflow-hidden border border-red-200'>
				<div className='p-4 border-b border-red-200 bg-red-50'>
					<h2 className='text-xl font-semibold text-red-600'>Danger Zone</h2>
				</div>

				<div className='p-4'>
					<div className='space-y-4'>
						<div>
							<h3 className='font-medium mb-1'>Export Your Data</h3>
							<p className='text-sm text-gray-500 mb-2'>
								Download all your expenses and household data in CSV format
							</p>
							<button className='px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50'>
								Export Data
							</button>
						</div>

						<div className='pt-4 border-t border-gray-200'>
							<h3 className='font-medium text-red-600 mb-1'>Delete Account</h3>
							<p className='text-sm text-gray-500 mb-2'>
								Permanently delete your account and all associated data
							</p>
							<button className='px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700'>
								Delete Account
							</button>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
