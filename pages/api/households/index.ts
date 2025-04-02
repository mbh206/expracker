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

	// GET /api/households - Get all households for the user
	if (req.method === 'GET') {
		try {
			const households = await prisma.household.findMany({
				where: {
					members: {
						some: {
							userId,
						},
					},
				},
				include: {
					_count: {
						select: {
							members: true,
							expenses: true,
						},
					},
				},
			});

			return res.status(200).json(households);
		} catch (error) {
			console.error('Error fetching households:', error);
			return res.status(500).json({ error: 'Failed to fetch households' });
		}
	}

	// POST /api/households - Create a new household
	if (req.method === 'POST') {
		try {
			const { name } = req.body;

			// Validate input
			if (!name) {
				return res.status(400).json({ error: 'Missing required fields' });
			}

			// Create household
			const household = await prisma.household.create({
				data: {
					name,
					members: {
						create: [
							{
								userId,
								role: 'admin',
							},
						],
					},
				},
			});

			return res.status(201).json(household);
		} catch (error) {
			console.error('Error creating household:', error);
			return res.status(500).json({ error: 'Failed to create household' });
		}
	}

	// Method not allowed
	return res.status(405).json({ error: 'Method not allowed' });
}
