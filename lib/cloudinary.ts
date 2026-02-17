import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

// Upload image
export const uploadImage = async (
  file: string, 
  folder: string = 'rent-a-companion',
  options: any = {}
): Promise<{ url: string; publicId: string }> => {
  try {
    const result = await cloudinary.uploader.upload(file, {
      folder,
      resource_type: 'auto',
      transformation: [
        { quality: 'auto:good' },
        { fetch_format: 'auto' },
      ],
      ...options,
    });

    return {
      url: result.secure_url,
      publicId: result.public_id,
    };
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw new Error('Failed to upload image');
  }
};

// Upload multiple images
export const uploadMultipleImages = async (
  files: string[],
  folder: string = 'rent-a-companion'
): Promise<{ url: string; publicId: string }[]> => {
  try {
    const uploadPromises = files.map(file => uploadImage(file, folder));
    const results = await Promise.all(uploadPromises);
    return results;
  } catch (error) {
    console.error('Cloudinary multiple upload error:', error);
    throw new Error('Failed to upload images');
  }
};

// Delete image
export const deleteImage = async (publicId: string): Promise<void> => {
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error('Cloudinary delete error:', error);
    throw new Error('Failed to delete image');
  }
};

// Delete multiple images
export const deleteMultipleImages = async (publicIds: string[]): Promise<void> => {
  try {
    const deletePromises = publicIds.map(id => deleteImage(id));
    await Promise.all(deletePromises);
  } catch (error) {
    console.error('Cloudinary multiple delete error:', error);
    throw new Error('Failed to delete images');
  }
};

// Generate optimized URL
export const getOptimizedUrl = (publicId: string, options: any = {}): string => {
  return cloudinary.url(publicId, {
    quality: 'auto',
    fetch_format: 'auto',
    ...options,
  });
};

// Generate thumbnail
export const getThumbnailUrl = (publicId: string, width: number = 300, height: number = 300): string => {
  return cloudinary.url(publicId, {
    width,
    height,
    crop: 'fill',
    gravity: 'face',
    quality: 'auto',
    fetch_format: 'auto',
  });
};

// Upload video
export const uploadVideo = async (
  file: string,
  folder: string = 'rent-a-companion/videos'
): Promise<{ url: string; publicId: string; duration: number }> => {
  try {
    const result = await cloudinary.uploader.upload(file, {
      folder,
      resource_type: 'video',
      eager: [
        { format: 'mp4', video_codec: 'h264' },
        { format: 'webm', video_codec: 'vp9' },
      ],
      eager_async: true,
    });

    return {
      url: result.secure_url,
      publicId: result.public_id,
      duration: result.duration,
    };
  } catch (error) {
    console.error('Cloudinary video upload error:', error);
    throw new Error('Failed to upload video');
  }
};

// Get video thumbnail
export const getVideoThumbnail = (publicId: string, options: any = {}): string => {
  return cloudinary.url(publicId, {
    resource_type: 'video',
    format: 'jpg',
    transformation: [
      { width: 640, height: 480, crop: 'fill' },
      { start_offset: 'auto' },
    ],
    ...options,
  });
};

export default cloudinary;
