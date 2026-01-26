# Bug: Camera Display Full Screen Instead of 2:3 Portrait Format

## Bug Description
The camera feed currently displays in full-screen mode, filling the entire viewport. The user needs the camera to display in a vertical format at 100% height but with a 2:3 (width:height) aspect ratio, similar to the standard iPhone camera vertical ratio. This will provide better framing and show more of the camera feed without excessive cropping.

**Current behavior:** Camera fills the entire screen width and height with `object-cover`, creating a zoomed-in effect.

**Expected behavior:** Camera displays at 100% viewport height but constrained to 2:3 aspect ratio (width:height), showing more of the camera frame in proper portrait orientation.

## Problem Statement
The camera video element uses `object-cover` which forces the video to fill its container completely, causing excessive cropping. The container has a max-width of `56.25vh` (9:16 ratio), but this doesn't match the desired 2:3 aspect ratio for the camera display.

## Solution Statement
Change the camera container to use a 2:3 (width:height) aspect ratio constraint and update the video element to use `object-contain` instead of `object-cover`. This will:
1. Display the camera at full viewport height (100dvh)
2. Constrain the width to maintain 2:3 aspect ratio (66.67vh width for 100vh height)
3. Show the full camera frame without aggressive cropping
4. Match standard iPhone camera portrait orientation

The 2:3 ratio (width:height) means: if height is 100vh, width will be 66.67vh (100 * 2/3).

## Steps to Reproduce
1. Open the app in a browser
2. Allow camera access
3. Observe the camera preview fills the entire screen
4. Notice the camera view is zoomed in and crops significant portions of the frame

## Root Cause Analysis
The bug is in `/Users/antoine/claude/celeb-selfie/src/components/Camera.tsx` at line 46:

```tsx
<div className="relative h-full overflow-hidden w-full max-w-[56.25vh]" role="region" aria-label="Camera preview">
```

And line 61:

```tsx
<video
  ref={videoRef}
  autoPlay
  playsInline
  muted
  className={`selfie-mirror absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${!isReady ? 'opacity-30' : ''}`}
  aria-label="Live camera feed"
/>
```

Issues:
1. The container uses `max-w-[56.25vh]` which creates a 9:16 aspect ratio (56.25% = 9/16), not the desired 2:3 ratio
2. The video uses `object-cover` which crops the feed to fill the container entirely
3. The calculation should be `max-w-[66.67vh]` for 2:3 ratio (66.67% = 2/3)

## Relevant Files
Use these files to fix the bug:

- **src/components/Camera.tsx** (lines 46, 61)
  - Update the container max-width from `56.25vh` (9:16) to `66.67vh` (2:3 ratio)
  - Change video `object-cover` to `object-contain` to show full camera frame
  - This matches the portrait aspect ratio expected by users and provides better framing

## Step by Step Tasks

### 1. Update Camera Container Aspect Ratio
- Open `src/components/Camera.tsx`
- Locate line 46 with the video preview container div
- Change `max-w-[56.25vh]` to `max-w-[66.67vh]` to create a 2:3 (width:height) aspect ratio
- Add a centered background color to fill any letterboxing gaps

### 2. Change Video Object Fit Strategy
- In the same file, locate line 61 with the video element
- Change `object-cover` to `object-contain` in the className
- This will show the full camera frame without aggressive cropping
- The video will fit within the container while maintaining its aspect ratio

### 3. Test the Changes
- Start the development server
- Test on desktop browser (resize window to verify aspect ratio holds)
- Test on mobile device (iPhone if possible) to verify portrait orientation
- Verify the camera shows more of the frame compared to before
- Ensure the shutter button, title overlay, and face guides still work correctly
- Take a test photo and verify the captured image maintains proper quality

### 4. Run Validation Commands
- Execute all validation commands listed below to ensure zero regressions
- Verify TypeScript compilation passes
- Verify build completes successfully

## Validation Commands
Execute every command to validate the bug is fixed with zero regressions.

### Manual Testing
1. **Visual Inspection**: Open the app and verify camera displays in 2:3 portrait format (not full screen)
2. **Aspect Ratio Check**: Measure container width should be ~66.67% of viewport height
3. **Camera Frame**: Verify more of the camera feed is visible (less cropping)
4. **Responsive Test**: Resize browser window and verify aspect ratio is maintained
5. **Mobile Test**: Test on iPhone to verify it matches standard camera portrait ratio

### Automated Validation
- `cd /Users/antoine/claude/celeb-selfie && npm run dev` - Start dev server and manually test camera display
- `cd /Users/antoine/claude/celeb-selfie && npm run build` - Run frontend build to validate the bug is fixed with zero regressions

## Notes
- The 2:3 aspect ratio (width:height) is a common portrait photo format
- Standard iPhone camera uses approximately 3:4 ratio, but 2:3 is close and works well for selfies
- Using `object-contain` may show letterboxing (black bars) on sides if camera feed doesn't match 2:3 exactly
- The background is already black, so letterboxing will blend naturally
- This change affects visual presentation only; the capture logic in `useCamera.ts` already crops to 2:3 (lines 96-122)
- No changes needed to the capture logic as it already handles 2:3 aspect ratio correctly
