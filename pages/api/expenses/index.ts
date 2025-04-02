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

	// GET /api/expenses - Get all expenses for the user
	if (req.method === 'GET') {
		try {
			const expenses = await prisma.expense.findMany({
				where: {
					userId,
				},
				orderBy: {
					date: 'desc',
				},
			});

			return res.status(200).json(expenses);
		} catch (error) {
			console.error('Error fetching expenses:', error);
			return res.status(500).json({ error: 'Failed to fetch expenses' });
		}
	}

	// POST /api/expenses - Create a new expense
	if (req.method === 'POST') {
		try {
			const { description, amount, date, category, householdId } = req.body;

			// Validate input
			if (!description || amount === undefined || !date || !category) {
				return res.status(400).json({ error: 'Missing required fields' });
			}

			// Create data object with correct structure
			const data: any = {
				description,
				amount: parseFloat(amount),
				date: new Date(date),
				category,
				user: {
					connect: {
						id: userId,
					},
				},
			};

			// Only add household connection if householdId is provided
			if (householdId) {
				data.household = {
					connect: {
						id: householdId,
					},
				};
			}

			// Create expense
			const expense = await prisma.expense.create({
				data,
			});

			return res.status(201).json(expense);
		} catch (error) {
			console.error('Error creating expense:', error);
			return res.status(500).json({ error: 'Failed to create expense' });
		}
	}

	// Method not allowed
	return res.status(405).json({ error: 'Method not allowed' });
}
