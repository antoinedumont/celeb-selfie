/**
 * Watermark utility functions for adding Go1 logo to images
 */

export interface WatermarkOptions {
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left' | 'center';
  opacity?: number; // 0-1
  scale?: number; // 0-1, percentage of image width
  padding?: number; // pixels from edge
}

const DEFAULT_OPTIONS: Required<WatermarkOptions> = {
  position: 'bottom-right',
  opacity: 0.9,
  scale: 0.15, // Logo will be 15% of image width
  padding: 20,
};

/**
 * Loads an image from a URL
 */
const loadImage = (url: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
};

/**
 * Adds Go1 logo watermark to an image
 * @param imageUrl - URL of the image to watermark
 * @param options - Watermark positioning and styling options
 * @returns Promise resolving to watermarked image as data URL
 */
export const addGo1Watermark = async (
  imageUrl: string,
  options: WatermarkOptions = {}
): Promise<string> => {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  // Load the main image and logo
  const [mainImage, logoImage] = await Promise.all([
    loadImage(imageUrl),
    loadImage('/assets/go1-logo.svg'),
  ]);

  // Create canvas with main image dimensions
  const canvas = document.createElement('canvas');
  canvas.width = mainImage.width;
  canvas.height = mainImage.height;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Failed to get canvas context');
  }

  // Draw main image
  ctx.drawImage(mainImage, 0, 0);

  // Calculate logo dimensions (scale relative to image width)
  const logoWidth = canvas.width * opts.scale;
  const logoHeight = (logoImage.height / logoImage.width) * logoWidth;

  // Calculate logo position
  let x: number;
  let y: number;

  switch (opts.position) {
    case 'bottom-right':
      x = canvas.width - logoWidth - opts.padding;
      y = canvas.height - logoHeight - opts.padding;
      break;
    case 'bottom-left':
      x = opts.padding;
      y = canvas.height - logoHeight - opts.padding;
      break;
    case 'top-right':
      x = canvas.width - logoWidth - opts.padding;
      y = opts.padding;
      break;
    case 'top-left':
      x = opts.padding;
      y = opts.padding;
      break;
    case 'center':
      x = (canvas.width - logoWidth) / 2;
      y = (canvas.height - logoHeight) / 2;
      break;
    default:
      x = canvas.width - logoWidth - opts.padding;
      y = canvas.height - logoHeight - opts.padding;
  }

  // Draw logo with opacity
  ctx.globalAlpha = opts.opacity;
  ctx.drawImage(logoImage, x, y, logoWidth, logoHeight);
  ctx.globalAlpha = 1.0; // Reset opacity

  // Convert to data URL
  return canvas.toDataURL('image/png', 0.95);
};

/**
 * Adds Go1 watermark and returns as Blob (for downloading)
 */
export const addGo1WatermarkBlob = async (
  imageUrl: string,
  options: WatermarkOptions = {}
): Promise<Blob> => {
  const dataUrl = await addGo1Watermark(imageUrl, options);
  const response = await fetch(dataUrl);
  return response.blob();
};

/**
 * Downloads an image with Go1 watermark
 */
export const downloadWithWatermark = async (
  imageUrl: string,
  filename: string,
  options: WatermarkOptions = {}
): Promise<void> => {
  const watermarkedDataUrl = await addGo1Watermark(imageUrl, options);

  const link = document.createElement('a');
  link.href = watermarkedDataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
