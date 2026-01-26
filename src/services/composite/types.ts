/**
 * Photo Composite Service Types
 *
 * Defines interfaces and types for AI-powered photo compositing services.
 * Architecture supports multiple AI models (Nano Banana Pro, PhotoMaker, etc.)
 */

import type { CelebrityGenerationMode } from '../../types';
import type { FacialExpressionAnalysis } from '../../types/facialExpression.types';

/**
 * Supported AI models for photo compositing
 * Uses Google AI Studio API directly via US proxy
 */
export enum CompositeModel {
  GOOGLE_DIRECT = 'google-direct',
}

/**
 * Result from a photo composition operation
 */
export interface CompositeResult {
  /** Which AI model was used */
  model: CompositeModel;

  /** URL to the generated composite image (primary/first image) */
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

  /** Background composition mode */
  backgroundMode?: 'two-person' | 'three-person-with-background';

  /** Additional context for background scene */
  backgroundContext?: string;

  /** Use text-prompt mode instead of image composition for celebrity generation */
  useTextPromptMode?: boolean;

  /** Generation mode: booth-focused (go1) or casual freestyle */
  generationMode?: CelebrityGenerationMode;

  /** Facial expression analysis for accurate expression preservation */
  facialExpression?: FacialExpressionAnalysis;
}

/**
 * Progress callback signature
 */
export type ProgressCallback = (progress: number) => void;

/**
 * Abstract interface for photo composite services
 * All AI model integrations must implement this interface
 */
export interface CompositeService {
  /**
   * Compose a photo with user and celebrity
   *
   * @param userImageDataUrl - User's photo as data URL (base64)
   * @param celebrityImageUrl - Celebrity image URL or data URL
   * @param celebrityName - Name of the celebrity for prompt
   * @param onProgress - Optional callback for progress updates (0-100)
   * @param config - Optional configuration
   * @param backgroundImageUrl - Optional background scene image URL or data URL for three-image composition
   * @returns Promise resolving to composite result
   */
  compose(
    userImageDataUrl: string,
    celebrityImageUrl: string,
    celebrityName: string,
    onProgress?: ProgressCallback,
    config?: CompositionConfig,
    backgroundImageUrl?: string
  ): Promise<CompositeResult>;
}

/**
 * Gemini API specific types
 */

export interface GeminiGenerationConfig {
  responseModalities: string[];
  imageConfig: {
    imageSize: string;
    aspectRatio?: string;
  };
  thinkingConfig?: {
    thinkingBudget: number;
  };
}

export interface GeminiContentPart {
  text?: string;
  inlineData?: {
    mimeType: string;
    data: string; // base64 encoded
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
