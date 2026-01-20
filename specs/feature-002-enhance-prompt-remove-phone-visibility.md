# Feature: Enhance AI Prompt to Eliminate Visible Mobile Phone in Selfies

## Feature Description
Enhance the AI prompt generation system to ensure that mobile phones are never visible in the generated celebrity selfies. The current system generates POV (Point-of-View) selfies, but sometimes the mobile device itself appears in the frame. This feature will optimize the prompt templates and natural language instructions to explicitly prevent phone visibility while maintaining the authentic arm's-length handheld selfie perspective.

The enhancement will build on the user's preferred prompt style: "Ultra-realistic handheld selfie captured from a front-phone-camera perspective. The framing is a natural arm's-length handheld shot; the mobile phone itself is never visible."

## User Story
As a user generating celebrity selfies
I want the mobile phone to never appear in the generated image
So that the photo looks like a natural, professional selfie without technical distractions

## Problem Statement
Users are experiencing unwanted mobile phone visibility in their generated celebrity selfies. While the POV selfie template creates authentic-looking handheld shots, the AI sometimes includes the phone device in the frame, which:
- Detracts from the professional quality of the image
- Makes the photo look artificial or staged
- Breaks the immersion of the "real selfie" experience
- Doesn't match user expectations for clean, distraction-free celebrity photos

The current prompt templates (POV_SELFIE_TEMPLATE and static fallback) need to be enhanced with stronger, more explicit instructions to prevent phone visibility.

## Solution Statement
Enhance the prompt generation system by:

1. **Template Enhancement**: Update the `POV_SELFIE_TEMPLATE` in `gemini3PromptGenerator.service.ts` to include explicit "no phone visible" instructions in multiple strategic locations
2. **Composition Rules**: Add a dedicated `phone_visibility` rule in the scene_description to make it a critical constraint
3. **Natural Language Strengthening**: Enhance the fallback static prompt in `promptBuilder.ts` with reinforced "no phone visible" instructions
4. **Gemini Meta-Prompt Update**: Update the meta-prompt sent to Gemini 3 to emphasize phone invisibility as a critical requirement
5. **Visual Style Enhancement**: Add specific framing guidance that naturally prevents phone visibility through composition rules

The solution will use the user's preferred phrasing as a foundation: "The framing is a natural arm's-length handheld shot; the mobile phone itself is never visible."

## Relevant Files
Use these files to implement the feature:

- **`src/services/gemini3PromptGenerator.service.ts`** (lines 69-100, 199-335)
  - Contains POV_SELFIE_TEMPLATE that needs phone visibility rules
  - Contains BASE_JSON_TEMPLATE as reference
  - Contains convertJsonTemplateToNaturalLanguage() for natural language generation
  - Contains generateCelebrityPromptWithGemini3() with meta-prompt that needs updating

- **`src/services/gemini3PromptGenerator.types.ts`** (lines 12-42)
  - Contains PromptTemplate interface that may need phone_visibility field
  - Type definitions for the prompt structure

- **`src/services/composite/promptBuilder.ts`** (lines 79-91, 109-137)
  - Contains buildStaticFreestylePrompt() fallback that needs phone visibility enhancement
  - Contains buildFreestyleSelfiePrompt() that orchestrates prompt generation

- **`src/App.tsx`** (lines 78-86, 236-240)
  - Shows how prompts are displayed to users via ProcessingIndicator
  - May need UI updates to show enhanced prompt quality

- **`src/components/ProcessingIndicator.tsx`**
  - Displays the generated prompt to users
  - May benefit from highlighting phone-free framing feature

### New Files
None required - all changes will be made to existing files.

## Implementation Plan

### Phase 1: Foundation
Update the core prompt template structure to support explicit phone visibility rules. This includes:
- Adding phone_visibility constraint to PromptTemplate type definition
- Updating POV_SELFIE_TEMPLATE with multi-layered phone invisibility instructions
- Ensuring backward compatibility with existing cached prompts

### Phase 2: Core Implementation
Enhance prompt generation across all code paths:
- Strengthen POV_SELFIE_TEMPLATE with explicit framing and composition rules
- Update Gemini 3 meta-prompt to emphasize phone invisibility as critical constraint
- Enhance static fallback prompt with reinforced "no phone visible" instructions
- Add composition guidelines that naturally prevent phone appearance

### Phase 3: Integration
Integrate enhanced prompts throughout the generation flow:
- Test with Gemini 3 API to ensure proper template filling
- Verify static fallback works correctly
- Update prompt caching to handle enhanced templates
- Ensure natural language conversion includes phone-free framing details

## Step by Step Tasks

### 1. Update PromptTemplate Type Definition
- Open `src/services/gemini3PromptGenerator.types.ts`
- Add optional `phone_visibility?: string` field to scene_description in PromptTemplate interface
- Add optional `framing_rules?: string` field to scene_description
- Document these fields with TSDoc comments explaining their purpose

### 2. Enhance POV_SELFIE_TEMPLATE with Phone Invisibility Rules
- Open `src/services/gemini3PromptGenerator.service.ts`
- Locate POV_SELFIE_TEMPLATE constant (lines 69-100)
- Add `phone_visibility: 'CRITICAL: The mobile phone/camera device must NEVER be visible in the frame. The photo is taken from the phone\'s perspective, but the phone itself is completely out of frame.'` to scene_description
- Add `framing_rules: 'Natural arm\'s-length handheld shot captured from front-facing camera perspective. The phone is held by the photographer but remains entirely outside the visible frame.'` to scene_description
- Update `lens_effect` to emphasize "captured BY a smartphone camera, not OF a smartphone camera"
- Update `result_description` to include: "The mobile phone itself is never visible - this is a photo taken FROM the phone, not a photo OF someone holding a phone"

### 3. Update Gemini 3 Meta-Prompt
- In `src/services/gemini3PromptGenerator.service.ts`, locate generateCelebrityPromptWithGemini3() function (line 205)
- Find the meta-prompt construction (lines 241-263)
- Add a dedicated instruction block before the JSON template:
  ```
  CRITICAL CONSTRAINT - Phone Visibility:
  The mobile phone/camera device must NEVER appear in the generated image.
  This is a photo taken FROM a front-facing smartphone camera perspective, not a photo OF someone holding a phone.
  The phone is held at arm's length by the photographer but remains completely outside the visible frame.
  ```
- Update the meta-prompt to emphasize this as a non-negotiable requirement

### 4. Enhance Static Fallback Prompt
- Open `src/services/composite/promptBuilder.ts`
- Locate buildStaticFreestylePrompt() function (lines 79-91)
- Update the prompt string to start with: "Ultra-realistic handheld selfie captured from a front-phone-camera perspective. The framing is a natural arm's-length handheld shot; the mobile phone itself is never visible."
- Add reinforcement before the technical details: "CRITICAL: The camera/phone device must never appear in frame - this is a photo taken FROM the phone perspective, not OF someone holding a phone."
- Add after line 89: "6. No Phone Visible: The mobile device taking the photo must never appear in the generated image. The photo is taken FROM the phone, not OF the phone."

### 5. Update Natural Language Conversion
- In `src/services/gemini3PromptGenerator.service.ts`, locate convertJsonTemplateToNaturalLanguage() (lines 109-139)
- Add phone_visibility and framing_rules to the natural language output
- Insert after the composition section:
  ```typescript
  ${scene_description.phone_visibility ? `\nPhone Visibility:\n${scene_description.phone_visibility}` : ''}
  ${scene_description.framing_rules ? `\nFraming Rules:\n${scene_description.framing_rules}` : ''}
  ```

### 6. Test with Gemini 3 API
- Build the application: `npm run build`
- Start dev server: `npm run dev`
- Generate a test selfie with a celebrity name
- Verify the generated prompt includes phone invisibility instructions
- Check the console logs to ensure Gemini 3 receives and processes the enhanced template
- Verify the cached prompt includes phone-free framing details

### 7. Test Static Fallback
- Temporarily disable Gemini 3 API by removing VITE_GEMINI_API_KEY from .env
- Restart dev server
- Generate a test selfie
- Verify the static fallback prompt includes enhanced phone invisibility instructions
- Re-enable Gemini 3 API

### 8. Validate Generated Images
- Generate 3-5 celebrity selfies with different celebrities
- Verify that mobile phones do not appear in any generated images
- Check that the selfie perspective and framing remain natural and authentic
- Confirm that the arm's-length POV perspective is maintained

### 9. Clear Prompt Cache for Testing
- Open browser DevTools > Application > Local Storage
- Clear cached prompts to force fresh generation with new templates
- Generate test selfies to verify new prompts are being used
- Verify cache stores enhanced prompts correctly

### 10. Run Validation Commands
- Execute all validation commands listed below to ensure zero regressions
- Fix any TypeScript errors
- Verify build succeeds
- Test end-to-end generation flow

## Testing Strategy

### Unit Tests
- **PromptTemplate Validation**: Test isValidPromptTemplate() accepts templates with phone_visibility field
- **Natural Language Conversion**: Test convertJsonTemplateToNaturalLanguage() includes phone visibility instructions
- **Static Prompt**: Test buildStaticFreestylePrompt() contains "no phone visible" text
- **Template Placeholder Detection**: Test extractPlaceholders() works with enhanced template

### Edge Cases
- **Gemini 3 Unavailable**: Verify static fallback includes phone invisibility instructions
- **Cached Prompts**: Verify old cached prompts without phone rules still work (backward compatibility)
- **Empty Celebrity Name**: Verify phone visibility rules are included regardless of celebrity
- **Custom Context**: Test with user input like "Taylor Swift at concert" to ensure phone rules persist
- **Template Validation Failure**: Verify fallback to static prompt maintains phone visibility rules

## Acceptance Criteria
- [ ] POV_SELFIE_TEMPLATE includes explicit phone_visibility and framing_rules fields
- [ ] Gemini 3 meta-prompt emphasizes phone invisibility as critical constraint
- [ ] Static fallback prompt includes "mobile phone itself is never visible" phrasing
- [ ] Natural language conversion displays phone-free framing instructions
- [ ] Generated prompts include phone invisibility rules in multiple locations
- [ ] TypeScript types updated to support new template fields
- [ ] All existing functionality works without regression
- [ ] Build succeeds without errors
- [ ] Generated celebrity selfies do not show mobile phones in frame
- [ ] Selfie perspective remains natural and arm's-length POV
- [ ] Console logs show enhanced prompts being sent to Replicate API

## Validation Commands
Execute every command to validate the feature works correctly with zero regressions.

- `npm run dev` - Start development server and manually test celebrity selfie generation
- `grep -r "phone itself is never visible" src/` - Verify phone invisibility text is present in multiple files
- `grep -r "phone_visibility" src/` - Verify new template field is used throughout codebase
- `npm run build` - Run production build to validate the feature works with zero regressions
- Test manual generation flow:
  1. Open http://localhost:5173
  2. Take a selfie photo
  3. Enter a celebrity name (e.g., "Taylor Swift")
  4. Wait for generation to complete
  5. Verify the generated image does not show a mobile phone
  6. Check browser console for prompt details containing phone invisibility rules
  7. Repeat with 2-3 different celebrities

## Notes

### User's Preferred Phrasing
The user specifically likes this phrasing which should be incorporated:
> "Ultra-realistic handheld selfie captured from a front-phone-camera perspective at the Learning Technologies Paris exhibition (Porte de Versailles). The framing is a natural arm's-length handheld shot; the mobile phone itself is never visible."

Key elements to preserve:
- "handheld selfie captured from a front-phone-camera perspective"
- "natural arm's-length handheld shot"
- "the mobile phone itself is never visible"

### Implementation Strategy
The solution uses a **multi-layered approach** to prevent phone visibility:

1. **Template Level**: Add dedicated phone_visibility field in the structured JSON
2. **Meta-Prompt Level**: Instruct Gemini 3 that phone invisibility is critical
3. **Static Fallback Level**: Ensure fallback prompts also prevent phone visibility
4. **Natural Language Level**: Make phone-free framing visible to users in UI
5. **Composition Rules Level**: Add framing_rules that naturally prevent phone appearance

This redundancy ensures the instruction is never lost, even if one layer fails.

### Why POV Selfie Template
The current system already uses POV_SELFIE_TEMPLATE by default (line 213 in gemini3PromptGenerator.service.ts), which is correct. The enhancement will strengthen this template rather than switching templates.

### Backward Compatibility
Enhanced templates will remain compatible with:
- Existing cached prompts (cache entries without phone_visibility will still work)
- Replicate API (additional fields in natural language won't break image generation)
- TypeScript validation (new fields are optional)

### Cost Impact
No cost increase - this feature only enhances the prompt text sent to existing APIs:
- Gemini 3 cost remains the same (~$0.001-0.005 per prompt, with 7-day cache)
- Nano Banana Pro cost remains the same (~$0.15 per image)
- Slightly longer prompts have negligible impact on API costs

### Future Enhancements
- Add user preference toggle for "POV selfie" vs "third-person photo"
- Allow users to preview/edit generated prompts before submission
- Add more composition rules (e.g., no hands visible, face-forward orientation)
- Implement A/B testing to measure phone visibility improvement
