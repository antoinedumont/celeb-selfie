/**
 * Gallery Export Utilities
 *
 * Utilities for exporting gallery photos as ZIP or JSON.
 */

import JSZip from 'jszip';
import type { GalleryPhoto } from '../types/gallery.types';
import { ZIP_FILENAME_PREFIX, JSON_FILENAME_PREFIX } from '../constants/gallery';

/**
 * Export photos as a ZIP file
 */
export async function exportPhotosAsZip(photos: GalleryPhoto[]): Promise<void> {
  try {
    const zip = new JSZip();

    // Add each photo to the zip
    for (let i = 0; i < photos.length; i++) {
      const photo = photos[i];
      const base64Data = photo.imageUrl.split(',')[1];

      // Create filename: celebrity-name_timestamp.jpg
      const filename = `${sanitizeFilename(photo.metadata.celebrityName)}_${photo.timestamp}.jpg`;

      zip.file(filename, base64Data, { base64: true });
    }

    // Generate the zip file
    const content = await zip.generateAsync({ type: 'blob' });

    // Download the zip file
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `${ZIP_FILENAME_PREFIX}_${timestamp}.zip`;
    downloadBlob(content, filename);

    console.log(`[Gallery Export] Exported ${photos.length} photos as ZIP`);
  } catch (error) {
    console.error('[Gallery Export] Failed to export as ZIP:', error);
    throw error;
  }
}

/**
 * Export metadata as JSON
 */
export function exportMetadataAsJSON(photos: GalleryPhoto[]): void {
  try {
    const metadata = photos.map((photo) => ({
      id: photo.id,
      celebrityName: photo.metadata.celebrityName,
      generationMode: photo.metadata.generationMode,
      timestamp: photo.timestamp,
      date: new Date(photo.timestamp).toISOString(),
      size: photo.size,
    }));

    const jsonString = JSON.stringify(metadata, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });

    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `${JSON_FILENAME_PREFIX}_${timestamp}.json`;

    downloadBlob(blob, filename);

    console.log(`[Gallery Export] Exported metadata for ${photos.length} photos as JSON`);
  } catch (error) {
    console.error('[Gallery Export] Failed to export as JSON:', error);
    throw error;
  }
}

/**
 * Download a single photo
 */
export function downloadPhoto(photo: GalleryPhoto): void {
  const link = document.createElement('a');
  link.href = photo.imageUrl;
  link.download = `${sanitizeFilename(photo.metadata.celebrityName)}_${photo.timestamp}.jpg`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  console.log(`[Gallery Export] Downloaded photo ${photo.id}`);
}

/**
 * Download all photos individually (triggers multiple downloads)
 */
export function downloadAllPhotos(photos: GalleryPhoto[]): void {
  console.log(`[Gallery Export] Downloading ${photos.length} photos individually...`);
  photos.forEach((photo, index) => {
    // Stagger downloads to avoid browser blocking
    setTimeout(() => downloadPhoto(photo), index * 100);
  });
}

/**
 * Helper: Download a blob as a file
 */
function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Helper: Sanitize filename for safe download
 */
function sanitizeFilename(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}
