import type { CameraProps } from '../types';
import { useCamera } from '../hooks/useCamera';

export const Camera = ({ onCapture, onError }: CameraProps) => {
  const { videoRef, canvasRef, error, isReady, capturePhoto, retryCamera } = useCamera();

  const handleCapture = async () => {
    try {
      const photo = await capturePhoto();
      onCapture(photo);
    } catch (err: any) {
      console.error('Failed to capture photo:', err);
      const errorObj = {
        message: err.message || 'Failed to capture photo',
        code: 'CAPTURE_ERROR',
        step: 'camera' as const,
        retryable: true,
      };
      onError?.(errorObj);
    }
  };

  return (
    <div className="flex flex-col items-center gap-6 w-full">
      {error ? (
        // Error State - Mobile optimized
        <div className="card w-full max-w-md mx-auto p-8 text-center fade-in">
          <div className="text-6xl mb-4">📷</div>
          <h3 className="text-2xl font-bold mb-3">Camera Access Required</h3>
          <p className="text-white/60 mb-6 text-sm">{error.message}</p>
          {error.retryable && (
            <button
              onClick={retryCamera}
              className="btn-primary w-full sm:w-auto"
              aria-label="Allow camera access to take selfie"
            >
              Allow Camera Access
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Video Preview - Silent Apple Mirror */}
          <div className="relative apple-frame w-full max-w-md mx-auto spring-in" style={{ aspectRatio: '3/4' }} role="region" aria-label="Camera preview">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`selfie-mirror w-full h-full object-cover transition-opacity duration-500 ${!isReady ? 'opacity-30' : ''}`}
              aria-label="Live camera feed"
            />

            {/* Loading Overlay */}
            {!isReady && (
              <div className="absolute inset-0 flex items-center justify-center glass-strong" role="status" aria-live="polite">
                <div className="text-center">
                  <div className="spinner mb-4" aria-hidden="true"></div>
                  <p className="text-white/80 font-medium">Starting camera...</p>
                </div>
              </div>
            )}

            {/* Subtle Face Guides - Apple Minimal Style */}
            {isReady && (
              <>

                {/* Face Alignment Oval Guide */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none" aria-hidden="true">
                  {/* Outer glow ring */}
                  <div className="absolute inset-0 w-48 h-56 rounded-full border-2 border-brand-pink/40 blur-sm animate-pulse"></div>

                  {/* Main oval guide */}
                  <div className="relative w-48 h-56 rounded-full border-3 border-white/30"
                       style={{
                         background: 'linear-gradient(135deg, rgba(247,149,51,0.1), rgba(239,78,123,0.1))',
                         boxShadow: 'inset 0 0 20px rgba(255,255,255,0.1), 0 0 20px rgba(239,78,123,0.3)'
                       }}>

                    {/* Helper text */}
                    <div className="absolute -top-12 left-1/2 -translate-x-1/2 text-center">
                      <p className="text-xs font-semibold text-white/80 bg-black/40 px-3 py-1 rounded-full backdrop-blur-sm">
                        Position your face here
                      </p>
                    </div>

                    {/* Face positioning markers */}
                    <div className="absolute top-[25%] left-1/2 -translate-x-1/2 w-16 h-0.5 bg-white/20"></div>
                    <div className="absolute top-[50%] left-1/2 -translate-x-1/2 w-20 h-0.5 bg-white/30"></div>
                    <div className="absolute top-[75%] left-1/2 -translate-x-1/2 w-12 h-0.5 bg-white/20"></div>
                  </div>
                </div>
              </>
            )}

            {/* Gradient Overlay for Style */}
            <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/20 via-transparent to-black/10"></div>
          </div>

          <canvas ref={canvasRef} className="hidden" />

          {/* Capture Button - Apple Minimal */}
          <div className="text-center w-full max-w-md mx-auto spring-in">
            <button
              onClick={handleCapture}
              disabled={!isReady}
              className="apple-btn disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label={isReady ? "Capture selfie photo" : "Camera is preparing"}
              aria-disabled={!isReady}
            >
              {isReady ? (
                'Take Photo'
              ) : (
                'Loading...'
              )}
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default Camera;
