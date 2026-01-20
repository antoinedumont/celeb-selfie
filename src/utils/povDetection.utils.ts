/**
 * POV Selfie Detection Utility
 *
 * NOTE: As of the latest update, POV selfie is now the DEFAULT behavior for all selfie generation.
 * This utility is retained for potential future use cases or backwards compatibility
 * (e.g., if we want to add a toggle to switch between POV and third-person perspectives).
 *
 * Detects when a user requests a POV (Point-of-View) selfie
 * by analyzing input text for specific keywords.
 */

/**
 * List of keywords that trigger POV selfie mode
 * Case-insensitive matching
 */
const POV_KEYWORDS = [
  'pov selfie',
  'selfie pov',
  'pov',
  'selfie',
  'first person selfie',
  'front camera selfie',
  'selfie cam',
];

/**
 * Detect if the input text contains POV selfie keywords
 *
 * @param text - User input text to analyze
 * @returns true if POV selfie is requested, false otherwise
 *
 * @example
 * detectPOVSelfie('Ousmane Dembélé ballon d\'or 2025 POV selfie') // true
 * detectPOVSelfie('Marie Curie laboratoire') // false
 * detectPOVSelfie('Messi PoV sELfIe') // true (case-insensitive)
 * detectPOVSelfie('Taylor Swift concert selfie') // true
 */
export function detectPOVSelfie(text: string): boolean {
  if (!text || typeof text !== 'string') {
    return false;
  }

  const normalizedText = text.toLowerCase().trim();

  // Check if any POV keyword is present in the text
  return POV_KEYWORDS.some(keyword => {
    // Use word boundary to avoid partial matches like "prove" containing "pov"
    // But allow hyphens and underscores: "pov-selfie", "pov_selfie"
    const regex = new RegExp(`\\b${keyword.replace(/\s+/g, '[\\s\\-_]*')}\\b`, 'i');
    return regex.test(normalizedText);
  });
}

/**
 * Get the list of POV keywords (for testing/debugging)
 * @returns Array of POV keywords
 */
export function getPOVKeywords(): string[] {
  return [...POV_KEYWORDS];
}
