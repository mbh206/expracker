// lib/cloudinary.ts
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
	cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
	api_key: process.env.CLOUDINARY_API_KEY,
	api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const uploadToCloudinary = async (
	file: Buffer,
	folder = 'profile-images'
): Promise<string> => {
	return new Promise((resolve, reject) => {
		const uploadOptions = {
			folder,
			resource_type: 'auto' as const,
			unique_filename: true,
		};

		cloudinary.uploader
			.upload_stream(uploadOptions, (error, result) => {
				if (error || !result)
					return reject(error || new Error('Upload failed'));
				resolve(result.secure_url);
			})
			.end(file);
	});
};

export const deleteFromCloudinary = async (publicId: string): Promise<void> => {
	if (!publicId) return;

	try {
		await cloudinary.uploader.destroy(publicId);
	} catch (error) {
		console.error('Error deleting image from Cloudinary:', error);
		// Re-throw the error to be handled by the caller
		throw error;
	}
};

// Helper to extract public_id from Cloudinary URL
export const getPublicIdFromUrl = (url: string): string | null => {
	if (!url) return null;

	try {
		// Format: https://res.cloudinary.com/cloud-name/image/upload/v1234567890/folder/filename.jpg
		const regex = /\/v\d+\/([^/]+\/[^.]+)/;
		const match = url.match(regex);
		return match ? match[1] : null;
	} catch (error) {
		console.error('Error extracting public ID from URL:', error);
		return null;
	}
};
