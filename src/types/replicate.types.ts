// Replicate API types

export type PredictionStatus =
  | 'starting'
  | 'processing'
  | 'succeeded'
  | 'failed'
  | 'canceled';

export interface FaceSwapInput {
  input_image: string;  // Celebrity photo URL or data URL
  swap_image: string;   // User photo data URL
}

export interface PredictionMetrics {
  predict_time?: number;
  total_time?: number;
}

export interface ReplicatePrediction {
  id: string;
  version: string;
  status: PredictionStatus;
  input: FaceSwapInput;
  output?: string | string[] | null;
  error?: string | null;
  logs?: string;
  metrics?: PredictionMetrics;
  created_at: string;
  started_at?: string;
  completed_at?: string;
}

export interface ReplicateServiceConfig {
  apiToken: string;
  modelVersion: string;
  timeout?: number;
  maxRetries?: number;
}
