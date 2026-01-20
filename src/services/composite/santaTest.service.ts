/**
 * Santa Test Service
 *
 * Simple test to verify Gemini API is working with basic image generation
 * Uses the same API but with a simple prompt instead of photo composition
 */

export interface SantaTestResult {
  success: boolean;
  imageUrl?: string;
  error?: string;
  processingTime: number;
}

export interface SantaCompositeResult {
  success: boolean;
  imageUrl?: string;
  error?: string;
  processingTime: number;
}

export async function generateSanta(): Promise<SantaTestResult> {
  const startTime = Date.now();

  console.log('[Santa Test] Starting simple image generation test...');

  const geminiApiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!geminiApiKey) {
    return {
      success: false,
      error: 'Gemini API key not configured',
      processingTime: Date.now() - startTime,
    };
  }

  try {
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-image-preview:generateContent?key=${geminiApiKey}`;

    const prompt = `Generate a photorealistic image of Santa Claus.
He should have a jolly expression, white beard, red suit with white fur trim, and a friendly smile.
Professional photo quality, warm lighting, festive atmosphere.
High quality, realistic, DSLR quality.`;

    const request = {
      contents: [{
        parts: [
          { text: prompt }
        ],
      }],
      generationConfig: {
        responseModalities: ['IMAGE'],
        imageConfig: {
          imageSize: '2K',
        },
        thinkingConfig: {
          thinkingBudget: 2048,
        },
      },
    };

    console.log('[Santa Test] Calling Gemini API with simple prompt...');
    console.log('[Santa Test] Prompt:', prompt);

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Santa Test] API Error:', response.status, errorText);

      return {
        success: false,
        error: `API error (${response.status}): ${errorText.substring(0, 200)}`,
        processingTime: Date.now() - startTime,
      };
    }

    const data = await response.json();
    console.log('[Santa Test] API Response:', JSON.stringify(data, null, 2));

    // Check for blocking
    if (data.promptFeedback?.blockReason) {
      console.error('[Santa Test] Content blocked:', data.promptFeedback.blockReason);
      return {
        success: false,
        error: `Content blocked: ${data.promptFeedback.blockReason}`,
        processingTime: Date.now() - startTime,
      };
    }

    // Extract image from response
    if (!data.candidates || data.candidates.length === 0) {
      console.error('[Santa Test] No candidates in response');
      return {
        success: false,
        error: 'No image generated (no candidates)',
        processingTime: Date.now() - startTime,
      };
    }

    const candidate = data.candidates[0];
    const parts = candidate.content?.parts || [];

    // Find image part
    const imagePart = parts.find((p: any) => p.inlineData?.mimeType?.startsWith('image/'));

    if (!imagePart || !imagePart.inlineData?.data) {
      console.error('[Santa Test] No image data in response');
      return {
        success: false,
        error: 'No image data in API response',
        processingTime: Date.now() - startTime,
      };
    }

    const imageBase64 = imagePart.inlineData.data;
    const mimeType = imagePart.inlineData.mimeType;
    const imageUrl = `data:${mimeType};base64,${imageBase64}`;

    console.log('[Santa Test] Success! Image generated');

    return {
      success: true,
      imageUrl,
      processingTime: Date.now() - startTime,
    };

  } catch (error: any) {
    console.error('[Santa Test] Exception:', error);
    return {
      success: false,
      error: error.message || 'Unknown error',
      processingTime: Date.now() - startTime,
    };
  }
}

/**
 * Test photo composition: Put user's selfie with Santa
 */
export async function compositeWithSanta(userImageDataUrl: string): Promise<SantaCompositeResult> {
  const startTime = Date.now();

  console.log('[Santa Composite] Starting photo composition test...');

  const geminiApiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!geminiApiKey) {
    return {
      success: false,
      error: 'Gemini API key not configured',
      processingTime: Date.now() - startTime,
    };
  }

  try {
    // Extract base64 from data URL
    const userBase64 = userImageDataUrl.split(',')[1];
    if (!userBase64) {
      throw new Error('Invalid user image data URL');
    }

    // Detect user image MIME type
    const mimeMatches = userImageDataUrl.match(/^data:(image\/[a-z]+);base64,/);
    const userMimeType = mimeMatches ? mimeMatches[1] : 'image/png';

    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-image-preview:generateContent?key=${geminiApiKey}`;

    const prompt = `A highly photorealistic selfie of the person from the reference image with Santa Claus.

The person and Santa are taking a festive holiday selfie together. Position the person on the left side and Santa Claus on the right side (jolly expression, white beard, red suit with white fur trim). Both are close together as friends would be in a selfie, looking at the camera.

The scene has warm holiday lighting, slightly blurred festive background, professional photo quality. Both people visible from shoulders up, same distance from camera. High quality 2K resolution, realistic skin tones, DSLR quality.

IMPORTANT: Maintain the EXACT facial features, expression, and appearance of the person from the reference image. Do not change their expression - if they are not smiling, keep them not smiling. Preserve their original look completely.

Create a natural, believable holiday celebration photo.`;

    const request = {
      contents: [{
        parts: [
          { text: prompt },
          {
            inlineData: {
              mimeType: userMimeType,
              data: userBase64,
            },
          },
        ],
      }],
      generationConfig: {
        responseModalities: ['IMAGE'],
        imageConfig: {
          imageSize: '2K',
        },
        thinkingConfig: {
          thinkingBudget: 2048,
        },
      },
    };

    console.log('[Santa Composite] Calling Gemini API with composition prompt...');
    console.log('[Santa Composite] User image MIME type:', userMimeType);

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Santa Composite] API Error:', response.status, errorText);

      return {
        success: false,
        error: `API error (${response.status}): ${errorText.substring(0, 200)}`,
        processingTime: Date.now() - startTime,
      };
    }

    const data = await response.json();
    console.log('[Santa Composite] API Response:', JSON.stringify(data, null, 2));

    // Check for blocking
    if (data.promptFeedback?.blockReason) {
      console.error('[Santa Composite] Content blocked:', data.promptFeedback.blockReason);
      return {
        success: false,
        error: `Content blocked: ${data.promptFeedback.blockReason}`,
        processingTime: Date.now() - startTime,
      };
    }

    // Extract image from response
    if (!data.candidates || data.candidates.length === 0) {
      console.error('[Santa Composite] No candidates in response');
      return {
        success: false,
        error: 'No image generated (no candidates)',
        processingTime: Date.now() - startTime,
      };
    }

    const candidate = data.candidates[0];
    const parts = candidate.content?.parts || [];

    // Find image part
    const imagePart = parts.find((p: any) => p.inlineData?.mimeType?.startsWith('image/'));

    if (!imagePart || !imagePart.inlineData?.data) {
      console.error('[Santa Composite] No image data in response');
      return {
        success: false,
        error: 'No image data in API response',
        processingTime: Date.now() - startTime,
      };
    }

    const imageBase64 = imagePart.inlineData.data;
    const mimeType = imagePart.inlineData.mimeType;
    const imageUrl = `data:${mimeType};base64,${imageBase64}`;

    console.log('[Santa Composite] Success! Composite image generated');

    return {
      success: true,
      imageUrl,
      processingTime: Date.now() - startTime,
    };

  } catch (error: any) {
    console.error('[Santa Composite] Exception:', error);
    return {
      success: false,
      error: error.message || 'Unknown error',
      processingTime: Date.now() - startTime,
    };
  }
}
