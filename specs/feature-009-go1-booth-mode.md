# Feature: Go1 Booth Mode

## Feature Description
Add a "Go1 Mode" toggle that forces image generation to use the Go1 booth as the background. This feature enables users to switch between the current "freestyle" mode (casual selfies in dynamic locations) and "Go1 mode" (conference booth selfies with Go1 branding, lanyards, and Learning Technologies Paris exhibition setting). The mode selection will be accessible via a simple toggle in the celebrity input screen, and the selection will be persisted in localStorage for convenience.

## User Story
As a conference attendee or Go1 brand ambassador
I want to generate selfies with celebrities at the Go1 booth
So that I can create branded content for the Learning Technologies Paris exhibition

## Problem Statement
Currently, the app only supports "freestyle" mode which generates casual, authentic-looking selfies in various dynamic locations. However, there's a need for branded content at conferences and exhibitions where the Go1 booth should be prominently featured in the background. The existing `buildCelebritySelfiePrompt` function in `promptBuilder.ts` already contains the Go1 booth prompt template, but there's no UI to activate it.

## Solution Statement
Implement a mode toggle in the `CustomCelebrityInput` component that allows users to switch between:
1. **Freestyle Mode** (default): Casual selfies with AI-generated backgrounds in the celebrity's favorite city
2. **Go1 Mode**: Conference selfies at the Go1 booth with purple-and-white lanyards, Learning Technologies Paris exhibition setting

The solution leverages the existing `CelebrityGenerationMode` type (`'go1' | 'freestyle'`) and the `buildCelebritySelfiePrompt` function that already exists in the codebase. The mode selection will be passed through the composition pipeline to use the appropriate prompt builder.

## Relevant Files
Use these files to implement the feature:

- **`src/types/index.ts`** - Contains `CelebrityGenerationMode` type (`'go1' | 'freestyle'`) already defined; no changes needed
- **`src/services/composite/types.ts`** - Contains `CompositionConfig` with `generationMode` field already defined; no changes needed
- **`src/services/composite/promptBuilder.ts`** - Contains both `buildFreestyleSelfiePrompt()` and `buildCelebritySelfiePrompt()` functions; needs modification to add `buildGo1SelfiePrompt()` async version that mirrors freestyle behavior
- **`src/services/composite/googleDirectNanoBanana.service.ts`** - Service that calls prompt builder; needs modification to use the correct prompt based on `generationMode`
- **`src/components/CustomCelebrityInput.tsx`** - Celebrity input component; needs mode toggle UI added
- **`src/App.tsx`** - Main app component; needs to pass `generationMode` to composition function and handle mode state
- **`src/index.css`** - Global styles; may need toggle switch styles
- **`src/services/galleryStorage.service.ts`** - Gallery storage; already saves `generationMode` in metadata

### New Files
- None required - all functionality can be added to existing files

## Implementation Plan

### Phase 1: Foundation
1. Review existing `CelebrityGenerationMode` type and ensure it's properly exported
2. Create an async version of the Go1 booth prompt builder that can integrate with Gemini 3 for celebrity-specific customizations
3. Add localStorage utility for persisting mode preference

### Phase 2: Core Implementation
1. Update `promptBuilder.ts` to export a new `buildGo1BoothSelfiePrompt()` async function
2. Modify `googleDirectNanoBanana.service.ts` to check `generationMode` and call the appropriate prompt builder
3. Add mode toggle UI component in `CustomCelebrityInput.tsx`
4. Add toggle switch styles to `index.css`

### Phase 3: Integration
1. Update `App.tsx` to manage mode state and pass it through the composition pipeline
2. Ensure gallery metadata correctly records the generation mode
3. Test both modes end-to-end

## Step by Step Tasks
IMPORTANT: Execute every step in order, top to bottom.

### Step 1: Add Mode Toggle Styles
- Edit `src/index.css`
- Add toggle switch styles for the mode selector (Apple-style minimal toggle)
- Style should match the existing design system (dark theme, glass morphism)

### Step 2: Create Go1 Booth Async Prompt Builder
- Edit `src/services/composite/promptBuilder.ts`
- Create new async function `buildGo1BoothSelfiePrompt(celebrityName: string)` that returns the same structure as `buildFreestyleSelfiePrompt`
- The function should use the existing `buildCelebritySelfiePrompt()` as the base template
- Return format: `{ jsonTemplate: null, naturalLanguage: string, source: 'static' }`

### Step 3: Update Google Direct Service to Support Mode Selection
- Edit `src/services/composite/googleDirectNanoBanana.service.ts`
- Import `buildGo1BoothSelfiePrompt` from promptBuilder
- Modify the `compose()` method to check `config?.generationMode`
- If mode is `'go1'`, call `buildGo1BoothSelfiePrompt()` instead of `buildFreestyleSelfiePrompt()`
- Log which mode is being used

### Step 4: Add Mode Toggle UI to CustomCelebrityInput
- Edit `src/components/CustomCelebrityInput.tsx`
- Add new prop: `generationMode: CelebrityGenerationMode` and `onModeChange: (mode: CelebrityGenerationMode) => void`
- Add a toggle switch above the input field with labels "Freestyle" and "Go1 Booth"
- Toggle should be styled with Apple-minimal aesthetics
- Add brief description text that changes based on selected mode

### Step 5: Update App.tsx to Manage Mode State
- Edit `src/App.tsx`
- Add state: `const [generationMode, setGenerationMode] = useState<CelebrityGenerationMode>('freestyle')`
- Add localStorage persistence for mode preference on mount and change
- Pass `generationMode` and `setGenerationMode` to `CustomCelebrityInput`
- Update `handleCustomCelebritySubmit` to pass `generationMode` in the config
- Update gallery metadata to include the selected mode

### Step 6: Test Mode Switching
- Verify toggle UI appears and is styled correctly
- Test switching between modes
- Verify localStorage persists the preference
- Test image generation in both modes
- Verify different prompts are used for each mode (check console logs)

### Step 7: Run Validation Commands
- Execute all validation commands listed below
- Ensure zero regressions in build and compilation
- Test the app with both generation modes

## Testing Strategy

### Unit Tests
- Verify `buildGo1BoothSelfiePrompt` returns correct prompt structure
- Verify `buildFreestyleSelfiePrompt` continues to work unchanged
- Verify mode toggle state management works correctly
- Verify localStorage read/write for mode preference

### Edge Cases
- User has localStorage mode set to invalid value (fallback to 'freestyle')
- User switches mode while generation is in progress (should be disabled)
- Mode toggle on mobile viewport (ensure touch-friendly)
- Network error during generation in Go1 mode (same error handling as freestyle)

## Acceptance Criteria
- [ ] Mode toggle appears in CustomCelebrityInput above the text input
- [ ] Toggle has Apple-minimal styling matching existing design
- [ ] Selecting "Go1 Booth" mode persists in localStorage
- [ ] Freestyle mode generates casual selfies (current behavior)
- [ ] Go1 mode generates booth selfies with Go1 branding and lanyards
- [ ] Console logs indicate which mode and prompt is being used
- [ ] Gallery metadata correctly records the generation mode
- [ ] Build succeeds with no TypeScript errors
- [ ] Toggle is disabled during image generation
- [ ] Description text below toggle explains current mode

## Validation Commands
Execute every command to validate the feature works correctly with zero regressions.

```bash
# Check TypeScript compilation
cd /Users/antoine/claude/celeb-selfie && npx tsc --noEmit

# Build the project
cd /Users/antoine/claude/celeb-selfie && npm run build

# Start dev server for manual testing
cd /Users/antoine/claude/celeb-selfie && npm run dev

# Manual testing checklist:
# 1. Open http://localhost:5173
# 2. Complete onboarding
# 3. Capture a selfie
# 4. Verify mode toggle appears above celebrity input
# 5. Toggle is set to "Freestyle" by default
# 6. Switch to "Go1 Booth" mode
# 7. Refresh page - verify mode persists (localStorage)
# 8. Generate a selfie in Go1 mode - verify booth background in result
# 9. Switch to Freestyle mode
# 10. Generate a selfie - verify casual background
# 11. Check console logs for prompt differences
# 12. Open admin gallery (Ctrl+Shift+G) - verify mode is recorded in metadata
```

## Notes

### Existing Infrastructure
The codebase already has most of the infrastructure for this feature:
- `CelebrityGenerationMode` type exists in `src/types/index.ts`
- `CompositionConfig.generationMode` field exists in `src/services/composite/types.ts`
- `buildCelebritySelfiePrompt()` with Go1 booth prompt exists in `promptBuilder.ts`
- Gallery metadata supports `generationMode` field

### Go1 Booth Prompt Details
The existing Go1 booth prompt includes:
- Learning Technologies Paris exhibition at Porte de Versailles
- Purple-and-white conference lanyard with badge holder on celebrity
- Go1 booth background with suspended banner
- Light wood-grain laminate floor
- Dark industrial ceiling with silver lighting trusses
- Purple "Learning Technologies" banners

### Future Enhancements
- Add booth background image reference for even more accurate generation
- Support multiple booth templates (different conferences)
- Add lanyard customization options
- A/B testing between freestyle and Go1 mode quality
