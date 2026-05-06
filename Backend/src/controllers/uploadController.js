const cloudinary = require('../config/cloudinary');
const ApiResponse = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

/**
 * Check if Cloudinary is properly configured
 */
const isCloudinaryConfigured = () => {
  const name = process.env.CLOUDINARY_CLOUD_NAME;
  const key = process.env.CLOUDINARY_API_KEY;
  const secret = process.env.CLOUDINARY_API_SECRET;
  return name && key && secret &&
    name !== 'your_cloud_name' &&
    key !== 'your_api_key' &&
    secret !== 'your_api_secret';
};

/**
 * @route   POST /api/upload/image
 * @desc    Upload cover image to Cloudinary
 * @access  Auth
 */
const uploadImage = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new ApiError(400, 'No image file provided');
  }

  if (!isCloudinaryConfigured()) {
    // Placeholder for when Cloudinary is not set up
    return ApiResponse.success(res, {
      url: `https://picsum.photos/seed/${Date.now()}/1200/630`,
      publicId: null,
      width: 1200,
      height: 630,
    }, 'Image uploaded (placeholder — Cloudinary not configured)');
  }

  const uploadResult = await new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: 'blog-platform/covers',
        transformation: [
          { width: 1200, height: 630, crop: 'fill', gravity: 'auto' },
          { quality: 'auto', fetch_format: 'auto' },
        ],
        resource_type: 'image',
      },
      (error, result) => {
        if (error) reject(new ApiError(500, 'Image upload failed: ' + error.message));
        else resolve(result);
      }
    );
    uploadStream.end(req.file.buffer);
  });

  ApiResponse.success(res, {
    url: uploadResult.secure_url,
    publicId: uploadResult.public_id,
    width: uploadResult.width,
    height: uploadResult.height,
  }, 'Image uploaded successfully');
});

/**
 * @route   POST /api/upload/avatar
 * @desc    Upload user avatar to Cloudinary
 * @access  Auth
 */
const uploadAvatar = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new ApiError(400, 'No image file provided');
  }

  if (!isCloudinaryConfigured()) {
    return ApiResponse.success(res, {
      url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${req.user._id}`,
      publicId: null,
    }, 'Avatar uploaded (placeholder — Cloudinary not configured)');
  }

  const uploadResult = await new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: 'blog-platform/avatars',
        transformation: [
          { width: 200, height: 200, crop: 'fill', gravity: 'face' },
          { quality: 'auto', fetch_format: 'auto' },
        ],
        resource_type: 'image',
      },
      (error, result) => {
        if (error) reject(new ApiError(500, 'Avatar upload failed: ' + error.message));
        else resolve(result);
      }
    );
    uploadStream.end(req.file.buffer);
  });

  ApiResponse.success(res, {
    url: uploadResult.secure_url,
    publicId: uploadResult.public_id,
  }, 'Avatar uploaded successfully');
});

module.exports = { uploadImage, uploadAvatar };
