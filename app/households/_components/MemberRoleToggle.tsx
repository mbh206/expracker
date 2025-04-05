'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';

interface MemberRoleToggleProps {
	householdId: string;
	userId: string;
	currentRole: 'admin' | 'member';
	isCurrentUser: boolean;
}

export default function MemberRoleToggle({
	householdId,
	userId,
	currentRole,
	isCurrentUser,
}: MemberRoleToggleProps) {
	const [isLoading, setIsLoading] = useState(false);

	const toggleRole = async () => {
		if (isCurrentUser) {
			toast.error('You cannot change your own role');
			return;
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
						role: currentRole === 'admin' ? 'member' : 'admin',
					}),
				}
			);

			if (!response.ok) {
				throw new Error('Failed to update role');
			}

			toast.success(
				`Role updated to ${currentRole === 'admin' ? 'member' : 'admin'}`
			);
			// Refresh the page to show updated role
			window.location.reload();
		} catch (error) {
			toast.error('Failed to update role');
			console.error('Error updating role:', error);
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<button
			onClick={toggleRole}
			disabled={isLoading || isCurrentUser}
			className={`px-2 py-1 text-xs rounded-full transition-colors ${
				currentRole === 'admin'
					? 'bg-yellow-200 text-gray-800 hover:bg-yellow-300'
					: 'bg-gray-200 text-gray-800 hover:bg-gray-300'
			} ${isLoading ? 'opacity-50 cursor-not-allowed' : ''} ${
				isCurrentUser ? 'cursor-not-allowed' : ''
			}`}>
			{isLoading ? 'Updating...' : currentRole === 'admin' ? 'Admin' : 'Member'}
		</button>
	);
}
