// Core application types

export type AppStep = 'camera' | 'select' | 'processing' | 'result' | 'error';

export type CelebrityGenerationMode = 'go1' | 'freestyle';

export interface Celebrity {
  id: string;
  name: string;
  imageUrl: string;
  color: string;
  category?: 'sports' | 'politics' | 'entertainment' | 'other';
  description?: string;
  mode?: CelebrityGenerationMode;
}

export interface CapturedPhoto {
  blob: Blob;
  dataUrl: string;
  timestamp: number;
  width?: number;
  height?: number;
}

export interface FaceSwapResult {
  imageUrl: string;
  processingTime: number;
  predictionId: string;
}

export interface PhotoCompositeResult {
  imageUrl: string;
  processingTime: number;
  cost: number;
  model: string;
  success: boolean;
  error?: string;
}

export interface AppError {
  message: string;
  code: string;
  step: AppStep;
  retryable: boolean;
}

// Component Props Types
export interface CameraProps {
  onCapture: (photo: CapturedPhoto) => void;
  onError?: (error: AppError) => void;
}

export interface CelebritySelectorProps {
  celebrities: Celebrity[];
  selectedId?: string;
  onSelect: (celebrity: Celebrity) => void;
  disabled?: boolean;
  onGuestImageSelect?: (imageDataUrl: string, originalUrl: string) => void;
  userPhotoUrl?: string;
  onSelectAndGenerate?: (celebrity: Celebrity) => void;
}

export interface ProcessingIndicatorProps {
  progress?: number;
  message?: string;
  onCancel?: () => void;
  promptText?: string;
  celebrityName?: string;
  isGeneratingPrompt?: boolean;
}

export interface ResultDisplayProps {
  imageUrl: string;
  onDownload: () => void;
  onReset: () => void;
  onRetry?: () => void;
}

// Hook Return Types
export interface UseCameraReturn {
  videoRef: React.RefObject<HTMLVideoElement>;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  stream: MediaStream | null;
  error: AppError | null;
  isReady: boolean;
  capturePhoto: () => Promise<CapturedPhoto>;
  retryCamera: () => Promise<void>;
}

export interface UseFaceSwapReturn {
  swapFaces: (photo: CapturedPhoto, celebrity: Celebrity) => Promise<FaceSwapResult>;
  isLoading: boolean;
  progress: number;
  result: FaceSwapResult | null;
  error: AppError | null;
  cancel: () => void;
  reset: () => void;
}

export interface UsePhotoCompositeReturn {
  compositePhoto: (photo: CapturedPhoto, celebrity: Celebrity) => Promise<PhotoCompositeResult>;
  isLoading: boolean;
  progress: number;
  result: PhotoCompositeResult | null;
  error: AppError | null;
  cancel: () => void;
  reset: () => void;
}

// Gallery Types (re-export from gallery.types.ts)
export * from './gallery.types';
