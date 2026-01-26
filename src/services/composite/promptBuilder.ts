/**
 * Prompt Builder Utility
 *
 * Generates ultra-realistic celebrity selfie prompts for text-based AI generation.
 * Uses proven template from successful generations.
 * Integrates with Gemini 3 for AI-powered prompt customization in freestyle mode.
 */

import type { CompositionConfig } from './types';
import type { PromptTemplate } from '../gemini3PromptGenerator.types';
import type { FacialExpressionAnalysis } from '../../types/facialExpression.types';
import { generateCelebrityPromptWithGemini3 } from '../gemini3PromptGenerator.service';

/**
 * Celebrity-specific descriptions for natural integration
 * Based on distinctive features and typical appearance
 * Heights researched from reliable sources (Wikipedia, CelebHeights.com)
 */
const CELEBRITY_DESCRIPTIONS: Record<string, { description: string; outfit: string }> = {
  'Taylor Swift': {
    description: 'world-famous blonde pop superstar with tall slender build (5\'11"/180cm), known for her signature red lipstick and chic fringe bangs',
    outfit: 'tailored, oversized beige blazer over a simple black top',
  },
  'Lionel Messi': {
    description: 'legendary Argentine footballer with shorter athletic build (5\'7"/170cm), compact powerful physique, his distinctive short beard',
    outfit: 'casual button-down shirt in light blue',
  },
  'Cristiano Ronaldo': {
    description: 'world-renowned Portuguese footballer with tall athletic build (6\'2"/188cm), imposing presence, known for his athletic physique and groomed appearance',
    outfit: 'fitted designer polo shirt',
  },
  'LeBron James': {
    description: 'towering NBA basketball icon with very tall powerful build (6\'9"/206cm), towering presence, known for his powerful physique and charismatic smile',
    outfit: 'premium athletic-style polo in dark colors',
  },
  'Beyoncé': {
    description: 'iconic performer with average height and powerful stage presence (5\'7"/170cm), known for her radiant smile, long flowing hair, and commanding presence',
    outfit: 'elegant blazer with subtle jewelry',
  },
  'Dwayne Johnson': {
    description: 'muscular actor and former wrestler with very tall muscular build (6\'5"/196cm), towering imposing presence, signature bald head and warm smile',
    outfit: 'fitted black t-shirt showing his athletic build',
  },
  'Barack Obama': {
    description: '44th U.S. President with tall distinguished presence (6\'1"/185cm), known for his warm, professional demeanor',
    outfit: 'crisp dress shirt with rolled-up sleeves',
  },
  'Elon Musk': {
    description: 'tech entrepreneur with tall lean build (6\'2"/188cm), known for his casual style and forward-thinking presence',
    outfit: 'simple black t-shirt or casual blazer',
  },
  'Sam Altman': {
    description: 'OpenAI CEO with average height build (5\'9"/175cm), known for his youthful appearance and tech industry presence',
    outfit: 'casual button-down shirt or tech-startup hoodie',
  },
  'Oprah Winfrey': {
    description: 'media mogul with average height commanding presence (5\'7"/170cm), known for her warm smile and elegant style',
    outfit: 'sophisticated blouse or tailored jacket',
  },
  'Albert Einstein': {
    description: 'legendary physicist with average height build and distinctive posture (5\'9"/175cm), iconic wild white hair and mustache',
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
 * Build facial expression injection block for prompts
 * Creates a high-weight instruction block based on analyzed expression
 */
function buildFacialExpressionBlock(facialExpression?: FacialExpressionAnalysis): string {
  if (!facialExpression) {
    return '';
  }

  return `
[ANALYZED FACIAL EXPRESSION - WEIGHT: 10/10 - MANDATORY]:
${facialExpression.detailedDescription}
This analysis was performed on the input photo. You MUST replicate these EXACT characteristics.
`;
}

/**
 * Static fallback template for freestyle mode
 * Used when Gemini 3 is unavailable or returns an error
 * Generates POV selfie prompts by default for authentic selfie experience
 */
function buildStaticFreestylePrompt(celebrityName: string, facialExpression?: FacialExpressionAnalysis): string {
  const facialBlock = buildFacialExpressionBlock(facialExpression);

  const prompt = `[CRITICAL FACIAL PRESERVATION - HIGHEST PRIORITY]:
1. FREEZE FACIAL EXPRESSION: Lock the exact expression from the reference image. If mouth is closed, keep it closed. If neutral, keep it neutral. If smiling, replicate the exact smile intensity. DO NOT alter expression to match scene mood or celebrity personality.
2. STRICT ANATOMICAL LOCK: Preserve mouth position (open/closed), lip shape, teeth visibility (show/hide), eye openness, eyebrow position, and facial muscle tension exactly as shown in reference. Clone every facial feature with photographic precision.
3. IDENTITY ANCHOR: The person's face is a non-negotiable visual constant. Replicate facial geometry, proportions, bone structure, skin texture, and all features EXACTLY. Zero modifications allowed.
4. OUTFIT PRESERVATION: Clone clothing, fabric textures, colors, patterns, and accessories exactly as shown. DO NOT change attire to match environment or scene context.
5. NEGATIVE CONSTRAINTS: DO NOT add smiles if face is neutral. DO NOT open mouth if lips are closed. DO NOT show teeth if mouth is closed. DO NOT change facial muscle engagement. DO NOT modify clothing style or add accessories.
6. HEIGHT & PROPORTION PRESERVATION: Preserve realistic height differences between the original person and celebrity. If the celebrity is notably tall (e.g., basketball player), their face/head should appear naturally higher in the frame. If celebrity is shorter, their face should appear lower. DO NOT artificially equalize heights - maintain natural proportions.
${facialBlock}
NATURAL SELFIE SPACING: Do NOT press heads together. Maintain realistic distance between faces (15-20cm apart) as seen in real celebrity fan photos.

Ultra-realistic selfie with ${celebrityName}. Natural arm's-length framing typical of authentic selfies. Wide-angle 24mm lens distortion. They are standing naturally beside me at a comfortable distance, heads about 15-20cm apart like a real fan selfie, calm and charismatic expression, very recognizable facial features. They are wearing a simple, elegant outfit. Natural soft daylight with slight flash effect, realistic skin texture, sharp facial details, true-to-life colors. Slight background blur (bokeh), in their favorite city. The photo feels spontaneous, candid, and genuine, like a real casual encounter photo. High resolution, professional photography quality.

High-resolution 8k photorealistic style, shallow depth of field (bokeh) where the subjects are sharp and the background is slightly soft.

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
 * @param facialExpression - Optional analyzed facial expression for accurate preservation
 * @returns Promise with JSON template and natural language prompt
 */
export async function buildFreestyleSelfiePrompt(
  celebrityName: string,
  facialExpression?: FacialExpressionAnalysis
): Promise<{ jsonTemplate: PromptTemplate | null; naturalLanguage: string; source: 'gemini3' | 'static' }> {
  console.log(`[Prompt Builder] Building freestyle prompt for: ${celebrityName}`);
  if (facialExpression) {
    console.log(`[Prompt Builder] With facial expression: ${facialExpression.emotion}, ${facialExpression.smileType}`);
  }

  try {
    // Try Gemini 3 first
    const geminiResult = await generateCelebrityPromptWithGemini3(celebrityName);

    if (geminiResult) {
      console.log('[Prompt Builder] Using Gemini 3 generated prompt');

      // Inject facial expression into the generated prompt
      let naturalLanguage = geminiResult.naturalLanguage;
      if (facialExpression) {
        const facialBlock = buildFacialExpressionBlock(facialExpression);
        // Insert facial expression block after the first line
        const firstLineEnd = naturalLanguage.indexOf('\n');
        if (firstLineEnd > 0) {
          naturalLanguage = naturalLanguage.slice(0, firstLineEnd) + facialBlock + naturalLanguage.slice(firstLineEnd);
        } else {
          naturalLanguage = facialBlock + '\n' + naturalLanguage;
        }
      }

      return {
        jsonTemplate: geminiResult.jsonTemplate,
        naturalLanguage,
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
    naturalLanguage: buildStaticFreestylePrompt(celebrityName, facialExpression),
    source: 'static',
  };
}

/**
 * Build Go1 booth selfie prompt for conference-branded generation
 *
 * This mode generates selfies at the Go1 booth with conference branding,
 * lanyards, and Learning Technologies Paris exhibition setting.
 * Uses async pattern to match freestyle mode's interface.
 *
 * @param celebrityName - Name of the celebrity to include in the selfie
 * @param facialExpression - Optional analyzed facial expression for accurate preservation
 * @returns Promise with natural language prompt and source indicator
 */
export async function buildGo1BoothSelfiePrompt(
  celebrityName: string,
  facialExpression?: FacialExpressionAnalysis
): Promise<{ jsonTemplate: PromptTemplate | null; naturalLanguage: string; source: 'static' }> {
  console.log(`[Prompt Builder] Building Go1 booth prompt for: ${celebrityName}`);
  if (facialExpression) {
    console.log(`[Prompt Builder] With facial expression: ${facialExpression.emotion}, ${facialExpression.smileType}`);
  }

  // Use the existing Go1 booth prompt template
  const prompt = buildCelebritySelfiePrompt(celebrityName, undefined, facialExpression);

  return {
    jsonTemplate: null,
    naturalLanguage: prompt,
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
 * @param facialExpression - Optional analyzed facial expression for accurate preservation
 * @returns Simplified prompt matching the successful Replicate test format
 */
function buildCelebritySelfiePrompt(
  celebrityName: string,
  config?: CompositionConfig,
  facialExpression?: FacialExpressionAnalysis
): string {
  const { description, outfit } = getCelebrityDetails(celebrityName);
  const facialBlock = buildFacialExpressionBlock(facialExpression);

  const prompt = `adapt it for ${celebrityName}

[CRITICAL FACIAL PRESERVATION - HIGHEST PRIORITY]:
1. FREEZE FACIAL EXPRESSION: Lock the exact expression from the reference image. If mouth is closed, keep it closed. If neutral, keep it neutral. If smiling, replicate the exact smile intensity. DO NOT alter expression to match scene mood, conference setting, or celebrity personality.
2. STRICT ANATOMICAL LOCK: Preserve mouth position (open/closed), lip shape, teeth visibility (show/hide), eye openness, eyebrow position, and facial muscle tension exactly as shown in reference. Clone every facial feature with photographic precision.
3. IDENTITY ANCHOR: The person's face is a non-negotiable visual constant. Replicate facial geometry, proportions, bone structure, skin texture, and all features EXACTLY. Zero modifications allowed.
4. OUTFIT PRESERVATION: Clone the person's current clothing, fabric textures, colors, patterns, and accessories exactly as shown. DO NOT change their attire to match the conference setting or add conference accessories (like lanyards) to this person.
5. NEGATIVE CONSTRAINTS: DO NOT add smiles if face is neutral. DO NOT open mouth if lips are closed. DO NOT show teeth if mouth is closed. DO NOT change facial muscle engagement. DO NOT modify their clothing style or add conference accessories to them.
${facialBlock}
NATURAL SELFIE SPACING: Do NOT press heads together. Maintain realistic distance between faces (15-20cm apart) as seen in real conference photos with celebrities.

The Scene: Ultra-realistic selfie at the Learning Technologies Paris exhibition (Porte de Versailles). Natural arm's-length framing typical of conference photos.

The Celebrity Guest: ${description}. They are standing beside me with natural spacing, heads comfortably apart (15-20cm) like a real conference photo, naturally positioned based on their actual height (respect height differences - taller celebrities naturally appear taller in frame). They MUST be wearing a purple-and-white conference lanyard around their neck with a clear plastic badge holder visible.

The Go1 Paris Booth (Visual Match): The background is a precise replica of the Go1 stand from the reference image.

Foreground: The suspended Go1 banner is on the frame

Environment: The floor is light wood-grain laminate. Above us, the dark industrial ceiling of the hall is visible with silver lighting trusses and hanging purple "Learning Technologies" banners.

The Technical Detail: The lighting is a realistic mix of the booth's warm yellow glow and the bright, cool-toned overhead exhibition hall LEDs. This creates authentic skin textures, minor imperfections, and a slight glint on the lanyard plastic. High-resolution 8k photorealistic style, 24mm wide-angle selfie lens distortion, and a shallow depth of field (bokeh) where the subjects are sharp and the booth background is slightly soft.

Height Proportions: Preserve realistic height differences between the original person and ${celebrityName}. Their relative heights should reflect natural physical proportions. Taller celebrities should appear with head naturally higher in frame, shorter celebrities with head lower. DO NOT artificially equalize heights.

[REINFORCEMENT - ORIGINAL PERSON PRESERVATION]:
REMINDER: The input person's face and clothing must remain EXACTLY as shown - same expression level, same mouth state (open/closed), same facial features, same outfit. This is NON-NEGOTIABLE and takes absolute precedence over conference context.`;

  return prompt;
}
