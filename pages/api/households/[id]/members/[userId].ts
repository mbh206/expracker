import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import prisma from '../../../../../lib/prismadb';
import { authOptions } from '../../../auth/[...nextauth]';

export default async function handler(
	req: NextApiRequest,
	res: NextApiResponse
) {
	const session = await getServerSession(req, res, authOptions);

	if (!session || !session.user?.email) {
		return res.status(401).json({ error: 'Unauthorized' });
	}

	// Get user ID from email
	const currentUser = await prisma.user.findUnique({
		where: {
			email: session.user.email,
		},
		select: {
			id: true,
		},
	});

	if (!currentUser) {
		return res.status(401).json({ error: 'User not found' });
	}

	const currentUserId = currentUser.id;
	const householdId = req.query.id as string;
	const targetUserId = req.query.userId as string;

	// Check if household exists and current user is an admin
	const membership = await prisma.householdMember.findUnique({
		where: {
			userId_householdId: {
				userId: currentUserId,
				householdId,
			},
		},
	});

	if (!membership) {
		return res.status(403).json({ error: 'Forbidden' });
	}

	// For self-removal, user can be a regular member
	// For other operations, user must be an admin
	const isAdmin = membership.role === 'admin';
	const isSelfRemoval =
		currentUserId === targetUserId && req.method === 'DELETE';

	if (!isAdmin && !isSelfRemoval) {
		return res.status(403).json({ error: 'Only admins can manage members' });
	}

	// Check if target member exists
	const targetMembership = await prisma.householdMember.findUnique({
		where: {
			userId_householdId: {
				userId: targetUserId,
				householdId,
			},
		},
	});

	if (!targetMembership) {
		return res.status(404).json({ error: 'Member not found' });
	}

	// PUT /api/households/[id]/members/[userId] - Update member role
	if (req.method === 'PUT') {
		try {
			const { role } = req.body;

			// Validate input
			if (!role || !['admin', 'member'].includes(role)) {
				return res.status(400).json({ error: 'Invalid role' });
			}

			// Prevent removing the last admin
			if (targetMembership.role === 'admin' && role === 'member') {
				const adminCount = await prisma.householdMember.count({
					where: {
						householdId,
						role: 'admin',
					},
				});

				if (adminCount <= 1) {
					return res
						.status(400)
						.json({ error: 'Cannot remove the last admin' });
				}
			}

			// Update member role
			const updatedMembership = await prisma.householdMember.update({
				where: {
					userId_householdId: {
						userId: targetUserId,
						householdId,
					},
				},
				data: {
					role,
				},
			});

			return res.status(200).json(updatedMembership);
		} catch (error) {
			console.error('Error updating member:', error);
			return res.status(500).json({ error: 'Failed to update member' });
		}
	}

	// DELETE /api/households/[id]/members/[userId] - Remove member
	if (req.method === 'DELETE') {
		try {
			// Prevent removing the last admin
			if (targetMembership.role === 'admin') {
				const adminCount = await prisma.householdMember.count({
					where: {
						householdId,
						role: 'admin',
					},
				});

				if (adminCount <= 1) {
					return res
						.status(400)
						.json({ error: 'Cannot remove the last admin' });
				}
			}

			// Remove member
			await prisma.householdMember.delete({
				where: {
					userId_householdId: {
						userId: targetUserId,
						householdId,
					},
				},
			});

			return res.status(200).json({ message: 'Member removed successfully' });
		} catch (error) {
			console.error('Error removing member:', error);
			return res.status(500).json({ error: 'Failed to remove member' });
		}
	}

	// Method not allowed
	return res.status(405).json({ error: 'Method not allowed' });
}
