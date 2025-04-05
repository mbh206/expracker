// pages/api/user/connections.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
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

	// Get user ID from email
	const user = await prisma.user.findUnique({
		where: { email: session.user.email },
		select: { id: true },
	});

	if (!user) {
		return res.status(401).json({ error: 'User not found' });
	}

	// Only accept GET requests
	if (req.method !== 'GET') {
		return res.status(405).json({ error: 'Method not allowed' });
	}

	try {
		// Get all households the user is a member of
		const userHouseholds = await prisma.householdMember.findMany({
			where: { userId: user.id },
			select: { householdId: true },
		});

		const householdIds = userHouseholds.map((h) => h.householdId);

		// Get all members from these households (excluding the current user)
		const connections = await prisma.householdMember.findMany({
			where: {
				householdId: { in: householdIds },
				userId: { not: user.id },
			},
			include: {
				user: {
					select: {
						id: true,
						name: true,
						email: true,
						image: true,
					},
				},
				household: {
					select: {
						id: true,
						name: true,
					},
				},
			},
		});

		// Group connections by user
		const groupedConnections = connections.reduce((acc, connection) => {
			const userId = connection.user.id;

			if (!acc[userId]) {
				acc[userId] = {
					user: connection.user,
					households: [],
				};
			}

			acc[userId].households.push({
				id: connection.household.id,
				name: connection.household.name,
				role: connection.role,
			});

			return acc;
		}, {});

		// Convert to array
		const result = Object.values(groupedConnections);

		return res.status(200).json(result);
	} catch (error) {
		console.error('Error fetching connections:', error);
		return res.status(500).json({ error: 'Failed to fetch connections' });
	}
}
