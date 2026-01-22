# Bug: iPhone Camera Displays Horizontal Format Instead of Full Viewport

## Bug Description
On iPhone devices, the camera preview displays in a horizontal/landscape format (approximately 16:9) instead of filling the full viewport screen vertically. The expected behavior is for the camera to fill the entire screen height in a portrait orientation, similar to native iOS camera apps. This issue does not occur on desktop browsers where the camera works correctly.

## Problem Statement
The camera preview on iPhone shows a horizontal (landscape) aspect ratio video feed instead of a vertical (portrait) full-screen display. This results in large black bars above and below the camera feed, making inefficient use of the screen and providing a poor user experience on mobile devices.

## Solution Statement
Modify the camera constraints and video display to:
1. Use `object-cover` instead of `object-contain` to fill the viewport
2. Prioritize portrait-oriented video constraints that work correctly on iOS Safari
3. Ensure the video element properly covers the full viewport height using CSS

## Steps to Reproduce
1. Open the application on an iPhone (Safari browser)
2. Allow camera permissions when prompted
3. Observe the camera preview displays in a horizontal/landscape format
4. Large black/empty areas appear above and below the video feed
5. Expected: Camera should fill the full screen height in portrait orientation

## Root Cause Analysis
The issue stems from two factors:

1. **Video constraints in `useCamera.ts` (lines 35-41)**: The constraints specify `width: { ideal: 720 }` and `height: { ideal: 1280 }`, but iOS Safari may not honor these constraints and instead returns the native camera resolution which is typically landscape-oriented.

2. **Video element CSS in `Camera.tsx` (line 59)**: The video uses `object-contain` which preserves aspect ratio but doesn't fill the container, resulting in letterboxing when the video source aspect ratio doesn't match the container.

3. **iOS Safari behavior**: Unlike desktop browsers, iOS Safari often returns video streams in landscape orientation by default from the front-facing camera, regardless of device orientation.

## Relevant Files
Use these files to fix the bug:

- `src/hooks/useCamera.ts` - Contains `getUserMedia` constraints that need to be adjusted for iOS compatibility. Lines 35-41 define the video constraints.
- `src/components/Camera.tsx` - Contains the video element JSX with `object-contain` class that should be changed to `object-cover`. Line 59.
- `src/index.css` - May need additional CSS rules for iOS-specific video handling.

## Step by Step Tasks
IMPORTANT: Execute every step in order, top to bottom.

### 1. Update video constraints in useCamera.ts for iOS compatibility
- Modify the `getUserMedia` constraints to add `aspectRatio` constraint for portrait orientation
- Add iOS-specific constraint handling to force portrait aspect ratio
- Change constraints from:
  ```typescript
  video: {
    facingMode: 'user',
    width: { ideal: 720 },
    height: { ideal: 1280 },
  }
  ```
  To:
  ```typescript
  video: {
    facingMode: 'user',
    width: { ideal: 720, max: 1080 },
    height: { ideal: 1280, max: 1920 },
    aspectRatio: { ideal: 9/16 },
  }
  ```

### 2. Change video element from object-contain to object-cover in Camera.tsx
- In `Camera.tsx` line 59, change `object-contain` to `object-cover`
- This ensures the video fills the entire container without letterboxing
- The video will be cropped to fill rather than showing black bars
- Change:
  ```tsx
  className={`selfie-mirror absolute inset-0 w-full h-full object-contain ...`}
  ```
  To:
  ```tsx
  className={`selfie-mirror absolute inset-0 w-full h-full object-cover ...`}
  ```

### 3. Verify the capture logic still produces correct portrait output
- Review the `capturePhoto` function in `useCamera.ts` (lines 82-161)
- The function already crops to 2:3 portrait ratio from any source aspect ratio
- No changes needed as the crop logic handles both landscape and portrait source video

### 4. Run validation commands to ensure no regressions

## Validation Commands
Execute every command to validate the bug is fixed with zero regressions.

- `cd /Users/antoine/claude/celeb-selfie && npm run build` - Run frontend build to validate no TypeScript or compilation errors
- `cd /Users/antoine/claude/celeb-selfie && npx tsc --noEmit` - Run TypeScript type checking to validate type safety

## Notes
- The `capturePhoto` function already handles cropping from any source aspect ratio to a 2:3 portrait output, so captured photos will remain correct regardless of the source video orientation.
- This fix changes from `object-contain` (show full video with letterboxing) to `object-cover` (fill container, crop excess). Users will see a cropped preview but the capture logic compensates.
- iOS Safari has known quirks with `getUserMedia` where it may ignore dimension constraints and return the camera's native resolution. Adding `aspectRatio` as a hint helps but is not guaranteed.
- Testing should be performed on actual iPhone hardware as iOS Safari camera behavior differs significantly from desktop browsers and simulators.
- The face positioning guide overlay will help users center their face in the cropped preview area.
