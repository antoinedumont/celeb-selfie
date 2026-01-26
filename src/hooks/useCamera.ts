import { useRef, useEffect, useState, useCallback } from 'react';
import type { CapturedPhoto, AppError } from '../types';
import { blobToDataUrl } from '../utils/image.utils';

export interface UseCameraReturn {
  videoRef: React.RefObject<HTMLVideoElement>;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  stream: MediaStream | null;
  error: AppError | null;
  isReady: boolean;
  capturePhoto: () => Promise<CapturedPhoto>;
  retryCamera: () => Promise<void>;
}

export const useCamera = (): UseCameraReturn => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<AppError | null>(null);
  const [isReady, setIsReady] = useState(false);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
      setIsReady(false);
    }
  }, [stream]);

  const startCamera = useCallback(async () => {
    setError(null);
    setIsReady(false);

    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 720, max: 1080 },
          height: { ideal: 1280, max: 1920 },
          aspectRatio: { ideal: 9 / 16 },
        },
      });

      setStream(mediaStream);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;

        // Wait for video to be ready
        videoRef.current.onloadedmetadata = async () => {
          console.log('[Camera] Video metadata loaded, camera ready');
          // Explicitly play the video (required for Safari iOS)
          try {
            await videoRef.current?.play();
            console.log('[Camera] Video playback started');
          } catch (playErr) {
            console.warn('[Camera] Auto-play failed, user interaction may be required:', playErr);
          }
          setIsReady(true);
        };

        // Handle video pause events (Safari iOS may pause video)
        videoRef.current.onpause = async () => {
          console.log('[Camera] Video paused, attempting to resume...');
          try {
            await videoRef.current?.play();
            console.log('[Camera] Video resumed successfully');
          } catch (resumeErr) {
            console.warn('[Camera] Could not resume video:', resumeErr);
          }
        };
      }
    } catch (err: any) {
      console.error('Error accessing camera:', err);

      let errorMessage = 'Could not access camera. ';
      let errorCode = 'CAMERA_ERROR';

      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        errorMessage += 'Please allow camera permissions in your browser.';
        errorCode = 'PERMISSION_DENIED';
      } else if (err.name === 'NotFoundError') {
        errorMessage += 'No camera device found.';
        errorCode = 'NO_CAMERA';
      } else if (err.name === 'NotReadableError') {
        errorMessage += 'Camera is already in use by another application.';
        errorCode = 'CAMERA_IN_USE';
      } else {
        errorMessage += 'Please check your camera settings and try again.';
      }

      setError({
        message: errorMessage,
        code: errorCode,
        step: 'camera',
        retryable: errorCode !== 'NO_CAMERA',
      });
    }
  }, []);

  const capturePhoto = useCallback(async (): Promise<CapturedPhoto> => {
    if (!videoRef.current || !canvasRef.current) {
      throw new Error('Video or canvas element not ready');
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) {
      throw new Error('Could not get canvas context');
    }

    // Portrait mode: 2:3 aspect ratio (width:height)
    const PORTRAIT_RATIO = 2 / 3; // 0.6667

    const videoWidth = video.videoWidth;
    const videoHeight = video.videoHeight;
    const videoRatio = videoWidth / videoHeight;

    let sourceX = 0;
    let sourceY = 0;
    let sourceWidth = videoWidth;
    let sourceHeight = videoHeight;

    // Crop to portrait 2:3 aspect ratio
    if (videoRatio > PORTRAIT_RATIO) {
      // Video is wider than target ratio - crop width
      sourceWidth = videoHeight * PORTRAIT_RATIO;
      sourceX = (videoWidth - sourceWidth) / 2;
    } else {
      // Video is taller than target ratio - crop height
      sourceHeight = videoWidth / PORTRAIT_RATIO;
      sourceY = (videoHeight - sourceHeight) / 2;
    }

    // Set canvas to portrait dimensions (800x1200 for good quality)
    const targetWidth = 800;
    const targetHeight = 1200;
    canvas.width = targetWidth;
    canvas.height = targetHeight;

    console.log('[Camera] Capturing portrait photo:', canvas.width, 'x', canvas.height,
                `(cropped from ${videoWidth}x${videoHeight})`);

    // Draw the cropped and resized frame
    context.drawImage(
      video,
      sourceX, sourceY, sourceWidth, sourceHeight,  // Source rectangle
      0, 0, targetWidth, targetHeight                // Destination rectangle
    );

    // Convert to blob
    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (b) => {
          if (b) {
            resolve(b);
          } else {
            reject(new Error('Failed to convert canvas to blob'));
          }
        },
        'image/png',
        0.95
      );
    });

    // Convert to data URL
    const dataUrl = await blobToDataUrl(blob);

    console.log('[Camera] Photo captured successfully');

    return {
      blob,
      dataUrl,
      timestamp: Date.now(),
      width: canvas.width,
      height: canvas.height,
    };
  }, []);

  const retryCamera = useCallback(async () => {
    console.log('[Camera] Retrying camera...');
    stopCamera();
    await startCamera();
  }, [stopCamera, startCamera]);

  // Start camera on mount
  useEffect(() => {
    console.log('[Camera] Initializing camera...');
    startCamera();

    // Cleanup on unmount
    return () => {
      console.log('[Camera] Cleaning up camera...');
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty deps intentional - only run on mount

  return {
    videoRef,
    canvasRef,
    stream,
    error,
    isReady,
    capturePhoto,
    retryCamera,
  };
};
