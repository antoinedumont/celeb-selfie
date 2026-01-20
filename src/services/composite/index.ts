/**
 * Composite Service Factory
 *
 * Provides factory function to create composite services.
 * All models now use Replicate API for unified authentication.
 */

import { ReplicateNanoBananaService } from './replicateNanoBanana.service';
import { CompositeModel, type CompositeService, type CompositeResult, type CompositionConfig, type ProgressCallback } from './types';

/**
 * Create a composite service instance
 *
 * Uses Replicate API for Nano Banana Pro (Google Gemini).
 *
 * @param model - Which AI model to use (only NANO_BANANA_PRO supported)
 * @returns CompositeService instance
 */
export function createCompositeService(
  model: CompositeModel = CompositeModel.NANO_BANANA_PRO
): CompositeService {
  switch (model) {
    case CompositeModel.NANO_BANANA_PRO: {
      console.log('[Composite Service] Creating Nano Banana Pro service (via Replicate)');
      return new ReplicateNanoBananaService();
    }

    default:
      throw new Error(`Unsupported model: ${model}. Only NANO_BANANA_PRO is supported.`);
  }
}


/**
 * Compose celebrity selfie using Nano Banana Pro only
 *
 * @param userImageDataUrl - User's photo as data URL
 * @param celebrityImageUrl - Celebrity image URL
 * @param celebrityName - Name of celebrity
 * @param onProgress - Progress callback (0-100)
 * @param config - Optional configuration
 * @param backgroundImageUrl - Optional background scene image
 * @returns Single composite result from Nano Banana Pro
 */
export async function compositeWithNanoBanana(
  userImageDataUrl: string,
  celebrityImageUrl: string,
  celebrityName: string,
  onProgress?: ProgressCallback,
  config?: CompositionConfig,
  backgroundImageUrl?: string
): Promise<CompositeResult> {
  const startTime = Date.now();

  // Enable text-prompt mode by default to bypass safety policies
  const finalConfig: CompositionConfig = {
    ...config,
    useTextPromptMode: config?.useTextPromptMode ?? true,
  };

  console.log('[Nano Banana Composite] Starting celebrity selfie composition...');
  console.log('[Nano Banana Composite] Model: Nano Banana Pro (Google Gemini)');
  console.log(`[Nano Banana Composite] Mode: ${finalConfig.useTextPromptMode ? 'TEXT-PROMPT' : 'IMAGE-COMPOSITION'}`);

  // Create service
  const nanoBananaService = createCompositeService(CompositeModel.NANO_BANANA_PRO);

  try {
    // Compose with Nano Banana Pro
    const result = await nanoBananaService.compose(
      userImageDataUrl,
      celebrityImageUrl,
      celebrityName,
      onProgress,
      finalConfig,
      backgroundImageUrl
    );

    const totalTime = Date.now() - startTime;
    console.log(`[Nano Banana Composite] Completed in ${totalTime}ms`);
    console.log(`[Nano Banana Composite] Result: ${result.success ? '✅ SUCCESS' : '❌ FAILED'}`);

    return result;
  } catch (err: any) {
    const totalTime = Date.now() - startTime;
    console.error('[Nano Banana Composite] Composition failed:', err);

    return {
      model: CompositeModel.NANO_BANANA_PRO,
      imageUrl: '',
      processingTime: totalTime,
      cost: 0,
      success: false,
      error: err.message || 'Nano Banana Pro composition failed',
    };
  }
}

/**
 * Run both models in parallel and return both results
 *
 * @param userImageDataUrl - User's photo as data URL
 * @param celebrityImageUrl - Celebrity image URL
 * @param celebrityName - Name of celebrity
 * @param callbacks - Progress callbacks for each model
 * @param config - Optional configuration
 * @param backgroundImageUrl - Optional background scene image for three-image composition
 * @returns Both results (GPT-Image and Nano Banana Pro)
 */
export async function compositeWithBothModels(
  userImageDataUrl: string,
  celebrityImageUrl: string,
  celebrityName: string,
  callbacks?: DualProgressCallbacks,
  config?: CompositionConfig,
  backgroundImageUrl?: string
): Promise<DualCompositeResult> {
  const startTime = Date.now();

  // Enable text-prompt mode by default to bypass safety policies
  const finalConfig: CompositionConfig = {
    ...config,
    useTextPromptMode: config?.useTextPromptMode ?? true, // Default to true for celebrity selfies
  };

  console.log('[Dual Composite] Starting dual-model composition...');
  console.log('[Dual Composite] Models: GPT-Image 1.5 + Nano Banana Pro (Gemini)');
  console.log(`[Dual Composite] Mode: ${finalConfig.useTextPromptMode ? 'TEXT-PROMPT (bypassing safety policies)' : 'IMAGE-COMPOSITION (may be blocked)'}`);

  // Create both services
  const gptImageService = createCompositeService(CompositeModel.GPT_IMAGE);
  const nanoBananaService = createCompositeService(CompositeModel.NANO_BANANA_PRO);

  // Run both models in parallel with error handling
  // Both models should succeed in text-prompt mode
  const [gptImageResult, nanoBananaResult] = await Promise.all([
    gptImageService.compose(
      userImageDataUrl,
      celebrityImageUrl,
      celebrityName,
      callbacks?.onPhotoMakerProgress, // Reuse for GPT-Image
      finalConfig,
      backgroundImageUrl
    ).catch((err) => {
      console.error('[Dual Composite] GPT-Image failed:', err);
      return {
        model: CompositeModel.GPT_IMAGE,
        imageUrl: '',
        processingTime: 0,
        cost: 0,
        success: false,
        error: err.message || 'GPT-Image composition failed',
      } as CompositeResult;
    }),
    nanoBananaService.compose(
      userImageDataUrl,
      celebrityImageUrl,
      celebrityName,
      callbacks?.onNanoBananaProgress,
      finalConfig,
      backgroundImageUrl
    ).catch((err) => {
      console.error('[Dual Composite] Nano Banana Pro failed:', err);
      return {
        model: CompositeModel.NANO_BANANA_PRO,
        imageUrl: '',
        processingTime: 0,
        cost: 0,
        success: false,
        error: err.message || 'Nano Banana Pro composition failed',
      } as CompositeResult;
    }),
  ]);

  const totalTime = Date.now() - startTime;

  console.log(`[Dual Composite] Both models completed in ${totalTime}ms`);
  console.log(`[Dual Composite] GPT-Image: ${gptImageResult.success ? '✅ SUCCESS' : '❌ FAILED'}`);
  console.log(`[Dual Composite] Nano Banana Pro: ${nanoBananaResult.success ? '✅ SUCCESS' : '❌ FAILED'}`);

  // At least one model should succeed
  const atLeastOneSuccess = gptImageResult.success || nanoBananaResult.success;
  console.log(`[Dual Composite] Result: ${atLeastOneSuccess ? '✅ At least one model succeeded' : '❌ Both models failed'}`);

  return {
    nanoBanana: nanoBananaResult,
    photoMaker: gptImageResult, // Use GPT-Image result in photoMaker field for backward compatibility
    totalTime,
  };
}

// Re-export types for convenience
export * from './types';

// Re-export Replicate services
export { ReplicateNanoBananaService } from './replicateNanoBanana.service';
