// pages/api/user/profile.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import formidable from 'formidable';
import fs from 'fs';
import prisma from '@/lib/prismadb';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import {
	uploadToCloudinary,
	deleteFromCloudinary,
	getPublicIdFromUrl,
} from '@/lib/cloudinary';

export const config = {
	api: {
		bodyParser: false,
	},
};

export default async function handler(
	req: NextApiRequest,
	res: NextApiResponse
) {
	const session = await getServerSession(req, res, authOptions);

	if (!session || !session.user?.email) {
		return res.status(401).json({ error: 'Unauthorized' });
	}

	// Get the current user
	const user = await prisma.user.findUnique({
		where: { email: session.user.email },
	});

	if (!user) {
		return res.status(404).json({ error: 'User not found' });
	}

	// PUT request to update profile
	if (req.method === 'PUT') {
		try {
			const form = formidable({
				maxFileSize: 5 * 1024 * 1024, // 5MB limit
			});

			const [fields, files] = await new Promise<
				[formidable.Fields, formidable.Files]
			>((resolve, reject) => {
				form.parse(req, (err, fields, files) => {
					if (err) reject(err);
					resolve([fields, files]);
				});
			});

			// Extract data from fields
			const name = fields.name ? fields.name[0] : undefined;
			const bio = fields.bio ? fields.bio[0] : undefined;
			const location = fields.location ? fields.location[0] : undefined;

			// Check if username is being changed
			if (name && name !== user.name) {
				// Check if name is unique
				const existingUserWithName = await prisma.user.findFirst({
					where: {
						name,
						id: { not: user.id },
					},
				});

				if (existingUserWithName) {
					return res.status(400).json({ error: 'Username is already taken' });
				}

				// Check if last username change was less than 30 days ago
				if (user.lastUsernameChange) {
					const daysSinceLastChange = Math.floor(
						(Date.now() - user.lastUsernameChange.getTime()) /
							(1000 * 60 * 60 * 24)
					);

					if (daysSinceLastChange < 30) {
						return res.status(400).json({
							error: `You can change your username once every 30 days. Please wait ${
								30 - daysSinceLastChange
							} more days.`,
						});
					}
				}
			}

			// Process profile image if uploaded
			let imageUrl = user.image;
			let imagePublicId = user.imagePublicId;

			if (files.image) {
				const file = Array.isArray(files.image) ? files.image[0] : files.image;

				// Read the file
				const fileBuffer = fs.readFileSync(file.filepath);

				// Delete old image from Cloudinary if it exists
				if (user.imagePublicId) {
					await deleteFromCloudinary(user.imagePublicId);
				}

				// Upload new image to Cloudinary
				imageUrl = await uploadToCloudinary(fileBuffer);
				imagePublicId = getPublicIdFromUrl(imageUrl);
			}

			// Update user profile
			const updatedUser = await prisma.user.update({
				where: { id: user.id },
				data: {
					name: name || user.name,
					bio: bio !== undefined ? bio : user.bio,
					location: location !== undefined ? location : user.location,
					image: imageUrl,
					imagePublicId,
					...(name && name !== user.name
						? { lastUsernameChange: new Date() }
						: {}),
				},
				select: {
					id: true,
					name: true,
					email: true,
					image: true,
					bio: true,
					location: true,
					lastUsernameChange: true,
					createdAt: true,
				},
			});

			return res.status(200).json(updatedUser);
		} catch (error) {
			console.error('Profile update error:', error);
			return res.status(500).json({ error: 'Internal server error' });
		}
	}

	// GET request to fetch profile
	if (req.method === 'GET') {
		try {
			const userProfile = await prisma.user.findUnique({
				where: { id: user.id },
				select: {
					id: true,
					name: true,
					email: true,
					image: true,
					bio: true,
					location: true,
					lastUsernameChange: true,
					createdAt: true,
				},
			});

			// Get user's household memberships
			const householdMemberships = await prisma.householdMember.findMany({
				where: { userId: user.id },
				include: {
					household: true,
				},
			});

			return res.status(200).json({
				...userProfile,
				householdMemberships,
			});
		} catch (error) {
			console.error('Error fetching profile:', error);
			return res.status(500).json({ error: 'Failed to fetch profile' });
		}
	}

	return res.status(405).json({ error: 'Method not allowed' });
}
