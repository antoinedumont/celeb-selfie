# Chore: Make POV Selfie the Default Camera Perspective

## Chore Description
Modify the prompt generation system to always use the POV (Point-of-View) selfie template by default, instead of requiring users to explicitly add "POV selfie" keywords to their celebrity name input. This will make all generated celebrity selfies use the front-facing camera perspective with close-up, intimate framing typical of authentic smartphone selfies.

Currently, the system defaults to a third-person view and only switches to POV selfie mode when specific keywords are detected in the celebrity name input. This chore changes the default behavior to always use POV selfie mode, providing a more authentic and engaging selfie experience for all users.

## Relevant Files
Use these files to resolve the chore:

- **`src/services/gemini3PromptGenerator.service.ts`** (lines 205-218)
  - Contains the `generateCelebrityPromptWithGemini3()` function that currently detects POV keywords and selects between templates
  - Contains the `POV_SELFIE_TEMPLATE` and `BASE_JSON_TEMPLATE` constants
  - This is where the template selection logic needs to be changed to always default to POV

- **`src/utils/povDetection.utils.ts`**
  - Contains the `detectPOVSelfie()` function and `POV_KEYWORDS` array
  - After making POV the default, this utility may become obsolete, but we'll keep it for potential future use cases or backwards compatibility

- **`src/services/composite/promptBuilder.ts`** (lines 78-91)
  - Contains the `buildStaticFreestylePrompt()` fallback function used when Gemini API is unavailable
  - Currently generates a generic third-person prompt - should be updated to match POV selfie style for consistency

## Step by Step Tasks
IMPORTANT: Execute every step in order, top to bottom.

### Step 1: Update Gemini3 Prompt Generator to Default to POV Selfie
- Open `src/services/gemini3PromptGenerator.service.ts`
- Locate the `generateCelebrityPromptWithGemini3()` function (around line 205)
- Find the POV detection logic:
  ```typescript
  const isPOVSelfie = detectPOVSelfie(celebrityName);
  const templateToUse = isPOVSelfie ? POV_SELFIE_TEMPLATE : BASE_JSON_TEMPLATE;
  ```
- Change the logic to always default to POV selfie:
  ```typescript
  // Always use POV selfie template by default for authentic selfie experience
  const templateToUse = POV_SELFIE_TEMPLATE;
  ```
- Remove or comment out the `detectPOVSelfie()` call since it's no longer needed for template selection
- Update the console log message to reflect that POV is now the default:
  ```typescript
  console.log(`[Gemini3] Using POV selfie template (default)`);
  ```

### Step 2: Update Static Fallback Prompt to Match POV Selfie Style
- Open `src/services/composite/promptBuilder.ts`
- Locate the `buildStaticFreestylePrompt()` function (around line 78)
- Update the prompt text to emphasize POV selfie perspective:
  - Change camera description from generic to explicit POV/front-facing camera
  - Add lens distortion and composition details typical of POV selfies
  - Emphasize close-up framing with faces dominating the frame
- Replace the generic camera description with POV-specific language:
  - From: "The camera is held at arm's length, close framing typical of an authentic smartphone selfie"
  - To: "POV selfie taken with a front-facing smartphone camera held at arm's length. Wide-angle lens distortion with faces dominating the frame in tight close-up framing typical of authentic POV selfies"

### Step 3: Update Console Logging and Comments
- In `src/services/gemini3PromptGenerator.service.ts`:
  - Update the comment on line 211-218 to reflect that POV is now the default
  - Update console log message to indicate POV is the new default behavior
- In `src/services/composite/promptBuilder.ts`:
  - Update the function JSDoc comment for `buildStaticFreestylePrompt()` to indicate it now generates POV selfie prompts by default

### Step 4: Optional - Add Comment to POV Detection Utility
- Open `src/utils/povDetection.utils.ts`
- Add a comment at the top of the file indicating that POV is now the default and this utility is kept for potential future use cases
- No functional changes needed - keep the utility as-is for backwards compatibility

## Validation Commands
Execute every command to validate the chore is complete with zero regressions.

- `cd /Users/antoine/claude/celeb-selfie && npm run dev` - Start the development server and verify it starts without errors
- **Manual Testing**:
  1. Open `http://localhost:5174` in browser
  2. Take a selfie with the camera
  3. Select any celebrity (e.g., "Taylor Swift", "Lionel Messi")
  4. Verify the generated prompt displays POV selfie language in the processing indicator
  5. Wait for image generation to complete
  6. Verify the resulting image shows POV selfie perspective (close-up, intimate framing)
  7. Test with a custom celebrity name without any "POV" keywords
  8. Verify POV selfie template is still used by default
- `cd /Users/antoine/claude/celeb-selfie && npm run build` - Verify the project builds without errors

## Notes
- The POV selfie template provides a more authentic and engaging user experience with close-up, intimate framing
- After this change, users will no longer need to explicitly request "POV selfie" - it becomes the default behavior
- The `detectPOVSelfie()` utility function is retained for potential future use cases where we might want to toggle between perspectives based on user preference
- The change affects both the Gemini-generated prompts (via JSON template) and the static fallback prompts
- No database migrations or API changes required - this is purely a frontend/prompt generation change
- The 7-day prompt cache will gradually update as new prompts are generated with the POV template
