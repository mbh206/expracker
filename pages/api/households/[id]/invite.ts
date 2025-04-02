import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import prisma from '../../../../lib/prismadb';
import { authOptions } from '../../auth/[...nextauth]';

export default async function handler(
	req: NextApiRequest,
	res: NextApiResponse
) {
	const session = await getServerSession(req, res, authOptions);

	if (!session || !session.user?.email) {
		return res.status(401).json({ error: 'Unauthorized' });
	}

	// Get user ID from email
	const user = await prisma.user.findUnique({
		where: {
			email: session.user.email,
		},
		select: {
			id: true,
		},
	});

	if (!user) {
		return res.status(401).json({ error: 'User not found' });
	}

	const userId = user.id;
	const householdId = req.query.id as string;

	// Check if household exists and user is an admin
	const membership = await prisma.householdMember.findUnique({
		where: {
			userId_householdId: {
				userId,
				householdId,
			},
		},
	});

	if (!membership || membership.role !== 'admin') {
		return res.status(403).json({ error: 'Only admins can invite members' });
	}

	// POST /api/households/[id]/invite - Invite a user to the household
	if (req.method === 'POST') {
		try {
			const { email } = req.body;

			// Validate input
			if (!email) {
				return res.status(400).json({ error: 'Email is required' });
			}

			// Find user by email
			const invitedUser = await prisma.user.findUnique({
				where: {
					email,
				},
			});

			if (!invitedUser) {
				return res
					.status(404)
					.json({ error: 'User not found. They need to register first.' });
			}

			// Check if user is already a member
			const existingMembership = await prisma.householdMember.findUnique({
				where: {
					userId_householdId: {
						userId: invitedUser.id,
						householdId,
					},
				},
			});

			if (existingMembership) {
				return res
					.status(400)
					.json({ error: 'User is already a member of this household' });
			}

			// Add user to household
			await prisma.householdMember.create({
				data: {
					userId: invitedUser.id,
					householdId,
					role: 'member',
				},
			});

			// In a real application, you could send an email notification here

			return res.status(200).json({ message: 'User invited successfully' });
		} catch (error) {
			console.error('Error inviting user:', error);
			return res.status(500).json({ error: 'Failed to invite user' });
		}
	}

	// Method not allowed
	return res.status(405).json({ error: 'Method not allowed' });
}
