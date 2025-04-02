import type { NextApiRequest, NextApiResponse } from 'next';
import bcrypt from 'bcrypt';
import prisma from '../../lib/prismadb';

export default async function handler(
	req: NextApiRequest,
	res: NextApiResponse
) {
	if (req.method !== 'POST') {
		return res.status(405).json({ error: 'Method not allowed' });
	}

	try {
		const { token, password } = req.body;

		if (!token || !password) {
			return res.status(400).json({ error: 'Missing required fields' });
		}

		if (password.length < 8) {
			return res
				.status(400)
				.json({ error: 'Password must be at least 8 characters' });
		}

		// Find user by reset token
		const user = await prisma.user.findFirst({
			where: {
				resetToken: token,
				resetTokenExpiry: {
					gt: new Date(),
				},
			},
		});

		if (!user) {
			return res.status(400).json({
				error: 'Invalid or expired reset token. Please request a new one.',
			});
		}

		// Hash new password
		const hashedPassword = await bcrypt.hash(password, 12);

		// Update user with new password and clear reset token
		await prisma.user.update({
			where: { id: user.id },
			data: {
				password: hashedPassword,
				resetToken: null,
				resetTokenExpiry: null,
			},
		});

		return res.status(200).json({ message: 'Password reset successful' });
	} catch (error: any) {
		console.error('Reset password error:', error);
		return res.status(500).json({ error: 'Internal server error' });
	}
}
