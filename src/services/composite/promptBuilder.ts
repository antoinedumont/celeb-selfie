/**
 * Prompt Builder Utility
 *
 * Generates ultra-realistic celebrity selfie prompts for text-based AI generation.
 * Uses proven template from successful generations.
 * Integrates with Gemini 3 for AI-powered prompt customization in freestyle mode.
 */

import type { CompositionConfig } from './types';
import type { PromptTemplate } from '../gemini3PromptGenerator.types';
import { generateCelebrityPromptWithGemini3 } from '../gemini3PromptGenerator.service';

/**
 * Celebrity-specific descriptions for natural integration
 * Based on distinctive features and typical appearance
 */
const CELEBRITY_DESCRIPTIONS: Record<string, { description: string; outfit: string }> = {
  'Taylor Swift': {
    description: 'world-famous blonde pop superstar known for her signature red lipstick and chic fringe bangs',
    outfit: 'tailored, oversized beige blazer over a simple black top',
  },
  'Lionel Messi': {
    description: 'legendary Argentine footballer with his distinctive short beard and athletic build',
    outfit: 'casual button-down shirt in light blue',
  },
  'Cristiano Ronaldo': {
    description: 'world-renowned Portuguese footballer known for his athletic physique and groomed appearance',
    outfit: 'fitted designer polo shirt',
  },
  'LeBron James': {
    description: 'towering NBA basketball icon known for his powerful presence and charismatic smile',
    outfit: 'premium athletic-style polo in dark colors',
  },
  'Beyoncé': {
    description: 'iconic performer known for her radiant smile, long flowing hair, and commanding presence',
    outfit: 'elegant blazer with subtle jewelry',
  },
  'Dwayne Johnson': {
    description: 'muscular actor and former wrestler known for his signature bald head and warm smile',
    outfit: 'fitted black t-shirt showing his athletic build',
  },
  'Barack Obama': {
    description: '44th U.S. President known for his distinguished appearance and warm, professional demeanor',
    outfit: 'crisp dress shirt with rolled-up sleeves',
  },
  'Elon Musk': {
    description: 'tech entrepreneur known for his casual style and forward-thinking presence',
    outfit: 'simple black t-shirt or casual blazer',
  },
  'Sam Altman': {
    description: 'OpenAI CEO known for his youthful appearance and tech industry presence',
    outfit: 'casual button-down shirt or tech-startup hoodie',
  },
  'Oprah Winfrey': {
    description: 'media mogul known for her warm smile, elegant style, and commanding presence',
    outfit: 'sophisticated blouse or tailored jacket',
  },
  'Albert Einstein': {
    description: 'legendary physicist with his iconic wild white hair and mustache',
    outfit: 'rumpled cardigan over a simple shirt',
  },
};

/**
 * Get celebrity-specific description or fallback to generic
 */
function getCelebrityDetails(celebrityName: string): { description: string; outfit: string } {
  return CELEBRITY_DESCRIPTIONS[celebrityName] || {
    description: `world-famous ${celebrityName}`,
    outfit: 'smart casual conference attire',
  };
}

/**
 * Static fallback template for freestyle mode
 * Used when Gemini 3 is unavailable or returns an error
 * Generates POV selfie prompts by default for authentic selfie experience
 */
function buildStaticFreestylePrompt(celebrityName: string): string {
  const prompt = `[CRITICAL FACIAL PRESERVATION - HIGHEST PRIORITY]:
1. FREEZE FACIAL EXPRESSION: Lock the exact expression from the reference image. If mouth is closed, keep it closed. If neutral, keep it neutral. If smiling, replicate the exact smile intensity. DO NOT alter expression to match scene mood or celebrity personality.
2. STRICT ANATOMICAL LOCK: Preserve mouth position (open/closed), lip shape, teeth visibility (show/hide), eye openness, eyebrow position, and facial muscle tension exactly as shown in reference. Clone every facial feature with photographic precision.
3. IDENTITY ANCHOR: The person's face is a non-negotiable visual constant. Replicate facial geometry, proportions, bone structure, skin texture, and all features EXACTLY. Zero modifications allowed.
4. OUTFIT PRESERVATION: Clone clothing, fabric textures, colors, patterns, and accessories exactly as shown. DO NOT change attire to match environment or scene context.
5. NEGATIVE CONSTRAINTS: DO NOT add smiles if face is neutral. DO NOT open mouth if lips are closed. DO NOT show teeth if mouth is closed. DO NOT change facial muscle engagement. DO NOT modify clothing style or add accessories.

Ultra-realistic handheld selfie captured from a front-phone-camera perspective with ${celebrityName}. The framing is a natural arm's-length handheld shot; the mobile phone itself is never visible. POV selfie taken with a front-facing smartphone camera held at arm's length. Wide-angle lens distortion with faces dominating the frame in tight close-up framing typical of authentic POV selfies. They are leaning in close to the camera next to me, naturally positioned, calm and charismatic expression, very recognizable facial features. They are wearing a simple, elegant outfit. Natural soft daylight with slight front-facing camera flash effect, realistic skin texture, sharp facial details, true-to-life colors. Slight background blur (bokeh), in their favorite city. The photo feels spontaneous, candid, and genuine, like a real moment captured casually with intimate selfie framing. High resolution, professional photography quality, with slight wide-angle perspective distortion.

CRITICAL: The camera/phone device must never appear in frame - this is a photo taken FROM the phone perspective, not OF someone holding a phone. The photo is captured BY a smartphone camera, not OF a smartphone camera.

High-resolution 8k photorealistic style, 24mm wide-angle selfie lens distortion, and a shallow depth of field (bokeh) where the subjects are sharp and the background is slightly soft.

[REINFORCEMENT - ORIGINAL PERSON PRESERVATION]:
REMINDER: The input person's face must remain EXACTLY as shown - same expression level, same mouth state (open/closed), same facial features, same clothing. This is a NON-NEGOTIABLE requirement that takes absolute precedence over scene context.`;

  return prompt;
}

/**
 * Build freestyle celebrity selfie prompt for casual, authentic generation
 *
 * This mode generates spontaneous, personal-looking POV selfies without booth context.
 * Uses POV (Point-of-View) selfie template by default for authentic selfie experience.
 * No conference lanyards, no Go1 branding, no event background.
 * Focus is on authenticity and casual spontaneity in the celebrity's favorite city.
 *
 * Uses Gemini 3 AI to generate celebrity-specific prompts with detailed context.
 * Returns both JSON template (for Replicate API) and natural language (for display).
 * Always uses POV selfie template for close-up, intimate framing.
 *
 * @param celebrityName - Name of the celebrity to include in the selfie
 * @returns Promise with JSON template and natural language prompt
 */
export async function buildFreestyleSelfiePrompt(
  celebrityName: string
): Promise<{ jsonTemplate: PromptTemplate | null; naturalLanguage: string; source: 'gemini3' | 'static' }> {
  console.log(`[Prompt Builder] Building freestyle prompt for: ${celebrityName}`);

  try {
    // Try Gemini 3 first
    const geminiResult = await generateCelebrityPromptWithGemini3(celebrityName);

    if (geminiResult) {
      console.log('[Prompt Builder] Using Gemini 3 generated prompt');
      return {
        jsonTemplate: geminiResult.jsonTemplate,
        naturalLanguage: geminiResult.naturalLanguage,
        source: 'gemini3',
      };
    }
  } catch (error) {
    console.warn('[Prompt Builder] Gemini 3 generation failed:', error);
  }

  // Fallback to static template
  console.log('[Prompt Builder] Using static template (Gemini 3 unavailable)');
  return {
    jsonTemplate: null,
    naturalLanguage: buildStaticFreestylePrompt(celebrityName),
    source: 'static',
  };
}

/**
 * Build ultra-realistic celebrity selfie prompt for text-based generation
 *
 * This prompt uses multi-image composition with simplified structure.
 * The AI models receive both images (user selfie + booth template) via
 * input_images/image_input arrays, but the prompt references them generically
 * as "the reference image" rather than "image 1" and "image 2".
 *
 * Based on successful Jacques Chirac and Cristiano Ronaldo prompt tests,
 * optimized for Learning Technologies Paris exhibition (Porte de Versailles).
 *
 * The prompt starts with "adapt it for [celebrity name]" prefix to guide
 * the AI model in generating the specific celebrity requested.
 *
 * @param celebrityName - Name of the celebrity to include in the selfie
 * @param config - Optional configuration for customization
 * @returns Simplified prompt matching the successful Replicate test format
 */
export function buildCelebritySelfiePrompt(
  celebrityName: string,
  config?: CompositionConfig
): string {
  const { description, outfit } = getCelebrityDetails(celebrityName);

  const prompt = `adapt it for ${celebrityName}

[CRITICAL FACIAL PRESERVATION - HIGHEST PRIORITY]:
1. FREEZE FACIAL EXPRESSION: Lock the exact expression from the reference image. If mouth is closed, keep it closed. If neutral, keep it neutral. If smiling, replicate the exact smile intensity. DO NOT alter expression to match scene mood, conference setting, or celebrity personality.
2. STRICT ANATOMICAL LOCK: Preserve mouth position (open/closed), lip shape, teeth visibility (show/hide), eye openness, eyebrow position, and facial muscle tension exactly as shown in reference. Clone every facial feature with photographic precision.
3. IDENTITY ANCHOR: The person's face is a non-negotiable visual constant. Replicate facial geometry, proportions, bone structure, skin texture, and all features EXACTLY. Zero modifications allowed.
4. OUTFIT PRESERVATION: Clone the person's current clothing, fabric textures, colors, patterns, and accessories exactly as shown. DO NOT change their attire to match the conference setting or add conference accessories (like lanyards) to this person.
5. NEGATIVE CONSTRAINTS: DO NOT add smiles if face is neutral. DO NOT open mouth if lips are closed. DO NOT show teeth if mouth is closed. DO NOT change facial muscle engagement. DO NOT modify their clothing style or add conference accessories to them.

The Scene: Ultra-realistic handheld selfie captured from a front-phone-camera perspective at the Learning Technologies Paris exhibition (Porte de Versailles). The framing is a natural arm's-length handheld shot; the mobile phone itself is never visible.

The Celebrity Guest: ${description}. They are standing shoulder-to-shoulder with me, naturally positioned and leaning into the frame for a spontaneous moment. They MUST be wearing a purple-and-white conference lanyard around their neck with a clear plastic badge holder visible.

The Go1 Paris Booth (Visual Match): The background is a precise replica of the Go1 stand from the reference image.

Foreground: The suspended Go1 banner is on the frame

Environment: The floor is light wood-grain laminate. Above us, the dark industrial ceiling of the hall is visible with silver lighting trusses and hanging purple "Learning Technologies" banners.

The Technical Detail: The lighting is a realistic mix of the booth's warm yellow glow and the bright, cool-toned overhead exhibition hall LEDs. This creates authentic skin textures, minor imperfections, and a slight glint on the lanyard plastic. High-resolution 8k photorealistic style, 24mm wide-angle selfie lens distortion, and a shallow depth of field (bokeh) where the subjects are sharp and the booth background is slightly soft. No phone visible.

[REINFORCEMENT - ORIGINAL PERSON PRESERVATION]:
REMINDER: The input person's face and clothing must remain EXACTLY as shown - same expression level, same mouth state (open/closed), same facial features, same outfit. This is NON-NEGOTIABLE and takes absolute precedence over conference context.`;

  return prompt;
}
