/**
 * Composite Service Factory
 *
 * Provides factory function to create composite services.
 * Uses Google Direct API for Nano Banana Pro image generation.
 */

import { GoogleDirectNanoBananaService } from './googleDirectNanoBanana.service';
import { CompositeModel, type CompositeService, type CompositeResult, type CompositionConfig, type ProgressCallback } from './types';

/**
 * Create a composite service instance
 *
 * @param model - Which AI model to use (defaults to GOOGLE_DIRECT)
 * @returns CompositeService instance
 */
export function createCompositeService(
  model: CompositeModel = CompositeModel.GOOGLE_DIRECT
): CompositeService {
  switch (model) {
    case CompositeModel.GOOGLE_DIRECT: {
      console.log('[Composite Service] Creating Google Direct Nano Banana Pro service');
      return new GoogleDirectNanoBananaService();
    }

    default:
      throw new Error(`Unsupported model: ${model}. Supported model: GOOGLE_DIRECT`);
  }
}

/**
 * Compose celebrity selfie using Google Direct API
 *
 * @param userImageDataUrl - User's photo as data URL
 * @param celebrityImageUrl - Celebrity image URL
 * @param celebrityName - Name of celebrity
 * @param onProgress - Progress callback (0-100)
 * @param config - Optional configuration
 * @param backgroundImageUrl - Optional background scene image
 * @returns Single composite result from Google Direct API
 */
export async function compositeWithGoogleDirect(
  userImageDataUrl: string,
  celebrityImageUrl: string,
  celebrityName: string,
  onProgress?: ProgressCallback,
  config?: CompositionConfig,
  backgroundImageUrl?: string
): Promise<CompositeResult> {
  const startTime = Date.now();

  console.log('[Google Direct Composite] Starting celebrity selfie composition...');
  console.log('[Google Direct Composite] Model: Nano Banana Pro (Google Direct API)');

  // Create service
  const googleDirectService = createCompositeService(CompositeModel.GOOGLE_DIRECT);

  try {
    // Compose with Google Direct
    const result = await googleDirectService.compose(
      userImageDataUrl,
      celebrityImageUrl,
      celebrityName,
      onProgress,
      config,
      backgroundImageUrl
    );

    const totalTime = Date.now() - startTime;
    console.log(`[Google Direct Composite] Completed in ${totalTime}ms`);
    console.log(`[Google Direct Composite] Result: ${result.success ? '✅ SUCCESS' : '❌ FAILED'}`);

    return result;
  } catch (err: any) {
    const totalTime = Date.now() - startTime;
    console.error('[Google Direct Composite] Composition failed:', err);

    return {
      model: CompositeModel.GOOGLE_DIRECT,
      imageUrl: '',
      processingTime: totalTime,
      cost: 0,
      success: false,
      error: err.message || 'Google Direct API composition failed',
    };
  }
}

// Re-export types for convenience
export * from './types';

// Re-export service
export { GoogleDirectNanoBananaService } from './googleDirectNanoBanana.service';
