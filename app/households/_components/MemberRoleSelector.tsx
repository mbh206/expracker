'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';

interface MemberRoleSelectorProps {
	householdId: string;
	userId: string;
	currentRole: 'admin' | 'member';
	isCurrentUser: boolean;
}

export default function MemberRoleSelector({
	householdId,
	userId,
	currentRole,
	isCurrentUser,
}: MemberRoleSelectorProps) {
	const [isLoading, setIsLoading] = useState(false);

	const updateRole = async (newRole: 'admin' | 'member') => {
		// If trying to change to the same role, do nothing
		if (newRole === currentRole) {
			return;
		}

		// If this is the current user
		if (isCurrentUser) {
			// Only allow changing from admin to member (not the other way around)
			if (currentRole === 'admin' && newRole === 'member') {
				// This is allowed - proceed with the change
			} else {
				toast.error('You can only change your own role from admin to member');
				return;
			}
		} else {
			// If this is not the current user
			// Don't allow changing other admins' roles
			if (currentRole === 'admin') {
				toast.error("You cannot change another admin's role");
				return;
			}
			// Only allow changing members to admins
			if (newRole !== 'admin') {
				toast.error('You can only change members to admins');
				return;
			}
		}

		setIsLoading(true);
		try {
			const response = await fetch(
				`/api/households/${householdId}/members/${userId}/role`,
				{
					method: 'PUT',
					headers: {
						'Content-Type': 'application/json',
					},
					body: JSON.stringify({
						role: newRole,
					}),
				}
			);

			if (!response.ok) {
				throw new Error('Failed to update role');
			}

			toast.success(`Role updated to ${newRole}`);
			// Refresh the page to show updated role
			window.location.reload();
		} catch (error) {
			toast.error('Failed to update role');
			console.error('Error updating role:', error);
		} finally {
			setIsLoading(false);
		}
	};

	// Determine if the role can be changed
	const canChangeRole = () => {
		if (isCurrentUser) {
			// Current user can only change their own role from admin to member
			return currentRole === 'admin';
		} else {
			// Can only change members to admins
			return currentRole === 'member';
		}
	};

	return (
		<div className='relative'>
			<select
				value={currentRole}
				onChange={(e) => updateRole(e.target.value as 'admin' | 'member')}
				disabled={isLoading || !canChangeRole()}
				className={`px-2 py-1 text-xs rounded-md appearance-none cursor-pointer ${
					currentRole === 'admin'
						? 'bg-yellow-200 text-gray-800'
						: 'bg-gray-200 text-gray-800'
				} ${isLoading ? 'opacity-50 cursor-not-allowed' : ''} ${
					!canChangeRole() ? 'cursor-not-allowed' : ''
				}`}>
				<option value='member'>Member</option>
				<option value='admin'>Admin</option>
			</select>
			<div className='absolute inset-y-0 right-0 flex items-center px-1 pointer-events-none'>
				<svg
					className='w-3 h-3 text-gray-600'
					fill='none'
					stroke='currentColor'
					viewBox='0 0 24 24'
					xmlns='http://www.w3.org/2000/svg'>
					<path
						strokeLinecap='round'
						strokeLinejoin='round'
						strokeWidth='2'
						d='M19 9l-7 7-7-7'></path>
				</svg>
			</div>
		</div>
	);
}
