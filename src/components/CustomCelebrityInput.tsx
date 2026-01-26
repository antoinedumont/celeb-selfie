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
    <div className="w-full fade-in flex-1 flex flex-col items-center justify-center py-8 px-4">
      {/* Sleek Spacious Interface - Premium Layout */}
      <div className="max-w-lg mx-auto w-full space-y-8">

        {/* Vocal Waves - Elevated Above Input */}
        {isListening && (
          <div
            className="vocal-wave-apple spring-in mx-auto"
            aria-hidden="true"
            style={{
              animation: 'fade-in 0.3s ease-out, float 3s ease-in-out infinite',
            }}
          >
            <div className="wave-bar-apple"></div>
            <div className="wave-bar-apple"></div>
            <div className="wave-bar-apple"></div>
            <div className="wave-bar-apple"></div>
            <div className="wave-bar-apple"></div>
            <div className="wave-bar-apple"></div>
          </div>
        )}

        {/* Status Text - Floating Above */}
        {isListening && (
          <p className="text-center text-sm text-white/70 font-light tracking-wide animate-pulse -mt-4">
            Listening...
          </p>
        )}

        {/* Unsupported browser message */}
        {!isSupported && (
          <div
            className="text-center py-4 px-6 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10"
            style={{ animation: 'fade-in 0.4s ease-out' }}
          >
            <p className="text-sm text-white/60 font-light">
              La reconnaissance vocale n'est pas supportée sur ce navigateur.
            </p>
          </div>
        )}

        {/* Main Input Container - Hero Element */}
        <div className="space-y-6">

          {/* Input Field - Generous Sizing */}
          <div className="relative">
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
              className="input-apple-sleek"
              disabled={disabled || isLoading || isListening}
              autoFocus={!isListening}
              aria-label="Celebrity name with context"
              aria-invalid={!!error}
              aria-describedby={error ? 'input-error' : 'input-tips'}
              style={{
                fontSize: '1.25rem',
                fontWeight: '400',
                letterSpacing: '-0.01em',
                height: '64px',
                paddingLeft: '24px',
                paddingRight: '68px',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              }}
            />

            {/* Interim transcript overlay */}
            {interimTranscript && isListening && (
              <div
                className="absolute inset-0 flex items-center justify-center pointer-events-none"
                aria-live="polite"
                aria-label="Interim speech recognition result"
              >
                <span
                  className="text-apple-body px-6 font-light italic"
                  style={{
                    opacity: 0.6,
                    fontSize: '1.125rem',
                  }}
                >
                  {interimTranscript}
                </span>
              </div>
            )}

            {/* Voice Button - Refined Position */}
            {isSupported && (
              <button
                type="button"
                onClick={toggleVoice}
                disabled={disabled || isLoading}
                className={`voice-btn-sleek ${isListening ? 'listening' : ''}`}
                aria-label={isListening ? 'Stop listening' : 'Start voice input'}
                aria-live="polite"
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: '44px',
                  height: '44px',
                  borderRadius: '12px',
                  transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                }}
              >
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                  style={{ transition: 'transform 0.3s ease' }}
                >
                  <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
                  <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
                </svg>
              </button>
            )}
          </div>

          {/* Error message - Breathing Room */}
          {error && (
            <div
              id="input-error"
              className="text-sm text-red-400 text-center px-4 py-2 rounded-xl bg-red-500/10 backdrop-blur-sm"
              role="alert"
              style={{ animation: 'fade-in 0.3s ease-out' }}
            >
              {error}
            </div>
          )}
        </div>

        {/* Mode Toggle - Clear Separation */}
        {onModeChange && (
          <div
            className="mode-toggle-sleek"
            style={{
              marginTop: '32px',
              marginBottom: '32px',
            }}
          >
            <button
              type="button"
              onClick={() => onModeChange('freestyle')}
              disabled={disabled || isLoading}
              className={`mode-option-sleek ${generationMode === 'freestyle' ? 'active' : ''}`}
              aria-pressed={generationMode === 'freestyle'}
            >
              Freestyle
            </button>
            <span className="mode-separator-sleek">|</span>
            <button
              type="button"
              onClick={() => onModeChange('go1')}
              disabled={disabled || isLoading}
              className={`mode-option-sleek ${generationMode === 'go1' ? 'active' : ''}`}
              aria-pressed={generationMode === 'go1'}
            >
              Go1 Booth
            </button>
          </div>
        )}

        {/* Generate Button - Hero CTA */}
        <button
          onClick={handleSubmit}
          disabled={!input.trim() || disabled || isLoading || input.trim().length < 3}
          className="apple-btn-sleek"
          aria-busy={isLoading}
          aria-label={isLoading ? "Generating selfie, please wait" : "Generate selfie with celebrity"}
          style={{
            width: '100%',
            height: '60px',
            fontSize: '1.0625rem',
            fontWeight: '600',
            letterSpacing: '-0.01em',
            marginTop: '32px',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        >
          {isLoading ? (
            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
              Creating...
            </span>
          ) : (
            'Generate'
          )}
        </button>

        {/* Tips - Generous Bottom Spacing */}
        {!isListening && !input && (
          <p
            id="input-tips"
            className="text-center text-xs text-white/40 font-light tracking-wide"
            style={{
              marginTop: '24px',
              animation: 'fade-in 0.5s ease-out',
              lineHeight: '1.6',
            }}
          >
            Add context like "at the Oscars" or "playing guitar"
          </p>
        )}
      </div>
    </div>
  );
};

export default CustomCelebrityInput;
