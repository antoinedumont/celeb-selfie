/**
 * Gallery Storage Service
 *
 * Manages localStorage persistence for the admin photo gallery.
 * Handles saving, loading, compression, and cleanup of gallery photos.
 * Also uploads to Cloudinary for permanent cloud storage.
 */

import type {
  GalleryPhoto,
  GalleryMetadata,
  GalleryStorageData,
  GalleryStats,
} from '../types/gallery.types';
import type { CompositeResult } from './composite/types';
import {
  GALLERY_STORAGE_KEY,
  MAX_PHOTOS,
  MAX_STORAGE_MB,
  STORAGE_WARNING_THRESHOLD,
  GALLERY_VERSION,
  THUMBNAIL_SIZE,
  IMAGE_COMPRESSION_QUALITY,
  AUTO_CLEANUP_ENABLED,
  CLEANUP_BATCH_SIZE,
} from '../constants/gallery';
import { uploadToCloudinary } from './cloudinary.service';

/**
 * Save a photo to the gallery
 * Saves to localStorage first, then uploads to Cloudinary in background
 */
export async function savePhoto(
  result: CompositeResult,
  metadata: GalleryMetadata
): Promise<void> {
  try {
    // Load existing gallery data
    const galleryData = loadGalleryData();

    // Check storage limits and cleanup if needed
    if (AUTO_CLEANUP_ENABLED && galleryData.photos.length >= MAX_PHOTOS) {
      console.warn(`[Gallery] Max photos (${MAX_PHOTOS}) reached. Cleaning up oldest photos.`);
      cleanupOldPhotos(galleryData, CLEANUP_BATCH_SIZE);
    }

    // Compress images for storage
    const compressedImage = await compressImage(result.imageUrl, IMAGE_COMPRESSION_QUALITY);
    const thumbnail = await generateThumbnail(result.imageUrl, THUMBNAIL_SIZE);

    // Generate unique photo ID
    const photoId = generatePhotoId();

    // Create gallery photo object
    const photo: GalleryPhoto = {
      id: photoId,
      imageUrl: compressedImage,
      thumbnailUrl: thumbnail,
      metadata,
      timestamp: Date.now(),
      size: estimateSize(compressedImage),
    };

    // Add to gallery
    galleryData.photos.push(photo);
    galleryData.lastUpdated = Date.now();

    // Save to localStorage first (instant access)
    saveGalleryData(galleryData);

    console.log(`[Gallery] Photo saved to localStorage. Total photos: ${galleryData.photos.length}`);

    // Upload to Cloudinary in background (don't block)
    uploadToCloudinaryAsync(result.imageUrl, photoId, metadata.celebrityName)
      .then((cloudinaryResult) => {
        if (cloudinaryResult.success && cloudinaryResult.secureUrl) {
          // Update metadata with Cloudinary URL
          const updatedGalleryData = loadGalleryData();
          const photoToUpdate = updatedGalleryData.photos.find((p) => p.id === photoId);
          if (photoToUpdate) {
            photoToUpdate.metadata.cloudinaryUrl = cloudinaryResult.secureUrl;
            photoToUpdate.metadata.cloudinaryPublicId = cloudinaryResult.publicId;
            saveGalleryData(updatedGalleryData);
            console.log(`[Gallery] Cloudinary URL added to photo ${photoId}`);
          }
        }
      })
      .catch((error) => {
        console.warn('[Gallery] Cloudinary upload failed (photo still saved locally):', error);
      });

    // Check storage usage and warn if high
    const storageSize = getStorageSize();
    if (storageSize > MAX_STORAGE_MB * STORAGE_WARNING_THRESHOLD) {
      console.warn(
        `[Gallery] Storage usage high: ${storageSize.toFixed(2)}MB / ${MAX_STORAGE_MB}MB`
      );
    }
  } catch (error) {
    console.error('[Gallery] Failed to save photo:', error);
    throw error;
  }
}

/**
 * Upload image to Cloudinary with error handling
 */
async function uploadToCloudinaryAsync(
  imageDataUrl: string,
  photoId: string,
  celebrityName: string
) {
  try {
    console.log('[Gallery] Uploading to Cloudinary...');
    const filename = `${photoId}_${celebrityName.replace(/\s+/g, '_')}`;
    const result = await uploadToCloudinary(imageDataUrl, filename);

    if (result.success) {
      console.log('[Gallery] Cloudinary upload successful:', result.secureUrl);
    } else {
      console.warn('[Gallery] Cloudinary upload failed:', result.error);
    }

    return result;
  } catch (error) {
    console.error('[Gallery] Cloudinary upload error:', error);
    throw error;
  }
}

/**
 * Get all photos from gallery
 */
export function getAllPhotos(): GalleryPhoto[] {
  const galleryData = loadGalleryData();
  return galleryData.photos;
}

/**
 * Get a single photo by ID
 */
export function getPhotoById(id: string): GalleryPhoto | null {
  const photos = getAllPhotos();
  return photos.find((photo) => photo.id === id) || null;
}

/**
 * Delete a photo from gallery
 */
export function deletePhoto(id: string): void {
  const galleryData = loadGalleryData();
  galleryData.photos = galleryData.photos.filter((photo) => photo.id !== id);
  galleryData.lastUpdated = Date.now();
  saveGalleryData(galleryData);
  console.log(`[Gallery] Photo ${id} deleted`);
}

/**
 * Clear all photos from gallery
 */
export function clearGallery(): void {
  const emptyData: GalleryStorageData = {
    photos: [],
    version: GALLERY_VERSION,
    lastUpdated: Date.now(),
  };
  saveGalleryData(emptyData);
  console.log('[Gallery] All photos cleared');
}

/**
 * Get storage size in MB
 */
export function getStorageSize(): number {
  const data = localStorage.getItem(GALLERY_STORAGE_KEY);
  if (!data) return 0;
  // Estimate: each character is ~2 bytes in UTF-16
  const bytes = data.length * 2;
  return bytes / (1024 * 1024);
}

/**
 * Get gallery statistics
 */
export function getGalleryStats(): GalleryStats {
  const photos = getAllPhotos();

  // Count photos by celebrity
  const celebrityCounts = new Map<string, number>();
  photos.forEach((photo) => {
    const name = photo.metadata.celebrityName;
    celebrityCounts.set(name, (celebrityCounts.get(name) || 0) + 1);
  });

  // Sort and get top celebrities
  const popularCelebrities = Array.from(celebrityCounts.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // Count by mode
  const go1Count = photos.filter((p) => p.metadata.generationMode === 'go1').length;
  const freestyleCount = photos.filter((p) => p.metadata.generationMode === 'freestyle').length;

  // Calculate average size
  const totalSize = photos.reduce((sum, photo) => sum + (photo.size || 0), 0);
  const averageSize = photos.length > 0 ? totalSize / photos.length : 0;

  return {
    totalPhotos: photos.length,
    popularCelebrities,
    modeBreakdown: {
      go1: go1Count,
      freestyle: freestyleCount,
    },
    averageSize,
    storageUsed: getStorageSize(),
  };
}

/**
 * Compress image for storage
 */
async function compressImage(dataUrl: string, quality: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }

      // Keep original dimensions but compress quality
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      try {
        const compressed = canvas.toDataURL('image/jpeg', quality);
        resolve(compressed);
      } catch (error) {
        reject(error);
      }
    };
    img.onerror = reject;
    img.src = dataUrl;
  });
}

/**
 * Generate thumbnail from image
 */
async function generateThumbnail(dataUrl: string, size: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }

      // Calculate dimensions maintaining aspect ratio
      let width = img.width;
      let height = img.height;
      if (width > height) {
        if (width > size) {
          height = (height * size) / width;
          width = size;
        }
      } else {
        if (height > size) {
          width = (width * size) / height;
          height = size;
        }
      }

      canvas.width = width;
      canvas.height = height;
      ctx.drawImage(img, 0, 0, width, height);

      try {
        const thumbnail = canvas.toDataURL('image/jpeg', 0.8);
        resolve(thumbnail);
      } catch (error) {
        reject(error);
      }
    };
    img.onerror = reject;
    img.src = dataUrl;
  });
}

/**
 * Estimate size of base64 string in bytes
 */
function estimateSize(dataUrl: string): number {
  // Base64 encoding increases size by ~33%
  // Remove data URL prefix
  const base64Data = dataUrl.split(',')[1] || dataUrl;
  return (base64Data.length * 3) / 4;
}

/**
 * Generate unique photo ID
 */
function generatePhotoId(): string {
  return `photo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Load gallery data from localStorage
 */
function loadGalleryData(): GalleryStorageData {
  try {
    const data = localStorage.getItem(GALLERY_STORAGE_KEY);
    if (!data) {
      return {
        photos: [],
        version: GALLERY_VERSION,
        lastUpdated: Date.now(),
      };
    }

    const parsed: GalleryStorageData = JSON.parse(data);

    // Handle version migrations if needed
    if (parsed.version !== GALLERY_VERSION) {
      console.warn('[Gallery] Version mismatch, using current version');
      parsed.version = GALLERY_VERSION;
    }

    return parsed;
  } catch (error) {
    console.error('[Gallery] Failed to load gallery data:', error);
    return {
      photos: [],
      version: GALLERY_VERSION,
      lastUpdated: Date.now(),
    };
  }
}

/**
 * Save gallery data to localStorage
 */
function saveGalleryData(data: GalleryStorageData): void {
  try {
    localStorage.setItem(GALLERY_STORAGE_KEY, JSON.stringify(data));
  } catch (error: any) {
    if (error.name === 'QuotaExceededError') {
      console.error('[Gallery] localStorage quota exceeded!');
      // Try emergency cleanup
      if (AUTO_CLEANUP_ENABLED) {
        cleanupOldPhotos(data, CLEANUP_BATCH_SIZE * 2);
        localStorage.setItem(GALLERY_STORAGE_KEY, JSON.stringify(data));
      }
    } else {
      throw error;
    }
  }
}

/**
 * Cleanup old photos
 */
function cleanupOldPhotos(data: GalleryStorageData, count: number): void {
  // Sort by timestamp and remove oldest
  data.photos.sort((a, b) => a.timestamp - b.timestamp);
  const removed = data.photos.splice(0, count);
  console.log(`[Gallery] Cleaned up ${removed.length} old photos`);
}
