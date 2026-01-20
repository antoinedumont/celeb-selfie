// Image utility functions

/**
 * Converts a Blob to a data URL (base64 encoded string)
 */
export const blobToDataUrl = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to convert blob to data URL'));
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

/**
 * Validates an image blob for size and type
 */
export const validateImage = (blob: Blob): { valid: boolean; error?: string } => {
  const MAX_SIZE_MB = 10;
  const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;
  const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

  if (blob.size > MAX_SIZE_BYTES) {
    return {
      valid: false,
      error: `Image size must be less than ${MAX_SIZE_MB}MB`,
    };
  }

  if (!ALLOWED_TYPES.includes(blob.type)) {
    return {
      valid: false,
      error: 'Image must be in JPEG, PNG, or WebP format',
    };
  }

  return { valid: true };
};

/**
 * Downloads an image from a URL
 */
export const downloadImage = (url: string, filename: string): void => {
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Creates a timestamp-based filename
 */
export const generateFilename = (prefix: string = 'booth-photo'): string => {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  return `${prefix}-${timestamp}.png`;
};

/**
 * Converts a data URL to a blob
 */
export const dataUrlToBlob = async (dataUrl: string): Promise<Blob> => {
  const response = await fetch(dataUrl);
  return response.blob();
};

/**
 * Validates if a string is a valid HTTP/HTTPS URL
 */
export const isValidHttpUrl = (url: string): boolean => {
  try {
    const parsedUrl = new URL(url);
    return parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:';
  } catch {
    return false;
  }
};

/**
 * Validates if a URL points to an image
 */
export const validateImageUrl = (url: string): boolean => {
  if (!isValidHttpUrl(url)) return false;

  // Check if URL ends with common image extensions
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
  const lowerUrl = url.toLowerCase();

  return imageExtensions.some(ext => lowerUrl.includes(ext));
};

/**
 * Fetches an image from URL and converts to data URL (bypasses CORS for API calls)
 */
export const fetchAndConvertImageUrl = async (url: string): Promise<{ success: boolean; dataUrl?: string; error?: string }> => {
  try {
    // Validate URL format
    if (!isValidHttpUrl(url)) {
      return { success: false, error: 'URL invalide - utilisez une URL HTTP ou HTTPS' };
    }

    console.log('[Image Utils] Fetching image from URL:', url);

    // Fetch the image
    const response = await fetch(url);

    if (!response.ok) {
      return { success: false, error: `Échec du chargement: ${response.status} ${response.statusText}` };
    }

    // Convert to blob
    const blob = await response.blob();

    // Validate it's an image
    if (!blob.type.startsWith('image/')) {
      return { success: false, error: 'Le fichier n\'est pas une image valide' };
    }

    // Convert blob to data URL
    const dataUrl = await blobToDataUrl(blob);

    console.log('[Image Utils] Successfully converted image to data URL');
    return { success: true, dataUrl };

  } catch (error: any) {
    console.error('[Image Utils] Failed to fetch image:', error);

    // Handle CORS errors
    if (error.message?.includes('CORS') || error.name === 'TypeError') {
      return {
        success: false,
        error: 'Image bloquée par CORS - essayez une image depuis Wikimedia Commons ou un CDN public'
      };
    }

    return {
      success: false,
      error: error.message || 'Impossible de charger l\'image'
    };
  }
};

/**
 * Compresses an image data URL to reduce file size
 * @param dataUrl - Original data URL
 * @param maxWidth - Maximum width in pixels
 * @param quality - JPEG quality (0-1)
 * @returns Compressed data URL
 */
export const compressImageDataUrl = async (
  dataUrl: string,
  maxWidth: number = 2048,
  quality: number = 0.85
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }

      // Calculate new dimensions
      let width = img.width;
      let height = img.height;

      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }

      canvas.width = width;
      canvas.height = height;

      // Draw and compress
      ctx.drawImage(img, 0, 0, width, height);

      try {
        const compressed = canvas.toDataURL('image/jpeg', quality);
        resolve(compressed);
      } catch (error) {
        reject(error);
      }
    };
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = dataUrl;
  });
};

/**
 * Loads the Go1 booth template image and converts it to data URL
 *
 * This image is used as a visual reference for AI models to ensure accurate booth composition.
 * The booth template provides:
 * - Exact booth layout and colors
 * - Go1 branding placement
 * - Background spatial reference
 *
 * @returns Promise<string> Data URL of the booth template image
 * @throws Error if the booth template fails to load
 */
export const loadBoothTemplateImage = async (): Promise<string> => {
  try {
    console.log('[Image Utils] Loading Go1 booth template...');

    const response = await fetch('/assets/Go1-booth-template.jpeg');

    if (!response.ok) {
      throw new Error(`Failed to load booth template: ${response.status}`);
    }

    const blob = await response.blob();
    const dataUrl = await blobToDataUrl(blob);

    console.log('[Image Utils] Go1 booth template loaded successfully');
    return dataUrl;
  } catch (error) {
    console.error('[Image Utils] Failed to load booth template:', error);
    throw new Error('Failed to load Go1 booth template image');
  }
};
