import { useState, useEffect } from 'react';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import type { CelebrityGenerationMode } from '../types';

interface CustomCelebrityInputProps {
  onSubmit: (celebrityNameWithContext: string) => void;
  disabled?: boolean;
  isLoading?: boolean;
  generationMode?: CelebrityGenerationMode;
  onModeChange?: (mode: CelebrityGenerationMode) => void;
}

export const CustomCelebrityInput = ({
  onSubmit,
  disabled = false,
  isLoading = false,
  generationMode = 'freestyle',
  onModeChange,
}: CustomCelebrityInputProps) => {
  const [input, setInput] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Web Speech API hook
  const {
    isListening,
    transcript,
    interimTranscript,
    error: speechError,
    startListening,
    stopListening,
    isSupported,
  } = useSpeechRecognition({ lang: 'fr-FR' });

  const handleSubmit = () => {
    const trimmedInput = input.trim();

    // Validate input
    if (!trimmedInput) {
      setError('Please enter a celebrity name');
      return;
    }

    if (trimmedInput.length < 3) {
      setError('Name must be at least 3 characters');
      return;
    }

    // Clear error and submit
    setError(null);
    onSubmit(trimmedInput);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && input.trim() && !disabled && !isLoading) {
      handleSubmit();
    }
  };

  // Update input when speech recognition completes
  useEffect(() => {
    if (transcript) {
      setInput(transcript);
      setError(null);
    }
  }, [transcript]);

  // Handle speech recognition errors
  useEffect(() => {
    if (speechError) {
      setError(speechError);
    }
  }, [speechError]);

  const toggleVoice = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  return (
    <div className="w-full fade-in flex-1 flex flex-col items-center justify-center py-4">
      {/* Voice-First HUD Interface - Compact Layout */}
      <div className="max-w-md mx-auto px-4 w-full">
        <div className="space-y-5">
          {/* Vocal Waves (shown when listening) - Apple Smooth Style */}
          {isListening && (
            <div className="vocal-wave-apple spring-in" aria-hidden="true">
              <div className="wave-bar-apple"></div>
              <div className="wave-bar-apple"></div>
              <div className="wave-bar-apple"></div>
              <div className="wave-bar-apple"></div>
              <div className="wave-bar-apple"></div>
              <div className="wave-bar-apple"></div>
            </div>
          )}

          {/* Status Text - Apple Minimal */}
          {isListening && (
            <p className="text-center text-sm text-apple-body animate-pulse">
              Listening...
            </p>
          )}

          {/* Unsupported browser message */}
          {!isSupported && (
            <div className="text-center">
              <p className="text-sm text-white/60 px-4">
                La reconnaissance vocale n'est pas supportée sur ce navigateur.
              </p>
            </div>
          )}

          {/* Input with Mic Button */}
          <div className="relative w-full">
            <input
              id="celebrity-input"
              type="text"
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                setError(null);
                if (isListening) {
                  stopListening();
                }
              }}
              onKeyPress={handleKeyPress}
              placeholder={isListening ? "Listening..." : "Which celebrity?"}
              className="input-apple w-full text-center pr-14"
              disabled={disabled || isLoading || isListening}
              autoFocus={!isListening}
              aria-label="Celebrity name with context"
              aria-invalid={!!error}
              aria-describedby={error ? 'input-error' : 'input-tips'}
            />
            {/* Interim transcript overlay - Apple Style */}
            {interimTranscript && isListening && (
              <div
                className="absolute inset-0 flex items-center justify-center pointer-events-none"
                aria-live="polite"
                aria-label="Interim speech recognition result"
              >
                <span className="text-apple-body px-6 font-light italic" style={{ opacity: 0.6 }}>
                  {interimTranscript}
                </span>
              </div>
            )}

            {/* Voice Button - Inside input on right */}
            {isSupported && (
              <button
                type="button"
                onClick={toggleVoice}
                disabled={disabled || isLoading}
                className={`absolute right-2 top-1/2 -translate-y-1/2 voice-btn-inline-sm ${isListening ? 'listening' : ''}`}
                aria-label={isListening ? 'Stop listening' : 'Start voice input'}
                aria-live="polite"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
                  <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
                </svg>
              </button>
            )}
          </div>

          {/* Error message */}
          {error && (
            <p id="input-error" className="text-sm text-red-400 text-center" role="alert">
              {error}
            </p>
          )}

          {/* Mode Toggle - Discreet, below input */}
          {onModeChange && (
            <div className="mode-toggle-discreet">
              <button
                type="button"
                onClick={() => onModeChange('freestyle')}
                disabled={disabled || isLoading}
                className={`mode-option-discreet ${generationMode === 'freestyle' ? 'active' : ''}`}
                aria-pressed={generationMode === 'freestyle'}
              >
                Freestyle
              </button>
              <span className="mode-separator">|</span>
              <button
                type="button"
                onClick={() => onModeChange('go1')}
                disabled={disabled || isLoading}
                className={`mode-option-discreet ${generationMode === 'go1' ? 'active' : ''}`}
                aria-pressed={generationMode === 'go1'}
              >
                Go1 Booth
              </button>
            </div>
          )}

          {/* Generate Button - Full width, integrated */}
          <button
            onClick={handleSubmit}
            disabled={!input.trim() || disabled || isLoading || input.trim().length < 3}
            className="apple-btn w-full disabled:opacity-50 disabled:cursor-not-allowed"
            aria-busy={isLoading}
            aria-label={isLoading ? "Generating selfie, please wait" : "Generate selfie with celebrity"}
          >
            {isLoading ? 'Creating...' : 'Generate'}
          </button>

          {/* Tips - Apple Minimal */}
          {!isListening && !input && (
            <p id="input-tips" className="text-center text-xs text-white/50 font-light spring-in">
              Add context like "at the Oscars" or "playing guitar"
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default CustomCelebrityInput;
