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
      pose: 'FREEZE FACIAL EXPRESSION: Lock the exact expression from reference. If mouth is closed, keep closed. If neutral, stay neutral. If smiling, match exact smile intensity. MANDATORY: Keep EXACT same outfit, hairstyle, and facial expression. DO NOT alter expression to match scene mood or celebrity personality.',
      visual_integrity: 'ANATOMICAL LOCK: Preserve mouth position (open/closed), lip shape, teeth visibility, eye openness, eyebrow position, facial muscle tension exactly as shown. Clone every facial feature with photographic precision. STRICTLY UNALTERED: Zero modifications to physical appearance, clothing textures, expression level, or style.',
      expression_priority: 'HIGHEST PRIORITY: User\'s facial expression takes absolute precedence over scene context. NEGATIVE CONSTRAINTS: DO NOT add smiles if neutral. DO NOT open mouth if closed. DO NOT show teeth if mouth closed. DO NOT modify facial muscle engagement or clothing style.',
    },
    celebrity: {
      name: '<CELEBRITY_NAME>',
      role_context: '<ICONIC_ROLE_OR_JOB>',
      position: 'standing naturally beside the original person with comfortable spacing, shoulders may touch but heads are 15-20cm apart, like a typical fan photo',
      physical_description: '<PHYSICAL_APPEARANCE_DETAILS>',
    },
    environment: {
      setting_name: '<ICONIC_SETTING>',
      location_details: '<SPECIFIC_ENVIRONMENT_DETAILS>',
      thematic_elements: '<KEY_PROPS_OR_BACKGROUND_FEATURES>',
    },
    height_proportions: 'Preserve realistic height differences between original person and celebrity based on their actual heights. Taller person naturally appears with head higher in frame, shorter person with head lower. DO NOT artificially equalize heights.',
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
    camera_perspective: 'close-up_selfie_POV',
    action: 'close-up selfie with natural arm-length framing',
    original_person: {
      identity: 'the person from the input image',
      pose: 'FREEZE FACIAL EXPRESSION: Lock the exact expression from reference. If mouth is closed, keep closed. If neutral, stay neutral. If smiling, match exact smile intensity. MANDATORY: Keep EXACT same outfit, hairstyle, and facial expression. DO NOT alter expression to match scene mood or celebrity personality.',
      visual_integrity: 'ANATOMICAL LOCK: Preserve mouth position (open/closed), lip shape, teeth visibility, eye openness, eyebrow position, facial muscle tension exactly as shown. Clone every facial feature with photographic precision. STRICTLY UNALTERED: Zero modifications to physical appearance, clothing textures, expression level, or style.',
      expression_priority: 'HIGHEST PRIORITY: User\'s facial expression takes absolute precedence over scene context. NEGATIVE CONSTRAINTS: DO NOT add smiles if neutral. DO NOT open mouth if closed. DO NOT show teeth if mouth closed. DO NOT modify facial muscle engagement or clothing style.',
    },
    celebrity: {
      name: '<CELEBRITY_NAME>',
      role_context: '<ICONIC_ROLE_OR_JOB>',
      position: 'standing naturally beside the original person at arm\'s length, with comfortable 15-20cm spacing between heads, like a real fan-celebrity encounter selfie',
      physical_description: '<PHYSICAL_APPEARANCE_DETAILS>',
    },
    environment: {
      setting_name: '<ICONIC_SETTING>',
      location_details: '<SPECIFIC_ENVIRONMENT_DETAILS>',
      thematic_elements: '<KEY_PROPS_OR_BACKGROUND_FEATURES>',
    },
    lens_effect: 'Wide-angle 24mm lens distortion creating slight fisheye effect where faces appear slightly larger in the center.',
    composition: 'Faces dominate the frame entirely, showing only head and shoulders in tight close-up framing. Both people\'s faces take up most of the image space.',
    framing_rules: 'Natural arm\'s-length framing. Intimate close-up composition typical of authentic selfies.',
    height_proportions: 'Preserve realistic height differences between original person and celebrity based on their actual heights. Taller person naturally appears with head higher in frame, shorter person with head lower. DO NOT artificially equalize heights.',
  },
  visual_style: {
    realism: 'photorealistic',
    lighting: 'natural to the specific environment with slight flash effect',
    shadows: 'physically accurate and consistent',
    depth_and_scale: 'realistic proportions for all subjects and the background, with slight wide-angle perspective distortion',
  },
  result_description:
    "A seamless, photorealistic close-up selfie. The original person and the celebrity are standing together in natural selfie framing, with both faces clearly visible and dominating the frame. The background is the celebrity's iconic professional environment, slightly blurred (bokeh). CRITICAL: The original person must maintain their EXACT appearance from the input image - same clothes, same hair, same everything.",
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
${celebrity.physical_description ? `\nCelebrity Appearance:\n${celebrity.physical_description}` : ''}

CRITICAL - Original Person Preservation:
${original_person.pose}
${original_person.visual_integrity}
${original_person.expression_priority ? `\n${original_person.expression_priority}` : ''}
${scene_description.height_proportions ? `\nHeight Proportions:\n${scene_description.height_proportions}` : ''}

Environment:
The setting is ${environment.setting_name}. ${environment.location_details}. The scene features ${environment.thematic_elements}.
${scene_description.lens_effect ? `\nLens Effect:\n${scene_description.lens_effect}` : ''}
${scene_description.composition ? `\nComposition:\n${scene_description.composition}` : ''}
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

CRITICAL FACIAL PRESERVATION RULES (HIGHEST PRIORITY):
When filling this template, ensure the original person's facial expression is preserved EXACTLY:
- If their mouth is closed in the reference, the prompt must maintain closed mouth
- If their expression is neutral, do NOT add smiles or positive emotions
- Expression takes precedence over scene context (neutral face in happy scene = neutral face)
- The person's appearance is a LOCKED CONSTANT, never modified for scene coherence
- DO NOT suggest modifying their expression, smile, mouth state, or facial features

CRITICAL HEIGHT & PROPORTION PRESERVATION:
When filling the template, preserve realistic height and size differences:
- If the celebrity is notably tall (6'0"+/183cm+), their head should appear higher in frame
- If the celebrity is notably short (under 5'7"/170cm), their head should appear lower in frame
- In POV selfies, taller people naturally appear slightly above eye level
- Shoulder heights should reflect actual height differences
- DO NOT artificially equalize heights - preserve natural proportions
- Camera angle may naturally tilt slightly up/down based on height differences

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
- Replace <PHYSICAL_APPEARANCE_DETAILS> with detailed physical description of the celebrity:
  * Height & Build: CRITICAL - RESEARCH AND INCLUDE THE CELEBRITY'S ACTUAL HEIGHT:
    - Use your knowledge of the celebrity's real-world height
    - Include BOTH metric (cm) and imperial (feet/inches) measurements
    - Describe how this affects their presence relative to average person (170cm/5'7"):
      - Very tall (190cm+/6'3"+): "very tall imposing presence (HEIGHT), towers over most people"
      - Tall (180-189cm/5'11"-6'2"): "tall build (HEIGHT), stands notably above average"
      - Average (170-179cm/5'7"-5'10"): "average height (HEIGHT), similar height to most people"
      - Shorter (160-169cm/5'3"-5'6"): "shorter stature (HEIGHT), below average height"
      - Very short (<160cm/<5'3"): "petite build (HEIGHT), notably shorter than most"
    - THIS HEIGHT WILL AFFECT HOW THE SELFIE IS COMPOSED - taller celebrities appear with head higher in frame
  * Hair: color, length, style, distinctive features (e.g., "blonde hair with signature bangs", "short dark hair")
  * Face: shape, distinctive features, typical expression (e.g., "fair complexion", "athletic facial structure")
  * Signature look: fashion style, typical outfit choices (e.g., "elegant feminine style with sophisticated dresses", "casual tech entrepreneur aesthetic")
  * Distinguishing marks: notable accessories, signature items (e.g., "red lipstick", "signature tattoos")

Physical Description Examples (WITH ACTUAL RESEARCHED HEIGHTS):
- "Taylor Swift" → "tall slender build (180cm/5'11"), stands above average height, blonde hair with signature bangs, fair complexion, red lipstick, elegant feminine style"
- "Elon Musk" → "tall lean build (188cm/6'2"), notably taller than average, short dark hair, clean-shaven or light stubble, tech entrepreneur aesthetic"
- "Serena Williams" → "tall athletic build (175cm/5'9"), powerful presence, natural curly hair often in braids, confident expression"
- "Danny DeVito" → "very short stature (147cm/4'10"), compact build, notably shorter than most people, bald, expressive face"
- "LeBron James" → "very tall imposing presence (206cm/6'9"), towers over most people, muscular athletic build, short hair"

Examples:
- Input: "Taylor Swift at concert" → Setting: concert stage with lights and audience
- Input: "Elon Musk in SpaceX factory" → Setting: SpaceX manufacturing facility with rockets
- Input: "Serena Williams" → Setting: professional tennis court (use default iconic setting)

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
    console.log(`[Gemini3] ✅ Physical: ${filledTemplate.scene_description.celebrity.physical_description}`);
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

