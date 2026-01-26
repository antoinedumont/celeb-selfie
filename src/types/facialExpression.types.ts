/**
 * Facial Expression Analysis Types
 *
 * Defines types for analyzing and preserving user facial expressions
 * during celebrity selfie generation.
 */

/**
 * Smile types detected in facial analysis
 */
export type SmileType =
  | 'NO_SMILE'
  | 'SLIGHT_SMILE'
  | 'MODERATE_SMILE'
  | 'BROAD_SMILE'
  | 'TEETH_SHOWING_SMILE';

/**
 * Mouth position states
 */
export type MouthPosition =
  | 'CLOSED'
  | 'SLIGHTLY_OPEN'
  | 'OPEN'
  | 'WIDE_OPEN';

/**
 * Primary emotion detected
 */
export type EmotionType =
  | 'NEUTRAL'
  | 'HAPPY'
  | 'SURPRISED'
  | 'SERIOUS'
  | 'THOUGHTFUL'
  | 'EXCITED';

/**
 * Teeth visibility state
 */
export type TeethVisibility =
  | 'NOT_VISIBLE'
  | 'SLIGHTLY_VISIBLE'
  | 'VISIBLE'
  | 'PROMINENTLY_VISIBLE';

/**
 * Eye state
 */
export type EyeState =
  | 'FULLY_OPEN'
  | 'RELAXED'
  | 'SLIGHTLY_SQUINTED'
  | 'SQUINTED';

/**
 * Complete facial expression analysis result
 */
export interface FacialExpressionAnalysis {
  /** Type of smile detected */
  smileType: SmileType;

  /** Mouth position state */
  mouthPosition: MouthPosition;

  /** Primary emotion detected */
  emotion: EmotionType;

  /** Teeth visibility state */
  teethVisibility: TeethVisibility;

  /** Eye state */
  eyeState: EyeState;

  /** Detailed natural language description for prompt injection */
  detailedDescription: string;

  /** Confidence score (0-1) */
  confidence: number;

  /** Timestamp of analysis */
  analyzedAt: number;
}

/**
 * Cache entry for facial expression analysis
 */
export interface FacialExpressionCacheEntry {
  /** Hash of the image data URL */
  imageHash: string;

  /** Analysis result */
  analysis: FacialExpressionAnalysis;

  /** Expiration timestamp */
  expiresAt: number;
}
