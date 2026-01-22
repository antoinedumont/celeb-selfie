/**
 * Google Direct Nano Banana Pro Service
 *
 * Implements Google's Nano Banana Pro (Gemini 3 Pro Image) via direct Google AI Studio API.
 * Model: gemini-3-pro-image-preview
 *
 * Features:
 * - Direct Google API access (no Replicate proxy)
 * - Text-prompt based celebrity selfie generation
 * - Multi-image reference input support (user selfie)
 * - High-resolution output (up to 4K)
 * - Lower cost than Replicate ($0.134-0.24 vs $0.15)
 *
 * Cost: $0.134 per 1K-2K image, $0.24 per 4K image
 * Processing time: 20-40 seconds (direct Google API)
 */

import {
  CompositeModel,
  type CompositeService,
  type CompositeResult,
  type CompositionConfig,
  type ProgressCallback,
  type GeminiRequest,
  type GeminiResponse,
  CompositeAPIError,
} from './types';
import { buildFreestyleSelfiePrompt, buildGo1BoothSelfiePrompt } from './promptBuilder';
import { retryWithBackoff, RetryPresets } from './retry.utils';
import { loadBoothTemplateImage, compressImageDataUrl } from '../../utils/image.utils';

// Model identifier on Google API
const MODEL_NAME = 'gemini-3-pro-image-preview';

// API endpoint - Use US proxy to bypass geo-restrictions
const USE_US_PROXY = import.meta.env.VITE_USE_CORS_PROXY === 'true';

// Get base proxy URL (remove /replicate/ path if present, we need just the domain)
const getProxyBase = (): string => {
  const proxyUrl = import.meta.env.VITE_US_CORS_PROXY_URL || 'https://us.api.tmtprod.com/';
  // Remove /replicate/ or any trailing path, keep only domain
  return proxyUrl.replace(/\/replicate\/?$/, '').replace(/\/$/, '');
};

// Construct endpoint: either direct or via US proxy
// US proxy path: https://us.api.tmtprod.com/google/v1beta/models/...
// Direct path: https://generativelanguage.googleapis.com/v1beta/models/...
const API_ENDPOINT = USE_US_PROXY
  ? `${getProxyBase()}/google/v1beta/models/${MODEL_NAME}:generateContent`
  : `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent`;

// Cost per image (Google pricing)
const COST_PER_1K_2K_IMAGE = 0.134;
const COST_PER_4K_IMAGE = 0.24;

// Number of output images to generate
const NUM_OUTPUTS = 2;

export class GoogleDirectNanoBananaService implements CompositeService {
  private apiKey: string;

  constructor() {
    const key = import.meta.env.VITE_GOOGLE_AI_STUDIO_API_KEY;
    if (!key) {
      throw new CompositeAPIError(
        'Google AI Studio API key not configured. Please set VITE_GOOGLE_AI_STUDIO_API_KEY in .env',
        401,
        CompositeModel.GOOGLE_DIRECT
      );
    }
    this.apiKey = key;
  }

  /**
   * Compose a celebrity selfie using Google Direct Nano Banana Pro API
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

    // Determine generation mode (default to 'freestyle')
    const mode = config?.generationMode || 'freestyle';

    // Calculate cost based on resolution
    const resolution = config?.resolution || '2K';
    const costPerImage = resolution === '4K' ? COST_PER_4K_IMAGE : COST_PER_1K_2K_IMAGE;
    const totalCost = costPerImage * NUM_OUTPUTS;

    console.log('[Google Direct Nano Banana] Starting composition...');
    console.log(`[Google Direct Nano Banana] Celebrity: ${celebrityName}`);
    console.log(`[Google Direct Nano Banana] Generation mode: ${mode.toUpperCase()}`);
    console.log(`[Google Direct Nano Banana] Resolution: ${resolution}`);
    console.log(`[Google Direct Nano Banana] Generating ${NUM_OUTPUTS} images`);
    console.log(`[Google Direct Nano Banana] Cost: $${totalCost.toFixed(3)} (${NUM_OUTPUTS} × $${costPerImage})`);

    // Track if we're using booth template (for fallback logic)
    let includeBoothTemplate = mode === 'go1';

    // Declare displayPrompt outside try block so it's available in catch
    let displayPrompt = '';

    try {
      onProgress?.(5);

      // Generate prompt based on mode
      console.log(`[Google Direct Nano Banana] Generating ${mode.toUpperCase()} prompt...`);

      let promptData: { jsonTemplate: any; naturalLanguage: string; source: string };

      if (mode === 'go1') {
        // Use Go1 booth prompt for conference branding
        promptData = await buildGo1BoothSelfiePrompt(celebrityName);
        console.log('[Google Direct Nano Banana] Using Go1 Booth prompt template');
      } else {
        // Use freestyle prompt with AI-generated context
        promptData = await buildFreestyleSelfiePrompt(celebrityName);
        console.log('[Google Direct Nano Banana] Using Freestyle prompt with Gemini');
      }

      displayPrompt = promptData.naturalLanguage;
      const jsonTemplate = promptData.jsonTemplate;

      if (jsonTemplate) {
        console.log('[Google Direct Nano Banana] Using Gemini-generated prompt');
        console.log('[Google Direct Nano Banana] Celebrity role:', jsonTemplate.scene_description?.celebrity?.role_context);
        console.log('[Google Direct Nano Banana] Setting:', jsonTemplate.scene_description?.environment?.setting_name);
      }

      console.log(`[Google Direct Nano Banana] Prompt preview: ${displayPrompt.substring(0, 150)}...`);

      onProgress?.(10);

      // Compress user image for API efficiency
      console.log('[Google Direct Nano Banana] Compressing user image...');
      const compressedUserImage = await compressImageDataUrl(userImageDataUrl, 1024, 0.85);
      const base64UserImage = this.dataUrlToBase64(compressedUserImage);

      // Build request parts array
      const requestParts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }> = [];

      // Add user image first
      requestParts.push({
        inlineData: {
          mimeType: 'image/jpeg',
          data: base64UserImage,
        },
      });

      // If Go1 mode and booth template should be included, load and add it
      if (includeBoothTemplate) {
        console.log('[Google Direct Nano Banana] Loading Go1 booth template for visual reference...');
        onProgress?.(12);

        try {
          const boothTemplateDataUrl = await loadBoothTemplateImage();
          const compressedBoothImage = await compressImageDataUrl(boothTemplateDataUrl, 1024, 0.85);
          const base64BoothImage = this.dataUrlToBase64(compressedBoothImage);

          requestParts.push({
            inlineData: {
              mimeType: 'image/jpeg',
              data: base64BoothImage,
            },
          });

          console.log('[Google Direct Nano Banana] ✅ Go1 booth template added to request');
        } catch (error) {
          console.warn('[Google Direct Nano Banana] ⚠️ Failed to load booth template, proceeding without it:', error);
          includeBoothTemplate = false;
        }
      }

      onProgress?.(15);

      // Add prompt text last
      requestParts.push({ text: displayPrompt });

      // Build request for Google API
      const request: GeminiRequest = {
        contents: [
          {
            parts: requestParts,
          },
        ],
        generationConfig: {
          responseModalities: ['TEXT', 'IMAGE'],
          imageConfig: {
            imageSize: this.mapResolution(resolution),
            aspectRatio: '2:3',
          },
        },
      };

      console.log(`[Google Direct Nano Banana] Request has ${requestParts.length} parts (${includeBoothTemplate ? '2 images + prompt' : '1 image + prompt'})`);

      onProgress?.(20);

      // Submit to Google API with retry logic
      console.log('[Google Direct Nano Banana] Submitting to Google AI Studio API...');
      const googleStartTime = Date.now();

      const response = await retryWithBackoff(
        async () => {
          return await this.callGoogleAPI(request, onProgress);
        },
        {
          ...RetryPresets.standard,
          onRetry: (attempt, error, delayMs) => {
            console.log(`[Google Direct Nano Banana] 🔄 Retry attempt ${attempt} after ${(delayMs / 1000).toFixed(1)}s delay`);
            console.log(`[Google Direct Nano Banana] Previous error: ${error.message}`);
            onProgress?.(20);
          },
        }
      );

      const googleTotalTime = Date.now() - googleStartTime;
      console.log(`[Google Direct Nano Banana] ⏱️  Google API completed in ${googleTotalTime}ms`);

      onProgress?.(85);

      // Extract images from response
      let imageDataUrls = this.extractImages(response);

      // Check for content policy block (IMAGE_OTHER) - fallback to freestyle mode
      if (imageDataUrls.length === 0 && mode === 'go1') {
        const finishReason = response.candidates?.[0]?.finishReason;

        if (finishReason === 'IMAGE_OTHER') {
          console.log('[Google Direct Nano Banana] ⚠️ Content policy blocked Go1 mode (living celebrity + branded content)');
          console.log('[Google Direct Nano Banana] 🔄 Falling back to freestyle mode...');

          onProgress?.(45);

          // Generate freestyle prompt instead (no branded content)
          const freestylePromptData = await buildFreestyleSelfiePrompt(celebrityName);
          const freestylePrompt = freestylePromptData.naturalLanguage;

          console.log('[Google Direct Nano Banana] Using freestyle prompt for fallback');
          console.log(`[Google Direct Nano Banana] Freestyle prompt preview: ${freestylePrompt.substring(0, 100)}...`);

          // Rebuild request with freestyle prompt, no booth template
          const fallbackParts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }> = [
            {
              inlineData: {
                mimeType: 'image/jpeg',
                data: base64UserImage,
              },
            },
            { text: freestylePrompt },
          ];

          const fallbackRequest: GeminiRequest = {
            contents: [{ parts: fallbackParts }],
            generationConfig: {
              responseModalities: ['TEXT', 'IMAGE'],
              imageConfig: {
                imageSize: this.mapResolution(resolution),
                aspectRatio: '2:3',
              },
            },
          };

          console.log('[Google Direct Nano Banana] Request has 2 parts (1 image + freestyle prompt)');

          // Retry API call with freestyle mode
          const fallbackResponse = await retryWithBackoff(
            async () => {
              return await this.callGoogleAPI(fallbackRequest, onProgress);
            },
            {
              ...RetryPresets.standard,
              onRetry: (attempt, error, delayMs) => {
                console.log(`[Google Direct Nano Banana] 🔄 Fallback retry attempt ${attempt} after ${(delayMs / 1000).toFixed(1)}s delay`);
                onProgress?.(50);
              },
            }
          );

          const fallbackTime = Date.now() - googleStartTime;
          console.log(`[Google Direct Nano Banana] ⏱️  Fallback API completed in ${fallbackTime}ms`);

          imageDataUrls = this.extractImages(fallbackResponse);

          if (imageDataUrls.length > 0) {
            console.log('[Google Direct Nano Banana] ✅ Fallback to freestyle mode successful!');
          }
        }
      }

      if (imageDataUrls.length === 0) {
        throw new CompositeAPIError(
          'No images generated by Google API',
          500,
          CompositeModel.GOOGLE_DIRECT
        );
      }

      console.log(`[Google Direct Nano Banana] Received ${imageDataUrls.length} images`);

      const processingTime = Date.now() - startTime;
      onProgress?.(100);

      console.log(`[Google Direct Nano Banana] ✅ Composition completed in ${processingTime}ms`);

      return {
        model: CompositeModel.GOOGLE_DIRECT,
        imageUrl: imageDataUrls[0],
        imageUrls: imageDataUrls,
        processingTime,
        cost: totalCost,
        success: true,
        metadata: {
          resolution,
          promptUsed: displayPrompt,
          mode,
          imageInputCount: 1,
          numOutputs: imageDataUrls.length,
          apiMode: 'google-direct',
        },
      };
    } catch (error) {
      const processingTime = Date.now() - startTime;

      console.error('[Google Direct Nano Banana] ❌ Composition failed:', error);

      // Format error message
      let errorMessage = 'Unknown error occurred';
      if (error instanceof CompositeAPIError) {
        errorMessage = error.message;
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }

      return {
        model: CompositeModel.GOOGLE_DIRECT,
        imageUrl: '',
        processingTime,
        cost: 0,
        success: false,
        error: errorMessage,
        metadata: {
          promptUsed: displayPrompt,
          mode,
          resolution,
        },
      };
    }
  }

  /**
   * Call Google AI Studio API
   */
  private async callGoogleAPI(
    request: GeminiRequest,
    onProgress?: ProgressCallback
  ): Promise<GeminiResponse> {
    try {
      onProgress?.(30);

      const response = await fetch(`${API_ENDPOINT}?key=${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      onProgress?.(70);

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        const errorMessage = errorData?.error?.message || `HTTP ${response.status}: ${response.statusText}`;

        throw new CompositeAPIError(
          `Google API error: ${errorMessage}`,
          response.status,
          CompositeModel.GOOGLE_DIRECT,
          response.status >= 500 || response.status === 429 // Retryable for server errors and rate limits
        );
      }

      const data: GeminiResponse = await response.json();

      // DEBUG: Log full response structure
      console.log('[Google Direct Nano Banana] 🔍 Full API Response:', JSON.stringify(data, null, 2));

      onProgress?.(80);

      return data;
    } catch (error) {
      if (error instanceof CompositeAPIError) {
        throw error;
      }

      // Network or parsing error
      throw new CompositeAPIError(
        `Failed to call Google API: ${error instanceof Error ? error.message : 'Unknown error'}`,
        0,
        CompositeModel.GOOGLE_DIRECT,
        true // Network errors are retryable
      );
    }
  }

  /**
   * Extract image data URLs from Google API response
   */
  private extractImages(response: GeminiResponse): string[] {
    const images: string[] = [];

    try {
      console.log('[Google Direct Nano Banana] 🔍 Extracting images from response...');
      console.log('[Google Direct Nano Banana] 🔍 Response has candidates:', !!response.candidates);
      console.log('[Google Direct Nano Banana] 🔍 Number of candidates:', response.candidates?.length || 0);

      const candidates = response.candidates || [];

      for (const candidate of candidates) {
        console.log('[Google Direct Nano Banana] 🔍 Candidate content:', candidate.content);
        console.log('[Google Direct Nano Banana] 🔍 Candidate parts:', candidate.content?.parts);

        const parts = candidate.content?.parts || [];

        for (const part of parts) {
          console.log('[Google Direct Nano Banana] 🔍 Part:', part);
          console.log('[Google Direct Nano Banana] 🔍 Has inlineData:', !!part.inlineData);

          if (part.inlineData?.data && part.inlineData?.mimeType) {
            // Convert base64 back to data URL
            const dataUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
            images.push(dataUrl);
            console.log('[Google Direct Nano Banana] ✅ Found image with mimeType:', part.inlineData.mimeType);
          }
        }
      }

      console.log('[Google Direct Nano Banana] 🔍 Total images extracted:', images.length);
    } catch (error) {
      console.error('[Google Direct Nano Banana] Failed to extract images:', error);
    }

    return images;
  }

  /**
   * Convert data URL to base64 string (remove prefix)
   */
  private dataUrlToBase64(dataUrl: string): string {
    const matches = dataUrl.match(/^data:image\/\w+;base64,(.+)$/);
    if (!matches || matches.length < 2) {
      throw new Error('Invalid data URL format');
    }
    return matches[1];
  }

  /**
   * Map our resolution format to Google's expected format
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
