// app/profile/ProfileContent.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import axios from 'axios';
import { format } from 'date-fns';

interface User {
	id: string;
	name?: string | null;
	email: string;
	image?: string | null;
	bio?: string | null;
	location?: string | null;
	lastUsernameChange?: Date | null;
	createdAt: Date;
}

interface Household {
	id: string;
	name: string;
}

interface HouseholdMembership {
	userId: string;
	householdId: string;
	role: string;
	household: Household;
}

interface Connection {
	user: {
		id: string;
		name?: string | null;
		email: string;
		image?: string | null;
	};
	households: {
		id: string;
		name: string;
		role: string;
	}[];
}

interface ProfileContentProps {
	user: User;
	householdMemberships: HouseholdMembership[];
}

export default function ProfileContent({
	user,
	householdMemberships,
}: ProfileContentProps) {
	const router = useRouter();
	const fileInputRef = useRef<HTMLInputElement>(null);

	// Profile form state
	const [name, setName] = useState(user.name || '');
	const [bio, setBio] = useState(user.bio || '');
	const [location, setLocation] = useState(user.location || '');
	const [imageFile, setImageFile] = useState<File | null>(null);
	const [imagePreview, setImagePreview] = useState<string | null>(
		user.image || null
	);

	// UI state
	const [isEditing, setIsEditing] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState('');
	const [success, setSuccess] = useState('');
	const [connections, setConnections] = useState<Connection[]>([]);
	const [connectionsLoading, setConnectionsLoading] = useState(true);

	// Calculate days until username can be changed
	const canChangeUsername =
		!user.lastUsernameChange ||
		new Date().getTime() - new Date(user.lastUsernameChange).getTime() >
			30 * 24 * 60 * 60 * 1000;

	const daysUntilUsernameChange = user.lastUsernameChange
		? Math.max(
				0,
				30 -
					Math.floor(
						(new Date().getTime() -
							new Date(user.lastUsernameChange).getTime()) /
							(1000 * 60 * 60 * 24)
					)
		  )
		: 0;

	// Fetch connections (other household members)
	useEffect(() => {
		const fetchConnections = async () => {
			try {
				setConnectionsLoading(true);
				const response = await axios.get('/api/user/connections');
				setConnections(response.data);
			} catch (error) {
				console.error('Failed to fetch connections:', error);
			} finally {
				setConnectionsLoading(false);
			}
		};

		fetchConnections();
	}, []);

	const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;

		// Check file size (max 5MB)
		if (file.size > 5 * 1024 * 1024) {
			setError('Image size must be less than 5MB');
			return;
		}

		// Check file type
		if (!file.type.startsWith('image/')) {
			setError('File must be an image');
			return;
		}

		setImageFile(file);
		setImagePreview(URL.createObjectURL(file));
		setError('');
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsLoading(true);
		setError('');
		setSuccess('');

		try {
			const formData = new FormData();
			formData.append('name', name);
			formData.append('bio', bio);
			formData.append('location', location);

			if (imageFile) {
				formData.append('image', imageFile);
			}

			const response = await axios.put('/api/user/profile', formData, {
				headers: {
					'Content-Type': 'multipart/form-data',
				},
			});

			setSuccess('Profile updated successfully!');
			setIsEditing(false);

			// If we changed the name, refresh the page to update the UI
			if (response.data.name !== user.name) {
				router.refresh();
			}
		} catch (error: any) {
			if (axios.isAxiosError(error) && error.response) {
				setError(error.response.data.error || 'Failed to update profile');
			} else {
				setError('Something went wrong. Please try again.');
			}
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
			{/* Profile Card */}
			<div className='md:col-span-1'>
				<div className='bg-white rounded-lg shadow-md overflow-hidden p-6'>
					<div className='flex flex-col items-center'>
						{!isEditing ? (
							// View Mode
							<>
								<div className='relative w-32 h-32 mb-4'>
									{imagePreview ? (
										<Image
											src={imagePreview}
											alt={name || 'User'}
											fill
											className='rounded-full object-cover'
										/>
									) : (
										<div className='w-32 h-32 bg-gray-200 rounded-full flex items-center justify-center'>
											<span className='text-3xl text-gray-500 font-semibold'>
												{name?.charAt(0) || user.email?.charAt(0) || 'U'}
											</span>
										</div>
									)}
								</div>
								<h2 className='text-xl font-semibold mb-1'>
									{name || 'Unnamed User'}
								</h2>
								<p className='text-gray-500 mb-4'>{user.email}</p>

								{bio && <p className='text-gray-700 mb-3'>{bio}</p>}

								{location && (
									<p className='text-gray-500 flex items-center mb-3'>
										<svg
											className='w-4 h-4 mr-1'
											fill='none'
											stroke='currentColor'
											viewBox='0 0 24 24'
											xmlns='http://www.w3.org/2000/svg'>
											<path
												strokeLinecap='round'
												strokeLinejoin='round'
												strokeWidth={2}
												d='M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z'
											/>
											<path
												strokeLinecap='round'
												strokeLinejoin='round'
												strokeWidth={2}
												d='M15 11a3 3 0 11-6 0 3 3 0 016 0z'
											/>
										</svg>
										{location}
									</p>
								)}

								<p className='text-gray-500 text-sm'>
									Member since {format(new Date(user.createdAt), 'MMMM yyyy')}
								</p>

								<button
									onClick={() => setIsEditing(true)}
									className='mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700'>
									Edit Profile
								</button>
							</>
						) : (
							// Edit Mode
							<form
								onSubmit={handleSubmit}
								className='w-full'>
								{error && (
									<div className='mb-4 p-3 bg-red-100 text-red-700 rounded-md'>
										{error}
									</div>
								)}

								{success && (
									<div className='mb-4 p-3 bg-green-100 text-green-700 rounded-md'>
										{success}
									</div>
								)}

								<div className='flex flex-col items-center mb-4'>
									<div
										className='relative w-32 h-32 mb-2 cursor-pointer'
										onClick={() => fileInputRef.current?.click()}>
										{imagePreview ? (
											<>
												<Image
													src={imagePreview}
													alt={name || 'User'}
													fill
													className='rounded-full object-cover'
												/>
												<div className='absolute inset-0 bg-black bg-opacity-40 rounded-full flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity'>
													<span className='text-white text-sm'>
														Change Photo
													</span>
												</div>
											</>
										) : (
											<div className='w-32 h-32 bg-gray-200 rounded-full flex items-center justify-center hover:bg-gray-300 transition-colors'>
												<span className='text-3xl text-gray-500 font-semibold'>
													{name?.charAt(0) || user.email?.charAt(0) || 'U'}
												</span>
											</div>
										)}
									</div>

									<input
										type='file'
										ref={fileInputRef}
										onChange={handleImageChange}
										accept='image/*'
										className='hidden'
									/>

									<button
										type='button'
										onClick={() => fileInputRef.current?.click()}
										className='text-sm text-blue-600 hover:text-blue-800'>
										Change Profile Picture
									</button>
								</div>

								<div className='mb-4'>
									<label className='block text-sm font-medium text-gray-700 mb-1'>
										Username
									</label>
									<input
										type='text'
										value={name}
										onChange={(e) => setName(e.target.value)}
										disabled={!canChangeUsername}
										className='w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500'
									/>
									{!canChangeUsername && (
										<p className='text-xs text-orange-600 mt-1'>
											You can change your username again in{' '}
											{daysUntilUsernameChange} days.
										</p>
									)}
								</div>

								<div className='mb-4'>
									<label className='block text-sm font-medium text-gray-700 mb-1'>
										Bio
									</label>
									<textarea
										value={bio}
										onChange={(e) => setBio(e.target.value)}
										rows={3}
										className='w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500'
										placeholder='Tell us about yourself'
									/>
								</div>

								<div className='mb-4'>
									<label className='block text-sm font-medium text-gray-700 mb-1'>
										Location
									</label>
									<input
										type='text'
										value={location}
										onChange={(e) => setLocation(e.target.value)}
										className='w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500'
										placeholder='City, Country'
									/>
								</div>

								<div className='flex justify-end space-x-2'>
									<button
										type='button'
										onClick={() => {
											setIsEditing(false);
											setImagePreview(user.image || null);
											setName(user.name || '');
											setBio(user.bio || '');
											setLocation(user.location || '');
											setError('');
											setSuccess('');
										}}
										className='px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50'
										disabled={isLoading}>
										Cancel
									</button>

									<button
										type='submit'
										className='px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50'
										disabled={isLoading}>
										{isLoading ? 'Saving...' : 'Save Changes'}
									</button>
								</div>
							</form>
						)}
					</div>
				</div>
			</div>

			{/* Households and Connections */}
			<div className='md:col-span-2'>
				{/* User's Households */}
				<div className='bg-white rounded-lg shadow-md overflow-hidden mb-6'>
					<div className='p-4 border-b border-gray-200'>
						<h2 className='text-xl font-semibold'>Your Households</h2>
					</div>

					<div className='p-4'>
						{householdMemberships.length === 0 ? (
							<div className='text-center py-4'>
								<p className='text-gray-500'>
									You are not a member of any households yet.
								</p>
								<Link
									href='/households/new'
									className='text-blue-600 hover:text-blue-800 mt-2 inline-block'>
									Create Your First Household
								</Link>
							</div>
						) : (
							<div className='space-y-3'>
								{householdMemberships.map((membership) => (
									<div
										key={membership.householdId}
										className='flex justify-between items-center p-3 bg-gray-50 rounded-md'>
										<div>
											<Link
												href={`/households/${membership.householdId}`}
												className='font-medium text-blue-600 hover:text-blue-800'>
												{membership.household.name}
											</Link>
											<span className='ml-2 text-sm text-gray-500 capitalize'>
												({membership.role})
											</span>
										</div>
										<Link
											href={`/households/${membership.householdId}`}
											className='text-sm text-blue-600 hover:text-blue-800'>
											View Details
										</Link>
									</div>
								))}

								<div className='mt-4 text-center'>
									<Link
										href='/households/new'
										className='text-blue-600 hover:text-blue-800'>
										+ Create New Household
									</Link>
								</div>
							</div>
						)}
					</div>
				</div>

				{/* Connections */}
				<div className='bg-white rounded-lg shadow-md overflow-hidden'>
					<div className='p-4 border-b border-gray-200'>
						<h2 className='text-xl font-semibold'>Household Connections</h2>
						<p className='text-sm text-gray-500 mt-1'>
							People you share expenses with in your households
						</p>
					</div>

					<div className='p-4'>
						{connectionsLoading ? (
							<div className='flex justify-center items-center py-8'>
								<div className='w-6 h-6 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin mr-2'></div>
								<p className='text-gray-500'>Loading connections...</p>
							</div>
						) : connections.length === 0 ? (
							<div className='text-center py-4'>
								<p className='text-gray-500'>
									You don't have any connections yet. Invite members to your
									households to see them here.
								</p>
							</div>
						) : (
							<div className='divide-y'>
								{connections.map((connection) => (
									<div
										key={connection.user.id}
										className='py-4'>
										<div className='flex items-center'>
											<div className='flex-shrink-0 mr-3'>
												{connection.user.image ? (
													<div className='relative w-10 h-10'>
														<Image
															src={connection.user.image}
															alt={connection.user.name || 'User'}
															fill
															className='rounded-full object-cover'
														/>
													</div>
												) : (
													<div className='w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center'>
														<span className='text-sm text-gray-500 font-semibold'>
															{connection.user.name?.charAt(0) ||
																connection.user.email?.charAt(0) ||
																'U'}
														</span>
													</div>
												)}
											</div>

											<div>
												<h3 className='font-medium'>
													{connection.user.name || 'Unnamed User'}
												</h3>
												<p className='text-sm text-gray-500'>
													{connection.user.email}
												</p>
											</div>
										</div>

										<div className='mt-2 pl-13 ml-13'>
											<p className='text-xs text-gray-500 mb-1'>
												Shared households:
											</p>
											<div className='flex flex-wrap gap-2'>
												{connection.households.map((household) => (
													<Link
														key={household.id}
														href={`/households/${household.id}`}
														className='text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-full'>
														{household.name}
													</Link>
												))}
											</div>
										</div>
									</div>
								))}
							</div>
						)}
					</div>
				</div>

				{/* Account Stats */}
				<div className='bg-white rounded-lg shadow-md overflow-hidden mt-6'>
					<div className='p-4 border-b border-gray-200'>
						<h2 className='text-xl font-semibold'>Account Statistics</h2>
					</div>

					<div className='p-4'>
						<div className='grid grid-cols-2 gap-4'>
							<div className='p-3 bg-gray-50 rounded-md'>
								<p className='text-sm text-gray-500'>Total Households</p>
								<p className='text-2xl font-bold text-gray-900'>
									{householdMemberships.length}
								</p>
							</div>

							<div className='p-3 bg-gray-50 rounded-md'>
								<p className='text-sm text-gray-500'>Connected Users</p>
								<p className='text-2xl font-bold text-gray-900'>
									{connections.length}
								</p>
							</div>

							<div className='p-3 bg-gray-50 rounded-md col-span-2'>
								<p className='text-sm text-gray-500'>Account Type</p>
								<p className='text-lg font-medium text-gray-900'>
									Free Account
								</p>
								<div className='mt-2'>
									<a
										href='#'
										className='text-sm text-blue-600 hover:text-blue-800'>
										Upgrade to Premium
									</a>
								</div>
							</div>
						</div>

						<div className='mt-4'>
							<h3 className='font-medium mb-2'>Quick Actions</h3>
							<div className='grid grid-cols-2 gap-2'>
								<Link
									href='/expenses/new'
									className='p-2 text-center text-sm bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100'>
									Add New Expense
								</Link>
								<Link
									href='/households'
									className='p-2 text-center text-sm bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100'>
									Manage Households
								</Link>
								<Link
									href='/advice'
									className='p-2 text-center text-sm bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100'>
									View Financial Insights
								</Link>
								<Link
									href='#'
									className='p-2 text-center text-sm bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100'>
									Account Settings
								</Link>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
