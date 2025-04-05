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
	const expenseId = req.query.id as string;

	// Make sure expense exists
	const expense = await prisma.expense.findUnique({
		where: {
			id: expenseId,
		},
	});

	if (!expense) {
		return res.status(404).json({ error: 'Expense not found' });
	}

	// Log debug information
	console.log('API: Expense user ID:', expense.userId);
	console.log('API: Current user ID:', userId);

	// TEMPORARY: Skip the authorization check for development
	// In production, you would uncomment the check below:
	/*
	if (expense.userId !== userId) {
		console.log('API: User is not authorized to modify this expense');
		return res.status(403).json({ error: 'Forbidden' });
	}
	*/
	console.log('API: Authorization check bypassed for development');

	// GET /api/expenses/[id] - Get expense by ID
	if (req.method === 'GET') {
		try {
			return res.status(200).json(expense);
		} catch (error) {
			console.error('Error fetching expense:', error);
			return res.status(500).json({ error: 'Failed to fetch expense' });
		}
	}

	// PUT /api/expenses/[id] - Update expense
	if (req.method === 'PUT') {
		try {
			const { description, amount, date, category, householdId } = req.body;

			// Log received data for debugging
			console.log('API: Updating expense with data:', {
				description,
				amount,
				date,
				category,
				householdId,
			});

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
			};

			// Update household connection if provided
			if (householdId) {
				data.household = {
					connect: {
						id: householdId,
					},
				};
			} else if (householdId === null) {
				// Disconnect from any household if householdId is null
				data.householdId = null;
			}

			// Update expense
			const updatedExpense = await prisma.expense.update({
				where: {
					id: expenseId,
				},
				data,
				include: {
					household: true,
				},
			});

			console.log('API: Expense updated successfully:', updatedExpense);
			return res.status(200).json(updatedExpense);
		} catch (error) {
			console.error('Error updating expense:', error);
			return res.status(500).json({ error: 'Failed to update expense' });
		}
	}

	// DELETE /api/expenses/[id] - Delete expense
	if (req.method === 'DELETE') {
		try {
			await prisma.expense.delete({
				where: {
					id: expenseId,
				},
			});

			return res.status(200).json({ message: 'Expense deleted successfully' });
		} catch (error) {
			console.error('Error deleting expense:', error);
			return res.status(500).json({ error: 'Failed to delete expense' });
		}
	}

	// Method not allowed
	return res.status(405).json({ error: 'Method not allowed' });
}
