# Feature Plan: Web Speech API Integration for Real Voice Capture

## Metadata
- **Issue Number**: 001
- **ADW ID**: adw-voice-capture-001
- **Feature Type**: Enhancement
- **Priority**: High
- **Created**: 2026-01-20

## Summary

Implement real audio capture using the Web Speech API to replace the current simulated voice recognition in `CustomCelebrityInput.tsx`. Users should be able to speak a celebrity name and have it transcribed in real-time.

## Current State

The application currently has a simulated voice capture implementation:
- Voice button UI exists at `src/components/CustomCelebrityInput.tsx:43-56`
- Simulated with `setTimeout()` that sets hardcoded value "Taylor Swift at Coachella"
- Vocal wave animations are fully implemented
- Voice button toggles `isListening` state properly

## Goals

1. Replace simulated voice with real Web Speech API integration
2. Transcribe user's spoken celebrity name in real-time
3. Handle browser compatibility gracefully
4. Provide clear feedback for permission requests
5. Support both French and English speech recognition

## Technical Requirements

### 1. Web Speech API Integration

**File**: `src/components/CustomCelebrityInput.tsx`

- Use `SpeechRecognition` or `webkitSpeechRecognition` API
- Handle browser compatibility (Chrome, Edge, Safari)
- Request microphone permissions properly
- Configure continuous recognition with interim results

**Implementation Details**:
```typescript
// Check browser support
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

// Configure recognition
recognition.continuous = false;
recognition.interimResults = true;
recognition.lang = 'fr-FR'; // or 'en-US'
recognition.maxAlternatives = 1;
```

### 2. Permission Handling

- Show clear UI when microphone permission is required
- Handle permission denied state gracefully
- Provide fallback to text input when permission denied
- Show error message if Web Speech API is not supported

### 3. Real-Time Transcription

- Display interim results as user speaks
- Update input field with interim results (grayed out)
- Finalize input when speech recognition ends
- Clear interim results if user stops speaking

### 4. Error Handling

Handle these error cases:
- `no-speech`: User didn't speak, show "Aucun son détecté"
- `audio-capture`: Microphone not available
- `not-allowed`: Permission denied
- `network`: Network error
- `aborted`: Recognition aborted

### 5. Language Support

- Default to French (`fr-FR`) to match UI language
- Provide option to switch to English (`en-US`) if needed
- Store language preference in localStorage

### 6. Browser Compatibility

**Supported Browsers**:
- Chrome/Edge: Full support via `webkitSpeechRecognition`
- Safari (iOS 14.5+): Partial support
- Firefox: Not supported (show fallback message)

**Fallback Strategy**:
- Detect browser support on component mount
- Hide voice button if not supported
- Show message: "La reconnaissance vocale n'est pas supportée sur ce navigateur"

## Files to Modify

### Primary Files

1. **src/components/CustomCelebrityInput.tsx** (Main implementation)
   - Add Web Speech API hook
   - Implement permission handling
   - Add interim results display
   - Handle all error cases

2. **src/types.ts** (If needed)
   - Add Web Speech API type definitions
   - Add error type for voice recognition

### Supporting Files

3. **src/hooks/useSpeechRecognition.ts** (New custom hook)
   - Encapsulate Web Speech API logic
   - Handle browser compatibility
   - Manage recognition lifecycle
   - Return: `{ isListening, transcript, error, startListening, stopListening, isSupported }`

4. **src/index.css** (Optional styling enhancements)
   - Add `.interim-transcript` class for grayed-out text
   - Add `.permission-prompt` styles
   - Add `.voice-unsupported` message styles

## Implementation Steps

### Step 1: Create Custom Hook (src/hooks/useSpeechRecognition.ts)
```typescript
export const useSpeechRecognition = (lang: string = 'fr-FR') => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);

  const isSupported = useMemo(() => {
    return 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window;
  }, []);

  // Implementation details...

  return {
    isListening,
    transcript,
    interimTranscript,
    error,
    startListening,
    stopListening,
    isSupported,
  };
};
```

### Step 2: Integrate Hook into CustomCelebrityInput
- Replace simulated `toggleVoice()` with real speech recognition
- Use `startListening()` / `stopListening()` methods
- Display interim results in input field
- Handle errors with user-friendly messages

### Step 3: Add Permission UI
- Show permission request message when user first clicks voice button
- Explain why microphone access is needed
- Provide "Allow" / "Deny" context

### Step 4: Testing Checklist
- [ ] Test on Chrome (desktop & mobile)
- [ ] Test on Safari (desktop & iOS)
- [ ] Test on Edge
- [ ] Test permission denied scenario
- [ ] Test no-speech scenario
- [ ] Test background noise handling
- [ ] Test French language recognition
- [ ] Test English language recognition
- [ ] Test interim results display
- [ ] Test unsupported browser fallback

## User Experience Flow

### Happy Path
1. User clicks voice button
2. Browser requests microphone permission (first time only)
3. User allows permission
4. Vocal waves animate
5. User speaks: "Taylor Swift at Coachella"
6. Interim transcript appears in input (grayed)
7. User stops speaking
8. Final transcript appears in input (white)
9. `isListening` state becomes false
10. User clicks "Generate ✨" button

### Permission Denied Path
1. User clicks voice button
2. Browser requests permission
3. User denies permission
4. Show message: "Microphone access is required for voice input. Please use text input instead."
5. Hide voice button
6. User can still use text input

### No Speech Detected Path
1. User clicks voice button
2. User doesn't speak for 5 seconds
3. Recognition times out
4. Show message: "Aucun son détecté. Réessayez ou utilisez le clavier."
5. Reset to idle state

## Accessibility Considerations

- Add ARIA live region for interim transcripts
- Announce "Listening..." to screen readers
- Announce "Recognition complete" when done
- Provide keyboard alternative (already exists with text input)
- Support reduced motion preference (don't animate waves)

## Security & Privacy

- Request microphone permission explicitly
- No audio data sent to external servers (browser-native API)
- Transcripts processed locally only
- Clear interim transcripts on component unmount
- Respect user's privacy preferences

## Testing Strategy

### Unit Tests
- Test `useSpeechRecognition` hook in isolation
- Mock `SpeechRecognition` API
- Test all error scenarios
- Test interim results handling

### Integration Tests
- Test CustomCelebrityInput with real speech recognition
- Test permission flow
- Test error handling UI

### Manual Testing
- Test on different devices
- Test with different accents
- Test background noise scenarios
- Test language switching

## Performance Considerations

- Lazy load speech recognition only when needed
- Clean up recognition instance on unmount
- Debounce interim results to avoid excessive re-renders
- Limit recognition time to 30 seconds max

## Rollout Plan

### Phase 1: Core Implementation (Priority: High)
- Implement `useSpeechRecognition` hook
- Integrate into `CustomCelebrityInput`
- Handle basic permission flow

### Phase 2: Error Handling (Priority: High)
- Implement all error cases
- Add user-friendly error messages
- Add fallback UI

### Phase 3: Polish (Priority: Medium)
- Add interim results display
- Improve visual feedback
- Add language switching option

### Phase 4: Testing (Priority: High)
- Cross-browser testing
- Edge case testing
- Accessibility testing

## Success Criteria

- [ ] Users can speak celebrity name and have it transcribed
- [ ] Transcription accuracy > 85% for common celebrity names
- [ ] Permission flow is clear and user-friendly
- [ ] Error states are handled gracefully
- [ ] Works on Chrome, Edge, and Safari (iOS 14.5+)
- [ ] Fallback to text input works on unsupported browsers
- [ ] No console errors or warnings
- [ ] Accessibility score remains WCAG AA compliant

## Open Questions

1. Should we support multiple languages beyond French and English?
2. Should we store the language preference in localStorage?
3. Should we add a visual indicator for interim results vs. final results?
4. Should we add a "retry" button if recognition fails?
5. Should we limit recognition time to prevent long sessions?

## References

- [Web Speech API Documentation](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API)
- [SpeechRecognition Interface](https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognition)
- [Can I Use: Speech Recognition](https://caniuse.com/speech-recognition)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)

## Timeline Estimate

- Phase 1 (Core Implementation): 4-6 hours
- Phase 2 (Error Handling): 2-3 hours
- Phase 3 (Polish): 2-3 hours
- Phase 4 (Testing): 3-4 hours

**Total**: 11-16 hours of development time

---

**Note**: This plan focuses on implementing real audio capture to replace the simulated voice recognition. The existing UI (voice button, vocal waves, animations) will remain unchanged. Only the underlying logic in the `toggleVoice()` function will be replaced with real Web Speech API integration.
