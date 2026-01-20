import { useState, useEffect, useCallback, useRef, useMemo } from 'react';

// Type definitions for Web Speech API
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onstart: ((this: SpeechRecognition, ev: Event) => any) | null;
  onend: ((this: SpeechRecognition, ev: Event) => any) | null;
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null;
  onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => any) | null;
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

interface UseSpeechRecognitionOptions {
  lang?: string;
  continuous?: boolean;
  interimResults?: boolean;
  maxAlternatives?: number;
}

interface UseSpeechRecognitionReturn {
  isListening: boolean;
  transcript: string;
  interimTranscript: string;
  error: string | null;
  startListening: () => void;
  stopListening: () => void;
  isSupported: boolean;
}

export const useSpeechRecognition = (
  options: UseSpeechRecognitionOptions = {}
): UseSpeechRecognitionReturn => {
  const {
    lang = 'fr-FR',
    continuous = false,
    interimResults = true,
    maxAlternatives = 1,
  } = options;

  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);

  const recognitionRef = useRef<SpeechRecognition | null>(null);

  // Check if Web Speech API is supported
  const isSupported = useMemo(() => {
    return typeof window !== 'undefined' &&
           ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);
  }, []);

  // Initialize speech recognition
  useEffect(() => {
    if (!isSupported) {
      return;
    }

    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognitionAPI();

    recognition.continuous = continuous;
    recognition.interimResults = interimResults;
    recognition.lang = lang;
    recognition.maxAlternatives = maxAlternatives;

    // Handle recognition results
    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interimTranscriptText = '';
      let finalTranscriptText = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const transcriptText = result[0].transcript;

        if (result.isFinal) {
          finalTranscriptText += transcriptText;
        } else {
          interimTranscriptText += transcriptText;
        }
      }

      if (finalTranscriptText) {
        setTranscript(finalTranscriptText);
        setInterimTranscript('');
      } else {
        setInterimTranscript(interimTranscriptText);
      }
    };

    // Handle recognition errors
    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error('[SpeechRecognition] Error:', event.error);

      let errorMessage = '';

      switch (event.error) {
        case 'no-speech':
          errorMessage = 'Aucun son détecté. Réessayez ou utilisez le clavier.';
          break;
        case 'audio-capture':
          errorMessage = 'Microphone non disponible. Vérifiez votre appareil.';
          break;
        case 'not-allowed':
          errorMessage = "Accès au microphone refusé. Activez les permissions dans votre navigateur.";
          break;
        case 'network':
          errorMessage = 'Erreur réseau. Vérifiez votre connexion.';
          break;
        case 'aborted':
          errorMessage = 'Reconnaissance vocale interrompue.';
          break;
        default:
          errorMessage = 'Erreur de reconnaissance vocale. Réessayez.';
      }

      setError(errorMessage);
      setIsListening(false);
    };

    // Handle recognition end
    recognition.onend = () => {
      setIsListening(false);
    };

    // Handle recognition start
    recognition.onstart = () => {
      setIsListening(true);
      setError(null);
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [isSupported, continuous, interimResults, lang, maxAlternatives]);

  // Start listening
  const startListening = useCallback(() => {
    if (!isSupported) {
      setError('La reconnaissance vocale n\'est pas supportée sur ce navigateur.');
      return;
    }

    if (!recognitionRef.current) {
      setError('Erreur d\'initialisation de la reconnaissance vocale.');
      return;
    }

    try {
      // Reset state
      setTranscript('');
      setInterimTranscript('');
      setError(null);

      recognitionRef.current.start();
    } catch (err) {
      console.error('[SpeechRecognition] Start error:', err);
      setError('Impossible de démarrer la reconnaissance vocale.');
    }
  }, [isSupported]);

  // Stop listening
  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
    }
  }, [isListening]);

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
