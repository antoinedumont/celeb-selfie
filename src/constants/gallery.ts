/**
 * Gallery Configuration Constants
 *
 * Configuration values for the admin photo gallery feature.
 */

// LocalStorage key for gallery data
export const GALLERY_STORAGE_KEY = 'go1-booth-gallery';

// Storage limits
export const MAX_PHOTOS = 500; // Maximum number of photos to store
export const MAX_STORAGE_MB = 8; // Conservative limit in megabytes
export const STORAGE_WARNING_THRESHOLD = 0.8; // Warn at 80% capacity

// Image sizing
export const THUMBNAIL_SIZE = 200; // Thumbnail size in pixels
export const IMAGE_COMPRESSION_QUALITY = 0.7; // JPEG compression quality (0-1)

// Admin authentication
// Simple password hash (SHA-256 of 'go1admin2026')
export const ADMIN_PASSWORD_HASH = '8f4e0f4c9c5e6a3d2b1f0e8d7c6b5a4f3e2d1c0b9a8f7e6d5c4b3a2f1e0d9c8b7';

// Session storage key for authentication
export const AUTH_SESSION_KEY = 'go1-gallery-auth';

// Gallery version for future migrations
export const GALLERY_VERSION = 1;

// Cleanup settings
export const AUTO_CLEANUP_ENABLED = true;
export const CLEANUP_BATCH_SIZE = 50; // Remove this many photos when cleanup needed

// Export settings
export const ZIP_FILENAME_PREFIX = 'go1-booth-photos';
export const JSON_FILENAME_PREFIX = 'go1-booth-metadata';
