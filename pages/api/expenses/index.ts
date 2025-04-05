import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import prisma from '../../../lib/prismadb';
import { authOptions } from '../auth/[...nextauth]';
import { Prisma } from '@prisma/client';

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
			const { householdId } = req.query;

			// If householdId is provided, check if user is a member of the household
			if (householdId) {
				const membership = await prisma.householdMember.findUnique({
					where: {
						userId_householdId: {
							userId,
							householdId: householdId as string,
						},
					},
				});

				if (!membership) {
					return res
						.status(403)
						.json({ error: 'Not a member of this household' });
				}

				// Get household expenses
				const expenses = await prisma.expense.findMany({
					where: {
						householdId: householdId as string,
					},
					orderBy: {
						date: 'desc',
					},
				});

				return res.status(200).json(expenses);
			}

			// If no householdId, get user's personal expenses
			const expenses = await prisma.expense.findMany({
				where: {
					userId,
					householdId: null,
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
			const { description, amount, date, category, householdId, isRecurring } =
				req.body;

			console.log('Received expense data:', {
				description,
				amount,
				date,
				category,
				householdId,
				isRecurring,
			});

			// Validate input
			if (!description || amount === undefined || !date || !category) {
				console.log('Missing required fields:', {
					description: !!description,
					amount: amount !== undefined,
					date: !!date,
					category: !!category,
				});
				return res.status(400).json({ error: 'Missing required fields' });
			}

			// Create data object with correct structure
			const data: Prisma.ExpenseCreateInput = {
				description,
				amount: parseFloat(amount),
				date: new Date(date),
				category,
				isRecurring: isRecurring === true || isRecurring === 'true',
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

			console.log('Creating expense with data:', JSON.stringify(data, null, 2));

			// Create expense
			const expense = await prisma.expense.create({
				data,
			});

			console.log('Expense created successfully:', expense);
			return res.status(201).json(expense);
		} catch (error) {
			console.error('Error creating expense:', error);
			// Return more detailed error information
			return res.status(500).json({
				error: 'Failed to create expense',
				details: error instanceof Error ? error.message : String(error),
			});
		}
	}

	// Method not allowed
	return res.status(405).json({ error: 'Method not allowed' });
}
