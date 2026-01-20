import { useState, useCallback, useRef } from 'react';
import type { CapturedPhoto, Celebrity, FaceSwapResult, AppError } from '../types';
import type { PredictionStatus } from '../types/replicate.types';
import { performFaceSwap, ReplicateAPIError } from '../services/replicate.service';

export interface UseFaceSwapReturn {
  swapFaces: (photo: CapturedPhoto, celebrity: Celebrity) => Promise<FaceSwapResult>;
  isLoading: boolean;
  progress: number;
  result: FaceSwapResult | null;
  error: AppError | null;
  cancel: () => void;
  reset: () => void;
}

export const useFaceSwap = (): UseFaceSwapReturn => {
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<FaceSwapResult | null>(null);
  const [error, setError] = useState<AppError | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const swapFaces = useCallback(async (
    photo: CapturedPhoto,
    celebrity: Celebrity
  ): Promise<FaceSwapResult> => {
    setIsLoading(true);
    setProgress(0);
    setError(null);
    setResult(null);
    abortControllerRef.current = new AbortController();

    try {
      console.log(`[Face Swap] Starting swap with ${celebrity.name}...`);

      // Perform face swap with progress updates
      const swapResult = await performFaceSwap(
        photo.dataUrl,
        celebrity.imageUrl,
        (status: PredictionStatus, progressValue: number) => {
          console.log(`[Face Swap] Status: ${status}, Progress: ${progressValue}%`);
          setProgress(progressValue);
        }
      );

      console.log('[Face Swap] Complete!', swapResult);
      setResult(swapResult);
      setProgress(100);
      setIsLoading(false);

      return swapResult;
    } catch (err: any) {
      console.error('[Face Swap] Error:', err);

      let appError: AppError;

      if (err instanceof ReplicateAPIError) {
        appError = {
          message: err.message,
          code: err.code,
          step: 'processing',
          retryable: err.retryable,
        };
      } else {
        appError = {
          message: err.message || 'Face swap failed unexpectedly',
          code: 'UNKNOWN_ERROR',
          step: 'processing',
          retryable: true,
        };
      }

      setError(appError);
      setIsLoading(false);
      setProgress(0);

      throw appError;
    }
  }, []);

  const cancel = useCallback(() => {
    console.log('[Face Swap] Cancelling...');
    abortControllerRef.current?.abort();
    setIsLoading(false);
    setProgress(0);
    setError({
      message: 'Face swap cancelled',
      code: 'CANCELLED',
      step: 'processing',
      retryable: true,
    });
  }, []);

  const reset = useCallback(() => {
    console.log('[Face Swap] Resetting...');
    setIsLoading(false);
    setProgress(0);
    setResult(null);
    setError(null);
  }, []);

  return {
    swapFaces,
    isLoading,
    progress,
    result,
    error,
    cancel,
    reset,
  };
};
