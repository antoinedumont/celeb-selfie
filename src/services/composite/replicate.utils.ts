/**
 * Replicate API Utilities
 *
 * Shared utilities for interacting with Replicate API for both models:
 * - google/nano-banana-pro (Gemini)
 * - openai/gpt-image-1.5 (OpenAI)
 *
 * Benefits:
 * - Unified authentication (single API token)
 * - Consistent request/response format
 * - Simplified error handling
 * - Prefer: wait header for synchronous-like experience
 * - CORS proxy support for browser compatibility
 */

import type { ProgressCallback } from './types';
import {
  getCorsProxyUrlWithProxy,
  getProxyHeaders,
  getProxyUrls,
  isProxyEnabled,
  logProxyConfig,
  recordProxyFailure,
  recordProxySuccess,
} from '../corsProxy';

// Replicate API configuration
export const REPLICATE_API_TOKEN = import.meta.env.VITE_REPLICATE_API_TOKEN || '';
export const REPLICATE_BASE_URL = 'https://api.replicate.com/v1';

// Timeout configuration
const DEFAULT_FETCH_TIMEOUT = 300000; // 5 minutes for API calls with Prefer:wait (AI processing can take 2-3 minutes)
const POLL_FETCH_TIMEOUT = 30000; // 30 seconds for polling
const IMAGE_FETCH_TIMEOUT = 60000; // 60 seconds for image downloads

/**
 * Replicate prediction response structure
 */
export interface ReplicatePrediction {
  id: string;
  status: 'starting' | 'processing' | 'succeeded' | 'failed' | 'canceled';
  output?: string | string[] | null;
  error?: string;
  metrics?: {
    predict_time?: number;
  };
  logs?: string;
}

/**
 * Get authorization header for Replicate API
 */
export function getAuthHeader(): Record<string, string> {
  return {
    'Authorization': `Bearer ${REPLICATE_API_TOKEN}`,
    'Content-Type': 'application/json',
  };
}

/**
 * Fetch with timeout protection using AbortController
 *
 * @param url - URL to fetch
 * @param options - Fetch options
 * @param timeoutMs - Timeout in milliseconds (default: 8000ms)
 * @returns Fetch response
 * @throws Error if timeout is reached
 */
async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeoutMs: number = DEFAULT_FETCH_TIMEOUT
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);

    // Convert AbortError to more descriptive timeout error
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`Request timed out after ${timeoutMs}ms`);
    }

    throw error;
  }
}

/**
 * Submit a prediction to Replicate API with specific proxy
 *
 * Internal function that attempts submission with a specific proxy.
 *
 * @param modelPath - Model identifier
 * @param input - Input parameters
 * @param proxyUrl - CORS proxy URL to use
 * @param onProgress - Optional progress callback
 * @returns Completed prediction result
 */
async function submitPredictionWithProxy(
  modelPath: string,
  input: Record<string, any>,
  proxyUrl: string | null,
  onProgress?: ProgressCallback
): Promise<ReplicatePrediction> {
  const baseUrl = `${REPLICATE_BASE_URL}/models/${modelPath}/predictions`;
  const url = proxyUrl ? getCorsProxyUrlWithProxy(baseUrl, proxyUrl) : baseUrl;

  console.log(`[Replicate] Attempting with proxy: ${proxyUrl || 'DIRECT'}`);

  const response = await fetchWithTimeout(
    url,
    {
      method: 'POST',
      headers: {
        ...getAuthHeader(),
        ...getProxyHeaders(),
        'Prefer': 'wait', // Wait up to 60 seconds for completion
      },
      body: JSON.stringify({ input }),
    },
    DEFAULT_FETCH_TIMEOUT
  );

  onProgress?.(30);

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`[Replicate] API Error (${response.status}):`, errorText);

    // Handle common error codes
    if (response.status === 401) {
      throw new Error('Replicate authentication failed - check API token');
    }
    if (response.status === 404) {
      throw new Error(`Model not found: ${modelPath}`);
    }
    if (response.status === 429) {
      throw new Error('Replicate rate limit exceeded - please wait and try again');
    }

    throw new Error(`Replicate API failed: ${response.status} - ${errorText}`);
  }

  const prediction: ReplicatePrediction = await response.json();
  console.log(`[Replicate] Prediction result:`, prediction);

  onProgress?.(80);

  // Check if prediction succeeded
  if (prediction.status === 'failed') {
    throw new Error(prediction.error || 'Prediction failed without error message');
  }

  if (prediction.status === 'canceled') {
    throw new Error('Prediction was canceled');
  }

  // If still processing after 60s wait, poll manually
  if (prediction.status === 'processing' || prediction.status === 'starting') {
    console.log('[Replicate] Still processing after wait, polling for completion...');
    return await pollPrediction(prediction.id, onProgress);
  }

  onProgress?.(90);

  return prediction;
}

/**
 * Submit a prediction to Replicate API and wait for completion
 *
 * Uses the 'Prefer: wait' header to wait up to 60 seconds for completion.
 * This provides a synchronous-like experience without manual polling.
 *
 * Implements automatic failover across multiple CORS proxies for reliability.
 *
 * @param modelPath - Model identifier (e.g., 'google/nano-banana-pro')
 * @param input - Input parameters for the model
 * @param onProgress - Optional progress callback
 * @returns Completed prediction result
 */
export async function submitPrediction(
  modelPath: string,
  input: Record<string, any>,
  onProgress?: ProgressCallback
): Promise<ReplicatePrediction> {
  console.log(`[Replicate] Submitting prediction to ${modelPath}...`);
  console.log(`[Replicate] Input:`, input);

  onProgress?.(10);

  // If proxy is disabled, make direct request
  if (!isProxyEnabled()) {
    console.log('[Replicate] CORS proxy disabled, making direct request');
    return await submitPredictionWithProxy(modelPath, input, null, onProgress);
  }

  // Log proxy configuration
  logProxyConfig();
  console.log(`[Replicate] Using CORS proxy with automatic failover`);

  const proxies = getProxyUrls();
  const attemptedProxies: string[] = [];
  let lastError: Error | null = null;

  // Try each proxy in order
  for (const proxyUrl of proxies) {
    try {
      attemptedProxies.push(proxyUrl);
      const result = await submitPredictionWithProxy(modelPath, input, proxyUrl, onProgress);

      // Success! Record it and return
      recordProxySuccess(proxyUrl);
      console.log(`[Replicate] ✅ Success with proxy: ${proxyUrl}`);
      return result;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      recordProxyFailure(proxyUrl);
      console.warn(`[Replicate] ❌ Failed with proxy ${proxyUrl}:`, error);

      // Don't retry on authentication or model errors
      if (
        lastError.message.includes('authentication') ||
        lastError.message.includes('Model not found') ||
        lastError.message.includes('rate limit')
      ) {
        throw lastError;
      }

      // Continue to next proxy
      continue;
    }
  }

  // All proxies failed
  const errorMessage =
    `Failed to connect to Replicate API after trying ${attemptedProxies.length} CORS proxies.\n\n` +
    `Attempted proxies:\n${attemptedProxies.map((p, i) => `${i + 1}. ${p}`).join('\n')}\n\n` +
    `Last error: ${lastError?.message || 'Unknown error'}\n\n` +
    `Troubleshooting:\n` +
    `- Check your internet connection\n` +
    `- Try disabling browser extensions that might block requests\n` +
    `- For production, consider using a custom backend proxy`;

  console.error('[Replicate]', errorMessage);
  throw new Error(errorMessage);
}

/**
 * Cancel a prediction
 *
 * Cancels a running prediction to stop wasting GPU resources.
 * Used when a prediction times out (>120s).
 */
async function cancelPrediction(predictionId: string): Promise<void> {
  console.log(`[Replicate] Cancelling prediction: ${predictionId}`);

  try {
    const baseUrl = `${REPLICATE_BASE_URL}/predictions/${predictionId}/cancel`;

    if (isProxyEnabled()) {
      const proxies = getProxyUrls();

      for (const proxyUrl of proxies) {
        try {
          const url = getCorsProxyUrlWithProxy(baseUrl, proxyUrl);
          const response = await fetchWithTimeout(
            url,
            {
              method: 'POST',
              headers: {
                ...getAuthHeader(),
                ...getProxyHeaders(),
              },
            },
            POLL_FETCH_TIMEOUT
          );

          if (response.ok) {
            console.log(`[Replicate] ✅ Prediction cancelled successfully`);
            recordProxySuccess(proxyUrl);
            return;
          }
        } catch (error) {
          recordProxyFailure(proxyUrl);
          continue; // Try next proxy
        }
      }
    } else {
      // Direct request without proxy
      const response = await fetchWithTimeout(
        baseUrl,
        {
          method: 'POST',
          headers: getAuthHeader(),
        },
        POLL_FETCH_TIMEOUT
      );

      if (response.ok) {
        console.log(`[Replicate] ✅ Prediction cancelled successfully`);
        return;
      }
    }

    // If we get here, cancellation failed but don't throw - continue with timeout error
    console.warn(`[Replicate] ⚠️  Failed to cancel prediction, but continuing...`);
  } catch (error) {
    // Log but don't throw - cancellation is best-effort
    console.warn(`[Replicate] ⚠️  Error cancelling prediction:`, error);
  }
}

/**
 * Poll a prediction until it completes with proxy failover
 *
 * Fallback for when Prefer: wait times out.
 * Polls every 2 seconds for up to 180 seconds (3 minutes).
 * Uses timeout protection and proxy failover.
 * Emits progress warnings at 60s, 90s, 120s thresholds.
 * Auto-cancels predictions at 180s timeout.
 */
async function pollPrediction(
  predictionId: string,
  onProgress?: ProgressCallback
): Promise<ReplicatePrediction> {
  const maxAttempts = 90; // 90 * 2s = 180s max (3 minutes - Nano Banana can take up to 160s under load)
  const startTime = Date.now();
  let attempts = 0;
  let hasWarned60s = false;
  let hasWarned90s = false;
  let hasWarned120s = false;

  while (attempts < maxAttempts) {
    await delay(2000); // Wait 2 seconds between polls

    // Calculate elapsed time
    const elapsedSeconds = Math.floor((Date.now() - startTime) / 1000);

    // Emit progress warnings at thresholds
    if (elapsedSeconds >= 60 && !hasWarned60s) {
      console.warn(`[Replicate] ⏳ Processing is taking longer than usual (${elapsedSeconds}s elapsed)`);
      hasWarned60s = true;
    }

    if (elapsedSeconds >= 90 && !hasWarned90s) {
      console.warn(`[Replicate] ⏳ Still processing... (${elapsedSeconds}s elapsed, up to 180s max)`);
      hasWarned90s = true;
    }

    if (elapsedSeconds >= 120 && !hasWarned120s) {
      console.warn(`[Replicate] ⏳ Still processing... (${elapsedSeconds}s elapsed, patience appreciated)`);
      hasWarned120s = true;
    }

    // Check for timeout
    if (elapsedSeconds >= 180) {
      console.error(`[Replicate] ⏰ Timeout reached after ${elapsedSeconds}s, cancelling prediction...`);
      await cancelPrediction(predictionId);
      throw new Error('Generation took longer than expected and was cancelled. The AI service is experiencing delays. Please try again - it usually works on the second attempt!');
    }

    const baseUrl = `${REPLICATE_BASE_URL}/predictions/${predictionId}`;

    // Try polling with proxy failover
    let prediction: ReplicatePrediction | null = null;

    if (isProxyEnabled()) {
      const proxies = getProxyUrls();

      for (const proxyUrl of proxies) {
        try {
          const url = getCorsProxyUrlWithProxy(baseUrl, proxyUrl);
          const response = await fetchWithTimeout(
            url,
            {
              headers: {
                ...getAuthHeader(),
                ...getProxyHeaders(),
              },
            },
            POLL_FETCH_TIMEOUT
          );

          if (!response.ok) {
            throw new Error(`Poll failed: ${response.status}`);
          }

          prediction = await response.json();
          recordProxySuccess(proxyUrl);
          break; // Success, exit proxy loop
        } catch (error) {
          recordProxyFailure(proxyUrl);
          console.warn(`[Replicate Poll] Failed with proxy ${proxyUrl}:`, error);
          continue; // Try next proxy
        }
      }
    } else {
      // Direct request without proxy
      const response = await fetchWithTimeout(
        baseUrl,
        {
          headers: getAuthHeader(),
        },
        POLL_FETCH_TIMEOUT
      );

      if (!response.ok) {
        throw new Error(`Failed to poll prediction: ${response.status}`);
      }

      prediction = await response.json();
    }

    if (!prediction) {
      throw new Error('Failed to poll prediction with all available proxies');
    }

    // Update progress based on attempts (80% → 95%)
    const progressValue = 80 + Math.min(attempts / maxAttempts * 15, 15);
    onProgress?.(progressValue);

    if (prediction.status === 'succeeded') {
      return prediction;
    }

    if (prediction.status === 'failed') {
      throw new Error(prediction.error || 'Prediction failed');
    }

    if (prediction.status === 'canceled') {
      throw new Error('Prediction was canceled');
    }

    attempts++;
  }

  // This should not be reached due to elapsedSeconds check, but just in case
  await cancelPrediction(predictionId);
  throw new Error('Generation took longer than expected and was cancelled. The AI service is experiencing delays. Please try again - it usually works on the second attempt!');
}

/**
 * Fetch an image from a URL and convert it to a data URL
 *
 * Replicate returns HTTPS URLs - we need to fetch and convert to data URLs
 * for consistency with the rest of the application.
 *
 * Uses timeout protection and proxy failover for reliability.
 *
 * NOTE: Replicate uses two domains:
 * - api.replicate.com: API endpoints (no CORS headers, requires proxy)
 * - replicate.delivery: CDN for result images (has CORS headers, direct fetch)
 *
 * @param url - HTTPS URL to the image
 * @returns Data URL (base64 encoded)
 */
export async function fetchImageAsDataUrl(url: string): Promise<string> {
  console.log(`[Replicate] Fetching image from URL: ${url}`);

  let blob: Blob | null = null;

  // Check if URL is from replicate.delivery CDN
  // These URLs have CORS enabled, so we can fetch directly without proxy
  const isDeliveryUrl = url.includes('replicate.delivery');

  if (isDeliveryUrl) {
    // Replicate's CDN has CORS headers - fetch directly
    console.log('[Replicate] Fetching directly from replicate.delivery (CORS enabled)');
    const response = await fetchWithTimeout(url, {}, IMAGE_FETCH_TIMEOUT);

    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status}`);
    }

    blob = await response.blob();
    console.log('[Replicate] ✅ Image fetched successfully from replicate.delivery');
  } else if (isProxyEnabled()) {
    // Only proxy api.replicate.com URLs (API calls without CORS headers)
    const proxies = getProxyUrls();

    // Try each proxy
    for (const proxyUrl of proxies) {
      try {
        const proxiedUrl = getCorsProxyUrlWithProxy(url, proxyUrl);
        const response = await fetchWithTimeout(proxiedUrl, {}, IMAGE_FETCH_TIMEOUT);

        if (!response.ok) {
          throw new Error(`Failed to fetch image: ${response.status}`);
        }

        blob = await response.blob();
        recordProxySuccess(proxyUrl);
        console.log(`[Replicate] ✅ Image fetched successfully with proxy: ${proxyUrl}`);
        break; // Success, exit loop
      } catch (error) {
        recordProxyFailure(proxyUrl);
        console.warn(`[Replicate] ❌ Failed to fetch image with proxy ${proxyUrl}:`, error);
        continue; // Try next proxy
      }
    }

    if (!blob) {
      throw new Error('Failed to fetch image with all available proxies');
    }
  } else {
    // Direct request without proxy
    const response = await fetchWithTimeout(url, {}, IMAGE_FETCH_TIMEOUT);

    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status}`);
    }

    blob = await response.blob();
  }

  // Convert blob to data URL
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to convert blob to data URL'));
      }
    };
    reader.onerror = () => reject(new Error('FileReader error'));
    reader.readAsDataURL(blob);
  });
}

/**
 * Delay utility for polling
 */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Extract the first image URL from Replicate output
 *
 * Replicate can return either a single string or an array of strings.
 * This helper extracts the first valid URL.
 */
export function extractImageUrl(output: string | string[] | null | undefined): string {
  if (!output) {
    throw new Error('No output received from Replicate');
  }

  if (Array.isArray(output)) {
    if (output.length === 0) {
      throw new Error('Replicate returned empty output array');
    }
    return output[0];
  }

  return output;
}
