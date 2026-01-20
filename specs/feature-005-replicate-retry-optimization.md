# Feature: Replicate API Retry Logic & Timeout Optimization

## Feature Description
Port the comprehensive Replicate API optimization system from booth-selfie to celeb-selfie, including smart retry logic with exponential backoff, intelligent timeout handling with cancellation, and progress warnings. This addresses the inherent variability in Replicate's API processing times (5-6x variance) that causes ~30% timeout rate despite payload optimization.

The optimization combines three strategies:
1. **Image Compression** (already implemented): 65% payload reduction
2. **Smart Retry Logic** (NEW): Exponential backoff with 2 retries to reduce effective timeout rate from 33% → 11%
3. **Timeout/Cancellation** (NEW): Auto-cancel predictions at 120s with progress warnings at 60s and 90s

Expected impact: Increase success rate from 67% → 89-96%, reduce timeout rate by 67%, and provide better user feedback during delays.

## User Story
As a user generating celebrity selfies
I want the generation to succeed reliably even when Replicate's API has processing delays
So that I don't experience frequent failures and long waits without feedback

## Problem Statement
Celeb Selfie currently experiences the same Replicate API variability issues documented in booth-selfie:
- **33% timeout rate**: 1 in 3 requests timeout even with optimized payloads
- **5-6x processing variance**: Identical inputs can take 55s or 303s to process
- **Poor user experience**: Users wait 5+ minutes with no feedback, then see failure
- **67% success rate**: Below the 95% target for production reliability

The root cause is Replicate's backend processing inconsistency (cold starts, queueing, resource contention), NOT payload size. Compression alone cannot solve this problem.

## Solution Statement
Implement a multi-layered optimization strategy proven successful in booth-selfie:

### Layer 1: Smart Retry Logic (Primary Solution)
- Wrap Replicate API calls with retry logic
- Use exponential backoff (2s, 4s, 8s delays)
- Classify errors as retryable vs non-retryable
- Skip retry on authentication, validation, rate limit errors
- Expected outcome: 33% single-attempt timeout → 11% effective timeout with 2 retries

### Layer 2: Intelligent Timeout & Cancellation (UX Enhancement)
- Emit progress warnings at 60s, 90s thresholds
- Auto-cancel predictions at 120s timeout
- Stop wasting Replicate GPU time on doomed predictions
- **Clear user-facing messages** with actionable guidance
- Display timeout status in UI (not just console)

### Layer 3: Existing Compression (Already Implemented)
- Keep existing compression optimization
- 51% faster successful runs (113s → 55s)
- Complements retry logic for optimal results

**Expected Combined Impact:**
- Success rate: 67% → 89-96% (+33% improvement)
- Timeout rate: 33% → 11% (-67% reduction)
- Average processing time: Unchanged (~55s when successful)
- User experience: 🔴 Poor → 🟢 Good

## Relevant Files
Use these files to implement the feature:

### Existing Files to Modify
- **`src/services/composite/replicateNanoBanana.service.ts`** - Main service that needs retry wrapper
  - Will import and wrap submitPrediction calls with retryWithBackoff
  - Add custom onRetry callback for progress reset and logging
  - Lines ~100-150 where submitPrediction is called

- **`src/services/composite/replicate.utils.ts`** - Replicate API utilities
  - Will add cancelPrediction() function for timeout handling
  - Enhance pollPrediction() with progress warnings (60s, 90s, 120s)
  - Auto-cancellation logic at 120s timeout
  - Lines ~200-300 in polling logic

### New Files

#### `src/services/composite/retry.utils.ts` (277 lines)
Complete retry logic implementation with:
- retryWithBackoff() function with exponential backoff
- Error classification (retryable vs non-retryable)
- RetryPresets (conservative, standard, aggressive, emergency)
- Configurable retry options
- Progress callback support

Port directly from booth-selfie with no modifications.

#### `docs/RETRY_OPTIMIZATION_SUMMARY.md`
Documentation summarizing:
- Implementation details
- Configuration options
- Expected performance improvements
- Rollback plan
- Monitoring recommendations

## User-Facing Messages

### Timeout Error Message (120s timeout)
When a generation times out after all retry attempts:

**Error Display:**
```
😕 Something Went Wrong

Generation took longer than expected and was cancelled.
The AI service is experiencing delays.

Please try again - it usually works on the second attempt!

[Try Again]  [Start Over]
```

**Technical Details:**
- Displayed in the error step of the app (lines 296-313 in App.tsx)
- Error message stored in `error.message` state
- Clear, encouraging tone that guides user to retry
- Emphasizes that retry usually succeeds (based on 96% success rate with retry)

### All Retries Failed Message
When generation fails after all retry attempts (rare: ~4% probability):

**Error Display:**
```
😕 Something Went Wrong

Generation failed after multiple attempts.
The AI service may be experiencing high demand.

Please try again in a moment.

[Try Again Later]  [Start Over]
```

**Technical Details:**
- More severe error indicating system-wide issue
- Suggests waiting before retry
- Still provides path forward for user

### Progress Warnings (Optional Enhancement)
Display in ProcessingIndicator component during generation:

**60s Warning:**
```
⏳ Taking longer than usual...
The AI is working hard on your selfie
```

**90s Warning:**
```
⏳ Still processing...
This can take up to 2 minutes
```

**Technical Details:**
- Can be passed via onProgress callback with special progress values
- Or emit via separate warning callback
- Displayed in ProcessingIndicator component (lines 270-277 in App.tsx)
- Manages user expectations during delays

### Retry Attempt Message (Console Only)
During retry attempts, log to console:
```
🔄 Retry attempt 1 after 2.0s delay
Previous error: Request timed out after 120000ms
Retrying generation...
```

**Technical Details:**
- Console-only message for debugging
- Not displayed to end users
- Helps developers understand retry behavior

### Non-Retryable Error Messages
For errors that shouldn't retry:

**Authentication Error:**
```
😕 Something Went Wrong

Authentication failed. Please check your API configuration.

[Contact Support]
```

**Rate Limit Error:**
```
😕 Something Went Wrong

API rate limit reached. Please try again in a few minutes.

[Try Again Later]
```

**Technical Details:**
- Specific guidance based on error type
- No retry button (wouldn't help)
- Clear next steps for user

## Implementation Plan

### Phase 1: Foundation (Retry Infrastructure)
Create the retry utilities infrastructure that will be used by the Replicate service. This includes error classification, exponential backoff calculation, and configurable retry presets.

**Tasks:**
1. Create `src/services/composite/retry.utils.ts` with all retry logic
2. Add TypeScript interfaces for RetryOptions
3. Implement error classification (retryable vs non-retryable)
4. Create retry presets (conservative, standard, aggressive, emergency)
5. Test retry logic with unit tests

**Success Criteria:**
- All utility functions properly typed
- Error classification handles all known error types
- Exponential backoff calculates correctly (2s, 4s, 8s...)
- Presets configured for different use cases

### Phase 2: Core Implementation (Retry Integration)
Integrate retry logic into the Replicate API service layer, wrapping prediction submission with intelligent retry behavior.

**Tasks:**
1. Modify `src/services/composite/replicateNanoBanana.service.ts`:
   - Import retryWithBackoff and RetryPresets
   - Wrap submitPrediction call with retry wrapper
   - Add custom onRetry callback for logging
   - Reset progress indicator on retry (onProgress?.(15))

2. Add timeout/cancellation to `src/services/composite/replicate.utils.ts`:
   - Implement cancelPrediction() function
   - Add progress warnings to pollPrediction() (60s, 90s)
   - Auto-cancel at 120s timeout
   - Emit warnings via progress callback or console

3. Test retry behavior manually:
   - Verify retry kicks in on timeout
   - Check exponential backoff delays
   - Confirm non-retryable errors fail fast

**Success Criteria:**
- Retry wrapper correctly wraps submitPrediction
- Retries occur on timeout/processing errors
- Non-retryable errors fail immediately
- Progress resets on retry attempt
- Cancellation stops predictions after 120s

### Phase 3: Integration (Testing & Documentation)
Comprehensive testing, documentation, and production readiness verification.

**Tasks:**
1. Manual testing across scenarios:
   - Normal successful generation
   - Single timeout with successful retry
   - Multiple timeouts until final failure
   - Non-retryable error (authentication, validation)
   - Rate limiting detection

2. Create documentation:
   - `docs/RETRY_OPTIMIZATION_SUMMARY.md` - Implementation summary
   - Update README.md with new reliability metrics
   - Document rollback procedure

3. Production readiness:
   - Verify TypeScript compilation
   - Test build process
   - Check for console errors
   - Review Replicate dashboard for cancelled predictions

**Success Criteria:**
- All manual test scenarios pass
- Documentation complete and accurate
- Build succeeds without errors
- No TypeScript errors
- Rollback plan documented and tested

## Step by Step Tasks

### Step 1: Create Retry Utilities Infrastructure
- Read `/Users/antoine/claude/booth-selfie/src/services/composite/retry.utils.ts` to understand implementation
- Create identical `src/services/composite/retry.utils.ts` in celeb-selfie
- Verify all TypeScript interfaces are properly defined
- Ensure RetryPresets export is correct

### Step 2: Implement Cancellation Function
- Add `cancelPrediction(predictionId: string)` function to `src/services/composite/replicate.utils.ts`
- Make POST request to `https://api.replicate.com/v1/predictions/{id}/cancel`
- Include proper authorization headers
- Handle CORS proxy if enabled
- Add error handling and logging

### Step 3: Enhance Polling with Progress Warnings
- Modify `pollPrediction()` function in `src/services/composite/replicate.utils.ts`
- Add elapsed time tracking
- Emit progress warnings at 60s and 90s thresholds
- Implement auto-cancellation at 120s timeout
- Call `cancelPrediction()` before throwing timeout error
- Throw user-friendly timeout error with retry guidance:
  ```typescript
  throw new Error('Generation took longer than expected and was cancelled. The AI service is experiencing delays. Please try again - it usually works on the second attempt!');
  ```

### Step 4: Integrate Retry Logic in Nano Banana Service
- Open `src/services/composite/replicateNanoBanana.service.ts`
- Import `retryWithBackoff` and `RetryPresets` from retry.utils
- Locate submitPrediction call (around line 100-150)
- Wrap with retryWithBackoff using RetryPresets.standard
- Add custom onRetry callback:
  - Log retry attempt number and delay
  - Reset progress to 15% (onProgress?.(15))
  - Log previous error message
- Update final error message if all retries fail:
  ```typescript
  catch (error) {
    throw new Error('Generation failed after multiple attempts. The AI service may be experiencing high demand. Please try again in a moment.');
  }
  ```

### Step 5: Manual Testing - Normal Success Case
- Start dev server: `npm run dev`
- Generate a celebrity selfie
- Verify normal generation works without retry
- Check console logs for no retry messages
- Confirm successful result display

### Step 6: Manual Testing - Retry Scenarios
- Monitor Replicate dashboard for prediction IDs
- Test during high-load periods (more likely to timeout)
- Observe retry behavior in console logs
- Verify exponential backoff delays (2s, 4s)
- Confirm eventual success or final failure after 3 attempts

### Step 7: Manual Testing - Cancellation and User Messages
- Wait for a slow prediction (>120s)
- Verify progress warnings appear at 60s, 90s (console or UI)
- Confirm auto-cancellation at 120s
- **Verify user sees friendly error message:**
  - Should say "Generation took longer than expected"
  - Should encourage retry: "usually works on the second attempt"
  - Should NOT contain technical error codes or stack traces
  - Should have clear call-to-action
- Check Replicate dashboard shows prediction status = "cancelled"
- Verify console logs show technical details for debugging

### Step 8: Enhance Error Messages for User Experience
- Review all error throw statements in retry and cancellation logic
- Ensure timeout errors use friendly message:
  - "Generation took longer than expected and was cancelled. The AI service is experiencing delays. Please try again - it usually works on the second attempt!"
- Ensure all-retries-failed uses encouraging message:
  - "Generation failed after multiple attempts. The AI service may be experiencing high demand. Please try again in a moment."
- Remove technical jargon from user-facing error messages
- Keep technical details in console.error() for debugging
- Test error messages display correctly in App.tsx error UI

### Step 9: Create Documentation
- Create `docs/RETRY_OPTIMIZATION_SUMMARY.md`
- Document implementation approach
- List configuration options (presets)
- Include expected performance metrics
- Add rollback instructions
- Document monitoring recommendations

### Step 10: Cost Impact Analysis
- Calculate retry cost impact:
  - Before: 100 requests = 100 API calls = $15.00
  - After: ~144 API calls for 89 successes = $21.60
  - Cost increase: +44% for +43% more successful users
- Document ROI: Same cost per successful user (~$0.22)

### Step 11: TypeScript & Build Validation
- Run `npm run type-check` or equivalent TypeScript validation
- Verify no type errors in retry.utils.ts
- Verify no type errors in modified services
- Run `npm run build` to confirm production build succeeds
- Check dist/ folder for expected output

### Step 12: Final Testing - All Scenarios
- Test successful generation (no retry needed)
- Test single timeout with successful retry
- Test multiple timeouts until failure
- Test cancellation after 120s
- Test with different celebrity names
- Test on mobile device (if applicable)

### Step 13: Production Deployment Preparation
- Review Replicate API dashboard for cancelled predictions
- Verify retry logic is working as expected
- Document current success rate for baseline
- Prepare monitoring plan (track retry rate, cost, success rate)
- Create rollback git commit if needed

### Step 14: Run Validation Commands
- Execute all validation commands to ensure zero regressions
- Verify TypeScript compilation
- Confirm production build succeeds
- Test deployment readiness

## Testing Strategy

### Unit Tests
While this feature focuses on integration with external APIs, we should test:

1. **Retry Logic**
   - Error classification correctly identifies retryable vs non-retryable errors
   - Exponential backoff calculates correct delays (2s, 4s, 8s)
   - Max delay cap is enforced (10s limit)
   - Retry stops on non-retryable errors
   - onRetry callback fires with correct parameters

2. **Timeout Calculation**
   - Progress warnings trigger at correct thresholds (60s, 90s)
   - Timeout detection at 120s
   - Elapsed time tracking accurate

### Integration Tests
Manual testing required for:

1. **End-to-End Generation**
   - Complete selfie generation with retry protection
   - Verify output quality unchanged
   - Check metadata preservation

2. **Retry Behavior**
   - Monitor console for retry attempts
   - Verify exponential backoff delays observed
   - Confirm progress reset on retry

3. **Cancellation**
   - Long-running predictions cancelled at 120s
   - Replicate dashboard shows cancelled status
   - Clear error message to user

### Edge Cases

1. **All Retries Fail**
   - Scenario: 3 consecutive timeouts (rare: 3.6% probability)
   - Expected: Clear error message after ~246s total
   - User action: Try again button

2. **Fast Success Without Retry**
   - Scenario: First attempt succeeds in 55s
   - Expected: No retry logic triggered
   - Performance: No overhead from retry wrapper

3. **Non-Retryable Error**
   - Scenario: Authentication error (401)
   - Expected: Fail immediately without retry
   - Logs: "Non-retryable error, aborting"

4. **Rate Limiting**
   - Scenario: 429 Too Many Requests
   - Expected: No retry (would make it worse)
   - Logs: "Non-retryable error, aborting"

5. **Network Interruption During Retry**
   - Scenario: Network drops during retry delay
   - Expected: Next retry attempt fails, continues retrying
   - Final outcome: Success if network recovers, failure if not

6. **Cancellation While Retry Pending**
   - Scenario: User cancels while waiting for retry delay
   - Expected: Abort retry, clean cancellation
   - No wasted API calls

7. **Concurrent Generations**
   - Scenario: User starts multiple selfies rapidly
   - Expected: Each has independent retry logic
   - No interference between requests

## Acceptance Criteria

### Functional Requirements
- [ ] Retry logic wraps all Replicate API calls
- [ ] 2 retries occur on timeout/processing errors (3 total attempts)
- [ ] Exponential backoff delays: 2s, 4s, 8s
- [ ] Non-retryable errors (auth, validation, rate limit) fail immediately
- [ ] Progress callback resets to 15% on retry attempt
- [ ] Retry attempts logged to console with attempt number and delay

### Timeout & Cancellation
- [ ] Progress warnings emit at 60s and 90s thresholds
- [ ] Predictions auto-cancel after 120s timeout
- [ ] Cancelled predictions show "cancelled" status on Replicate dashboard
- [ ] **Clear, user-friendly timeout error message shown in UI**
- [ ] **Error message encourages retry ("usually works on the second attempt")**
- [ ] No orphaned predictions continue processing after cancellation
- [ ] Error message is non-technical and actionable

### Performance Impact
- [ ] Success rate improves from ~67% to 89-96%
- [ ] Timeout rate reduces from ~33% to ~11%
- [ ] API cost increases by ~44% (acceptable ROI)
- [ ] No performance degradation on successful first attempts
- [ ] Build succeeds without errors or warnings

### User Experience
- [ ] Normal generations work identically (no visible retry)
- [ ] Retry attempts show in console logs for debugging
- [ ] Progress bar resets on retry for visual feedback
- [ ] **User-friendly error messages on timeout (no technical jargon)**
- [ ] **Error messages encourage retry with reassuring tone**
- [ ] **Different error messages for timeout vs all-retries-failed**
- [ ] Error messages displayed in existing error UI (App.tsx lines 296-313)
- [ ] No breaking changes to existing UI

### Code Quality
- [ ] TypeScript compilation succeeds with no errors
- [ ] All imports resolve correctly
- [ ] Code follows existing project patterns
- [ ] Console logs are informative and properly formatted
- [ ] Error handling is comprehensive

### Documentation
- [ ] Implementation summary document created
- [ ] Configuration options documented
- [ ] Rollback plan documented
- [ ] Expected metrics and ROI documented
- [ ] Monitoring recommendations included

## Validation Commands
Execute every command to validate the feature works correctly with zero regressions.

### TypeScript Validation
```bash
# Ensure no type errors
cd /Users/antoine/claude/celeb-selfie && npm run type-check
```

### Build Validation
```bash
# Verify production build succeeds
cd /Users/antoine/claude/celeb-selfie && npm run build
```

### Development Server Test
```bash
# Start dev server and manually test
cd /Users/antoine/claude/celeb-selfie && npm run dev
# Then open http://localhost:5173 and generate selfies
# Monitor console for retry behavior
```

### Manual Testing Checklist
Execute these manual tests in the browser:

1. **Test Normal Generation (No Retry)**
   - Generate a celebrity selfie
   - Verify it completes successfully
   - Check console shows no retry messages
   - Download and verify image quality

2. **Test Retry Behavior**
   - Generate multiple selfies
   - Look for retry attempts in console
   - Verify exponential backoff (2s, 4s delays)
   - Confirm eventual success

3. **Test Progress Warnings**
   - Wait for a slow generation
   - Check console for warnings at 60s, 90s
   - Verify user sees some indication of delay

4. **Test Cancellation and Error Message**
   - Wait for timeout (120s)
   - **Verify user-friendly error message appears in UI:**
     - "Generation took longer than expected and was cancelled"
     - "Please try again - it usually works on the second attempt!"
   - Check error has encouraging, non-technical tone
   - Verify prediction cancelled on Replicate dashboard
   - Check console logs show cancellation
   - Verify "Try Again" action available to user

5. **Test Different Scenarios**
   - Different celebrities
   - Different times of day (varying Replicate load)
   - Multiple concurrent generations
   - Mobile vs desktop

### Replicate Dashboard Check
```bash
# Open Replicate dashboard to verify cancelled predictions
open https://replicate.com/account/predictions
# Look for predictions with status = "cancelled"
# Verify they correspond to 120s timeout scenarios
```

### Rollback Verification (Don't Execute - Just Document)
```bash
# If issues arise, rollback procedure:
git log --oneline -10  # Find commit before retry implementation
git revert <commit-hash>  # Revert the retry commits
npm run build  # Rebuild without retry logic
# Deploy reverted build
```

## Notes

### User Experience is Critical
The success of this feature depends heavily on clear, encouraging user messages:

**Key Principles:**
1. **Non-technical language**: Avoid error codes, stack traces, or developer jargon
2. **Encouraging tone**: Reassure users that retry usually succeeds ("usually works on the second attempt")
3. **Actionable guidance**: Tell users what to do next ("Please try again")
4. **Explain the why**: Brief context about delays ("AI service is experiencing delays")
5. **Set expectations**: Mention that it can take up to 2 minutes

**Example of GOOD message:**
> "Generation took longer than expected and was cancelled. The AI service is experiencing delays. Please try again - it usually works on the second attempt!"

**Example of BAD message:**
> "Error: Request timed out after 120000ms. ReplicateAPIError: Prediction failed with status 'cancelled'. Stack trace: ..."

The error messages should make users feel confident, not confused or frustrated.

### Configuration Flexibility
The implementation uses configurable presets that can be easily adjusted without code changes:

**Standard Preset (Default):**
- 2 retries (3 total attempts)
- 2s base delay, 10s max delay
- Expected 96% success rate
- Recommended for production

**Alternative Presets Available:**
- `conservative`: 1 retry (faster failures, 89% success)
- `aggressive`: 3 retries (99% success, higher cost)
- `emergency`: 5 retries (99.6% success, very high cost)

To change presets, simply edit `replicateNanoBanana.service.ts`:
```typescript
...RetryPresets.aggressive  // instead of .standard
```

### Cost-Benefit Analysis
Based on booth-selfie testing data:

**Scenario: 100 user requests**

**Without Retry:**
- API calls: 100
- Successes: 67
- Cost: $15.00
- Success rate: 67%

**With Retry (Standard):**
- API calls: 144 (100 + 33 retries + 11 second retries)
- Successes: 96
- Cost: $21.60
- Success rate: 96%

**ROI Analysis:**
- Cost increase: +44% ($15.00 → $21.60)
- More successful users: +43% (67 → 96)
- Cost per success: ~$0.22 (unchanged)
- **Verdict: Excellent ROI** - serve 43% more users for same unit cost

### Monitoring Recommendations
After deployment, track these metrics:

1. **Retry Rate**: How often does retry logic activate?
2. **Retry Success Rate**: What % of retries succeed on 2nd attempt?
3. **Cost Impact**: Is actual cost increase ~44% as predicted?
4. **Success Rate**: Did it improve to 89-96% range?
5. **Timeout Rate**: Did it drop to ~11%?

If metrics deviate significantly from projections, consider adjusting retry preset.

### Rollback Plan
**Quick Rollback (<5 minutes):**
```typescript
// Edit replicateNanoBanana.service.ts
// Remove retry wrapper, use direct call:
const prediction = await submitPrediction(MODEL_PATH, input, onProgress);
// (instead of retryWithBackoff wrapper)
npm run build
```

**Full Rollback:**
```bash
git revert HEAD~2  # Revert last 2 commits (retry + cancellation)
npm run build
# Deploy
```

### Future Enhancements
Consider implementing in future:

1. **Adaptive Retry**: Adjust retry count based on time of day / Replicate load
2. **Circuit Breaker**: Temporarily disable retries if Replicate has extended outage
3. **Webhook Mode**: Use Replicate's async webhooks instead of polling (no timeout)
4. **Pre-warming**: Submit dummy prediction on page load to warm GPU
5. **Alternative Models**: Test other models for more consistent timing
6. **User Feedback UI**: Show retry status in UI instead of console only

### Lessons from Booth Selfie
Key insights from booth-selfie implementation:

1. **Compression alone isn't enough**: 65% payload reduction doesn't reduce timeout rate
2. **Replicate has 5-6x variance**: Identical inputs can take 55s or 303s (inherent issue)
3. **Retry logic is essential**: Only way to achieve >90% success rate
4. **Multi-layered works best**: Compression + retry + cancellation = comprehensive solution
5. **Standard preset is sweet spot**: 2 retries balances cost and reliability

### Security Considerations
- API token already secured in environment variables
- No new security vectors introduced
- Retry logic doesn't expose sensitive data
- Cancellation uses same auth as normal API calls

### Browser Compatibility
- Uses standard fetch API (widely supported)
- AbortController for timeout (Edge 16+, all modern browsers)
- No special polyfills needed
- Works with existing CORS proxy setup

### Performance Considerations
- Minimal overhead on successful first attempts (<10ms)
- Retry delays are intentional (exponential backoff strategy)
- No memory leaks (proper cleanup of timers and controllers)
- No impact on bundle size (small utility file ~8KB)
