/**
 * Prompt Cache Utility Functions
 *
 * Manages caching of AI-generated celebrity prompts in localStorage
 * to reduce API calls and costs.
 */

import type { PromptCacheEntry, PromptTemplate } from '../services/gemini3PromptGenerator.types';

// Cache configuration
const CACHE_KEY_PREFIX = 'celebrity_prompt_';
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const TEMPLATE_VERSION = '1.2'; // Increment to invalidate old cache entries (v1.2: Added POV selfie support with lens_effect and composition fields)

/**
 * Generate cache key for a celebrity
 */
function getCacheKey(celebrityName: string): string {
  return `${CACHE_KEY_PREFIX}${celebrityName.toLowerCase().replace(/\s+/g, '_')}`;
}

/**
 * Get cached prompt for a celebrity
 * Returns null if cache miss, expired, or invalid
 *
 * @param celebrityName - Name of the celebrity
 * @returns Cached prompt or null
 */
export function getCachedPrompt(celebrityName: string): { prompt: string; jsonTemplate: PromptTemplate } | null {
  try {
    const cacheKey = getCacheKey(celebrityName);
    const cached = localStorage.getItem(cacheKey);

    if (!cached) {
      console.log(`[Cache] Miss for ${celebrityName}`);
      return null;
    }

    const entry: PromptCacheEntry = JSON.parse(cached);

    // Check template version
    if (entry.templateVersion !== TEMPLATE_VERSION) {
      console.log(`[Cache] Version mismatch for ${celebrityName} (cached: ${entry.templateVersion}, current: ${TEMPLATE_VERSION})`);
      localStorage.removeItem(cacheKey);
      return null;
    }

    // Check expiration
    const age = Date.now() - entry.timestamp;
    if (age > CACHE_TTL_MS) {
      console.log(`[Cache] Expired for ${celebrityName} (age: ${Math.round(age / 1000 / 60 / 60)} hours)`);
      localStorage.removeItem(cacheKey);
      return null;
    }

    console.log(`[Cache] Hit for ${celebrityName} (age: ${Math.round(age / 1000 / 60)} minutes)`);
    return {
      prompt: entry.prompt,
      jsonTemplate: entry.jsonTemplate
    };
  } catch (error) {
    console.error('[Cache] Error reading cache:', error);
    return null;
  }
}

/**
 * Store generated prompt in cache
 *
 * @param celebrityName - Name of the celebrity
 * @param prompt - Generated natural language prompt
 * @param jsonTemplate - Filled JSON template
 */
export function setCachedPrompt(
  celebrityName: string,
  prompt: string,
  jsonTemplate: PromptTemplate
): void {
  try {
    const cacheKey = getCacheKey(celebrityName);
    const entry: PromptCacheEntry = {
      celebrityName,
      prompt,
      jsonTemplate,
      timestamp: Date.now(),
      templateVersion: TEMPLATE_VERSION,
    };

    localStorage.setItem(cacheKey, JSON.stringify(entry));
    console.log(`[Cache] Stored prompt for ${celebrityName}`);
  } catch (error) {
    console.error('[Cache] Error writing cache:', error);
  }
}

/**
 * Clear all cached prompts
 * Useful for debugging or when template changes
 */
export function clearPromptCache(): void {
  try {
    const keys = Object.keys(localStorage);
    const promptKeys = keys.filter(key => key.startsWith(CACHE_KEY_PREFIX));

    promptKeys.forEach(key => localStorage.removeItem(key));
    console.log(`[Cache] Cleared ${promptKeys.length} cached prompts`);
  } catch (error) {
    console.error('[Cache] Error clearing cache:', error);
  }
}

/**
 * Get cache statistics
 * Returns count and total size of cached prompts
 */
export function getCacheStats(): { count: number; sizeKB: number } {
  try {
    const keys = Object.keys(localStorage);
    const promptKeys = keys.filter(key => key.startsWith(CACHE_KEY_PREFIX));

    let totalSize = 0;
    promptKeys.forEach(key => {
      const value = localStorage.getItem(key);
      if (value) {
        totalSize += value.length;
      }
    });

    return {
      count: promptKeys.length,
      sizeKB: Math.round(totalSize / 1024 * 100) / 100,
    };
  } catch (error) {
    console.error('[Cache] Error getting stats:', error);
    return { count: 0, sizeKB: 0 };
  }
}
