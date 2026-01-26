# Replicate to NanoBanana Pro (Google Direct API) Migration Guide

> A comprehensive guide for migrating from Replicate API to direct Google Gemini (NanoBanana Pro) API calls.
> Based on the successful migration in `celeb-selfie` project.

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture Comparison](#architecture-comparison)
3. [Prerequisites](#prerequisites)
4. [Environment Setup](#environment-setup)
5. [Type Definitions](#type-definitions)
6. [Core Service Implementation](#core-service-implementation)
7. [Prompt Building](#prompt-building)
8. [Retry Logic](#retry-logic)
9. [Service Factory Pattern](#service-factory-pattern)
10. [Migration Checklist](#migration-checklist)
11. [Testing & Validation](#testing--validation)
12. [Troubleshooting](#troubleshooting)

---

## Overview

### What is NanoBanana Pro?

NanoBanana Pro is Google's Gemini 3 Pro Image model (`gemini-3-pro-image-preview`) that can:
- Generate images from text prompts
- Accept reference images as input
- Output multiple images per request
- Support various resolutions (1K, 2K, 4K)

### Why Migrate?

| Aspect | Replicate API | Google Direct API |
|--------|---------------|-------------------|
| **Latency** | 60-90 seconds | 20-40 seconds |
| **Cost** | $0.15/image | $0.13-0.24/image |
| **Complexity** | Requires CORS proxy | Direct API access |
| **Reliability** | Extra hop (proxy overhead) | Direct connection |

---

## Architecture Comparison

### Before (Replicate)

```
User App → CORS Proxy → Replicate API → Google Gemini → Response
```

### After (Google Direct)

```
User App → (Optional US Proxy) → Google AI Studio API → Response
```

### Key Differences

1. **Authentication**: Replicate uses Bearer token; Google uses API key in URL
2. **Request Format**: Replicate uses model-specific input; Google uses standard Gemini format
3. **Response Format**: Replicate returns URLs; Google returns base64 inline data
4. **Polling**: Replicate requires polling for completion; Google is synchronous

---

## Prerequisites

1. **Google AI Studio API Key**
   - Get from: https://aistudio.google.com/app/apikey
   - Required permissions: Gemini API access

2. **For Geo-Blocked Regions (e.g., EU)**
   - US-based proxy server (optional)
   - Nginx configuration for `/google/` path forwarding

---

## Environment Setup

### Required Environment Variables

```bash
# .env file

# Google AI Studio API Key (REQUIRED)
VITE_GOOGLE_AI_STUDIO_API_KEY=your_google_api_key_here

# Use CORS proxy for geo-blocked regions (optional)
VITE_USE_CORS_PROXY=true

# US Proxy Base URL (optional, for geo-blocked regions)
# IMPORTANT: Use a clean base URL without service-specific paths
# The code will append /google/v1beta/models/... to this base
VITE_US_CORS_PROXY_URL=https://your-us-proxy.com
```

> **Note**: Use a clean base URL (e.g., `https://us.api.example.com`) without trailing slashes or service-specific paths like `/replicate/`. This makes the configuration self-documenting and easier to maintain.

### API Endpoints

```typescript
// Direct Google API (works in US, some other regions)
const DIRECT_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-image-preview:generateContent';

// Via US Proxy (for geo-blocked regions like EU)
const PROXY_ENDPOINT = 'https://your-us-proxy.com/google/v1beta/models/gemini-3-pro-image-preview:generateContent';
```

---

## Type Definitions

### Core Types

```typescript
// src/services/composite/types.ts

/**
 * Supported AI models for photo compositing
 */
export enum CompositeModel {
  GOOGLE_DIRECT = 'google-direct',
  // Add other models as needed
}

/**
 * Result from a photo composition operation
 */
export interface CompositeResult {
  /** Which AI model was used */
  model: CompositeModel;

  /** URL/data URL to the generated composite image (primary/first image) */
  imageUrl: string;

  /** Array of all generated image URLs (when num_outputs > 1) */
  imageUrls?: string[];

  /** Processing time in milliseconds */
  processingTime: number;

  /** Cost of this operation in USD */
  cost: number;

  /** Whether the operation succeeded */
  success: boolean;

  /** Error message if operation failed */
  error?: string;

  /** Additional metadata */
  metadata?: {
    predictionId?: string;
    resolution?: string;
    promptUsed?: string;
    mode?: string;
    imageInputCount?: number;
    numOutputs?: number;
  };
}

/**
 * Configuration for composition
 */
export interface CompositionConfig {
  /** Output resolution (1K, 2K, 4K) */
  resolution?: '1K' | '2K' | '4K';

  /** Positioning style */
  positioning?: 'side-by-side' | 'behind' | 'group';

  /** Image quality (0-100) */
  quality?: number;

  /** Custom prompt additions */
  customPrompt?: string;
}

/**
 * Progress callback signature
 */
export type ProgressCallback = (progress: number) => void;

/**
 * Abstract interface for photo composite services
 */
export interface CompositeService {
  compose(
    userImageDataUrl: string,
    celebrityImageUrl: string,
    celebrityName: string,
    onProgress?: ProgressCallback,
    config?: CompositionConfig,
    backgroundImageUrl?: string
  ): Promise<CompositeResult>;
}
```

### Gemini API Types

```typescript
// Gemini API specific types

export interface GeminiGenerationConfig {
  responseModalities: string[];  // ['TEXT', 'IMAGE']
  imageConfig: {
    imageSize: string;  // '1K', '2K', '4K'
  };
  thinkingConfig?: {
    thinkingBudget: number;
  };
}

export interface GeminiContentPart {
  text?: string;
  inlineData?: {
    mimeType: string;  // 'image/png', 'image/jpeg'
    data: string;      // base64 encoded image
  };
}

export interface GeminiContent {
  parts: GeminiContentPart[];
}

export interface GeminiRequest {
  contents: GeminiContent[];
  generationConfig: GeminiGenerationConfig;
}

export interface GeminiResponseCandidate {
  content: {
    parts: Array<{
      text?: string;
      inlineData?: {
        mimeType: string;
        data: string;
      };
    }>;
  };
}

export interface GeminiResponse {
  candidates: GeminiResponseCandidate[];
}

/**
 * API Error class for composite services
 */
export class CompositeAPIError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public model?: CompositeModel,
    public retryable: boolean = false
  ) {
    super(message);
    this.name = 'CompositeAPIError';
  }
}
```

---

## Core Service Implementation

### GoogleDirectNanoBananaService

```typescript
// src/services/composite/googleDirectNanoBanana.service.ts

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
import { retryWithBackoff, RetryPresets } from './retry.utils';

// Model identifier on Google API
const MODEL_NAME = 'gemini-3-pro-image-preview';

// API endpoint configuration
const USE_US_PROXY = import.meta.env.VITE_USE_CORS_PROXY === 'true';

/**
 * Get the proxy base URL (clean approach)
 * Expects a clean base URL like: https://us.api.example.com
 * Simply strips any trailing slash for consistent path building
 */
const getProxyBase = (): string => {
  const proxyUrl = import.meta.env.VITE_US_CORS_PROXY_URL || 'https://us.api.example.com';
  return proxyUrl.replace(/\/$/, ''); // Remove trailing slash only
};

// Build API endpoint: direct Google API or via US proxy
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

    // Calculate cost based on resolution
    const resolution = config?.resolution || '2K';
    const costPerImage = resolution === '4K' ? COST_PER_4K_IMAGE : COST_PER_1K_2K_IMAGE;
    const totalCost = costPerImage * NUM_OUTPUTS;

    console.log('[Google Direct] Starting composition...');
    console.log(`[Google Direct] Celebrity: ${celebrityName}`);
    console.log(`[Google Direct] Resolution: ${resolution}`);
    console.log(`[Google Direct] Cost: $${totalCost.toFixed(3)}`);

    try {
      onProgress?.(5);

      // Build your prompt here (see Prompt Building section)
      const prompt = this.buildPrompt(celebrityName, config);

      onProgress?.(15);

      // Convert data URL to base64
      const base64Image = this.dataUrlToBase64(userImageDataUrl);

      // Build request for Google API
      const request: GeminiRequest = {
        contents: [
          {
            parts: [
              { text: prompt },
              {
                inlineData: {
                  mimeType: 'image/png',
                  data: base64Image,
                },
              },
            ],
          },
        ],
        generationConfig: {
          responseModalities: ['TEXT', 'IMAGE'],
          imageConfig: {
            imageSize: this.mapResolution(resolution),
          },
        },
      };

      onProgress?.(20);

      // Submit to Google API with retry logic
      const response = await retryWithBackoff(
        async () => this.callGoogleAPI(request, onProgress),
        {
          ...RetryPresets.standard,
          onRetry: (attempt, error, delayMs) => {
            console.log(`[Google Direct] Retry attempt ${attempt} after ${(delayMs / 1000).toFixed(1)}s`);
            onProgress?.(20);
          },
        }
      );

      onProgress?.(85);

      // Extract images from response
      const imageDataUrls = this.extractImages(response);

      if (imageDataUrls.length === 0) {
        throw new CompositeAPIError(
          'No images generated by Google API',
          500,
          CompositeModel.GOOGLE_DIRECT
        );
      }

      const processingTime = Date.now() - startTime;
      onProgress?.(100);

      console.log(`[Google Direct] Completed in ${processingTime}ms`);

      return {
        model: CompositeModel.GOOGLE_DIRECT,
        imageUrl: imageDataUrls[0],
        imageUrls: imageDataUrls,
        processingTime,
        cost: totalCost,
        success: true,
        metadata: {
          resolution,
          promptUsed: prompt.substring(0, 200),
          numOutputs: imageDataUrls.length,
        },
      };
    } catch (error) {
      const processingTime = Date.now() - startTime;
      console.error('[Google Direct] Composition failed:', error);

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
          response.status >= 500 || response.status === 429 // Retryable
        );
      }

      const data: GeminiResponse = await response.json();
      onProgress?.(80);

      return data;
    } catch (error) {
      if (error instanceof CompositeAPIError) {
        throw error;
      }

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
      const candidates = response.candidates || [];

      for (const candidate of candidates) {
        const parts = candidate.content?.parts || [];

        for (const part of parts) {
          if (part.inlineData?.data && part.inlineData?.mimeType) {
            // Convert base64 back to data URL
            const dataUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
            images.push(dataUrl);
          }
        }
      }
    } catch (error) {
      console.error('[Google Direct] Failed to extract images:', error);
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
   * Map resolution format to Google's expected format
   */
  private mapResolution(resolution: string): '1K' | '2K' | '4K' {
    switch (resolution.toUpperCase()) {
      case '1K': return '1K';
      case '4K': return '4K';
      case '2K':
      default: return '2K';
    }
  }

  /**
   * Build prompt for image generation
   * Customize this for your use case
   */
  private buildPrompt(celebrityName: string, config?: CompositionConfig): string {
    // Your prompt logic here
    return `Your prompt with ${celebrityName}...`;
  }
}
```

---

## Prompt Building

### Basic Prompt Builder

```typescript
// src/services/composite/promptBuilder.ts

export function buildSelfiePrompt(celebrityName: string): string {
  return `[CRITICAL FACIAL PRESERVATION - HIGHEST PRIORITY]:
1. FREEZE FACIAL EXPRESSION: Lock the exact expression from the reference image.
2. STRICT ANATOMICAL LOCK: Preserve mouth position, lip shape, teeth visibility exactly.
3. IDENTITY ANCHOR: Replicate facial geometry, proportions, bone structure EXACTLY.

Ultra-realistic handheld selfie captured from a front-phone-camera perspective with ${celebrityName}.
The framing is a natural arm's-length handheld shot; the mobile phone itself is never visible.
POV selfie taken with a front-facing smartphone camera held at arm's length.
Wide-angle lens distortion with faces dominating the frame.

They are leaning in close to the camera next to me, naturally positioned, calm and charismatic expression.
Natural soft daylight with slight front-facing camera flash effect, realistic skin texture, sharp facial details.
Slight background blur (bokeh). High resolution, professional photography quality.

CRITICAL: The camera/phone device must never appear in frame.

[REINFORCEMENT - ORIGINAL PERSON PRESERVATION]:
The input person's face must remain EXACTLY as shown - same expression, same facial features.`;
}
```

### Celebrity-Specific Descriptions

```typescript
const CELEBRITY_DESCRIPTIONS: Record<string, { description: string; outfit: string }> = {
  'Taylor Swift': {
    description: 'world-famous blonde pop superstar with tall slender build (5\'11"/180cm)',
    outfit: 'tailored, oversized beige blazer over a simple black top',
  },
  'Lionel Messi': {
    description: 'legendary Argentine footballer with shorter athletic build (5\'7"/170cm)',
    outfit: 'casual button-down shirt in light blue',
  },
  // Add more celebrities...
};

function getCelebrityDetails(name: string) {
  return CELEBRITY_DESCRIPTIONS[name] || {
    description: `world-famous ${name}`,
    outfit: 'smart casual attire',
  };
}
```

---

## Retry Logic

### retry.utils.ts

```typescript
// src/services/composite/retry.utils.ts

interface RetryOptions {
  maxRetries: number;
  baseDelay: number; // milliseconds
  maxDelay: number;  // milliseconds
  onRetry?: (attempt: number, error: Error, delayMs: number) => void;
}

const DEFAULT_OPTIONS: RetryOptions = {
  maxRetries: 2,    // Total: 3 attempts
  baseDelay: 2000,  // Start with 2s
  maxDelay: 10000,  // Cap at 10s
};

function isRetryableError(error: Error): boolean {
  const message = error.message.toLowerCase();

  // Non-retryable errors
  if (message.includes('401') || message.includes('authentication')) return false;
  if (message.includes('404') || message.includes('not found')) return false;
  if (message.includes('429') || message.includes('rate limit')) return false;
  if (message.includes('400') || message.includes('validation')) return false;

  // Retryable errors
  if (message.includes('timeout') || message.includes('500') ||
      message.includes('502') || message.includes('503')) {
    return true;
  }

  return true; // Default: retry unknown errors
}

function calculateBackoff(attempt: number, baseDelay: number, maxDelay: number): number {
  const exponentialDelay = baseDelay * Math.pow(2, attempt - 1);
  return Math.min(exponentialDelay, maxDelay);
}

export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: Partial<RetryOptions> = {}
): Promise<T> {
  const config = { ...DEFAULT_OPTIONS, ...options };
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= config.maxRetries + 1; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      const isLastAttempt = attempt === config.maxRetries + 1;
      if (isLastAttempt || !isRetryableError(lastError)) {
        throw lastError;
      }

      const delayMs = calculateBackoff(attempt, config.baseDelay, config.maxDelay);
      console.log(`[Retry] Attempt ${attempt} failed, retrying in ${delayMs}ms...`);

      config.onRetry?.(attempt, lastError, delayMs);
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }

  throw lastError || new Error('Retry failed');
}

export const RetryPresets = {
  conservative: { maxRetries: 1, baseDelay: 1000, maxDelay: 2000 },
  standard: { maxRetries: 2, baseDelay: 2000, maxDelay: 10000 },
  aggressive: { maxRetries: 3, baseDelay: 2000, maxDelay: 15000 },
} as const;
```

---

## Service Factory Pattern

### Factory Function

```typescript
// src/services/composite/index.ts

import { GoogleDirectNanoBananaService } from './googleDirectNanoBanana.service';
import { CompositeModel, type CompositeService, type CompositeResult, type ProgressCallback, type CompositionConfig } from './types';

/**
 * Create a composite service instance
 */
export function createCompositeService(
  model: CompositeModel = CompositeModel.GOOGLE_DIRECT
): CompositeService {
  switch (model) {
    case CompositeModel.GOOGLE_DIRECT:
      console.log('[Composite] Creating Google Direct service');
      return new GoogleDirectNanoBananaService();

    default:
      throw new Error(`Unsupported model: ${model}`);
  }
}

/**
 * Convenience function for compositing
 */
export async function compositeWithGoogleDirect(
  userImageDataUrl: string,
  celebrityImageUrl: string,
  celebrityName: string,
  onProgress?: ProgressCallback,
  config?: CompositionConfig,
  backgroundImageUrl?: string
): Promise<CompositeResult> {
  const service = createCompositeService(CompositeModel.GOOGLE_DIRECT);

  try {
    return await service.compose(
      userImageDataUrl,
      celebrityImageUrl,
      celebrityName,
      onProgress,
      config,
      backgroundImageUrl
    );
  } catch (err: any) {
    return {
      model: CompositeModel.GOOGLE_DIRECT,
      imageUrl: '',
      processingTime: 0,
      cost: 0,
      success: false,
      error: err.message || 'Composition failed',
    };
  }
}

// Re-export types
export * from './types';
export { GoogleDirectNanoBananaService } from './googleDirectNanoBanana.service';
```

---

## Migration Checklist

### Files to Create

- [ ] `src/services/composite/types.ts` - Type definitions
- [ ] `src/services/composite/googleDirectNanoBanana.service.ts` - Main service
- [ ] `src/services/composite/retry.utils.ts` - Retry logic
- [ ] `src/services/composite/promptBuilder.ts` - Prompt generation
- [ ] `src/services/composite/index.ts` - Factory and exports

### Files to Modify

- [ ] `.env` - Add `VITE_GOOGLE_AI_STUDIO_API_KEY`
- [ ] Remove Replicate SDK dependency from `package.json`
- [ ] Update consuming components to use new service

### Files to Delete

- [ ] `src/services/replicate.service.ts` (if exists)
- [ ] `src/services/composite/replicateNanoBanana.service.ts` (if exists)
- [ ] `src/types/replicate.types.ts` (if exists)

### Environment Variables

```bash
# Remove these
VITE_REPLICATE_API_TOKEN=xxx  # DELETE

# Add/keep these
VITE_GOOGLE_AI_STUDIO_API_KEY=your_key
VITE_USE_CORS_PROXY=true  # If geo-blocked
VITE_US_CORS_PROXY_URL=https://your-proxy.com  # Clean base URL (no trailing slash, no /replicate/)
```

### npm Dependencies

```bash
# Remove Replicate
npm uninstall replicate

# No new dependencies needed for Google Direct API (uses native fetch)
```

---

## Testing & Validation

### Validation Commands

```bash
# TypeScript compilation check
npm run build

# Or explicit type check
npx tsc --noEmit

# Verify no Replicate imports remain
grep -r "from.*replicate" src/ --include="*.ts" --include="*.tsx" || echo "PASS: No replicate imports"

# Verify package.json cleaned
grep "replicate" package.json || echo "PASS: No replicate dependency"
```

### Manual Testing

1. Start dev server: `npm run dev`
2. Capture a selfie
3. Generate with a celebrity name
4. Verify:
   - Processing time ~20-40 seconds
   - Image generated successfully
   - Console shows "[Google Direct]" logs
   - No errors in console

### Test Cases

```typescript
// Test different scenarios
const testCases = [
  { celebrity: 'Taylor Swift', expectSuccess: true },
  { celebrity: 'Unknown Person', expectSuccess: true },  // Should work with generic prompt
  { celebrity: '', expectSuccess: false },  // Should handle gracefully
];
```

---

## Troubleshooting

### Common Errors

#### 1. "Google AI Studio API key not configured"

**Cause**: Missing `VITE_GOOGLE_AI_STUDIO_API_KEY` in `.env`

**Fix**: Add the API key to your `.env` file

#### 2. "HTTP 403: Forbidden" or Geo-blocking

**Cause**: Google API geo-restricted in your region (e.g., EU)

**Fix**:
- Set `VITE_USE_CORS_PROXY=true`
- Configure a US-based proxy server
- Set `VITE_US_CORS_PROXY_URL` to your proxy base URL (e.g., `https://us.api.example.com`)

#### 3. "No images generated by Google API"

**Cause**: Response doesn't contain expected image data

**Fix**:
- Check console for full API response
- Verify `generationConfig.responseModalities` includes `'IMAGE'`
- Check if content was blocked by safety filters

#### 4. "Invalid data URL format"

**Cause**: User image not in expected base64 data URL format

**Fix**: Ensure image is converted to data URL with format: `data:image/png;base64,<base64data>`

### Proxy Configuration (Nginx)

If you need a US proxy for geo-blocked regions:

```nginx
# /etc/nginx/conf.d/google-proxy.conf

server {
    listen 443 ssl;
    server_name your-proxy.com;

    location /google/ {
        # Remove /google/ prefix and forward to Google API
        rewrite ^/google/(.*)$ /$1 break;

        proxy_pass https://generativelanguage.googleapis.com;
        proxy_set_header Host generativelanguage.googleapis.com;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_ssl_server_name on;

        # CORS headers
        add_header 'Access-Control-Allow-Origin' '*' always;
        add_header 'Access-Control-Allow-Methods' 'GET, POST, OPTIONS' always;
        add_header 'Access-Control-Allow-Headers' 'Content-Type' always;
    }
}
```

---

## Cost Reference

| Resolution | Cost per Image | Notes |
|------------|----------------|-------|
| 1K | $0.134 | Good for thumbnails |
| 2K | $0.134 | Recommended default |
| 4K | $0.24 | High quality output |

**Processing Time**: 20-40 seconds (vs 60-90 seconds on Replicate)

---

## Summary

This migration replaces the Replicate proxy approach with direct Google Gemini API calls, resulting in:

1. **Faster processing**: 20-40s vs 60-90s
2. **Simpler architecture**: Direct API calls
3. **Lower latency**: No proxy overhead
4. **Comparable cost**: $0.13-0.24 vs $0.15

The key components are:
- `GoogleDirectNanoBananaService` - Main service class
- `GeminiRequest/GeminiResponse` types - API communication
- `retryWithBackoff` - Retry logic with exponential backoff
- Prompt builder - Customized prompts for your use case

For questions or issues, refer to the original implementation in `celeb-selfie` project.
