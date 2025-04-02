import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../lib/prismadb';
import crypto from 'crypto';

export default async function handler(
	req: NextApiRequest,
	res: NextApiResponse
) {
	if (req.method !== 'POST') {
		return res.status(405).json({ error: 'Method not allowed' });
	}

	try {
		const { email } = req.body;

		if (!email) {
			return res.status(400).json({ error: 'Email is required' });
		}

		// Find user by email
		const user = await prisma.user.findUnique({ where: { email } });

		// We don't want to reveal if a user exists, so we return success even if no user is found
		if (!user) {
			return res.status(200).json({ message: 'Password reset email sent' });
		}

		// Generate reset token
		const resetToken = crypto.randomBytes(32).toString('hex');
		const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour from now

		// Store reset token in database
		await prisma.user.update({
			where: { id: user.id },
			data: {
				resetToken,
				resetTokenExpiry,
			},
		});

		// In a real application, you would send an email with the reset link
		// For this demo, we'll just return success
		console.log(
			`Reset link: ${process.env.NEXTAUTH_URL}/reset-password?token=${resetToken}`
		);

		return res.status(200).json({ message: 'Password reset email sent' });
	} catch (error: any) {
		console.error('Forgot password error:', error);
		return res.status(500).json({ error: 'Internal server error' });
	}
}
