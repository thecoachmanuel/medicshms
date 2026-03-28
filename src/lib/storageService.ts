import cloudinary from './cloudinary';

/**
 * Upload a file to Cloudinary
 * @param {string} fileStr - base64 encoded file string
 * @param {string} folder - folder name in Cloudinary
 * @returns {Promise<object>} upload result
 */
export const uploadFile = async (fileStr: string, folder: string = 'hms') => {
  try {
    const uploadResponse = await cloudinary.uploader.upload(fileStr, {
      folder: folder,
      resource_type: 'auto',
    });
    return uploadResponse;
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw error;
  }
};

/**
 * Delete a file from Cloudinary
 * @param {string} publicId - public ID of the file
 * @returns {Promise<object>} delete result
 */
export const deleteFile = async (publicId: string) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (error) {
    console.error('Cloudinary delete error:', error);
    throw error;
  }
};

/**
 * Get a URL for a file
 * (Cloudinary URLs are public by default if configured so)
 */
export const getFileUrl = (publicId: string) => {
  return cloudinary.url(publicId, {
    secure: true,
  });
};
