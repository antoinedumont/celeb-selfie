/**
 * Gemini 3 Prompt Generator Service
 *
 * Uses Google AI Studio API (Gemini 3) to generate celebrity-specific
 * prompts by filling a structured JSON template with contextual details.
 *
 * Features:
 * - Sends JSON template to Gemini 3 for celebrity-specific completion
 * - Returns both JSON template (for Replicate API) and natural language (for display)
 * - Caches results to reduce API calls and costs
 * - Graceful fallback to static templates
 */

import type {
  PromptTemplate,
  Gemini3Request,
  Gemini3Response,
  Gemini3APIError as Gemini3Error,
} from './gemini3PromptGenerator.types';
import { isValidPromptTemplate, extractPlaceholders } from './gemini3PromptGenerator.types';
import { getCachedPrompt, setCachedPrompt } from '../utils/promptCache.utils';
import { detectPOVSelfie } from '../utils/povDetection.utils';

// Google AI Studio API configuration
// Using Gemini 2.5 Flash for fast, cost-effective prompt generation
const GEMINI_API_ENDPOINT = 'https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent';
const REQUEST_TIMEOUT_MS = 10000; // 10 seconds
const MAX_RETRIES = 2;

/**
 * Base JSON template for celebrity selfie prompts
 * Placeholders will be filled by Gemini 3
 */
export const BASE_JSON_TEMPLATE: PromptTemplate = {
  task: 'edit_image',
  scene_description: {
    camera_perspective: 'third_person_view',
    action: 'person taking a selfie with celebrity',
    original_person: {
      identity: 'the person from the input image',
      pose: 'MANDATORY: Keep the EXACT same outfit, hairstyle, and facial expression as the original photo. DO NOT change the person\'s clothing style or appearance to match any scene or environment.',
      visual_integrity: 'STRICTLY UNALTERED: Zero modifications to the person\'s physical appearance, clothing textures, or style. This person must look EXACTLY as they appear in the input image.',
    },
    celebrity: {
      name: '<CELEBRITY_NAME>',
      role_context: '<ICONIC_ROLE_OR_JOB>',
      position: 'standing naturally next to original person for a selfie',
    },
    environment: {
      setting_name: '<ICONIC_SETTING>',
      location_details: '<SPECIFIC_ENVIRONMENT_DETAILS>',
      thematic_elements: '<KEY_PROPS_OR_BACKGROUND_FEATURES>',
    },
  },
  visual_style: {
    realism: 'photorealistic',
    lighting: 'natural to the specific environment',
    shadows: 'physically accurate and consistent',
    depth_and_scale: 'realistic proportions for all subjects and the background',
  },
  result_description:
    "A seamless, photorealistic photo captured from a third-person perspective, showing the original person and the celebrity interacting. The background is the celebrity's most iconic professional environment, replacing the original background entirely. CRITICAL: The original person must maintain their EXACT appearance from the input image - same clothes, same hair, same everything.",
};

/**
 * POV Selfie Template for front-facing camera perspective
 * Used when user requests a POV selfie (detected via keywords)
 */
export const POV_SELFIE_TEMPLATE: PromptTemplate = {
  task: 'edit_image',
  scene_description: {
    camera_perspective: 'front-facing_camera_selfie_POV',
    action: 'selfie with arm extended holding camera at natural distance',
    original_person: {
      identity: 'the person from the input image',
      pose: 'MANDATORY: Keep the EXACT same outfit, hairstyle, and facial expression as the original photo. DO NOT change the person\'s clothing style or appearance to match any scene or environment.',
      visual_integrity: 'STRICTLY UNALTERED: Zero modifications to the person\'s physical appearance, clothing textures, or style. This person must look EXACTLY as they appear in the input image.',
    },
    celebrity: {
      name: '<CELEBRITY_NAME>',
      role_context: '<ICONIC_ROLE_OR_JOB>',
      position: 'leaning in close to the camera next to original person for an intimate selfie',
    },
    environment: {
      setting_name: '<ICONIC_SETTING>',
      location_details: '<SPECIFIC_ENVIRONMENT_DETAILS>',
      thematic_elements: '<KEY_PROPS_OR_BACKGROUND_FEATURES>',
    },
    lens_effect: 'Wide-angle lens distortion typical of smartphone front cameras, creating slight fisheye effect where faces appear slightly larger in the center. CRITICAL: This photo is captured BY a smartphone camera, not OF a smartphone camera.',
    composition: 'Faces dominate the frame entirely, showing only head and shoulders in tight framing. Both people\'s faces take up most of the image space.',
    phone_visibility: 'CRITICAL: The mobile phone/camera device must NEVER be visible in the frame. The photo is taken from the phone\'s perspective, but the phone itself is completely out of frame. This is a photo taken FROM the phone, not a photo OF someone holding a phone.',
    framing_rules: 'Natural arm\'s-length handheld shot captured from front-facing camera perspective. The phone is held by the photographer but remains entirely outside the visible frame. The framing is a natural arm\'s-length handheld shot; the mobile phone itself is never visible.',
  },
  visual_style: {
    realism: 'photorealistic',
    lighting: 'natural to the specific environment with slight front-facing camera flash effect',
    shadows: 'physically accurate and consistent',
    depth_and_scale: 'realistic proportions for all subjects and the background, with slight wide-angle perspective distortion',
  },
  result_description:
    "A seamless, photorealistic POV selfie taken with a front-facing smartphone camera. The original person and the celebrity are standing together in natural selfie framing, with both faces clearly visible and comfortably composed in the frame. The background is the celebrity's iconic professional environment, but slightly blurred due to the selfie focus. CRITICAL: The original person must maintain their EXACT appearance from the input image - same clothes, same hair, same everything. This is NOT a photo taken by a third person - it is a POV selfie with the camera held at arm's length. The mobile phone itself is never visible - this is a photo taken FROM the phone, not a photo OF someone holding a phone.",
};

/**
 * Convert JSON template to natural language prompt for display/learning
 * Users can see what prompt is being sent to the image generation AI
 *
 * @param template - Filled PromptTemplate
 * @returns Natural language description
 */
export function convertJsonTemplateToNaturalLanguage(template: PromptTemplate): string {
  const { scene_description, visual_style, result_description } = template;
  const { celebrity, environment, original_person } = scene_description;

  const prompt = `
${result_description}

Scene Setup:
The photo shows ${original_person.identity} with ${celebrity.name} (${celebrity.role_context}). ${celebrity.position}.

CRITICAL - Original Person Preservation:
${original_person.pose}
${original_person.visual_integrity}

Environment:
The setting is ${environment.setting_name}. ${environment.location_details}. The scene features ${environment.thematic_elements}.
${scene_description.lens_effect ? `\nLens Effect:\n${scene_description.lens_effect}` : ''}
${scene_description.composition ? `\nComposition:\n${scene_description.composition}` : ''}
${scene_description.phone_visibility ? `\nPhone Visibility:\n${scene_description.phone_visibility}` : ''}
${scene_description.framing_rules ? `\nFraming Rules:\n${scene_description.framing_rules}` : ''}

Visual Style:
- ${visual_style.realism} quality
- ${visual_style.lighting}
- ${visual_style.shadows}
- ${visual_style.depth_and_scale}

Camera Perspective: ${scene_description.camera_perspective}
Action: ${scene_description.action}
`.trim();

  return prompt;
}

/**
 * Get API key from environment
 */
function getApiKey(): string | null {
  return import.meta.env.VITE_GOOGLE_AI_STUDIO_API_KEY || null;
}

/**
 * Make request to Gemini 3 API with timeout and retry logic
 */
async function makeGeminiRequest(
  request: Gemini3Request,
  retryCount: number = 0
): Promise<Gemini3Response> {
  const apiKey = getApiKey();

  if (!apiKey) {
    throw new Error('Google AI Studio API key not configured');
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(`${GEMINI_API_ENDPOINT}?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        `Gemini API error: ${response.status} - ${errorData.error?.message || response.statusText}`
      );
    }

    const data: Gemini3Response = await response.json();
    return data;
  } catch (error: any) {
    clearTimeout(timeoutId);

    // Retry on transient errors
    if (retryCount < MAX_RETRIES && (error.name === 'AbortError' || error.message.includes('fetch'))) {
      console.log(`[Gemini3] Retry ${retryCount + 1}/${MAX_RETRIES} after error:`, error.message);
      await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
      return makeGeminiRequest(request, retryCount + 1);
    }

    throw error;
  }
}

/**
 * Generate celebrity-specific prompt using Gemini 3
 *
 * @param celebrityName - Name of the celebrity
 * @returns Object with JSON template and natural language prompt
 */
export async function generateCelebrityPromptWithGemini3(
  celebrityName: string
): Promise<{ jsonTemplate: PromptTemplate; naturalLanguage: string } | null> {
  console.log(`[Gemini3] ========================================`);
  console.log(`[Gemini3] Generating prompt for: ${celebrityName}`);
  console.log(`[Gemini3] API Key configured: ${!!getApiKey()}`);

  // Always use POV selfie template by default for authentic selfie experience
  const templateToUse = POV_SELFIE_TEMPLATE;
  console.log(`[Gemini3] Using POV selfie template (default)`);

  // Check cache first
  const cached = getCachedPrompt(celebrityName);
  if (cached) {
    console.log('[Gemini3] ✅ Using cached prompt');
    return {
      jsonTemplate: cached.jsonTemplate,
      naturalLanguage: cached.prompt,
    };
  }

  // Check if API key is configured
  const apiKey = getApiKey();
  if (!apiKey) {
    console.warn('[Gemini3] ⚠️ API key not configured, skipping generation');
    return null;
  }

  console.log(`[Gemini3] API Key: ${apiKey.substring(0, 10)}...`);

  try {
    // Clone template and set celebrity name
    const templateCopy = JSON.parse(JSON.stringify(templateToUse));
    templateCopy.scene_description.celebrity.name = celebrityName;

    // Build meta-prompt for Gemini 3
    const metaPrompt = `Adapt this prompt for: ${celebrityName}

IMPORTANT: The input may contain both a celebrity name AND context (e.g., "Taylor Swift at concert", "Elon Musk in SpaceX factory").
Parse the input to identify:
1. The celebrity's actual name (e.g., "Taylor Swift", "Elon Musk")
2. Any context clues about setting/activity (e.g., "at concert", "in SpaceX factory", "playing tennis")

Fill in the placeholders in this JSON template:
- Replace <CELEBRITY_NAME> with the celebrity's full name only (extract from the input, remove context)
- Replace <ICONIC_ROLE_OR_JOB> with their most famous role or profession, influenced by any context provided
- Replace <ICONIC_SETTING> with the most appropriate setting based on the context OR their iconic environment if no context
- Replace <SPECIFIC_ENVIRONMENT_DETAILS> with vivid, detailed description of that setting
- Replace <KEY_PROPS_OR_BACKGROUND_FEATURES> with relevant props and features for that environment

Examples:
- Input: "Taylor Swift at concert" → Setting: concert stage with lights and audience
- Input: "Elon Musk in SpaceX factory" → Setting: SpaceX manufacturing facility with rockets
- Input: "Serena Williams" → Setting: professional tennis court (use default iconic setting)

CRITICAL CONSTRAINT - Phone Visibility:
The mobile phone/camera device must NEVER appear in the generated image.
This is a photo taken FROM a front-facing smartphone camera perspective, not a photo OF someone holding a phone.
The phone is held at arm's length by the photographer but remains completely outside the visible frame.
The framing is a natural arm's-length handheld shot; the mobile phone itself is never visible.

Return ONLY the completed JSON object with all placeholders filled. Do not include any explanation or additional text.

JSON Template:
${JSON.stringify(templateCopy, null, 2)}`;

    console.log('[Gemini3] Sending request to Google AI Studio...');

    // Make API request
    const request: Gemini3Request = {
      contents: [
        {
          parts: [{ text: metaPrompt }],
        },
      ],
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 2048,
      },
    };

    const response = await makeGeminiRequest(request);

    // Extract text from response
    if (!response.candidates || response.candidates.length === 0) {
      throw new Error('No candidates in Gemini response');
    }

    const textResponse = response.candidates[0]?.content?.parts?.[0]?.text;
    if (!textResponse) {
      throw new Error('No text in Gemini response');
    }

    console.log('[Gemini3] Received response, parsing JSON...');

    // Extract JSON from response (handle markdown code blocks)
    let jsonText = textResponse.trim();
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/```\n?/g, '');
    }

    // Parse JSON
    const filledTemplate: PromptTemplate = JSON.parse(jsonText);

    // Validate template
    if (!isValidPromptTemplate(filledTemplate)) {
      const placeholders = extractPlaceholders(filledTemplate);
      throw new Error(`Invalid template: still contains placeholders: ${placeholders.join(', ')}`);
    }

    console.log('[Gemini3] ✅ Template validated successfully');
    console.log(`[Gemini3] ✅ Celebrity: ${filledTemplate.scene_description.celebrity.name}`);
    console.log(`[Gemini3] ✅ Role: ${filledTemplate.scene_description.celebrity.role_context}`);
    console.log(`[Gemini3] ✅ Setting: ${filledTemplate.scene_description.environment.setting_name}`);
    console.log(`[Gemini3] ✅ Props: ${filledTemplate.scene_description.environment.thematic_elements}`);

    // Convert to natural language for display
    const naturalLanguage = convertJsonTemplateToNaturalLanguage(filledTemplate);

    // Cache the result
    setCachedPrompt(celebrityName, naturalLanguage, filledTemplate);

    return {
      jsonTemplate: filledTemplate,
      naturalLanguage,
    };
  } catch (error: any) {
    console.error('[Gemini3] ❌ Error generating prompt:', error);
    console.error('[Gemini3] ❌ Error message:', error.message);
    console.error('[Gemini3] ⚠️ Will fall back to static template');
    return null;
  }
}

