/**
 * Type definitions for Gemini 3 Prompt Generator Service
 *
 * Defines interfaces for Google AI Studio API integration and
 * structured JSON template for celebrity prompt generation.
 */

/**
 * Structured JSON template for celebrity selfie prompts
 * Uses placeholders that Gemini 3 will fill with celebrity-specific details
 */
export interface PromptTemplate {
  task: string;
  scene_description: {
    camera_perspective: string;
    action: string;
    original_person: {
      identity: string;
      pose: string;
      visual_integrity: string;
      expression_priority?: string;
    };
    celebrity: {
      name: string;
      role_context: string;
      position: string;
      physical_description?: string;
    };
    environment: {
      setting_name: string;
      location_details: string;
      thematic_elements: string;
    };
    lens_effect?: string;
    composition?: string;
    /** Framing rules: Defines the natural arm's-length framing */
    framing_rules?: string;
    /** Phone visibility rules: POV selfies should NOT show phone/arm */
    phone_visibility?: string;
    /** Height proportion preservation instructions */
    height_proportions?: string;
  };
  visual_style: {
    realism: string;
    lighting: string;
    shadows: string;
    depth_and_scale: string;
  };
  result_description: string;
}

/**
 * Google AI Studio API request structure
 */
export interface Gemini3Request {
  contents: Gemini3Content[];
  generationConfig?: Gemini3GenerationConfig;
}

/**
 * Content structure for Gemini 3 API
 */
export interface Gemini3Content {
  parts: Gemini3ContentPart[];
  role?: string;
}

/**
 * Individual content part (text or inline data)
 */
export interface Gemini3ContentPart {
  text?: string;
  inlineData?: {
    mimeType: string;
    data: string;
  };
}

/**
 * Generation configuration parameters
 */
export interface Gemini3GenerationConfig {
  temperature?: number;
  topK?: number;
  topP?: number;
  maxOutputTokens?: number;
  stopSequences?: string[];
}

/**
 * Google AI Studio API response structure
 */
export interface Gemini3Response {
  candidates: Gemini3Candidate[];
  promptFeedback?: {
    blockReason?: string;
    safetyRatings?: any[];
  };
}

/**
 * Response candidate structure
 */
export interface Gemini3Candidate {
  content: {
    parts: Array<{
      text?: string;
    }>;
    role: string;
  };
  finishReason?: string;
  index?: number;
  safetyRatings?: any[];
}

/**
 * Cache entry structure for storing generated prompts
 */
export interface PromptCacheEntry {
  celebrityName: string;
  prompt: string;
  jsonTemplate: PromptTemplate;
  timestamp: number;
  templateVersion: string;
}

/**
 * Custom error class for Gemini 3 API errors
 */
export class Gemini3APIError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public retryable: boolean = false
  ) {
    super(message);
    this.name = 'Gemini3APIError';
  }
}

/**
 * Type guard to validate PromptTemplate structure
 * Ensures all required fields are present and no placeholders remain
 */
export function isValidPromptTemplate(obj: any): obj is PromptTemplate {
  if (!obj || typeof obj !== 'object') {
    return false;
  }

  // Check required top-level fields
  if (!obj.task || !obj.scene_description || !obj.visual_style || !obj.result_description) {
    return false;
  }

  // Check scene_description structure
  const scene = obj.scene_description;
  if (!scene.camera_perspective || !scene.action || !scene.original_person || !scene.celebrity || !scene.environment) {
    return false;
  }

  // Check celebrity fields
  if (!scene.celebrity.name || !scene.celebrity.role_context || !scene.celebrity.position) {
    return false;
  }

  // Check environment fields
  if (!scene.environment.setting_name || !scene.environment.location_details || !scene.environment.thematic_elements) {
    return false;
  }

  // Check visual_style fields
  const style = obj.visual_style;
  if (!style.realism || !style.lighting || !style.shadows || !style.depth_and_scale) {
    return false;
  }

  // Check for remaining placeholders (should be filled by Gemini)
  const jsonString = JSON.stringify(obj);
  const hasPlaceholders = jsonString.includes('<') && jsonString.includes('>');

  if (hasPlaceholders) {
    console.warn('[PromptTemplate Validation] Template still contains placeholders');
    return false;
  }

  return true;
}

/**
 * Extracts placeholder tags from template for debugging
 */
export function extractPlaceholders(template: any): string[] {
  const jsonString = JSON.stringify(template);
  const placeholderRegex = /<([^>]+)>/g;
  const matches = jsonString.match(placeholderRegex) || [];
  return matches;
}
