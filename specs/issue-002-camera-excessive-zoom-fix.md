# Bug: Camera Excessive Zoom - Need Middle Shot/Frame

## Bug Description
The camera component is displaying an excessively zoomed-in view compared to the standard iPhone camera app. Users report that the camera preview feels too close/cropped, showing less of their face and body than expected. The user wants a "middle shot/frame" that shows more context, similar to what the native iPhone camera provides.

**Expected Behavior**: Camera should show a medium/middle shot with comfortable framing, allowing users to see their upper body and shoulders in the frame, similar to the native iPhone camera app.

**Actual Behavior**: Camera appears heavily zoomed in, showing primarily just the face with less context, making it difficult to frame selfies properly.

## Problem Statement
The `.camera-video-dezoom` CSS class applies `transform: scale(0.88)` which scales the video element down to 88% of its original size. However, because the video has `object-cover` applied, this creates a paradoxical effect where the scaled-down video is then stretched to fill the container, resulting in a MORE zoomed-in appearance rather than showing more of the frame. Additionally, the camera constraints request a narrow portrait aspect ratio (720x1280) which may contribute to the zoomed feel.

## Solution Statement
Fix the camera zoom issue by adjusting the video scaling approach:
1. **Remove or adjust the `.camera-video-dezoom` scale transform** - The current scale(0.88) combined with object-cover creates the opposite of the intended effect
2. **Change object-fit from `cover` to `contain`** - This will ensure the entire video frame is visible without cropping
3. **Adjust camera constraints if needed** - Consider requesting a wider field of view from the camera hardware
4. **Test to achieve the desired "middle shot" framing** - Ensure users can comfortably see their upper body in the frame

The goal is to match or approximate the native iPhone camera app's default framing.

## Steps to Reproduce
1. Open the app on an iPhone (or any mobile device)
2. Allow camera access
3. Observe the camera preview on the Camera component
4. Compare with the native iPhone Camera app
5. Notice the Celeb Selfie camera appears significantly more zoomed in
6. Try to frame a selfie - note that less of the body/context is visible

## Root Cause Analysis
The root cause is a CSS transform misconfiguration:

1. **File**: `src/index.css:969-972`
   ```css
   .camera-video-dezoom {
     transform: scale(0.88);
     transform-origin: center center;
   }
   ```

2. **File**: `src/components/Camera.tsx:59`
   ```tsx
   className={`camera-video-dezoom selfie-mirror absolute inset-0 w-full h-full object-cover ...`}
   ```

The `scale(0.88)` was intended to "dezoom" (show more of the frame) per feature-004, but when combined with `object-cover`, it has the opposite effect:
- The video element is scaled DOWN to 88% size
- `object-cover` then stretches/crops the video to fill the container
- This results in a MORE zoomed appearance because we're essentially cropping more of the video

Additionally, the aspect ratio constraint (720x1280 = 9:16 portrait) in `useCamera.ts` may request a narrower field of view than the native camera app uses.

## Relevant Files
Use these files to fix the bug:

### Existing Files to Modify

- **`src/index.css`** (lines 969-972)
  - Contains the `.camera-video-dezoom` class with problematic `transform: scale(0.88)`
  - Need to either remove this class or adjust the scale value
  - Possibly change from scale-based approach to a different method

- **`src/components/Camera.tsx`** (line 59)
  - Applies `camera-video-dezoom` and `object-cover` classes to the video element
  - May need to change `object-cover` to `object-contain` for better framing
  - Consider adding container padding or adjusting video container sizing

- **`src/hooks/useCamera.ts`** (lines 36-40)
  - Defines camera constraints with `width: { ideal: 720 }` and `height: { ideal: 1280 }`
  - May need to adjust aspect ratio or remove height/width constraints to allow wider field of view
  - Consider requesting lower resolution or different aspect ratio for better framing

### New Files
None required - this is a CSS and configuration fix.

## Step by Step Tasks
IMPORTANT: Execute every step in order, top to bottom.

### Step 1: Analyze Current Camera Behavior
- Test the current camera on iPhone/mobile device
- Take screenshots of the current zoomed-in framing
- Compare side-by-side with native iPhone Camera app
- Document the difference in visible frame area

### Step 2: Experiment with CSS Dezoom Removal
- Temporarily remove or comment out the `camera-video-dezoom` class from `src/components/Camera.tsx:59`
- Test the camera preview without the scale transform
- Document whether this improves or worsens the framing
- Take screenshots for comparison

### Step 3: Change object-fit to object-contain
- In `src/components/Camera.tsx:59`, change `object-cover` to `object-contain`
- This ensures the entire camera frame is visible without cropping
- Test on mobile device to see if this achieves the desired "middle shot"
- Document the visible frame area

### Step 4: Adjust or Remove the Scale Transform
- Based on testing results, decide on the optimal scale value or removal
- **Option A**: Remove `camera-video-dezoom` class entirely if `object-contain` is sufficient
- **Option B**: Adjust the scale value (e.g., `scale(1.0)` or `scale(1.1)` for slight zoom out)
- **Option C**: Use a different CSS approach (padding, larger container, etc.)
- Update `src/index.css` accordingly

### Step 5: Optimize Camera Constraints (if needed)
- If framing is still not ideal after CSS changes, adjust camera constraints in `src/hooks/useCamera.ts`
- Consider removing explicit width/height ideals to let the camera use its native resolution
- Test with different constraint configurations:
  ```typescript
  video: {
    facingMode: 'user',
    // Option 1: Remove width/height (let camera decide)
    // Option 2: Request wider aspect (e.g., 16:9 instead of 9:16)
  }
  ```
- Choose the configuration that provides the best "middle shot" framing

### Step 6: Test Across Multiple Devices
- Test the fix on iPhone (primary device mentioned by user)
- Test on Android devices to ensure cross-platform consistency
- Test on desktop/laptop webcam to verify no regression
- Verify the selfie mirror effect still works correctly
- Ensure captured photos still have correct orientation and framing

### Step 7: Verify No Visual Regressions
- Check that face guide overlays are still properly centered
- Verify the camera shutter button is still visible and accessible
- Ensure title overlay and other UI elements are not obscured
- Test loading state and error states remain functional
- Confirm smooth camera initialization

### Step 8: Update Documentation
- Update comments in `src/index.css` if `.camera-video-dezoom` is modified
- Document the final solution approach in code comments
- Note any device-specific considerations discovered during testing

### Step 9: Run Validation Commands
- Execute all validation commands listed below
- Ensure zero regressions in build and compilation
- Verify the app still builds successfully for production

## Validation Commands
Execute every command to validate the bug is fixed with zero regressions.

### Pre-Fix Validation
```bash
# Document current behavior
npm run dev
# Navigate to http://localhost:5173
# Take screenshot of camera view on iPhone
# Compare to native Camera app and document zoom difference
```

### Post-Fix Validation
```bash
# Verify TypeScript compilation
npm run build

# Check for TypeScript errors
npm run build 2>&1 | grep -i error || echo "No errors found"

# Verify production build succeeds
ls -lh dist/assets/*.js dist/assets/*.css

# Start dev server and test camera
npm run dev
# Navigate to http://localhost:5173
# Test camera on iPhone/mobile device
# Verify "middle shot" framing shows more context
# Take screenshot and compare to pre-fix screenshot
# Verify improvement in visible frame area
```

### Manual Testing Checklist
- [ ] Camera preview shows more of the user (upper body visible, not just face)
- [ ] Framing is comfortable and similar to native iPhone camera
- [ ] Face guide overlays are properly positioned
- [ ] Camera shutter button is visible and functional
- [ ] Selfie mirror effect works (image is flipped horizontally)
- [ ] Photo capture still works correctly
- [ ] Captured photo quality is maintained
- [ ] No visual glitches or layout issues
- [ ] Loading state displays correctly
- [ ] Error states work properly

### Cross-Device Testing
- [ ] Test on iPhone (user's primary device)
- [ ] Test on Android device
- [ ] Test on desktop/laptop webcam
- [ ] Verify consistent behavior across devices

## Notes

### Background Context
This bug is related to feature-004-camera-button-overlay-dezoom.md which intended to implement a "dezoom" effect to show more of the frame. However, the implementation using `transform: scale(0.88)` combined with `object-cover` created the opposite effect.

### Technical Insights
- **CSS `object-cover`**: Scales the video to cover the entire container, cropping excess. When combined with `scale()` transform, this creates unexpected zoom behavior.
- **CSS `object-contain`**: Scales the video to fit within the container, showing the entire frame. This is more predictable and likely what users expect.
- **Camera constraints**: Mobile browsers may ignore width/height ideals depending on hardware capabilities. Testing on actual devices is critical.

### Design Considerations
- The "middle shot" framing should show the user's head and shoulders comfortably
- Leave some space above the head and around the face for natural framing
- Match the comfort level of standard camera apps where users feel they can properly frame themselves
- Maintain the PhotoAI-inspired aesthetic while improving usability

### Potential Solutions (in order of preference)
1. **Remove scale transform + use object-contain**: Simplest and most predictable
2. **Adjust scale value + keep object-cover**: If precise cropping is needed
3. **Change camera constraints**: If CSS changes are insufficient
4. **Combination approach**: CSS + constraint adjustments for optimal result

### Related Features
- Feature 004: Camera Button Overlay & Dezoom (original implementation)
- Feature 006: Apple Native Camera UI (current UI design)
- Issue 001: Camera Centering Bug Fix (previous camera-related bug)

### User Expectation
The user explicitly mentioned "i want to have a more middle shot / frame" which indicates they want to see more of themselves in the frame (medium shot), not a tight close-up of just their face. The fix should prioritize showing the upper body comfortably.
