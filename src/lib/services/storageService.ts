import cloudinary from '../cloudinary';
import { Readable } from 'node:stream';

/**
 * Upload a file to Cloudinary
 * @param {Buffer} fileBuffer - The file buffer
 * @param {string} folder - Cloudinary folder (e.g., 'profile-photos')
 * @returns {Promise<string>} The secure URL of the uploaded file
 */
export const uploadToCloudinary = (fileBuffer: Buffer, folder: string): Promise<string> => {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            {
                folder: folder,
                resource_type: 'auto',
            },
            (error, result) => {
                if (error) return reject(error);
                if (!result) return reject(new Error('Cloudinary upload failed: no result'));
                resolve(result.secure_url);
            }
        );

        Readable.from(fileBuffer).pipe(uploadStream);
    });
};

/**
 * Delete a file from Cloudinary
 * @param {string} publicId - The public ID or URL of the file
 */
export const deleteFromCloudinary = async (publicId: string) => {
    if (!publicId) return;
    try {
        // Extract publicId if a full URL is provided
        let id = publicId;
        if (publicId.startsWith('http')) {
            const parts = publicId.split('/');
            const lastPart = parts[parts.length - 1];
            id = lastPart.split('.')[0];
            // If it's in a folder, we need the folder name too
            const folderPart = parts[parts.length - 2];
            if (folderPart && !folderPart.includes('upload')) {
                id = `${folderPart}/${id}`;
            }
        }
        
        await cloudinary.uploader.destroy(id);
    } catch (err: any) {
        console.error('Cloudinary delete error:', err.message);
    }
};

export const uploadToS3 = uploadToCloudinary;
export const deleteFromS3 = deleteFromCloudinary;
export const getPresignedUrl = (url: string) => url;
