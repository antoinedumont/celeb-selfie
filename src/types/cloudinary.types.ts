/**
 * Cloudinary Service Type Definitions
 */

export interface CloudinaryUploadResult {
  success: boolean;
  publicUrl?: string;
  secureUrl?: string;
  publicId?: string;
  error?: string;
  statusCode?: number;
  rawError?: any;
}

export interface CloudinaryConfig {
  cloudName: string;
  uploadPreset: string;
}

export interface CloudinaryTransformOptions {
  width?: number;
  quality?: number;
  format?: 'jpg' | 'png' | 'webp';
}
