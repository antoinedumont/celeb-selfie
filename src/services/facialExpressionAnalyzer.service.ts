/**
 * Facial Expression Analyzer Service
 *
 * Analyzes user photos using Gemini Vision API to extract detailed
 * facial expression information for accurate preservation during
 * celebrity selfie generation.
 *
 * Features:
 * - Detects smile type, mouth position, emotion, teeth visibility
 * - Generates detailed natural language descriptions for prompt injection
 * - 7-day cache to avoid redundant API calls
 * - Uses same API key and CORS proxy as main service
 */

import type {
  FacialExpressionAnalysis,
  SmileType,
  MouthPosition,
  EmotionType,
  TeethVisibility,
  EyeState,
} from '../types/facialExpression.types';

// Cache duration: 7 days in milliseconds
const CACHE_DURATION_MS = 7 * 24 * 60 * 60 * 1000;

// LocalStorage key for cache
const CACHE_KEY = 'facial-expression-cache';

// Model for analysis (using Gemini Flash for speed and cost)
const ANALYSIS_MODEL = 'gemini-2.0-flash';

// API endpoint configuration
const USE_US_PROXY = import.meta.env.VITE_USE_CORS_PROXY === 'true';

const getProxyBase = (): string => {
  const proxyUrl = import.meta.env.VITE_US_CORS_PROXY_URL || 'https://us.api.tmtprod.com/';
  return proxyUrl.replace(/\/replicate\/?$/, '').replace(/\/$/, '');
};

const API_ENDPOINT = USE_US_PROXY
  ? `${getProxyBase()}/google/v1beta/models/${ANALYSIS_MODEL}:generateContent`
  : `https://generativelanguage.googleapis.com/v1beta/models/${ANALYSIS_MODEL}:generateContent`;

/**
 * Simple hash function for image data URLs
 */
function hashImageDataUrl(dataUrl: string): string {
  let hash = 0;
  const str = dataUrl.substring(0, 10000); // Only hash first 10KB for speed
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString(36);
}

/**
 * Get cached analysis if available and not expired
 */
function getCachedAnalysis(imageHash: string): FacialExpressionAnalysis | null {
  try {
    const cacheJson = localStorage.getItem(CACHE_KEY);
    if (!cacheJson) return null;

    const cache = JSON.parse(cacheJson);
    const entry = cache[imageHash];

    if (entry && entry.expiresAt > Date.now()) {
      console.log('[Facial Analyzer] Cache hit for image hash:', imageHash);
      return entry.analysis;
    }

    // Clean up expired entry
    if (entry) {
      delete cache[imageHash];
      localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
    }

    return null;
  } catch (error) {
    console.warn('[Facial Analyzer] Cache read error:', error);
    return null;
  }
}

/**
 * Save analysis to cache
 */
function cacheAnalysis(imageHash: string, analysis: FacialExpressionAnalysis): void {
  try {
    const cacheJson = localStorage.getItem(CACHE_KEY);
    const cache = cacheJson ? JSON.parse(cacheJson) : {};

    cache[imageHash] = {
      imageHash,
      analysis,
      expiresAt: Date.now() + CACHE_DURATION_MS,
    };

    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
    console.log('[Facial Analyzer] Cached analysis for image hash:', imageHash);
  } catch (error) {
    console.warn('[Facial Analyzer] Cache write error:', error);
  }
}

/**
 * Convert data URL to base64 string (remove prefix)
 */
function dataUrlToBase64(dataUrl: string): string {
  const matches = dataUrl.match(/^data:image\/\w+;base64,(.+)$/);
  if (!matches || matches.length < 2) {
    throw new Error('Invalid data URL format');
  }
  return matches[1];
}

/**
 * Parse Gemini response into structured analysis
 */
function parseAnalysisResponse(responseText: string): FacialExpressionAnalysis {
  console.log('[Facial Analyzer] Parsing response:', responseText);

  // Default values
  let smileType: SmileType = 'NO_SMILE';
  let mouthPosition: MouthPosition = 'CLOSED';
  let emotion: EmotionType = 'NEUTRAL';
  let teethVisibility: TeethVisibility = 'NOT_VISIBLE';
  let eyeState: EyeState = 'RELAXED';
  let confidence = 0.8;

  const text = responseText.toUpperCase();

  // Parse smile type
  if (text.includes('BROAD SMILE') || text.includes('WIDE SMILE') || text.includes('BIG SMILE')) {
    smileType = 'BROAD_SMILE';
  } else if (text.includes('TEETH') && text.includes('SMILE')) {
    smileType = 'TEETH_SHOWING_SMILE';
  } else if (text.includes('MODERATE SMILE') || text.includes('GENTLE SMILE')) {
    smileType = 'MODERATE_SMILE';
  } else if (text.includes('SLIGHT SMILE') || text.includes('SMALL SMILE') || text.includes('HINT OF')) {
    smileType = 'SLIGHT_SMILE';
  } else if (text.includes('NO SMILE') || text.includes('NOT SMILING') || text.includes('NEUTRAL')) {
    smileType = 'NO_SMILE';
  }

  // Parse mouth position
  if (text.includes('WIDE OPEN') || text.includes('WIDELY OPEN')) {
    mouthPosition = 'WIDE_OPEN';
  } else if (text.includes('MOUTH OPEN') || text.includes('OPEN MOUTH') || text.includes('PARTED')) {
    mouthPosition = 'OPEN';
  } else if (text.includes('SLIGHTLY OPEN') || text.includes('SLIGHTLY PARTED')) {
    mouthPosition = 'SLIGHTLY_OPEN';
  } else if (text.includes('CLOSED') || text.includes('LIPS TOGETHER') || text.includes('SHUT')) {
    mouthPosition = 'CLOSED';
  }

  // Parse emotion
  if (text.includes('HAPPY') || text.includes('JOYFUL') || text.includes('CHEERFUL')) {
    emotion = 'HAPPY';
  } else if (text.includes('SURPRISED') || text.includes('ASTONISHED')) {
    emotion = 'SURPRISED';
  } else if (text.includes('SERIOUS') || text.includes('STERN') || text.includes('SOLEMN')) {
    emotion = 'SERIOUS';
  } else if (text.includes('THOUGHTFUL') || text.includes('CONTEMPLATIVE') || text.includes('PENSIVE')) {
    emotion = 'THOUGHTFUL';
  } else if (text.includes('EXCITED') || text.includes('ENTHUSIASTIC')) {
    emotion = 'EXCITED';
  } else {
    emotion = 'NEUTRAL';
  }

  // Parse teeth visibility
  if (text.includes('TEETH PROMINENTLY') || text.includes('CLEARLY VISIBLE TEETH')) {
    teethVisibility = 'PROMINENTLY_VISIBLE';
  } else if (text.includes('TEETH VISIBLE') || text.includes('SHOWING TEETH') || text.includes('TEETH SHOWING')) {
    teethVisibility = 'VISIBLE';
  } else if (text.includes('SLIGHTLY VISIBLE TEETH') || text.includes('HINT OF TEETH')) {
    teethVisibility = 'SLIGHTLY_VISIBLE';
  } else if (text.includes('NO TEETH') || text.includes('TEETH NOT VISIBLE') || text.includes('TEETH HIDDEN')) {
    teethVisibility = 'NOT_VISIBLE';
  }

  // Parse eye state
  if (text.includes('EYES SQUINTED') || text.includes('SQUINTING')) {
    eyeState = 'SQUINTED';
  } else if (text.includes('SLIGHTLY SQUINTED') || text.includes('NARROWED')) {
    eyeState = 'SLIGHTLY_SQUINTED';
  } else if (text.includes('EYES FULLY OPEN') || text.includes('WIDE EYES') || text.includes('EYES WIDE')) {
    eyeState = 'FULLY_OPEN';
  } else {
    eyeState = 'RELAXED';
  }

  // Build detailed description for prompt injection
  const detailedDescription = buildDetailedDescription(
    smileType,
    mouthPosition,
    emotion,
    teethVisibility,
    eyeState
  );

  return {
    smileType,
    mouthPosition,
    emotion,
    teethVisibility,
    eyeState,
    detailedDescription,
    confidence,
    analyzedAt: Date.now(),
  };
}

/**
 * Build detailed natural language description for prompt injection
 */
function buildDetailedDescription(
  smileType: SmileType,
  mouthPosition: MouthPosition,
  emotion: EmotionType,
  teethVisibility: TeethVisibility,
  eyeState: EyeState
): string {
  const parts: string[] = [];

  // Smile description with emphasis
  switch (smileType) {
    case 'NO_SMILE':
      parts.push('The person has NO SMILE WHATSOEVER.');
      break;
    case 'SLIGHT_SMILE':
      parts.push('The person has a SLIGHT, SUBTLE smile.');
      break;
    case 'MODERATE_SMILE':
      parts.push('The person has a MODERATE, GENTLE smile.');
      break;
    case 'BROAD_SMILE':
      parts.push('The person has a BROAD, WIDE smile.');
      break;
    case 'TEETH_SHOWING_SMILE':
      parts.push('The person has a TEETH-SHOWING smile.');
      break;
  }

  // Mouth position with strong emphasis
  switch (mouthPosition) {
    case 'CLOSED':
      parts.push('Lips are COMPLETELY CLOSED and pressed together.');
      break;
    case 'SLIGHTLY_OPEN':
      parts.push('Lips are SLIGHTLY PARTED.');
      break;
    case 'OPEN':
      parts.push('Mouth is OPEN.');
      break;
    case 'WIDE_OPEN':
      parts.push('Mouth is WIDE OPEN.');
      break;
  }

  // Teeth visibility
  switch (teethVisibility) {
    case 'NOT_VISIBLE':
      parts.push('Teeth are NOT VISIBLE at all.');
      break;
    case 'SLIGHTLY_VISIBLE':
      parts.push('Teeth are SLIGHTLY visible.');
      break;
    case 'VISIBLE':
      parts.push('Teeth are CLEARLY visible.');
      break;
    case 'PROMINENTLY_VISIBLE':
      parts.push('Teeth are PROMINENTLY visible.');
      break;
  }

  // Eye state
  switch (eyeState) {
    case 'SQUINTED':
      parts.push('Eyes are SQUINTED.');
      break;
    case 'SLIGHTLY_SQUINTED':
      parts.push('Eyes are SLIGHTLY SQUINTED.');
      break;
    case 'FULLY_OPEN':
      parts.push('Eyes are FULLY OPEN and alert.');
      break;
    case 'RELAXED':
      parts.push('Eyes are in a RELAXED, natural state.');
      break;
  }

  // Add strong negative constraint based on smile
  if (smileType === 'NO_SMILE') {
    parts.push('DO NOT ADD ANY SMILE.');
  }

  // Overall emotion summary
  parts.push(`Overall emotion: ${emotion}.`);

  return parts.join(' ');
}

/**
 * Analyze facial expression in an image using Gemini Vision API
 *
 * @param imageDataUrl - User's photo as data URL (base64)
 * @returns Promise resolving to facial expression analysis
 */
export async function analyzeFacialExpression(
  imageDataUrl: string
): Promise<FacialExpressionAnalysis> {
  console.log('[Facial Analyzer] Starting facial expression analysis...');

  // Check cache first
  const imageHash = hashImageDataUrl(imageDataUrl);
  const cached = getCachedAnalysis(imageHash);
  if (cached) {
    return cached;
  }

  // Get API key
  const apiKey = import.meta.env.VITE_GOOGLE_AI_STUDIO_API_KEY;
  if (!apiKey) {
    console.warn('[Facial Analyzer] No API key configured, using default analysis');
    return getDefaultAnalysis();
  }

  try {
    const base64Image = dataUrlToBase64(imageDataUrl);

    const prompt = `Analyze the facial expression in this photo. Describe PRECISELY:

1. SMILE: Is there a smile? Rate it: NO_SMILE, SLIGHT_SMILE, MODERATE_SMILE, BROAD_SMILE, or TEETH_SHOWING_SMILE
2. MOUTH POSITION: Is the mouth CLOSED, SLIGHTLY_OPEN, OPEN, or WIDE_OPEN?
3. TEETH: Are teeth visible? NOT_VISIBLE, SLIGHTLY_VISIBLE, VISIBLE, or PROMINENTLY_VISIBLE
4. EYES: Are eyes RELAXED, FULLY_OPEN, SLIGHTLY_SQUINTED, or SQUINTED?
5. EMOTION: What is the primary emotion? NEUTRAL, HAPPY, SURPRISED, SERIOUS, THOUGHTFUL, or EXCITED

Be extremely precise. If there is NO smile, say "NO SMILE". If lips are closed, say "MOUTH CLOSED".
This analysis will be used to preserve the exact expression in an AI-generated image.`;

    const request = {
      contents: [
        {
          parts: [
            {
              inlineData: {
                mimeType: 'image/jpeg',
                data: base64Image,
              },
            },
            { text: prompt },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.1, // Low temperature for consistent analysis
        maxOutputTokens: 500,
      },
    };

    console.log('[Facial Analyzer] Calling Gemini API...');

    const response = await fetch(`${API_ENDPOINT}?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(`API error: ${errorData?.error?.message || response.statusText}`);
    }

    const data = await response.json();

    // Extract text from response
    const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

    if (!responseText) {
      console.warn('[Facial Analyzer] Empty response from API');
      return getDefaultAnalysis();
    }

    console.log('[Facial Analyzer] API Response:', responseText);

    // Parse response into structured analysis
    const analysis = parseAnalysisResponse(responseText);

    // Cache the result
    cacheAnalysis(imageHash, analysis);

    console.log('[Facial Analyzer] Analysis complete:', analysis);

    return analysis;
  } catch (error) {
    console.error('[Facial Analyzer] Analysis failed:', error);
    return getDefaultAnalysis();
  }
}

/**
 * Get default analysis when API is unavailable
 */
function getDefaultAnalysis(): FacialExpressionAnalysis {
  return {
    smileType: 'NO_SMILE',
    mouthPosition: 'CLOSED',
    emotion: 'NEUTRAL',
    teethVisibility: 'NOT_VISIBLE',
    eyeState: 'RELAXED',
    detailedDescription: 'Preserve the exact facial expression from the reference image. Maintain the same smile level, mouth position, and overall emotion.',
    confidence: 0.5,
    analyzedAt: Date.now(),
  };
}

/**
 * Clear the facial expression cache
 */
export function clearFacialExpressionCache(): void {
  localStorage.removeItem(CACHE_KEY);
  console.log('[Facial Analyzer] Cache cleared');
}
