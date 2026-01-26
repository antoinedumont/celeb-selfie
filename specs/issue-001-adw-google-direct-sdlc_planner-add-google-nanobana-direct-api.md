# Feature: Add Direct Google Nano Banana Pro API Integration

## Feature Description
Add a parallel implementation to test Google's Nano Banana Pro API directly (without going through Replicate) while keeping the existing Replicate-based implementation. This allows for A/B testing, cost comparison, and performance benchmarking between the two approaches. Users will have an option to choose which API to use via a toggle in the UI.

## User Story
As a developer
I want to test Google's Nano Banana Pro API directly
So that I can compare costs, performance, and image quality against the Replicate API implementation

## Problem Statement
Currently, the app uses Replicate API as a proxy to access Google's Nano Banana Pro model. While this works well, it:
- Adds an extra layer of latency (Replicate proxy overhead)
- Costs $0.15 per image through Replicate
- Doesn't allow direct comparison with Google's native API
- Prevents testing of Google-specific features that may not be available through Replicate

We need a way to test Google's API directly while keeping the battle-tested Replicate implementation as the default.

## Solution Statement
Implement a new service class `GoogleDirectNanoBananaService` that calls Google's Nano Banana Pro API directly using the existing Google AI Studio API key. Add a UI toggle (similar to a feature flag) that allows switching between "Replicate API" and "Google Direct API" modes. Both implementations will use the same interface (`CompositeService`) for seamless integration.

The solution maintains backward compatibility by:
- Keeping Replicate as the default
- Using the same service interface
- Reusing existing prompt generation logic
- Maintaining the same UI flow

## Relevant Files
Use these files to implement the feature:

- **`src/services/composite/replicateNanoBanana.service.ts`** - Existing Replicate implementation; serves as reference for the new Google Direct service
- **`src/services/composite/types.ts`** - Contains `CompositeService` interface and `CompositeResult` types that the new service must implement
- **`src/services/composite/index.ts`** - Factory function that creates service instances; needs to handle new `GOOGLE_DIRECT` model type
- **`src/services/composite/promptBuilder.ts`** - Shared prompt generation logic (Gemini-powered freestyle prompts)
- **`src/App.tsx`** - Main app component; needs UI toggle to switch between APIs
- **`src/types/index.ts`** - Type definitions; may need new types for API selection state
- **`.env`** - Contains `VITE_GOOGLE_AI_STUDIO_API_KEY` which will be used for direct API calls

### New Files
- **`src/services/composite/googleDirectNanoBanana.service.ts`** - New service class that implements direct Google API calls
- **`src/components/ApiSelector.tsx`** - New component for toggling between Replicate and Google Direct APIs

## Implementation Plan

### Phase 1: Foundation
1. Research Google's Nano Banana Pro API documentation to understand:
   - Endpoint URLs and authentication
   - Request/response format
   - Rate limits and pricing
   - Available parameters (resolution, aspect ratio, etc.)
   - How to pass reference images (user selfie)

2. Update type definitions:
   - Add `GOOGLE_DIRECT` to `CompositeModel` enum in `types.ts`
   - Add `apiMode` to app state types for tracking which API is selected

3. Create utility functions for Google API communication:
   - HTTP client with proper headers (API key authentication)
   - Error handling for Google-specific error codes
   - Progress polling (if Google API uses async pattern)

### Phase 2: Core Implementation
1. Implement `GoogleDirectNanoBananaService` class:
   - Implement `CompositeService` interface
   - Handle Google authentication with API key from `.env`
   - Convert our prompt format to Google's expected format
   - Handle image uploads (user selfie as reference)
   - Poll for completion if Google uses async pattern
   - Return `CompositeResult` matching Replicate's format

2. Update factory function:
   - Modify `createCompositeService()` in `index.ts` to handle `GOOGLE_DIRECT` model
   - Add new export function `compositeWithGoogleDirect()` similar to `compositeWithNanoBanana()`

3. Add API selector UI:
   - Create `ApiSelector.tsx` component with toggle/radio buttons
   - Add to App.tsx near the celebrity input
   - Persist selection in localStorage for convenience
   - Show relevant info (cost, speed) for each option

### Phase 3: Integration
1. Wire up App.tsx:
   - Add state for API mode selection
   - Pass API mode to composition function
   - Update `handleCustomCelebritySubmit()` to use selected API
   - Show which API is being used in processing indicator

2. Add comparison metadata:
   - Log both API responses for comparison
   - Track cost, time, and quality metrics
   - Save API mode used in gallery metadata

3. Testing and validation:
   - Test with multiple celebrities
   - Compare image quality side-by-side
   - Verify error handling for both APIs
   - Ensure fallback works if one API fails

## Step by Step Tasks

### Task 1: Research Google Nano Banana Pro API
- Search for official Google AI Studio / Gemini API documentation for Nano Banana Pro
- Document endpoint URL, authentication method, request/response format
- Identify how to pass reference images (user selfie)
- Note any differences from Replicate's API format
- **If API doesn't exist or is unavailable**: Document this and pivot to using Google Imagen 3 API or similar Google image generation API

### Task 2: Update Type Definitions
- Edit `src/services/composite/types.ts`
- Add `GOOGLE_DIRECT = 'google-direct'` to `CompositeModel` enum
- Add `selectedApiMode?: 'replicate' | 'google-direct'` to `CompositionConfig` interface
- Export new type `ApiMode = 'replicate' | 'google-direct'`

### Task 3: Create Google Direct Service
- Create new file `src/services/composite/googleDirectNanoBanana.service.ts`
- Implement `GoogleDirectNanoBananaService` class that implements `CompositeService` interface
- Use `VITE_GOOGLE_AI_STUDIO_API_KEY` from environment
- Handle HTTP requests to Google API
- Convert our format to Google's format
- Parse Google's response to `CompositeResult`
- Add comprehensive logging similar to Replicate service
- Handle errors gracefully with detailed error messages

### Task 4: Add Utility Functions
- Create `src/services/composite/google.utils.ts` for Google-specific utilities
- Add function to upload images to Google (if needed)
- Add function to poll for completion (if async)
- Add function to format errors from Google API
- Add retry logic similar to `retry.utils.ts`

### Task 5: Update Service Factory
- Edit `src/services/composite/index.ts`
- Update `createCompositeService()` to handle `CompositeModel.GOOGLE_DIRECT`
- Add new function `compositeWithGoogleDirect()` similar to `compositeWithNanoBanana()`
- Add logging to show which service is being created

### Task 6: Create API Selector Component
- Create new file `src/components/ApiSelector.tsx`
- Build toggle/radio UI to switch between "Replicate API" and "Google Direct API"
- Show cost and speed info for each option
- Add icons for visual distinction
- Style with Tailwind CSS matching app's design
- Save selection to localStorage
- Emit onChange event with selected API mode

### Task 7: Integrate API Selector in App
- Edit `src/App.tsx`
- Add state: `const [apiMode, setApiMode] = useState<ApiMode>('replicate')`
- Load saved preference from localStorage on mount
- Add `<ApiSelector>` component in the UI (between camera and celebrity input)
- Pass `apiMode` to composition function
- Update processing indicator to show which API is being used

### Task 8: Update Composition Logic
- Edit `src/App.tsx` in `handleCustomCelebritySubmit()`
- Check `apiMode` state
- Call `compositeWithGoogleDirect()` if mode is 'google-direct'
- Call `compositeWithNanoBanana()` if mode is 'replicate' (default)
- Log which API is being used
- Save API mode in gallery metadata

### Task 9: Add Comparison Features
- Edit `src/components/CelebrityResult.tsx`
- Show which API was used in result metadata
- Display cost and processing time for comparison
- Add visual badge ("via Replicate" or "via Google Direct")

### Task 10: Error Handling and Edge Cases
- Test with invalid API key
- Test with network errors
- Test with rate limiting scenarios
- Ensure graceful degradation if Google API is unavailable
- Add user-friendly error messages for Google-specific errors

### Task 11: Documentation
- Update `README.md` with new API toggle feature
- Document how to switch between APIs
- Add cost comparison section
- Add troubleshooting for Google API issues

### Task 12: Run Validation Commands
- Execute all validation commands listed below
- Verify no regressions in existing Replicate functionality
- Test both API modes end-to-end
- Ensure dev server builds without errors

## Testing Strategy

### Unit Tests
- Test `GoogleDirectNanoBananaService.compose()` with mock Google API responses
- Test error handling for various Google API error codes
- Test retry logic for transient failures
- Test API selector component state management
- Test localStorage persistence of API mode preference

### Integration Tests
- Test full flow with Replicate API (existing behavior)
- Test full flow with Google Direct API (new behavior)
- Test switching between APIs mid-session
- Test that both APIs produce valid `CompositeResult` objects
- Test gallery saves correct API mode metadata

### Edge Cases
- Google API returns 401 (invalid API key)
- Google API returns 429 (rate limit exceeded)
- Google API times out
- User switches API mid-generation (should be disabled/ignored)
- No internet connection
- Google API returns unexpected response format
- Reference image too large for Google API
- Celebrity name contains special characters that break Google's prompt format

## Acceptance Criteria
1. ✅ New `GoogleDirectNanoBananaService` class successfully calls Google's API directly
2. ✅ API selector UI allows toggling between "Replicate API" and "Google Direct API"
3. ✅ Selected API mode persists in localStorage across sessions
4. ✅ Both APIs generate celebrity selfies successfully
5. ✅ Processing indicator shows which API is being used
6. ✅ Result metadata includes API mode used (visible in admin gallery)
7. ✅ Error handling works for both APIs with user-friendly messages
8. ✅ Existing Replicate functionality remains unchanged (backward compatible)
9. ✅ README documentation updated with API comparison info
10. ✅ Dev server builds without errors
11. ✅ No TypeScript compilation errors
12. ✅ Cost and processing time logged for both APIs for comparison

## Validation Commands
Execute every command to validate the feature works correctly with zero regressions.

```bash
# Check TypeScript compilation
cd /Users/antoine/claude/celeb-selfie
npm run build

# Start dev server (test in browser)
npm run dev

# Manual testing checklist:
# 1. Open http://localhost:5180
# 2. Verify API selector appears in UI
# 3. Capture a selfie
# 4. Select "Replicate API" mode
# 5. Generate a celebrity selfie → should work (existing behavior)
# 6. Capture another selfie
# 7. Select "Google Direct API" mode
# 8. Generate a celebrity selfie → should work (new behavior)
# 9. Compare results in admin gallery (Ctrl+Shift+G)
# 10. Verify API mode is shown in metadata
# 11. Check console logs for API calls and timing
# 12. Test error handling by temporarily invalidating API key in .env
```

### Browser Testing
- Test on Chrome, Firefox, Safari
- Test on mobile viewport
- Verify API selector is mobile-friendly
- Verify switching APIs works smoothly
- Verify localStorage persistence

### Performance Testing
- Measure time difference between Replicate and Google Direct APIs
- Compare image quality
- Compare costs (log in console)
- Verify no memory leaks when switching APIs repeatedly

## Notes

### Google API Key Already Available
- The app already has `VITE_GOOGLE_AI_STUDIO_API_KEY` in `.env`
- Currently used for Gemini 2.5 Flash prompt generation
- Will be reused for direct Nano Banana Pro API calls
- No new API key needed!

### Backward Compatibility
- Replicate API remains the default
- Existing code paths unchanged
- API selector is opt-in (user must explicitly choose Google Direct)
- If Google API fails, could add automatic fallback to Replicate

### Future Enhancements
- Add side-by-side comparison mode (generate with both APIs simultaneously)
- Add quality voting (which API produces better results?)
- Track success rates for both APIs
- Add cost calculator showing savings over time
- Add A/B testing framework for automated comparison

### Cost Comparison Hypothesis
- Replicate: $0.15 per image (known)
- Google Direct: TBD (likely cheaper, need to verify from Google's pricing)
- If Google is cheaper, could save significant costs at scale

### Technical Considerations
- Google API may have different rate limits than Replicate
- May need to implement queuing if rate limits are strict
- Image quality might differ between APIs (need subjective comparison)
- Google API might have different safety filters (may affect celebrity content)
- **Important**: If Google blocks celebrity content (similar to EU geo-blocking), this feature becomes a comparison tool showing why Replicate is necessary

### Debugging Tools
- Add `console.log()` for every API call with timestamps
- Log full request/response for comparison
- Add toggle to enable verbose logging mode
- Save API comparison data to localStorage for analysis

### Documentation to Add
- Comparison table in README (Replicate vs Google Direct)
- Troubleshooting section for Google API errors
- FAQ: "Which API should I use?"
- Cost calculator example

---

**Estimated Implementation Time**: 3-4 hours
**Complexity**: Medium (new service class + UI integration)
**Risk**: Low (non-breaking, additive feature with fallback)
