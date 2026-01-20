import { useState, useEffect } from 'react';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';

interface CustomCelebrityInputProps {
  onSubmit: (celebrityNameWithContext: string) => void;
  disabled?: boolean;
  isLoading?: boolean;
}

export const CustomCelebrityInput = ({
  onSubmit,
  disabled = false,
  isLoading = false,
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
    <div className="w-full fade-in min-h-[70vh] flex flex-col justify-center">
      {/* Voice-First HUD Interface - Minimal */}
      <div className="max-w-md mx-auto px-4 w-full">
        <div className="space-y-8">
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

          {/* Voice Button - Apple Circular Style */}
          {isSupported && (
            <div className="flex justify-center">
              <button
                type="button"
                onClick={toggleVoice}
                disabled={disabled || isLoading}
                className={`voice-btn-apple ${isListening ? 'listening' : ''}`}
                aria-label={isListening ? 'Stop listening' : 'Start voice input'}
                aria-live="polite"
              >
                <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
                  <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
                </svg>
              </button>
            </div>
          )}

          {/* Unsupported browser message */}
          {!isSupported && (
            <div className="text-center">
              <p className="text-sm text-white/60 px-4">
                ℹ️ La reconnaissance vocale n'est pas supportée sur ce navigateur. Utilisez le clavier.
              </p>
            </div>
          )}

          {/* Status Text - Apple Minimal */}
          {isListening && (
            <p className="text-center text-sm text-apple-body animate-pulse">
              Listening...
            </p>
          )}

          {/* Text Input - Apple Fluid Style */}
          <div>
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
                className="input-apple w-full text-center"
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
            </div>
            {error && (
              <p id="input-error" className="text-sm text-red-400 mt-3 text-center" role="alert">
                ❌ {error}
              </p>
            )}
          </div>

          {/* Generate Button - Apple Style */}
          <div className="flex justify-center">
            <button
              onClick={handleSubmit}
              disabled={!input.trim() || disabled || isLoading || input.trim().length < 3}
              className="apple-btn disabled:opacity-50 disabled:cursor-not-allowed"
              aria-busy={isLoading}
              aria-label={isLoading ? "Generating selfie, please wait" : "Generate selfie with celebrity"}
            >
              {isLoading ? (
                'Creating...'
              ) : (
                'Generate'
              )}
            </button>
          </div>

          {/* Tips - Apple Minimal */}
          {!isListening && !input && (
            <div id="input-tips" className="text-center spring-in">
              <p className="text-xs text-apple-body font-light">
                Add context like "at the Oscars" or "playing guitar"
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CustomCelebrityInput;
