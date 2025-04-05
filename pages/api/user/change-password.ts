// pages/api/user/change-password.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import bcrypt from 'bcrypt';
import prisma from '@/lib/prismadb';
import { authOptions } from '@/pages/api/auth/[...nextauth]';

export default async function handler(
	req: NextApiRequest,
	res: NextApiResponse
) {
	const session = await getServerSession(req, res, authOptions);

	if (!session || !session.user?.email) {
		return res.status(401).json({ error: 'Unauthorized' });
	}

	// Get user from email
	const user = await prisma.user.findUnique({
		where: {
			email: session.user.email,
		},
	});

	if (!user) {
		return res.status(404).json({ error: 'User not found' });
	}

	// Only accept POST requests
	if (req.method !== 'POST') {
		return res.status(405).json({ error: 'Method not allowed' });
	}

	try {
		const { currentPassword, newPassword } = req.body;

		// Validate input
		if (!currentPassword || !newPassword) {
			return res.status(400).json({ error: 'Missing required fields' });
		}

		if (newPassword.length < 8) {
			return res
				.status(400)
				.json({ error: 'Password must be at least 8 characters' });
		}

		// Check if user has a password set
		if (!user.password) {
			return res.status(400).json({
				error:
					'No password is set for this account. You might be using a social login method.',
			});
		}

		// Verify current password
		const isPasswordValid = await bcrypt.compare(
			currentPassword,
			user.password
		);
		if (!isPasswordValid) {
			return res.status(400).json({ error: 'Current password is incorrect' });
		}

		// Hash new password
		const hashedPassword = await bcrypt.hash(newPassword, 12);

		// Update password
		await prisma.user.update({
			where: { id: user.id },
			data: { password: hashedPassword },
		});

		return res.status(200).json({ message: 'Password changed successfully' });
	} catch (error) {
		console.error('Password change error:', error);
		return res.status(500).json({ error: 'Failed to change password' });
	}
}
