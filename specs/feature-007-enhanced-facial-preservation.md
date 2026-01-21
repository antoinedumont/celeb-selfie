# Feature: Enhanced Facial Preservation in AI Generation

## Feature Description
Strengthen prompt engineering to preserve the exact facial features, expression, and appearance of the user from the original photo. The current prompts allow the AI to modify facial expressions (e.g., making users smile more than they do in the original photo), which breaks the authenticity of the composite selfie.

## User Story
As a user taking a celebrity selfie
I want my face to look EXACTLY like it does in my original photo
So that the result feels authentic and represents my true appearance, not an AI-modified version

## Problem Statement
Users are experiencing unwanted modifications to their facial expressions in generated images:
- **Expression Changes**: Users with neutral expressions are being made to smile more
- **Feature Alterations**: Subtle changes to facial geometry, mouth position, eye shape
- **Identity Drift**: The generated face doesn't match the exact appearance of the input photo

**Example**: A user with a subtle, closed-mouth smile in their original photo appears with a wide, teeth-showing smile in the generated image.

This breaks trust and makes the selfie feel "fake" rather than authentic.

## Solution Statement
Implement research-backed prompt engineering techniques for facial preservation:

### Solution 1: Strengthen Positive Preservation Instructions
- Use explicit "lock" language: "preserve exact likeness, expression, hairstyle, and proportions"
- State exclusions clearly: "Do not change face, facial features, skin tone, pose, or identity in ANY way"
- Use "change only X, keep everything else the same" pattern
- Repeat preservation instructions multiple times to reduce AI drift

### Solution 2: Add Negative Constraint Language
- Embed negative prompts directly in the main prompt (Nano Banana Pro doesn't have separate negative_prompt parameter)
- Prevent common AI artifacts: "No distorted face, asymmetric eyes, strange mouth, disfigured features"
- Block expression changes: "No altered smile, no changed expression, no modified facial features"
- Prevent quality issues: "No poorly drawn face, bad proportions, cloned face, plastic texture"

### Solution 3: Anatomical Specificity
- Reference specific observable features from the input image
- Use precise language: "closed-mouth expression", "neutral facial expression", "exact mouth position"
- Lock individual elements: "same eye shape", "same nose structure", "same jawline"
- Describe what should be preserved at a granular level

### Solution 4: Prioritize Identity Over Scene
- Structure prompt to emphasize identity preservation FIRST, scene details SECOND
- Repeat identity constraints before and after scene description
- Use strong imperatives: "MUST preserve", "CRITICAL: maintain exact", "STRICTLY keep unchanged"

## Research Sources
Techniques based on industry best practices for AI image editing:
- [Stable Diffusion Negative Prompts Guide](https://www.aiarty.com/stable-diffusion-prompts/stable-diffusion-negative-prompt.htm)
- [Image Editing Prompting Guide](https://docs.bfl.ai/guides/prompting_guide_kontext_i2i)
- [Negative Prompts for Perfect AI Generation](https://medium.com/@johnnythedeveloper/negative-prompts-for-perfect-ai-image-generation-4b45744363c7)
- [Nano Banana Pro Documentation](https://replicate.com/google/nano-banana-pro)

## Relevant Files

### Files to Modify

**1. `src/services/composite/promptBuilder.ts`** (187 lines)
   - Contains `buildStaticFreestylePrompt()` function (line 79-94)
   - Contains `buildCelebritySelfiePrompt()` function (line 159-186)
   - Both functions include `[CORE IDENTITY & VISUAL ANCHOR]` section that needs strengthening
   - Need to enhance preservation language and add negative constraints

**2. `src/services/gemini3PromptGenerator.service.ts`** (347 lines)
   - Contains `BASE_JSON_TEMPLATE` (line 34-63)
   - Contains `POV_SELFIE_TEMPLATE` (line 69-102)
   - Both templates have `original_person` section that needs enhancement
   - Need to update template structure to prioritize facial preservation

## Implementation Plan

### Phase 1: Strengthen Static Prompts
Enhance the hardcoded prompt templates with proven preservation techniques.

**Key Changes:**
- Add "change only X, keep everything else the same" pattern
- Embed negative constraint language
- Use more specific anatomical locking
- Repeat preservation instructions before and after scene description

### Phase 2: Enhance JSON Templates
Update the Gemini 3 templates to generate better preservation instructions.

**Key Changes:**
- Restructure `original_person` section with stronger language
- Add `preservation_priority` field with highest importance
- Include negative constraints in result_description
- Add anatomical specificity to pose and visual_integrity fields

### Phase 3: Testing and Refinement
Test with various facial expressions and fine-tune based on results.

**Key Changes:**
- Test with neutral expressions
- Test with subtle smiles
- Test with serious expressions
- Compare before/after preservation quality

## Step by Step Tasks

### Step 1: Analyze Current Prompt Structure
- Read `promptBuilder.ts` to see current preservation language
- Read `gemini3PromptGenerator.service.ts` to see template structure
- Identify weak points where AI has freedom to modify faces
- Document specific improvements needed

### Step 2: Research-Backed Prompt Enhancements
- Review research findings on facial preservation
- Create list of specific phrases to add
- Create list of negative constraints to embed
- Design new prompt structure prioritizing identity

### Step 3: Enhance `buildStaticFreestylePrompt()` Function
- Open `src/services/composite/promptBuilder.ts`
- Locate `buildStaticFreestylePrompt()` function (line 79)
- Strengthen `[CORE IDENTITY & VISUAL ANCHOR]` section with:
  - More explicit "Do not change" language
  - Negative constraints embedded
  - Anatomical specificity
  - Repetition of key preservation rules
- Move identity preservation to TOP of prompt (highest priority)
- Add preservation reminder at END of prompt (reinforcement)

### Step 4: Enhance `buildCelebritySelfiePrompt()` Function
- In same file, locate `buildCelebritySelfiePrompt()` (line 159)
- Apply same enhancements as Step 3
- Ensure consistency between both prompt functions

### Step 5: Update JSON Templates
- Open `src/services/gemini3PromptGenerator.service.ts`
- Update `BASE_JSON_TEMPLATE.scene_description.original_person` (line 39-43)
- Update `POV_SELFIE_TEMPLATE.scene_description.original_person` (line 74-78)
- Add stronger language:
  - "LOCK facial expression at exact current state"
  - "FREEZE all facial features precisely as shown in input"
  - "STRICT PRESERVATION: Zero tolerance for expression modification"

### Step 6: Add Negative Constraints to Templates
- In both JSON templates, add new field: `preservation_constraints`
- Include embedded negative prompts:
  - "No distorted face, asymmetric eyes, strange mouth"
  - "No altered smile, changed expression, modified facial features"
  - "No poorly drawn face, bad proportions, plastic texture"

### Step 7: Update Meta-Prompt for Gemini
- In `generateCelebrityPromptWithGemini3()` function (line 209)
- Update the meta-prompt that instructs Gemini (line 245-273)
- Add instructions for Gemini to prioritize facial preservation
- Tell Gemini to include strong preservation language in filled templates

### Step 8: Test with Neutral Expression
- Build and deploy changes
- Test with a photo with neutral/serious expression
- Verify face is preserved without unwanted smiling
- Check for any other modifications to facial features

### Step 9: Test with Subtle Smile
- Test with a photo with a closed-mouth subtle smile
- Verify the exact smile intensity is maintained
- Ensure no teeth-showing or wider smile is generated

### Step 10: Test with Various Celebrities
- Test with multiple different celebrities
- Verify preservation works across different scene contexts
- Check that celebrity environment doesn't influence user's face

### Step 11: A/B Comparison
- Generate same selfie with old prompts (for comparison)
- Generate same selfie with new enhanced prompts
- Compare facial preservation quality
- Document improvement metrics

### Step 12: Validation and Deployment
- Run TypeScript compilation check
- Build production bundle
- Deploy to VPS
- Monitor user feedback on facial accuracy

## Technical Implementation

### Enhanced Prompt Structure

```typescript
// Priority 1: Identity Lock (TOP of prompt - highest weight)
[ABSOLUTE IDENTITY PRESERVATION - HIGHEST PRIORITY]
LOCK: The person from the input image must be preserved with ZERO modifications.
- Face: Preserve exact facial expression, smile intensity, mouth position
- Eyes: Maintain exact eye shape, gaze direction, expression
- Anatomy: Keep precise facial geometry, proportions, bone structure
- Expression: FREEZE current expression - no changes to smile, frown, or emotion
- Features: STRICTLY maintain nose shape, jawline, cheekbones, all features

DO NOT: Change expression, alter smile, modify facial features, adjust proportions

// Priority 2: Scene Details (MIDDLE - lower weight)
[Scene description, celebrity, environment...]

// Priority 3: Negative Constraints (EMBEDDED throughout)
STRICT CONSTRAINTS:
- No distorted face, asymmetric eyes, strange mouth, disfigured features
- No altered smile, changed expression, modified facial features, uncanny valley
- No poorly drawn face, bad proportions, cloned face, plastic texture, unnatural skin

// Priority 4: Reinforcement (BOTTOM - repeat key rules)
REMINDER: The input person's face must remain EXACTLY as shown - same expression, same features, same everything.
```

### Template Enhancement Example

```typescript
original_person: {
  identity: 'the person from the input image',
  preservation_priority: 'ABSOLUTE - Zero modifications allowed',
  facial_lock: 'FREEZE exact facial expression, smile intensity, mouth position, eye shape. Maintain precise facial geometry with zero alterations.',
  expression_constraint: 'CRITICAL: Keep the EXACT expression level - if neutral, stay neutral; if subtle smile, maintain subtle smile intensity. DO NOT enhance or modify smile.',
  visual_integrity: 'STRICTLY UNALTERED: Zero modifications to facial structure, expression, skin texture, or any visual aspect of the person.',
  negative_constraints: 'No distorted face, asymmetric eyes, altered smile, strange mouth, disfigured features, changed expression.',
  outfit_preservation: 'Keep the EXACT same outfit, hairstyle as the original photo.'
},
```

## Expected Results

### Before Enhancement (Current Issue)
- User with neutral expression → Generated with wide smile
- User with closed-mouth smile → Generated with teeth-showing smile
- Facial geometry subtly altered to match scene lighting/context
- Expression "improved" by AI to look "happier"

### After Enhancement (Expected)
- User with neutral expression → Generated with same neutral expression
- User with closed-mouth smile → Generated with exact same subtle smile
- Facial geometry perfectly preserved from input
- Expression locked to exact input state
- Zero unwanted modifications to face

## Success Metrics

### Qualitative
- [ ] User's facial expression matches input exactly
- [ ] No unwanted smile enhancement or expression changes
- [ ] Facial features (eyes, nose, mouth, jawline) perfectly preserved
- [ ] Users feel the generated face looks "like them"
- [ ] No "uncanny valley" or AI-modified appearance

### Quantitative (A/B Testing)
- Measure facial similarity score (before/after prompts)
- Track user satisfaction with facial accuracy
- Count reports of "doesn't look like me" (should decrease to 0)
- Compare expression preservation across 20+ test images

## Acceptance Criteria

### Functional Requirements
- [ ] Facial expression exactly preserved from input image
- [ ] No unwanted smile enhancement (neutral stays neutral)
- [ ] No teeth showing if input has closed-mouth smile
- [ ] Facial geometry (eyes, nose, mouth, proportions) unchanged
- [ ] Expression intensity locked to input level
- [ ] Works across all generation modes (freestyle, Go1)
- [ ] Works with various celebrities and scene contexts

### Visual Quality
- [ ] No AI artifacts (distorted faces, asymmetric eyes)
- [ ] No uncanny valley or plastic texture
- [ ] Natural skin texture preserved
- [ ] Facial proportions realistic and matching input
- [ ] No "over-improved" or "beautified" faces

### Technical Requirements
- [ ] TypeScript compilation succeeds
- [ ] Production build succeeds
- [ ] No regression in image quality or processing time
- [ ] Backward compatible with existing gallery images

## Validation Commands

```bash
# TypeScript check
npx tsc --noEmit

# Production build
npm run build

# Deploy to VPS
./scripts/deploy-production.sh

# Manual testing
npm run dev
# Test cases:
# 1. Upload photo with neutral expression
# 2. Upload photo with subtle closed-mouth smile
# 3. Upload photo with serious expression
# 4. Verify exact expression preservation in results
```

## Testing Strategy

### Test Case 1: Neutral Expression
- **Input**: Photo with neutral, calm face (no smile)
- **Expected**: Generated image maintains neutral expression
- **Current Bug**: AI makes user smile
- **Success**: No smile added, exact neutral expression preserved

### Test Case 2: Subtle Smile
- **Input**: Photo with closed-mouth subtle smile
- **Expected**: Generated image maintains same subtle smile intensity
- **Current Bug**: AI enhances smile to teeth-showing
- **Success**: Exact same subtle smile level preserved

### Test Case 3: Serious Expression
- **Input**: Photo with serious, focused expression
- **Expected**: Generated image maintains serious look
- **Current Bug**: AI "improves" to friendly smile
- **Success**: Serious expression locked

### Test Case 4: Various Celebrities
- **Input**: Same user photo tested with 5 different celebrities
- **Expected**: User's face identical across all 5 results
- **Current Bug**: Face may vary slightly between generations
- **Success**: Perfect consistency across all celebrities

### Test Case 5: Scene Context Resistance
- **Input**: User photo with neutral expression + "at a comedy show"
- **Expected**: User maintains neutral face despite comedy context
- **Current Bug**: AI might make user smile to match scene
- **Success**: User expression unchanged regardless of scene

## Notes

### Why Current Prompts Fail
The existing `[CORE IDENTITY & VISUAL ANCHOR]` section has good intentions but lacks:
1. **Insufficient repetition** - Preservation rules stated once, then overwhelmed by scene details
2. **Weak imperative language** - "Maintain exact" is softer than "FREEZE", "LOCK", "STRICT"
3. **No negative constraints** - Doesn't explicitly forbid expression changes
4. **Low priority placement** - Scene details follow immediately, diluting preservation focus
5. **Generic language** - "exact smile intensity" doesn't specify "closed-mouth" vs "teeth-showing"

### Prompt Engineering Principles
Based on research, effective facial preservation requires:
1. **Top placement** - Identity instructions first (highest weight in AI attention)
2. **Repetition** - State preservation rules 2-3 times (beginning, middle, end)
3. **Negative constraints** - Explicitly forbid unwanted changes
4. **Anatomical specificity** - Name exact features to preserve
5. **Strong imperatives** - Use LOCK, FREEZE, STRICT, MUST, CRITICAL
6. **Contrast** - "Change only [scene], preserve everything else"

### API Limitations
Nano Banana Pro doesn't offer:
- `negative_prompt` parameter (must embed in main prompt)
- `preservation_strength` parameter (must rely on prompt language)
- `face_lock` or `identity_weight` controls (prompt-only approach)

This makes prompt engineering the ONLY lever we have for facial preservation.

### Alternative Approaches (Future)
If prompt enhancements don't achieve perfect preservation:
1. **Face swapping post-process**: Generate image, then swap face back to original
2. **Multiple generations**: Generate 5 variations, pick best preservation
3. **Different model**: Explore models with explicit face preservation controls
4. **Hybrid approach**: Use inpainting to lock face, generate rest of image

### User Impact
This is a **critical quality issue** affecting user trust:
- Users expect to see THEMSELVES in the selfie
- Any modification feels "fake" or "AI-generated"
- Facial accuracy is more important than background/lighting perfection
- Users will share selfies only if they "look like them"

Getting facial preservation right is essential for product success.

## Rollout Plan

### Phase 1: Implement & Test (Local)
1. Make prompt enhancements
2. Test with 10+ diverse facial expressions
3. Verify preservation quality improvement
4. Document before/after examples

### Phase 2: Deploy to Production
1. Build production bundle
2. Deploy to VPS
3. Monitor first 20 generations
4. Collect user feedback

### Phase 3: Iterate if Needed
1. If preservation still insufficient, strengthen language further
2. Consider A/B testing different prompt variations
3. Explore post-processing face swap as backup approach
4. Potentially research alternative AI models

### Success Criteria for Rollout
- Zero "doesn't look like me" complaints
- User facial expressions exactly match input
- No unwanted smile enhancement
- Viral-quality selfies users are proud to share
