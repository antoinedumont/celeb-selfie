/**
 * Cloudinary Upload Service
 *
 * Handles image uploads to Cloudinary for cloud storage and sharing.
 * Images are stored permanently with optional transformations.
 */

import { compressImageDataUrl } from '../utils/image.utils';
import type { CloudinaryUploadResult, CloudinaryTransformOptions } from '../types/cloudinary.types';

const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

/**
 * Uploads a base64 data URL to Cloudinary
 * @param dataUrl - Base64 encoded image data URL
 * @param filename - Optional filename (default: auto-generated)
 * @returns Public URL and upload metadata
 */
export async function uploadToCloudinary(
  dataUrl: string,
  filename?: string
): Promise<CloudinaryUploadResult> {
  try {
    // Validate environment variables
    if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_UPLOAD_PRESET) {
      console.error('[Cloudinary] Missing configuration');
      return {
        success: false,
        error: 'Cloudinary not configured. Please add VITE_CLOUDINARY_CLOUD_NAME and VITE_CLOUDINARY_UPLOAD_PRESET to .env',
      };
    }

    console.log('[Cloudinary] Starting upload...');
    console.log('[Cloudinary] Compressing image before upload...');

    // Compress image to reduce size and prevent 413 errors
    const compressedDataUrl = await compressImageDataUrl(dataUrl, 2048, 0.85);

    // Prepare form data
    const formData = new FormData();
    formData.append('file', compressedDataUrl);
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

    if (filename) {
      formData.append('public_id', `celeb-selfie/${filename}`);
    }

    // Add metadata
    formData.append('tags', 'celeb-selfie,ai-selfie,freestyle');
    formData.append('context', `generated=${new Date().toISOString()}`);

    // Upload to Cloudinary
    const uploadUrl = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;

    const response = await fetch(uploadUrl, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('[Cloudinary] Upload failed:', errorData);

      // Categorize error for better user feedback
      let errorMessage = errorData.error?.message || 'Upload failed';

      if (response.status === 400) {
        errorMessage = 'Invalid image format or data. Please try again.';
      } else if (response.status === 413) {
        errorMessage = 'Image too large. Please compress and retry.';
      } else if (response.status === 429) {
        errorMessage = 'Too many uploads. Please wait a moment and retry.';
      } else if (response.status === 503) {
        errorMessage = 'Cloudinary service temporarily unavailable. Using fallback.';
      }

      return {
        success: false,
        error: errorMessage,
        statusCode: response.status,
        rawError: errorData,
      };
    }

    const data = await response.json();
    console.log('[Cloudinary] Upload successful:', data.secure_url);

    return {
      success: true,
      publicUrl: data.url,
      secureUrl: data.secure_url,
      publicId: data.public_id,
    };
  } catch (error) {
    console.error('[Cloudinary] Upload error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Generates a shareable URL with optional transformations
 * @param publicId - Cloudinary public ID
 * @param options - Transformation options
 */
export function generateShareableUrl(
  publicId: string,
  options?: CloudinaryTransformOptions
): string {
  const { width, quality = 90, format = 'jpg' } = options || {};

  let transformations = `q_${quality},f_${format}`;
  if (width) {
    transformations += `,w_${width},c_limit`;
  }

  return `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload/${transformations}/${publicId}`;
}

/**
 * Extracts public_id from Cloudinary URL
 */
export function getPublicIdFromUrl(url: string): string | null {
  try {
    // Extract public_id from Cloudinary URL
    // Format: https://res.cloudinary.com/{cloud_name}/image/upload/{transformations}/{public_id}.{format}
    const urlParts = url.split('/');
    const uploadIndex = urlParts.findIndex(part => part === 'upload');

    if (uploadIndex === -1 || uploadIndex >= urlParts.length - 1) {
      return null;
    }

    // Get everything after 'upload' and before the file extension
    const publicIdWithFormat = urlParts.slice(uploadIndex + 1).join('/');
    const publicId = publicIdWithFormat.replace(/\.[^.]+$/, ''); // Remove extension

    return publicId;
  } catch (error) {
    console.error('[Cloudinary] Failed to extract public_id:', error);
    return null;
  }
}
