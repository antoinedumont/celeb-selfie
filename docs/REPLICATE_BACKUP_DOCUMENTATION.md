# Replicate API Integration - Backup Documentation

> **Purpose**: This document contains all information needed to restore Replicate API functionality if needed in the future.
>
> **Date Created**: 2026-01-21
> **Reason for Removal**: Simplified architecture to use Google Direct API only (faster: 20-40s vs 60-90s)

---

## Table of Contents

1. [Overview](#overview)
2. [Environment Variables](#environment-variables)
3. [Files to Restore](#files-to-restore)
4. [Core Services](#core-services)
5. [UI Components](#ui-components)
6. [Types and Interfaces](#types-and-interfaces)
7. [CORS Proxy Configuration](#cors-proxy-configuration)
8. [Nginx Configuration](#nginx-configuration)
9. [Dependencies](#dependencies)
10. [Restoration Steps](#restoration-steps)

---

## Overview

The Replicate API integration provided:
- **Nano Banana Pro** model access via Replicate proxy
- **Face Swap** functionality (deprecated feature)
- **Dual API selection** UI allowing users to choose between Replicate and Google Direct
- **CORS proxy** infrastructure for browser-based API calls
- **Automatic failover** between US and France proxy servers

### Cost Comparison (at time of removal)

| API | Cost/Image | Speed | Reliability |
|-----|------------|-------|-------------|
| **Replicate** | $0.15 | 60-90s | Battle-tested |
| **Google Direct** | $0.13-0.24 | 20-40s | Fast & reliable |

---

## Environment Variables

Add these to `.env` to restore Replicate functionality:

```bash
# Replicate API Token
# Get from: https://replicate.com/account/api-tokens
VITE_REPLICATE_API_TOKEN=r8_your_token_here

# CORS Proxy Configuration (required for browser-based Replicate calls)
VITE_USE_CORS_PROXY=true
VITE_US_CORS_PROXY_URL=https://us.api.tmtprod.com/replicate/
VITE_CORS_PROXY_URL=https://api.tmtprod.com/replicate/
```

---

## Files to Restore

### Core Service Files

| File | Purpose | Lines |
|------|---------|-------|
| `src/services/replicate.service.ts` | Face swap via Replicate SDK | 264 |
| `src/services/composite/replicate.utils.ts` | Unified Replicate API utilities | 567 |
| `src/services/composite/replicateNanoBanana.service.ts` | Nano Banana Pro via Replicate | 242 |
| `src/services/composite/retry.utils.ts` | Retry logic with backoff | ~170 |

### Type Definition Files

| File | Purpose |
|------|---------|
| `src/types/replicate.types.ts` | Replicate API response types |

### UI Components

| File | Purpose |
|------|---------|
| `src/components/ApiSelector.tsx` | Toggle between Replicate/Google Direct |

### Hooks

| File | Purpose |
|------|---------|
| `src/hooks/useFaceSwap.ts` | React hook for face swap (deprecated) |

### Configuration

| File | Purpose |
|------|---------|
| `nginx-replicate-proxy.conf` | Nginx reverse proxy config for VPS |

---

## Core Services

### 1. replicate.service.ts (Face Swap - Deprecated)

```typescript
/**
 * Face Swap Service using Replicate's face-swap model
 *
 * Key exports:
 * - ReplicateAPIError: Custom error class
 * - createFaceSwapPrediction(): Create prediction
 * - waitForPrediction(): Poll for completion
 * - performFaceSwap(): Complete workflow
 * - getSessionStats(): Cost tracking
 */

import Replicate from 'replicate';
import type {
  ReplicatePrediction,
  FaceSwapInput,
  PredictionStatus,
} from '../types/replicate.types';

// Model configuration
const FACE_SWAP_MODEL = {
  version: 'c2d783366e8d32e6e82c40682fab6b4c23b9c6eff2692c2cf7580a5ca6854bdc',
  maxWaitTime: 120000, // 2 minutes
  pollInterval: 1500, // 1.5 seconds
};

// Cost tracking
const COST_PER_PREDICTION = 0.003;

export class ReplicateAPIError extends Error {
  constructor(
    message: string,
    public code: string,
    public retryable: boolean = true
  ) {
    super(message);
    this.name = 'ReplicateAPIError';
  }
}

const validateEnvironment = (): void => {
  const token = import.meta.env.VITE_REPLICATE_API_TOKEN;
  if (!token || token === 'your_replicate_api_token_here') {
    throw new ReplicateAPIError(
      'Replicate API token not configured. Please set VITE_REPLICATE_API_TOKEN in your .env file.',
      'CONFIG_ERROR',
      false
    );
  }
};

const getReplicateClient = (): Replicate => {
  validateEnvironment();
  const token = import.meta.env.VITE_REPLICATE_API_TOKEN;
  return new Replicate({ auth: token });
};

export const createFaceSwapPrediction = async (
  userImageDataUrl: string,
  celebrityImageUrl: string
): Promise<ReplicatePrediction> => {
  const replicate = getReplicateClient();

  const input: FaceSwapInput = {
    input_image: celebrityImageUrl,
    swap_image: userImageDataUrl,
  };

  const prediction = await replicate.predictions.create({
    version: FACE_SWAP_MODEL.version,
    input,
  });

  return prediction as ReplicatePrediction;
};

export const waitForPrediction = async (
  predictionId: string,
  onProgress?: (status: PredictionStatus, progress: number) => void
): Promise<FaceSwapResult> => {
  // Implementation polls until completion
  // See full file for details
};

export const performFaceSwap = async (
  userImageDataUrl: string,
  celebrityImageUrl: string,
  onProgress?: (status: PredictionStatus, progress: number) => void
): Promise<FaceSwapResult> => {
  const prediction = await createFaceSwapPrediction(userImageDataUrl, celebrityImageUrl);
  return waitForPrediction(prediction.id, onProgress);
};
```

### 2. replicate.utils.ts (Unified API Utilities)

```typescript
/**
 * Replicate API Utilities
 *
 * Shared utilities for interacting with Replicate API:
 * - CORS proxy support with automatic failover
 * - Prefer: wait header for synchronous experience
 * - Timeout protection with AbortController
 * - Image fetching from replicate.delivery CDN
 */

// Configuration
export const REPLICATE_API_TOKEN = import.meta.env.VITE_REPLICATE_API_TOKEN || '';
export const REPLICATE_BASE_URL = 'https://api.replicate.com/v1';

// Timeouts
const DEFAULT_FETCH_TIMEOUT = 300000; // 5 minutes
const POLL_FETCH_TIMEOUT = 30000; // 30 seconds
const IMAGE_FETCH_TIMEOUT = 60000; // 60 seconds

// Key functions:
export function getAuthHeader(): Record<string, string>;
export async function submitPrediction(modelPath, input, onProgress?): Promise<ReplicatePrediction>;
export async function fetchImageAsDataUrl(url: string): Promise<string>;
export function extractImageUrl(output): string;

// Internal functions:
async function submitPredictionWithProxy(modelPath, input, proxyUrl, onProgress?);
async function cancelPrediction(predictionId: string): Promise<void>;
async function pollPrediction(predictionId, onProgress?): Promise<ReplicatePrediction>;
```

### 3. replicateNanoBanana.service.ts

```typescript
/**
 * Replicate Nano Banana Pro Service
 *
 * Implements Google's Nano Banana Pro (Gemini) via Replicate API.
 * Model: google/nano-banana-pro
 * Cost: $0.15 per image
 * Processing: 30-60 seconds with Prefer: wait
 */

const MODEL_PATH = 'google/nano-banana-pro';
const COST_PER_IMAGE = 0.15;
const NUM_OUTPUTS = 2;

export class ReplicateNanoBananaService implements CompositeService {
  private boothTemplateDataUrl: string | null = null;

  async compose(
    userImageDataUrl: string,
    celebrityImageUrl: string,
    celebrityName: string,
    onProgress?: ProgressCallback,
    config?: CompositionConfig,
    backgroundImageUrl?: string
  ): Promise<CompositeResult> {
    // 1. Build prompt (freestyle or go1 mode)
    // 2. Prepare input with image_input array
    // 3. Submit prediction with retry logic
    // 4. Fetch images and convert to data URLs
    // 5. Return CompositeResult
  }

  private mapResolution(resolution: string): '1K' | '2K' | '4K';
}
```

---

## UI Components

### ApiSelector.tsx

```typescript
/**
 * API Selector Component
 *
 * Features:
 * - Visual toggle between Replicate and Google Direct
 * - Shows cost and speed for each API
 * - Persists selection to localStorage
 * - Key: 'celeb-selfie-api-mode'
 */

interface ApiSelectorProps {
  value: ApiMode;
  onChange: (mode: ApiMode) => void;
  disabled?: boolean;
}

export function ApiSelector({ value, onChange, disabled }: ApiSelectorProps);
export function loadApiMode(): ApiMode; // Loads from localStorage, defaults to 'replicate'
```

**Visual Layout:**
- Two side-by-side cards (mobile: stacked)
- Replicate: Purple theme, lightning icon
- Google Direct: Blue theme, sparkle icon
- Selected state: colored border + "Selected" badge
- Stats: Cost, Speed, Status for each

---

## Types and Interfaces

### replicate.types.ts

```typescript
export type PredictionStatus =
  | 'starting'
  | 'processing'
  | 'succeeded'
  | 'failed'
  | 'canceled';

export interface FaceSwapInput {
  input_image: string;  // Celebrity photo
  swap_image: string;   // User photo
}

export interface PredictionMetrics {
  predict_time?: number;
  total_time?: number;
}

export interface ReplicatePrediction {
  id: string;
  version: string;
  status: PredictionStatus;
  input: FaceSwapInput;
  output?: string | string[] | null;
  error?: string | null;
  logs?: string;
  metrics?: PredictionMetrics;
  created_at: string;
  started_at?: string;
  completed_at?: string;
}

export interface ReplicateServiceConfig {
  apiToken: string;
  modelVersion: string;
  timeout?: number;
  maxRetries?: number;
}
```

### composite/types.ts (Replicate-specific parts)

```typescript
export enum CompositeModel {
  NANO_BANANA_PRO = 'nano-banana-pro', // Replicate
  GOOGLE_DIRECT = 'google-direct',     // Keep
  // ...
}

export type ApiMode = 'replicate' | 'google-direct';

// In CompositeResult.metadata:
apiMode?: ApiMode;

// In CompositionConfig:
selectedApiMode?: ApiMode;
```

---

## CORS Proxy Configuration

### corsProxy.ts (Replicate-specific parts)

```typescript
/**
 * CORS Proxy for Replicate API
 *
 * Browser can't call api.replicate.com directly due to CORS.
 * Routes through proxy servers:
 * - Primary: US proxy (us.api.tmtprod.com)
 * - Fallback: France proxy (api.tmtprod.com)
 */

// Key functions:
export function isProxyEnabled(): boolean;
export function getProxyUrls(): string[]; // Returns [US, France]
export function getCorsProxyUrl(url: string): string;
export function getCorsProxyUrlWithProxy(url: string, proxyUrl: string): string;
export function recordProxySuccess(proxyUrl: string): void;
export function recordProxyFailure(proxyUrl: string): void;

// Proxy health tracking:
interface ProxyHealth {
  successCount: number;
  failureCount: number;
  lastSuccess: number | null;
  lastFailure: number | null;
}
```

---

## Nginx Configuration

### nginx-replicate-proxy.conf

```nginx
server {
    server_name us.api.tmtprod.com;

    # Allow large image uploads (base64 encoded)
    client_max_body_size 100M;

    # Replicate API proxy
    location /replicate/ {
        # Hide upstream CORS headers to prevent duplicates
        proxy_hide_header Access-Control-Allow-Origin;
        proxy_hide_header Access-Control-Allow-Methods;
        proxy_hide_header Access-Control-Allow-Headers;
        proxy_hide_header Access-Control-Max-Age;

        # Proxy to Replicate API
        rewrite ^/replicate/(.*) /$1 break;
        proxy_pass https://api.replicate.com;
        proxy_set_header Host api.replicate.com;
        proxy_set_header Authorization $http_authorization;
        proxy_ssl_server_name on;

        # CORS headers
        add_header 'Access-Control-Allow-Origin' '*' always;
        add_header 'Access-Control-Allow-Methods' 'GET, POST, OPTIONS, PUT, DELETE' always;
        add_header 'Access-Control-Allow-Headers' 'Authorization, Content-Type, Accept, Prefer, x-goog-api-key' always;
        add_header 'Access-Control-Max-Age' '86400' always;

        # Handle preflight requests
        if ($request_method = 'OPTIONS') {
            add_header 'Access-Control-Allow-Origin' '*' always;
            add_header 'Access-Control-Allow-Methods' 'GET, POST, OPTIONS, PUT, DELETE' always;
            add_header 'Access-Control-Allow-Headers' 'Authorization, Content-Type, Accept, Prefer, x-goog-api-key' always;
            add_header 'Access-Control-Max-Age' '86400' always;
            add_header 'Content-Type' 'text/plain charset=UTF-8';
            add_header 'Content-Length' '0';
            return 204;
        }

        # Proxy settings
        proxy_http_version 1.1;
        proxy_set_header Connection "";
        proxy_buffering off;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }
}
```

**Deployment Location**: `/etc/nginx/sites-available/api-proxy` on VPS 76.13.97.11

---

## Dependencies

### package.json

```json
{
  "dependencies": {
    "replicate": "^1.4.0"
  }
}
```

**Installation**: `npm install replicate`

---

## Restoration Steps

### 1. Install Dependencies

```bash
npm install replicate
```

### 2. Restore Environment Variables

Add to `.env`:
```bash
VITE_REPLICATE_API_TOKEN=r8_your_token_here
VITE_USE_CORS_PROXY=true
VITE_US_CORS_PROXY_URL=https://us.api.tmtprod.com/replicate/
VITE_CORS_PROXY_URL=https://api.tmtprod.com/replicate/
```

### 3. Restore Files

Copy all files from this backup or git history:
- `src/services/replicate.service.ts`
- `src/services/composite/replicate.utils.ts`
- `src/services/composite/replicateNanoBanana.service.ts`
- `src/types/replicate.types.ts`
- `src/components/ApiSelector.tsx`
- `src/hooks/useFaceSwap.ts`

### 4. Update Type Definitions

In `src/services/composite/types.ts`:

```typescript
// Add to CompositeModel enum:
NANO_BANANA_PRO = 'nano-banana-pro',

// Add ApiMode type:
export type ApiMode = 'replicate' | 'google-direct';

// Add to CompositeResult.metadata:
apiMode?: ApiMode;

// Add to CompositionConfig:
selectedApiMode?: ApiMode;
```

### 5. Update Factory

In `src/services/composite/index.ts`:

```typescript
import { ReplicateNanoBananaService } from './replicateNanoBanana.service';

// Add case to createCompositeService:
case CompositeModel.NANO_BANANA_PRO:
  return new ReplicateNanoBananaService();

// Add compositeWithNanoBanana function
// Export ReplicateNanoBananaService
```

### 6. Update App.tsx

```typescript
import { ApiSelector, loadApiMode } from './components/ApiSelector';
import { compositeWithNanoBanana, compositeWithGoogleDirect, ApiMode } from './services/composite';

// Add state:
const [apiMode, setApiMode] = useState<ApiMode>(() => loadApiMode());

// Add ApiSelector to JSX:
<ApiSelector value={apiMode} onChange={setApiMode} disabled={isGenerating} />

// Update generation logic to check apiMode and call appropriate function
```

### 7. Verify VPS Proxy

Ensure nginx is configured on VPS with `/replicate/` path:

```bash
ssh root@76.13.97.11
nginx -t
systemctl status nginx
curl -I https://us.api.tmtprod.com/replicate/
```

### 8. Test

1. Start dev server: `npm run dev`
2. Select "Replicate API" in API selector
3. Generate a celebrity selfie
4. Verify it works via US proxy

---

## Git History Reference

To restore files from git history:

```bash
# Find the commit before removal
git log --oneline --all -- src/services/replicate.service.ts

# Restore a specific file from commit
git checkout <commit-hash> -- src/services/replicate.service.ts
```

---

## Contact & Resources

- **Replicate API Docs**: https://replicate.com/docs
- **Nano Banana Pro Model**: https://replicate.com/google/nano-banana-pro
- **API Token**: https://replicate.com/account/api-tokens
- **VPS (US Proxy)**: 76.13.97.11 (us.api.tmtprod.com)

---

*This documentation was generated on 2026-01-21 to preserve all Replicate integration details before removal.*
