import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import prisma from '../../../../../../lib/prismadb';
import { authOptions } from '../../../../auth/[...nextauth]';
import { HouseholdMember } from '@prisma/client';

export default async function handler(
	req: NextApiRequest,
	res: NextApiResponse
) {
	const session = await getServerSession(req, res, authOptions);

	if (!session) {
		return res.status(401).json({ error: 'Unauthorized' });
	}

	const { id, userId } = req.query;

	if (!id || !userId || typeof id !== 'string' || typeof userId !== 'string') {
		return res.status(400).json({ error: 'Invalid household or user ID' });
	}

	// Check if the household exists
	const household = await prisma.household.findUnique({
		where: { id },
		include: {
			members: true,
		},
	});

	if (!household) {
		return res.status(404).json({ error: 'Household not found' });
	}

	// Check if the user is a member of the household
	const isMember = household.members.some(
		(member: HouseholdMember) => member.userId === session.user.id
	);

	if (!isMember) {
		return res
			.status(403)
			.json({ error: 'You are not a member of this household' });
	}

	// Check if the user is an admin of the household
	const isAdmin = household.members.some(
		(member: HouseholdMember) =>
			member.userId === session.user.id && member.role === 'admin'
	);

	if (!isAdmin) {
		return res
			.status(403)
			.json({ error: 'Only admins can change member roles' });
	}

	// Check if the target user is a member of the household
	const targetMember = household.members.find(
		(member: HouseholdMember) => member.userId === userId
	);

	if (!targetMember) {
		return res
			.status(404)
			.json({ error: 'User is not a member of this household' });
	}

	// Prevent changing your own role
	if (userId === session.user.id) {
		return res.status(400).json({ error: 'You cannot change your own role' });
	}

	// Update the member's role
	if (req.method === 'PUT') {
		try {
			const { role } = req.body;

			if (!role || (role !== 'admin' && role !== 'member')) {
				return res.status(400).json({ error: 'Invalid role' });
			}

			const updatedMember = await prisma.householdMember.update({
				where: {
					userId_householdId: {
						userId,
						householdId: id,
					},
				},
				data: {
					role,
				},
			});

			return res.status(200).json(updatedMember);
		} catch (error) {
			console.error('Error updating member role:', error);
			return res.status(500).json({ error: 'Failed to update member role' });
		}
	}

	return res.status(405).json({ error: 'Method not allowed' });
}
