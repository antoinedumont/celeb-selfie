/**
 * Retry Utilities
 *
 * Implements smart retry logic with exponential backoff for Replicate API calls.
 * Addresses the inherent variability in Replicate's processing times.
 *
 * Key Features:
 * - Exponential backoff (2s, 4s, 8s...)
 * - Configurable max retries (default: 2)
 * - Retry only on timeout/processing errors (not auth/validation errors)
 * - Detailed logging for debugging
 */

interface RetryOptions {
  maxRetries: number;
  baseDelay: number; // milliseconds
  maxDelay: number; // milliseconds
  onRetry?: (attempt: number, error: Error, delayMs: number) => void;
}

const DEFAULT_OPTIONS: RetryOptions = {
  maxRetries: 2, // Total: 3 attempts (1 initial + 2 retries)
  baseDelay: 2000, // Start with 2s delay
  maxDelay: 10000, // Cap at 10s delay
};

/**
 * Check if an error is retryable
 *
 * Non-retryable errors:
 * - Authentication errors (401)
 * - Model not found (404)
 * - Rate limiting (429)
 * - Invalid input/validation errors (400)
 *
 * Retryable errors:
 * - Timeout errors
 * - Processing failures
 * - Network errors
 * - Generic API errors (500, 502, 503)
 */
function isRetryableError(error: Error): boolean {
  const message = error.message.toLowerCase();

  // Non-retryable errors
  if (
    message.includes('authentication') ||
    message.includes('auth') ||
    message.includes('401')
  ) {
    return false;
  }

  if (
    message.includes('model not found') ||
    message.includes('404')
  ) {
    return false;
  }

  if (
    message.includes('rate limit') ||
    message.includes('429')
  ) {
    return false;
  }

  if (
    message.includes('invalid input') ||
    message.includes('validation') ||
    message.includes('400')
  ) {
    return false;
  }

  // Retryable errors
  if (
    message.includes('timeout') ||
    message.includes('timed out') ||
    message.includes('prediction failed') ||
    message.includes('processing') ||
    message.includes('network') ||
    message.includes('502') ||
    message.includes('503') ||
    message.includes('500')
  ) {
    return true;
  }

  // Default: retry for unknown errors
  return true;
}

/**
 * Calculate delay with exponential backoff
 *
 * Formula: min(baseDelay * 2^attempt, maxDelay)
 * Example with baseDelay=2000, maxDelay=10000:
 * - Attempt 1: 2000ms (2s)
 * - Attempt 2: 4000ms (4s)
 * - Attempt 3: 8000ms (8s)
 * - Attempt 4+: 10000ms (10s - capped)
 */
function calculateBackoff(attempt: number, baseDelay: number, maxDelay: number): number {
  const exponentialDelay = baseDelay * Math.pow(2, attempt - 1);
  return Math.min(exponentialDelay, maxDelay);
}

/**
 * Delay execution for specified milliseconds
 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retry a function with exponential backoff
 *
 * Example usage:
 * ```typescript
 * const result = await retryWithBackoff(
 *   () => submitPrediction(modelPath, input, onProgress),
 *   { maxRetries: 2, baseDelay: 2000 }
 * );
 * ```
 *
 * @param fn - Async function to retry
 * @param options - Retry configuration
 * @returns Result of successful function execution
 * @throws Last error if all retries exhausted
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: Partial<RetryOptions> = {}
): Promise<T> {
  const config: RetryOptions = { ...DEFAULT_OPTIONS, ...options };
  const { maxRetries, baseDelay, maxDelay, onRetry } = config;

  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
    try {
      // Execute the function
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Check if we should retry
      const isLastAttempt = attempt === maxRetries + 1;

      if (isLastAttempt) {
        // All retries exhausted
        console.error(`[Retry] ❌ All ${maxRetries + 1} attempts failed`);
        throw lastError;
      }

      if (!isRetryableError(lastError)) {
        // Error is not retryable
        console.error(`[Retry] ❌ Non-retryable error, aborting:`, lastError.message);
        throw lastError;
      }

      // Calculate backoff delay
      const delayMs = calculateBackoff(attempt, baseDelay, maxDelay);

      console.warn(
        `[Retry] ⚠️  Attempt ${attempt} failed: ${lastError.message}`
      );
      console.log(
        `[Retry] 🔄 Retrying in ${(delayMs / 1000).toFixed(1)}s... (${maxRetries - attempt + 1} retries remaining)`
      );

      // Call retry callback if provided
      if (onRetry) {
        onRetry(attempt, lastError, delayMs);
      }

      // Wait before retry
      await delay(delayMs);

      console.log(`[Retry] 🚀 Attempt ${attempt + 1} starting...`);
    }
  }

  // This should never be reached, but TypeScript requires it
  throw lastError || new Error('Retry failed for unknown reason');
}

/**
 * Create a retry wrapper with custom configuration
 *
 * Example:
 * ```typescript
 * const submitWithRetry = createRetryWrapper({ maxRetries: 3 });
 * const result = await submitWithRetry(() => submitPrediction(...));
 * ```
 */
export function createRetryWrapper(
  options: Partial<RetryOptions> = {}
): <T>(fn: () => Promise<T>) => Promise<T> {
  return <T>(fn: () => Promise<T>) => retryWithBackoff(fn, options);
}

/**
 * Retry configuration presets
 */
export const RetryPresets = {
  /**
   * Conservative: 1 retry with short delay (good for fast operations)
   */
  conservative: {
    maxRetries: 1,
    baseDelay: 1000,
    maxDelay: 2000,
  },

  /**
   * Standard: 2 retries with moderate delay (recommended for Replicate API)
   */
  standard: {
    maxRetries: 2,
    baseDelay: 2000,
    maxDelay: 10000,
  },

  /**
   * Aggressive: 3 retries with exponential backoff (for critical operations)
   */
  aggressive: {
    maxRetries: 3,
    baseDelay: 2000,
    maxDelay: 15000,
  },

  /**
   * Emergency: 5 retries with long delays (last resort)
   */
  emergency: {
    maxRetries: 5,
    baseDelay: 3000,
    maxDelay: 30000,
  },
} as const;
