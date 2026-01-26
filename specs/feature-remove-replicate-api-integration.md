# Feature: Remove Replicate API Integration

## Feature Description
Remove all Replicate API integration from the codebase, including services, UI components, types, hooks, and configuration. The application will use Google Direct API exclusively for Nano Banana Pro image generation. This simplifies the architecture, removes unused code, and reduces the codebase size while maintaining all core functionality.

## User Story
As a developer/maintainer
I want to remove the unused Replicate API integration
So that the codebase is simpler, more maintainable, and focused on the working Google Direct API

## Problem Statement
The application currently supports two APIs (Replicate and Google Direct) for Nano Banana Pro image generation. After successful testing, Google Direct API has proven to be:
- **Faster**: 20-40 seconds vs 60-90 seconds
- **Comparable cost**: $0.13-0.24 vs $0.15 per image
- **More reliable**: Direct access without CORS proxy complexity

Maintaining dual API support adds unnecessary complexity, extra code to maintain, and potential confusion for users.

## Solution Statement
Remove all Replicate-related code and simplify the application to use Google Direct API exclusively:
1. Delete Replicate service files and types
2. Remove API selector UI component
3. Simplify composite service factory to only create Google Direct service
4. Clean up environment variables
5. Remove CORS proxy Replicate-specific code
6. Update documentation

A comprehensive backup document (`docs/REPLICATE_BACKUP_DOCUMENTATION.md`) has been created to enable restoration if needed.

## Relevant Files
Use these files to implement the feature:

### Files to DELETE (Complete Removal)
- **`src/services/replicate.service.ts`** (264 lines)
  - Face swap service using Replicate SDK (deprecated feature)
  - Contains ReplicateAPIError, performFaceSwap, etc.

- **`src/services/composite/replicate.utils.ts`** (567 lines)
  - Unified Replicate API utilities
  - Contains submitPrediction, fetchImageAsDataUrl, CORS proxy logic

- **`src/services/composite/replicateNanoBanana.service.ts`** (242 lines)
  - Nano Banana Pro implementation via Replicate
  - Contains ReplicateNanoBananaService class

- **`src/types/replicate.types.ts`** (40 lines)
  - Replicate API response types
  - PredictionStatus, FaceSwapInput, ReplicatePrediction

- **`src/components/ApiSelector.tsx`** (235 lines)
  - UI component for toggling between Replicate/Google Direct
  - No longer needed with single API

- **`src/hooks/useFaceSwap.ts`** (112 lines)
  - React hook for face swap (deprecated feature)
  - Uses replicate.service.ts

### Files to MODIFY

- **`src/services/composite/index.ts`**
  - Remove ReplicateNanoBananaService import and export
  - Remove CompositeModel.NANO_BANANA_PRO case from factory
  - Remove compositeWithNanoBanana function
  - Remove compositeWithBothModels function
  - Keep only compositeWithGoogleDirect as main export

- **`src/services/composite/types.ts`**
  - Remove NANO_BANANA_PRO from CompositeModel enum
  - Remove ApiMode type (no longer needed)
  - Remove apiMode from CompositeResult.metadata
  - Remove selectedApiMode from CompositionConfig

- **`src/services/corsProxy.ts`**
  - Remove Replicate-specific proxy logic
  - Simplify to only handle Google API proxy
  - Remove /replicate/ path handling

- **`src/App.tsx`**
  - Remove ApiSelector import and usage
  - Remove apiMode state
  - Remove loadApiMode() call
  - Update handleCustomCelebritySubmit to only use compositeWithGoogleDirect
  - Simplify composition logic

- **`src/components/ProcessingIndicator.tsx`**
  - Remove apiMode prop
  - Remove API badge display logic (only one API now)
  - Simplify to show "Google AI" always

- **`src/components/CelebrityResult.tsx`**
  - Remove API metadata display
  - Remove apiMode references

- **`README.md`**
  - Remove "API Selection" section
  - Remove Replicate API documentation
  - Update "Tech Stack" to show only Google Direct
  - Update cost estimation section

- **`.env.example`**
  - Remove VITE_REPLICATE_API_TOKEN
  - Keep VITE_GOOGLE_AI_STUDIO_API_KEY
  - Update proxy URLs to only mention Google

- **`package.json`**
  - Remove "replicate" dependency

### Files to KEEP (for potential future use)

- **`src/services/composite/retry.utils.ts`**
  - Generic retry logic, still useful for Google Direct API
  - Not Replicate-specific

- **`nginx-replicate-proxy.conf`**
  - Keep for reference (or rename to `nginx-api-proxy.conf`)
  - Still needed for /google/ proxy path

### New Files

- **`docs/REPLICATE_BACKUP_DOCUMENTATION.md`** (Already created)
  - Complete backup of all Replicate code and configuration
  - Instructions for restoration if needed

## Implementation Plan

### Phase 1: Foundation
1. Verify backup documentation is complete
2. Run full test suite to establish baseline
3. Create a git branch for the removal work

### Phase 2: Core Removal
1. Delete Replicate-specific service files
2. Delete Replicate types file
3. Delete ApiSelector component
4. Delete useFaceSwap hook
5. Update composite service factory
6. Update composite types

### Phase 3: Integration Cleanup
1. Update App.tsx to remove API selection
2. Update ProcessingIndicator to remove API badge
3. Update CelebrityResult to remove API metadata
4. Simplify corsProxy.ts
5. Update environment configuration
6. Remove replicate npm package

### Phase 4: Documentation & Validation
1. Update README.md
2. Update .env.example
3. Run build and type checking
4. Test Google Direct API generation

## Step by Step Tasks
IMPORTANT: Execute every step in order, top to bottom.

### Step 1: Verify Backup Documentation
- Confirm `docs/REPLICATE_BACKUP_DOCUMENTATION.md` exists and is complete
- Review the file contains all necessary restoration information
- Create a git commit with the backup documentation

### Step 2: Delete Replicate Service Files
- Delete `src/services/replicate.service.ts`
- Delete `src/services/composite/replicate.utils.ts`
- Delete `src/services/composite/replicateNanoBanana.service.ts`
- Delete `src/types/replicate.types.ts`

### Step 3: Delete UI Components and Hooks
- Delete `src/components/ApiSelector.tsx`
- Delete `src/hooks/useFaceSwap.ts`

### Step 4: Update Composite Service Types
- Open `src/services/composite/types.ts`
- Remove `NANO_BANANA_PRO = 'nano-banana-pro'` from CompositeModel enum
- Remove `GPT_IMAGE` and `PHOTOMAKER` if not used
- Remove `ApiMode` type definition
- Remove `apiMode?: ApiMode` from CompositeResult.metadata
- Remove `selectedApiMode?: ApiMode` from CompositionConfig

### Step 5: Update Composite Service Factory
- Open `src/services/composite/index.ts`
- Remove import for ReplicateNanoBananaService
- Remove CompositeModel.NANO_BANANA_PRO case from createCompositeService
- Remove `compositeWithNanoBanana` function entirely
- Remove `compositeWithBothModels` function entirely
- Remove `DualProgressCallbacks` and `DualCompositeResult` types if defined
- Keep only `compositeWithGoogleDirect` as the main export
- Remove ReplicateNanoBananaService from exports

### Step 6: Update App.tsx
- Remove import for `ApiSelector` and `loadApiMode`
- Remove import for `compositeWithNanoBanana` and `ApiMode`
- Remove `apiMode` state and `setApiMode`
- Remove ApiSelector component from JSX
- Update `handleCustomCelebritySubmit` to always use `compositeWithGoogleDirect`
- Remove conditional logic checking apiMode

### Step 7: Update ProcessingIndicator Component
- Open `src/components/ProcessingIndicator.tsx`
- Remove `apiMode` prop from interface
- Remove API badge display or simplify to always show "Google AI"
- Update any conditional rendering based on apiMode

### Step 8: Update CelebrityResult Component
- Open `src/components/CelebrityResult.tsx`
- Remove apiMode display in metadata section
- Remove any Replicate-specific text (e.g., "Powered by... Replicate API")
- Update to show only "Powered by Google Gemini"

### Step 9: Simplify CORS Proxy
- Open `src/services/corsProxy.ts`
- Remove or simplify Replicate-specific URL handling
- Keep Google API proxy logic
- Remove /replicate/ path detection if present
- Consider renaming functions for clarity

### Step 10: Update Environment Configuration
- Open `.env.example`
- Remove `VITE_REPLICATE_API_TOKEN` line
- Update comments to reference Google API only
- Update proxy URL comments

### Step 11: Remove npm Dependency
- Run `npm uninstall replicate`
- Verify package.json no longer contains replicate
- Run `npm install` to update package-lock.json

### Step 12: Update Documentation
- Open `README.md`
- Remove "API Selection" section entirely
- Remove Replicate from "Tech Stack" section
- Update "Cost Estimation" to show only Google Direct pricing
- Update any other Replicate references

### Step 13: Run Validation Commands
- Execute all validation commands listed below
- Ensure zero regressions in build and compilation
- Test the app with Google Direct API

## Testing Strategy

### Unit Tests
- Verify composite service factory only creates Google Direct service
- Verify no TypeScript errors after removal
- Test that compositeWithGoogleDirect still works correctly

### Edge Cases
- Verify localStorage 'celeb-selfie-api-mode' doesn't cause errors if set to 'replicate'
- Verify app works without VITE_REPLICATE_API_TOKEN env var
- Verify CORS proxy still works for Google API

## Acceptance Criteria
- [ ] All Replicate service files deleted (5 files)
- [ ] ApiSelector component deleted
- [ ] useFaceSwap hook deleted
- [ ] replicate.types.ts deleted
- [ ] composite/index.ts only exports Google Direct
- [ ] composite/types.ts has no ApiMode references
- [ ] App.tsx has no API selection logic
- [ ] ProcessingIndicator has no API badge
- [ ] CelebrityResult shows only Google credit
- [ ] package.json has no replicate dependency
- [ ] Build succeeds with no TypeScript errors
- [ ] Google Direct API generation works end-to-end
- [ ] README updated with no Replicate references
- [ ] Backup documentation exists at docs/REPLICATE_BACKUP_DOCUMENTATION.md

## Validation Commands
Execute every command to validate the feature works correctly with zero regressions.

```bash
# Verify TypeScript compilation (no errors)
npm run build

# Check for TypeScript errors explicitly
npx tsc --noEmit

# Verify no replicate imports remain
grep -r "from.*replicate" src/ --include="*.ts" --include="*.tsx" | grep -v "BACKUP" || echo "No replicate imports found - PASS"

# Verify no Replicate references in active code
grep -r "Replicate" src/ --include="*.ts" --include="*.tsx" | wc -l
# Should be 0 or very few (only in comments)

# Verify package.json doesn't have replicate
grep "replicate" package.json || echo "No replicate dependency - PASS"

# Verify deleted files don't exist
ls src/services/replicate.service.ts 2>/dev/null && echo "FAIL: File exists" || echo "PASS: replicate.service.ts deleted"
ls src/services/composite/replicate.utils.ts 2>/dev/null && echo "FAIL: File exists" || echo "PASS: replicate.utils.ts deleted"
ls src/services/composite/replicateNanoBanana.service.ts 2>/dev/null && echo "FAIL: File exists" || echo "PASS: replicateNanoBanana.service.ts deleted"
ls src/types/replicate.types.ts 2>/dev/null && echo "FAIL: File exists" || echo "PASS: replicate.types.ts deleted"
ls src/components/ApiSelector.tsx 2>/dev/null && echo "FAIL: File exists" || echo "PASS: ApiSelector.tsx deleted"
ls src/hooks/useFaceSwap.ts 2>/dev/null && echo "FAIL: File exists" || echo "PASS: useFaceSwap.ts deleted"

# Verify backup documentation exists
ls docs/REPLICATE_BACKUP_DOCUMENTATION.md && echo "PASS: Backup documentation exists"

# Start dev server and test
npm run dev
# Navigate to http://localhost:5173
# Take selfie, enter celebrity name, generate
# Verify Google Direct API works (20-40 seconds, image generated)
```

## Notes

### Backup Location
All Replicate code is documented in `docs/REPLICATE_BACKUP_DOCUMENTATION.md` including:
- Complete source code for all services
- Type definitions
- Environment variables
- Nginx configuration
- Step-by-step restoration instructions

### Future Considerations
- If Replicate becomes preferable in the future (new features, better pricing), use the backup documentation to restore
- The CORS proxy infrastructure on the US VPS still supports both APIs via nginx
- The `/replicate/` path in nginx can be kept for potential future use

### Breaking Changes
- Users who had 'replicate' saved in localStorage will default to Google Direct
- No user-facing impact since both APIs produce same quality output

### Files NOT to Delete
- `src/services/composite/retry.utils.ts` - Generic utility, still used by Google Direct
- `nginx-replicate-proxy.conf` - Keep for VPS reference (has both /replicate/ and /google/ paths)

### Estimated Cleanup
- ~1,460 lines of code removed
- 6 files deleted
- 8 files modified
- 1 npm dependency removed
