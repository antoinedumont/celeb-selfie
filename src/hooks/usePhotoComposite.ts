/**
 * Photo Composite Hook
 *
 * React hook for compositing user photos with celebrities using AI.
 * Manages state, progress tracking, and error handling.
 *
 * Phase 1: Uses Nano Banana Pro (Google Gemini)
 * Phase 2: Will support dual-model comparison
 */

import { useState, useCallback, useRef } from 'react';
import type { CapturedPhoto, Celebrity, PhotoCompositeResult, AppError, UsePhotoCompositeReturn } from '../types';
import { createCompositeService, CompositeAPIError } from '../services/composite';

export const usePhotoComposite = (): UsePhotoCompositeReturn => {
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<PhotoCompositeResult | null>(null);
  const [error, setError] = useState<AppError | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const compositePhoto = useCallback(async (
    photo: CapturedPhoto,
    celebrity: Celebrity
  ): Promise<PhotoCompositeResult> => {
    setIsLoading(true);
    setProgress(0);
    setError(null);
    setResult(null);
    abortControllerRef.current = new AbortController();

    try {
      console.log(`[Photo Composite] Starting composition with ${celebrity.name}...`);
      console.log('[Photo Composite] Model: Nano Banana Pro (Google Gemini)');

      // Create composite service
      const service = createCompositeService();

      // Perform photo composition with progress updates
      const compositeResult = await service.compose(
        photo.dataUrl,
        celebrity.imageUrl,
        celebrity.name,
        (progressValue: number) => {
          console.log(`[Photo Composite] Progress: ${progressValue}%`);
          setProgress(progressValue);
        }
      );

      // Check if operation was successful
      if (!compositeResult.success) {
        throw new Error(compositeResult.error || 'Photo composition failed');
      }

      console.log('[Photo Composite] Complete!', {
        model: compositeResult.model,
        processingTime: compositeResult.processingTime,
        cost: compositeResult.cost,
      });

      // Convert to PhotoCompositeResult format
      const photoResult: PhotoCompositeResult = {
        imageUrl: compositeResult.imageUrl,
        processingTime: compositeResult.processingTime,
        cost: compositeResult.cost,
        model: compositeResult.model,
        success: true,
      };

      setResult(photoResult);
      setProgress(100);
      setIsLoading(false);

      return photoResult;
    } catch (err: any) {
      console.error('[Photo Composite] Error:', err);

      let appError: AppError;

      if (err instanceof Error && 'statusCode' in err) {
        // CompositeAPIError
        const apiError = err as CompositeAPIError;
        appError = {
          message: apiError.message,
          code: `API_ERROR_${apiError.statusCode || 'UNKNOWN'}`,
          step: 'processing',
          retryable: apiError.retryable,
        };
      } else if (err.message?.includes('API key')) {
        // API key configuration error
        appError = {
          message: 'Invalid or missing Gemini API key. Please check your .env file.',
          code: 'CONFIG_ERROR',
          step: 'processing',
          retryable: false,
        };
      } else {
        // Generic error
        appError = {
          message: err.message || 'Photo composition failed unexpectedly',
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
    console.log('[Photo Composite] Cancelling...');
    abortControllerRef.current?.abort();
    setIsLoading(false);
    setProgress(0);
    setError({
      message: 'Photo composition cancelled',
      code: 'CANCELLED',
      step: 'processing',
      retryable: true,
    });
  }, []);

  const reset = useCallback(() => {
    console.log('[Photo Composite] Resetting...');
    setIsLoading(false);
    setProgress(0);
    setResult(null);
    setError(null);
  }, []);

  return {
    compositePhoto,
    isLoading,
    progress,
    result,
    error,
    cancel,
    reset,
  };
};
