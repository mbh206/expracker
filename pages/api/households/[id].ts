import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import prisma from '../../../lib/prismadb';
import { authOptions } from '../auth/[...nextauth]';

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

	// Check if household exists and user is a member
	const membership = await prisma.householdMember.findUnique({
		where: {
			userId_householdId: {
				userId,
				householdId,
			},
		},
	});

	if (!membership) {
		return res.status(403).json({ error: 'Forbidden' });
	}

	// GET /api/households/[id] - Get household by ID
	if (req.method === 'GET') {
		try {
			const household = await prisma.household.findUnique({
				where: {
					id: householdId,
				},
				include: {
					members: {
						include: {
							user: {
								select: {
									id: true,
									name: true,
									email: true,
									image: true,
								},
							},
						},
					},
					expenses: {
						include: {
							user: {
								select: {
									id: true,
									name: true,
									email: true,
								},
							},
						},
						orderBy: {
							date: 'desc',
						},
					},
				},
			});

			if (!household) {
				return res.status(404).json({ error: 'Household not found' });
			}

			return res.status(200).json(household);
		} catch (error) {
			console.error('Error fetching household:', error);
			return res.status(500).json({ error: 'Failed to fetch household' });
		}
	}

	// Check if user is an admin for updates and deletes
	const isAdmin = membership.role === 'admin';

	// PUT /api/households/[id] - Update household
	if (req.method === 'PUT') {
		if (!isAdmin) {
			return res
				.status(403)
				.json({ error: 'Only admins can update households' });
		}

		try {
			const { name } = req.body;

			// Validate input
			if (!name) {
				return res.status(400).json({ error: 'Missing required fields' });
			}

			// Update household
			const updatedHousehold = await prisma.household.update({
				where: {
					id: householdId,
				},
				data: {
					name,
				},
			});

			return res.status(200).json(updatedHousehold);
		} catch (error) {
			console.error('Error updating household:', error);
			return res.status(500).json({ error: 'Failed to update household' });
		}
	}

	// DELETE /api/households/[id] - Delete household
	if (req.method === 'DELETE') {
		if (!isAdmin) {
			return res
				.status(403)
				.json({ error: 'Only admins can delete households' });
		}

		try {
			// First, delete all members
			await prisma.householdMember.deleteMany({
				where: {
					householdId,
				},
			});

			// Then, update all expenses to remove the household connection
			await prisma.expense.updateMany({
				where: {
					householdId,
				},
				data: {
					householdId: null,
				},
			});

			// Finally, delete the household
			await prisma.household.delete({
				where: {
					id: householdId,
				},
			});

			return res
				.status(200)
				.json({ message: 'Household deleted successfully' });
		} catch (error) {
			console.error('Error deleting household:', error);
			return res.status(500).json({ error: 'Failed to delete household' });
		}
	}

	// Method not allowed
	return res.status(405).json({ error: 'Method not allowed' });
}
