# Bug: Google API Invalid JSON Payload - Unknown Field "resolution"

## Bug Description

When attempting to generate images using Google Direct API, the request fails with:
```
Google API error: Invalid JSON payload received. Unknown name "resolution" at 'generation_config.image_config': Cannot find field.
```

**Expected Behavior**: Image generation should succeed with the specified resolution.

**Actual Behavior**: API request is rejected due to incorrect field name in the JSON payload.

## Problem Statement

The `GoogleDirectNanoBananaService` is sending an incorrect field name (`resolution`) in the `imageConfig` object. Google's Gemini API expects the field to be named `imageSize` instead of `resolution`.

## Solution Statement

Update the `GoogleDirectNanoBananaService` to use the correct field name (`imageSize`) in the `generationConfig.imageConfig` object when making requests to Google's Gemini API.

## Steps to Reproduce

1. Start the development server: `npm run dev`
2. Open browser to `http://localhost:5180`
3. Take a selfie
4. Select "Google Direct API" mode
5. Enter a celebrity name and generate
6. Observe error in console: "Invalid JSON payload received. Unknown name 'resolution'"

## Root Cause Analysis

**File**: `src/services/composite/googleDirectNanoBanana.service.ts`
**Line**: 127

The code currently sends:
```typescript
generationConfig: {
  responseModalities: ['TEXT', 'IMAGE'],
  imageConfig: {
    resolution: this.mapResolution(resolution),  // ❌ WRONG FIELD NAME
  },
}
```

According to [Google Gemini API documentation](https://ai.google.dev/gemini-api/docs/image-generation), the correct field name is `imageSize`, not `resolution`.

**Correct format**:
```typescript
generationConfig: {
  responseModalities: ['TEXT', 'IMAGE'],
  imageConfig: {
    imageSize: this.mapResolution(resolution),  // ✅ CORRECT FIELD NAME
  },
}
```

The API expects:
- Field name: `imageSize` (not `resolution`)
- Valid values: `"1K"`, `"2K"`, `"4K"` (uppercase K)
- Optional fields: `aspectRatio` (e.g., "16:9", "1:1"), `numberOfImages` (1-4)

## Relevant Files

Use these files to fix the bug:

- **`src/services/composite/googleDirectNanoBanana.service.ts`** (line 110-130)
  - Contains the incorrect field name `resolution` in the request payload
  - Needs to be changed to `imageSize`

- **`src/services/composite/types.ts`** (line 120-128)
  - Contains TypeScript type definition for `GeminiGenerationConfig`
  - Type definition has incorrect field name that needs updating for type safety

### New Files
None required - this is a simple field name correction.

## Step by Step Tasks

### Task 1: Update TypeScript Type Definition
- Edit `src/services/composite/types.ts`
- Locate the `GeminiGenerationConfig` interface (around line 120)
- Change field name from `resolution: string;` to `imageSize: string;`
- This ensures TypeScript type safety matches the actual API

### Task 2: Update Google Direct Service Request
- Edit `src/services/composite/googleDirectNanoBanana.service.ts`
- Locate the request building code (around line 127)
- Change `resolution: this.mapResolution(resolution)` to `imageSize: this.mapResolution(resolution)`

### Task 3: Verify TypeScript Compilation
- Run `npm run build` to ensure no TypeScript errors
- Verify the build completes successfully

### Task 4: Test Google Direct API
- Start dev server: `npm run dev`
- Take a selfie
- Select "Google Direct API" mode
- Generate a celebrity selfie
- Verify the request succeeds without field name errors

### Task 5: Run Validation Commands
- Execute all validation commands listed below
- Verify the bug is fixed with zero regressions

## Validation Commands

Execute every command to validate the bug is fixed with zero regressions.

```bash
# 1. TypeScript compilation check
npm run build

# Should output: ✓ built in X.XXs
# No errors about 'resolution' field

# 2. Start dev server
npm run dev

# 3. Manual testing:
# - Open http://localhost:5180
# - Take selfie
# - Select "Google Direct API"
# - Enter celebrity name (e.g., "Brad Pitt")
# - Generate image
# - Check browser console logs:
#   ✅ Should see: "[Google Direct Nano Banana] Google API completed in XXXms"
#   ❌ Should NOT see: "Invalid JSON payload received. Unknown name 'resolution'"

# 4. Verify request payload in Network tab:
# - Open DevTools → Network tab
# - Look for POST request to generativelanguage.googleapis.com
# - Check request payload contains:
#   {
#     "generationConfig": {
#       "imageConfig": {
#         "imageSize": "2K"  // ✅ Correct field name
#       }
#     }
#   }
```

## Notes

### API Documentation References
- [Nano Banana Image Generation Docs](https://ai.google.dev/gemini-api/docs/image-generation)
- [Gemini 3 Developer Guide](https://ai.google.dev/gemini-api/docs/gemini-3)

### Valid `imageSize` Values
- `"1K"` - Low resolution (faster, cheaper: ~$0.13/image)
- `"2K"` - Standard resolution (default)
- `"4K"` - High resolution (slower, more expensive: ~$0.24/image)

**Important**: The "K" must be uppercase!

### Optional Additional Fields
If we want to add more control in the future:
```typescript
imageConfig: {
  imageSize: "2K",
  aspectRatio: "2:3",      // Optional: portrait for selfies
  numberOfImages: 2         // Optional: generate multiple variations
}
```

### Why This Matters
- Without the correct field name, **every Google Direct API request fails**
- This is a **blocking bug** that prevents Google Direct API from working at all
- Fix is simple (1-word change) but critical for functionality

### Testing Checklist
After fix, verify:
- ✅ Google Direct API generates images successfully
- ✅ No "Invalid JSON payload" errors in console
- ✅ Images are generated at correct resolution (2K default)
- ✅ Cost and timing metadata is correct
- ✅ Replicate API still works (no regressions)
- ✅ TypeScript compilation succeeds
- ✅ Build succeeds

### Related Issues
This bug only affects Google Direct API. Replicate API is unaffected as it uses a different request format.
