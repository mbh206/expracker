// pages/api/user/preferences.ts
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

	// Get user from email
	const user = await prisma.user.findUnique({
		where: {
			email: session.user.email,
		},
	});

	if (!user) {
		return res.status(404).json({ error: 'User not found' });
	}

	// GET /api/user/preferences - Get user preferences
	if (req.method === 'GET') {
		try {
			// Here we would normally fetch user preferences from the database
			// For now, we'll return default values since we haven't added these fields to our schema yet

			return res.status(200).json({
				emailPreferences: {
					receiveUpdates: true,
					receiveNotifications: true,
					receiveWeeklySummary: false,
				},
				privacySettings: {
					makeProfilePublic: false,
					shareExpensesWithHousehold: true,
					allowDataAnalysis: true,
				},
			});
		} catch (error) {
			console.error('Error fetching preferences:', error);
			return res.status(500).json({ error: 'Failed to fetch preferences' });
		}
	}

	// PUT /api/user/preferences - Update user preferences
	if (req.method === 'PUT') {
		try {
			const { emailPreferences, privacySettings } = req.body;

			// Here we would normally update the user preferences in the database
			// For this example, we'll just validate and return success
			// In a real implementation, you would add these fields to your Prisma schema

			if (!emailPreferences && !privacySettings) {
				return res.status(400).json({ error: 'No preferences provided' });
			}

			// Validate email preferences
			if (emailPreferences && typeof emailPreferences !== 'object') {
				return res
					.status(400)
					.json({ error: 'Invalid email preferences format' });
			}

			// Validate privacy settings
			if (privacySettings && typeof privacySettings !== 'object') {
				return res
					.status(400)
					.json({ error: 'Invalid privacy settings format' });
			}

			// In a real implementation, you would update the user record:
			// await prisma.user.update({
			//   where: { id: user.id },
			//   data: {
			//     emailPreferences: emailPreferences,
			//     privacySettings: privacySettings,
			//   },
			// });

			return res.status(200).json({
				message: 'Preferences updated successfully',
				emailPreferences,
				privacySettings,
			});
		} catch (error) {
			console.error('Error updating preferences:', error);
			return res.status(500).json({ error: 'Failed to update preferences' });
		}
	}

	return res.status(405).json({ error: 'Method not allowed' });
}
