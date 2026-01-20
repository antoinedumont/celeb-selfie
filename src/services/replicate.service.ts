import Replicate from 'replicate';
import type {
  ReplicatePrediction,
  FaceSwapInput,
  PredictionStatus,
} from '../types/replicate.types';
import type { FaceSwapResult } from '../types';

// Model configuration
const FACE_SWAP_MODEL = {
  // Using codeplugtech/face-swap model
  version: 'c2d783366e8d32e6e82c40682fab6b4c23b9c6eff2692c2cf7580a5ca6854bdc',
  maxWaitTime: 120000, // 2 minutes
  pollInterval: 1500, // 1.5 seconds
};

// Cost tracking
const COST_PER_PREDICTION = 0.003;
let sessionCost = 0;
let sessionRequestCount = 0;

/**
 * Custom error class for Replicate API errors
 */
export class ReplicateAPIError extends Error {
  constructor(
    message: string,
    public code: string,
    public retryable: boolean = true
  ) {
    super(message);
    this.name = 'ReplicateAPIError';
  }
}

/**
 * Validates environment configuration
 */
const validateEnvironment = (): void => {
  const token = import.meta.env.VITE_REPLICATE_API_TOKEN;

  if (!token || token === 'your_replicate_api_token_here') {
    throw new ReplicateAPIError(
      'Replicate API token not configured. Please set VITE_REPLICATE_API_TOKEN in your .env file.',
      'CONFIG_ERROR',
      false
    );
  }
};

/**
 * Initialize Replicate client
 */
const getReplicateClient = (): Replicate => {
  validateEnvironment();

  const token = import.meta.env.VITE_REPLICATE_API_TOKEN;
  return new Replicate({ auth: token });
};

/**
 * Creates a face swap prediction
 */
export const createFaceSwapPrediction = async (
  userImageDataUrl: string,
  celebrityImageUrl: string
): Promise<ReplicatePrediction> => {
  const replicate = getReplicateClient();

  // Log cost estimate
  console.warn(
    `[Cost] Starting face swap prediction. Estimated cost: $${COST_PER_PREDICTION.toFixed(4)}`
  );

  const input: FaceSwapInput = {
    input_image: celebrityImageUrl, // Target face (celebrity)
    swap_image: userImageDataUrl,   // Source face (user)
  };

  try {
    const prediction = await replicate.predictions.create({
      version: FACE_SWAP_MODEL.version,
      input,
    });

    console.log('[Replicate] Prediction created:', prediction.id);
    return prediction as ReplicatePrediction;
  } catch (error: any) {
    console.error('[Replicate] Failed to create prediction:', error);

    if (error.response?.status === 401) {
      throw new ReplicateAPIError(
        'Invalid API token. Please check your VITE_REPLICATE_API_TOKEN.',
        'AUTH_ERROR',
        false
      );
    } else if (error.response?.status === 429) {
      throw new ReplicateAPIError(
        'Rate limit exceeded. Please wait a moment and try again.',
        'RATE_LIMIT',
        true
      );
    } else if (error.response?.status >= 500) {
      throw new ReplicateAPIError(
        'Replicate service error. Please try again later.',
        'SERVER_ERROR',
        true
      );
    } else {
      throw new ReplicateAPIError(
        'Failed to start face swap processing. Please check your network connection.',
        'NETWORK_ERROR',
        true
      );
    }
  }
};

/**
 * Waits for a prediction to complete with progress updates
 */
export const waitForPrediction = async (
  predictionId: string,
  onProgress?: (status: PredictionStatus, progress: number) => void
): Promise<FaceSwapResult> => {
  const replicate = getReplicateClient();
  const startTime = Date.now();

  try {
    // Status to progress mapping
    const getProgress = (status: PredictionStatus): number => {
      const progressMap: Record<PredictionStatus, number> = {
        starting: 10,
        processing: 50,
        succeeded: 100,
        failed: 0,
        canceled: 0,
      };
      return progressMap[status] || 0;
    };

    // Use Replicate SDK's built-in polling with custom progress callback
    const prediction = (await replicate.wait(
      { id: predictionId } as any,
      {
        interval: FACE_SWAP_MODEL.pollInterval,
      }
    )) as ReplicatePrediction;

    // Poll manually to provide progress updates
    let currentPrediction = prediction;
    while (
      currentPrediction.status === 'starting' ||
      currentPrediction.status === 'processing'
    ) {
      onProgress?.(currentPrediction.status, getProgress(currentPrediction.status));

      // Check timeout
      if (Date.now() - startTime > FACE_SWAP_MODEL.maxWaitTime) {
        throw new ReplicateAPIError(
          'Processing timeout. Please try again.',
          'TIMEOUT_ERROR',
          true
        );
      }

      // Wait and fetch again
      await new Promise((resolve) => setTimeout(resolve, FACE_SWAP_MODEL.pollInterval));
      currentPrediction = (await replicate.predictions.get(predictionId)) as ReplicatePrediction;
    }

    const processingTime = Date.now() - startTime;

    // Track cost
    const actualCost = (processingTime / 1000) * 0.0001; // $0.0001 per second
    sessionCost += actualCost;
    sessionRequestCount++;

    console.warn(
      `[Cost] Prediction completed. Actual cost: $${actualCost.toFixed(4)} | ` +
      `Session total: $${sessionCost.toFixed(4)} (${sessionRequestCount} requests)`
    );

    if (sessionCost > 1.0) {
      console.error('⚠️  WARNING: Session cost exceeded $1.00!');
    }

    if (currentPrediction.status === 'succeeded' && currentPrediction.output) {
      const imageUrl = Array.isArray(currentPrediction.output)
        ? currentPrediction.output[0]
        : currentPrediction.output;

      if (typeof imageUrl !== 'string') {
        throw new ReplicateAPIError(
          'Invalid output format received from API',
          'INVALID_OUTPUT',
          false
        );
      }

      onProgress?.('succeeded', 100);

      return {
        imageUrl,
        processingTime,
        predictionId: currentPrediction.id,
      };
    }

    throw new ReplicateAPIError(
      currentPrediction.error || 'Face swap processing failed',
      'PROCESSING_ERROR',
      true
    );
  } catch (error: any) {
    console.error('[Replicate] Prediction failed:', error);

    if (error instanceof ReplicateAPIError) {
      throw error;
    }

    throw new ReplicateAPIError(
      error.message || 'Unknown error occurred during processing',
      'UNKNOWN_ERROR',
      true
    );
  }
};

/**
 * Complete face swap flow: create prediction and wait for result
 */
export const performFaceSwap = async (
  userImageDataUrl: string,
  celebrityImageUrl: string,
  onProgress?: (status: PredictionStatus, progress: number) => void
): Promise<FaceSwapResult> => {
  const prediction = await createFaceSwapPrediction(
    userImageDataUrl,
    celebrityImageUrl
  );

  return waitForPrediction(prediction.id, onProgress);
};

/**
 * Get session cost statistics
 */
export const getSessionStats = () => {
  return {
    totalCost: sessionCost,
    requestCount: sessionRequestCount,
    avgCostPerRequest: sessionRequestCount > 0 ? sessionCost / sessionRequestCount : 0,
  };
};

/**
 * Reset session cost tracking
 */
export const resetSessionStats = () => {
  sessionCost = 0;
  sessionRequestCount = 0;
};
