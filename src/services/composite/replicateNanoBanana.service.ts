/**
 * Replicate Nano Banana Pro Service
 *
 * Implements Google's Nano Banana Pro (Gemini) via Replicate API.
 * Model: google/nano-banana-pro
 *
 * Features:
 * - Text-prompt based celebrity selfie generation
 * - Multi-image reference input support (user selfie + booth template)
 * - High-resolution output (up to 4K)
 * - Unified Replicate authentication
 *
 * Cost: $0.15 per image (Replicate pricing)
 * Processing time: 30-60 seconds (with Prefer: wait)
 */

import {
  CompositeModel,
  type CompositeService,
  type CompositeResult,
  type CompositionConfig,
  type ProgressCallback,
} from './types';
import { buildCelebritySelfiePrompt, buildFreestyleSelfiePrompt } from './promptBuilder';
import {
  submitPrediction,
  fetchImageAsDataUrl,
  extractImageUrl,
} from './replicate.utils';
import { loadBoothTemplateImage } from '../../utils/image.utils';
import { retryWithBackoff, RetryPresets } from './retry.utils';

// Model identifier on Replicate
const MODEL_PATH = 'google/nano-banana-pro';

// Cost per image (Replicate pricing)
const COST_PER_IMAGE = 0.15;

export class ReplicateNanoBananaService implements CompositeService {
  // Cached booth template image (loaded once, reused for all compositions)
  private boothTemplateDataUrl: string | null = null;

  /**
   * Compose a celebrity selfie using Nano Banana Pro via Replicate
   *
   * Uses multi-image composition:
   * - Image 1: User's selfie (preserves their appearance)
   * - Image 2: Go1 booth template (provides accurate background reference)
   */
  async compose(
    userImageDataUrl: string,
    celebrityImageUrl: string,
    celebrityName: string,
    onProgress?: ProgressCallback,
    config?: CompositionConfig,
    backgroundImageUrl?: string
  ): Promise<CompositeResult> {
    const startTime = Date.now();

    // Determine generation mode (default to 'go1' for backward compatibility)
    const mode = config?.generationMode || 'go1';
    const shouldIncludeBooth = mode === 'go1';

    console.log('[Nano Banana Pro - Replicate] Starting composition...');
    console.log(`[Nano Banana Pro - Replicate] Celebrity: ${celebrityName}`);
    console.log(`[Nano Banana Pro - Replicate] Generation mode: ${mode.toUpperCase()}`);
    console.log(`[Nano Banana Pro - Replicate] Cost: $${COST_PER_IMAGE.toFixed(3)}`);

    try {
      onProgress?.(5);

      // Only load booth template for Go1 mode (or undefined for backward compatibility)
      if (shouldIncludeBooth && !this.boothTemplateDataUrl) {
        console.log('[Nano Banana Pro - Replicate] Loading booth template for Go1 mode...');
        this.boothTemplateDataUrl = await loadBoothTemplateImage();
      }

      // Generate prompt based on mode
      let promptData: any;
      let promptForApi: string;
      let displayPrompt: string;

      if (mode === 'freestyle') {
        // Freestyle mode: use Gemini 3 for AI-powered prompts
        promptData = await buildFreestyleSelfiePrompt(celebrityName);

        // Always use natural language string for API (Replicate only accepts strings)
        promptForApi = promptData.naturalLanguage;
        displayPrompt = promptData.naturalLanguage;

        // Log details if Gemini 3 generated the prompt
        if (promptData.jsonTemplate) {
          console.log('[Nano Banana Pro - Replicate] Using Gemini 3-generated prompt');
          console.log('[Nano Banana Pro - Replicate] Celebrity role:', promptData.jsonTemplate.scene_description.celebrity.role_context);
          console.log('[Nano Banana Pro - Replicate] Setting:', promptData.jsonTemplate.scene_description.environment.setting_name);
        } else {
          console.log('[Nano Banana Pro - Replicate] Using static text prompt (Gemini 3 unavailable)');
        }
      } else {
        // Go1 mode: use traditional static prompt
        promptForApi = buildCelebritySelfiePrompt(celebrityName, config);
        displayPrompt = promptForApi as string;
        console.log('[Nano Banana Pro - Replicate] Using Go1 static prompt');
      }

      console.log(`[Nano Banana Pro - Replicate] Display prompt preview: ${displayPrompt.substring(0, 150)}...`);

      onProgress?.(10);

      // Prepare input for Replicate API
      // Nano Banana Pro supports image_input for reference images
      const input: Record<string, any> = {
        prompt: promptForApi,
        aspect_ratio: '2:3', // Portrait format for realistic selfies
        resolution: this.mapResolution(config?.resolution || '2K'),
        output_format: 'png',
      };

      // Add reference images based on mode
      if (userImageDataUrl) {
        if (shouldIncludeBooth && this.boothTemplateDataUrl) {
          // Go1 mode: user selfie + booth template (2 images)
          input.image_input = [userImageDataUrl, this.boothTemplateDataUrl];
          console.log('[Nano Banana Pro - Replicate] Including user photo + booth template (2 images) - Go1 mode');
        } else {
          // Freestyle mode: user selfie only (1 image)
          input.image_input = [userImageDataUrl];
          console.log('[Nano Banana Pro - Replicate] Including user photo only (1 image) - Freestyle mode');
        }
      }

      onProgress?.(15);

      // Submit prediction to Replicate with retry logic
      console.log('[Nano Banana Pro - Replicate] Submitting to Replicate API with retry protection...');
      const replicateStartTime = Date.now();

      const prediction = await retryWithBackoff(
        async () => {
          console.log('[Nano Banana Pro - Replicate] Attempting Replicate API call...');
          return await submitPrediction(
            MODEL_PATH,
            input,
            (p) => {
              // Map progress from submitPrediction (10-90) to our range (15-85)
              onProgress?.(15 + (p / 100) * 70);
            }
          );
        },
        {
          ...RetryPresets.standard, // 2 retries with exponential backoff
          onRetry: (attempt, error, delayMs) => {
            console.log(`[Nano Banana Pro - Replicate] 🔄 Retry attempt ${attempt} after ${(delayMs / 1000).toFixed(1)}s delay`);
            console.log(`[Nano Banana Pro - Replicate] Previous error: ${error.message}`);
            onProgress?.(15); // Reset progress for retry attempt
          },
        }
      );

      const replicateTotalTime = Date.now() - replicateStartTime;
      console.log(`[Nano Banana Pro - Replicate] ⏱️  Replicate API completed in ${replicateTotalTime}ms`);

      onProgress?.(85);

      // Extract image URL from output
      const imageUrl = extractImageUrl(prediction.output);
      console.log(`[Nano Banana Pro - Replicate] Image URL received: ${imageUrl}`);

      onProgress?.(90);

      // Fetch image and convert to data URL
      console.log('[Nano Banana Pro - Replicate] Fetching and converting image...');
      const imageDataUrl = await fetchImageAsDataUrl(imageUrl);

      const processingTime = Date.now() - startTime;
      onProgress?.(100);

      console.log(`[Nano Banana Pro - Replicate] ✅ Composition completed in ${processingTime}ms`);

      return {
        model: CompositeModel.NANO_BANANA_PRO,
        imageUrl: imageDataUrl,
        processingTime,
        cost: COST_PER_IMAGE,
        success: true,
        metadata: {
          predictionId: prediction.id,
          resolution: config?.resolution || '2K',
          promptUsed: displayPrompt, // Store the natural language prompt for display
          mode: config?.generationMode || 'go1', // Track generation mode
          imageInputCount: shouldIncludeBooth ? 2 : 1, // Track how many images were sent
        },
      };
    } catch (error) {
      const processingTime = Date.now() - startTime;

      console.error('[Nano Banana Pro - Replicate] ❌ Composition failed:', error);

      return {
        model: CompositeModel.NANO_BANANA_PRO,
        imageUrl: '',
        processingTime,
        cost: 0,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Map our resolution format to Replicate's expected format
   */
  private mapResolution(resolution: string): '1K' | '2K' | '4K' {
    switch (resolution.toUpperCase()) {
      case '1K':
        return '1K';
      case '4K':
        return '4K';
      case '2K':
      default:
        return '2K';
    }
  }
}
