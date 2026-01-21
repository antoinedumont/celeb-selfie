import { useState, useEffect } from 'react';
import type { CompositeResult } from '../services/composite';
import { getAllPhotos } from '../services/galleryStorage.service';

interface CelebrityResultProps {
  result: CompositeResult;
  onReset: () => void;
  onRetry: () => void;
  promptText?: string;
  jsonTemplate?: any;
  celebrityName: string;
}

export const CelebrityResult = ({
  result,
  onReset,
  onRetry,
  promptText,
  celebrityName,
}: CelebrityResultProps) => {
  const [showPrompt, setShowPrompt] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [cloudinaryUrl, setCloudinaryUrl] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  // Determine if we have multiple images
  const hasMultipleImages = result.imageUrls && result.imageUrls.length > 1;
  const displayImages = hasMultipleImages ? result.imageUrls : [result.imageUrl];
  const currentImage = displayImages[selectedImageIndex];

  // Check for Cloudinary URL periodically (it uploads in background)
  useEffect(() => {
    const checkCloudinaryUrl = () => {
      const photos = getAllPhotos();
      const latestPhoto = photos[photos.length - 1];
      if (latestPhoto?.metadata?.cloudinaryUrl) {
        setCloudinaryUrl(latestPhoto.metadata.cloudinaryUrl);
      }
    };

    // Check immediately
    checkCloudinaryUrl();

    // Then check every 2 seconds for up to 30 seconds
    const interval = setInterval(checkCloudinaryUrl, 2000);
    const timeout = setTimeout(() => clearInterval(interval), 30000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, []);

  const handleDownload = async () => {
    const imageToDownload = currentImage;
    if (!imageToDownload) return;

    setIsDownloading(true);
    try {
      const response = await fetch(imageToDownload);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = url;
      const suffix = hasMultipleImages ? `-v${selectedImageIndex + 1}` : '';
      link.download = `celeb-selfie-${celebrityName.replace(/\s+/g, '-').toLowerCase()}${suffix}-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleCopyLink = async () => {
    if (!cloudinaryUrl) return;

    try {
      await navigator.clipboard.writeText(cloudinaryUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch (error) {
      console.error('Copy failed:', error);
    }
  };

  return (
    <div className="w-full py-8 fade-in" role="region" aria-label="Celebrity selfie result">
      {result.success && result.imageUrl ? (
        <>
          {/* Success Header */}
          <div className="text-center mb-8">
            <div className="text-6xl mb-4 animate-bounce" aria-hidden="true">🎉</div>
            <h1 className="text-4xl sm:text-5xl font-black text-gradient mb-3" role="status">
              Your Celeb Selfie{hasMultipleImages ? 's' : ''}!
            </h1>
            <p className="text-lg text-white/70">
              Created with <span className="font-bold text-gradient">{celebrityName}</span>
              {hasMultipleImages && ' (2 variations)'}
            </p>
          </div>

          {/* Result Image(s) */}
          {hasMultipleImages ? (
            <div className="mb-6">
              {/* Desktop: Side-by-side */}
              <div className="hidden sm:grid sm:grid-cols-2 gap-4">
                {displayImages.map((imageUrl, index) => (
                  <div
                    key={index}
                    className={`card p-2 cursor-pointer transition-all duration-300 ${
                      selectedImageIndex === index
                        ? 'glow-border ring-4 ring-brand-orange scale-in'
                        : 'opacity-60 hover:opacity-80'
                    }`}
                    onClick={() => setSelectedImageIndex(index)}
                    role="button"
                    aria-label={`Select variation ${index + 1}`}
                    aria-pressed={selectedImageIndex === index}
                  >
                    <div className="relative rounded-2xl overflow-hidden">
                      <img
                        src={imageUrl}
                        alt={`Selfie with ${celebrityName} - Variation ${index + 1}`}
                        className="w-full h-auto"
                      />
                      {/* Selection indicator */}
                      {selectedImageIndex === index && (
                        <div className="absolute top-3 right-3 bg-brand-orange text-white px-3 py-1 rounded-full text-sm font-bold">
                          Selected ✓
                        </div>
                      )}
                      {/* Variation number badge */}
                      <div className="absolute top-3 left-3 bg-black/50 text-white px-2 py-1 rounded text-xs">
                        Variation {index + 1}
                      </div>
                      {/* Gradient overlay */}
                      <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/10 via-transparent to-transparent"></div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Mobile: Stacked with radio selection */}
              <div className="sm:hidden space-y-4">
                {displayImages.map((imageUrl, index) => (
                  <div key={index} className="space-y-2">
                    <div
                      className={`card p-2 cursor-pointer transition-all ${
                        selectedImageIndex === index
                          ? 'glow-border ring-2 ring-brand-orange'
                          : ''
                      }`}
                      onClick={() => setSelectedImageIndex(index)}
                    >
                      <div className="relative rounded-2xl overflow-hidden">
                        <img
                          src={imageUrl}
                          alt={`Variation ${index + 1}`}
                          className="w-full h-auto"
                        />
                        <div className="absolute top-2 left-2 bg-black/50 text-white px-2 py-1 rounded text-xs">
                          Variation {index + 1}
                        </div>
                        {/* Gradient overlay */}
                        <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/10 via-transparent to-transparent"></div>
                      </div>
                    </div>
                    {/* Radio button for mobile */}
                    <label className="flex items-center gap-2 text-white cursor-pointer justify-center">
                      <input
                        type="radio"
                        name="image-selection"
                        checked={selectedImageIndex === index}
                        onChange={() => setSelectedImageIndex(index)}
                        className="w-5 h-5"
                      />
                      <span className="text-sm">Use this version</span>
                    </label>
                  </div>
                ))}
              </div>

              {/* Selection hint */}
              <p className="text-center text-white/60 text-sm mt-4">
                Pick your favorite - download or share the one you like best!
              </p>
            </div>
          ) : (
            /* Single image display (backward compatible) */
            <div className="card p-2 sm:p-4 mb-6 glow-border scale-in">
              <div className="relative rounded-2xl overflow-hidden">
                <img
                  src={result.imageUrl}
                  alt={`Selfie with ${celebrityName}`}
                  className="w-full h-auto"
                />
                {/* Gradient overlay for polish */}
                <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/10 via-transparent to-transparent"></div>
              </div>
            </div>
          )}

          {/* Cloudinary Share Link */}
          {cloudinaryUrl ? (
            <div className="card p-4 mb-8 fade-in">
              <div className="flex items-center gap-3 mb-2">
                <div className="flex items-center gap-2 text-sm font-semibold text-white">
                  <svg className="w-5 h-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
                  </svg>
                  Cloud Storage ☁️
                </div>
              </div>
              <p className="text-xs text-white/50 mb-3">
                Your photo has been saved to the cloud and can be shared
              </p>
              <button
                onClick={handleCopyLink}
                className="btn-secondary w-full flex items-center justify-center gap-2"
                aria-label={copiedLink ? "Link copied to clipboard" : "Copy shareable link to clipboard"}
              >
                {copiedLink ? (
                  <>
                    <svg className="w-5 h-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Link Copied!
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    Copy Shareable Link
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="card p-4 mb-8 fade-in">
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                <p className="text-sm text-white/60">
                  Uploading to cloud storage... 💾
                </p>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 mb-8">
            <button
              onClick={handleDownload}
              disabled={isDownloading}
              className="btn-primary flex-1 flex items-center justify-center gap-2"
              aria-label={isDownloading ? "Downloading image" : "Download image to device"}
              aria-busy={isDownloading}
            >
              {isDownloading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Downloading...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Download Image
                </>
              )}
            </button>

            <button
              onClick={onRetry}
              className="btn-secondary flex-1 flex items-center justify-center gap-2"
              aria-label="Try generating with another celebrity"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Try Another Celebrity
            </button>

            <button
              onClick={onReset}
              className="btn-ghost flex items-center justify-center gap-2"
              aria-label="Take a new selfie photo"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              </svg>
              New Photo
            </button>
          </div>

          {/* AI Prompt Section */}
          {promptText && (
            <div className="card p-6">
              <button
                onClick={() => setShowPrompt(!showPrompt)}
                className="w-full flex items-center justify-between group"
                aria-expanded={showPrompt}
                aria-label={showPrompt ? "Hide AI prompt" : "View AI prompt used for generation"}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-orange to-brand-pink flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-bold text-white">View AI Prompt</h3>
                </div>
                <svg
                  className={`w-5 h-5 text-white/60 transition-transform duration-300 ${showPrompt ? 'rotate-180' : ''}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {showPrompt && (
                <div className="mt-4 pt-4 border-t border-white/10 slide-up">
                  <p className="text-sm text-white/60 leading-relaxed mb-4">
                    {promptText}
                  </p>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(promptText);
                    }}
                    className="text-xs text-white/40 hover:text-white/60 transition-colors flex items-center gap-2"
                    aria-label="Copy AI prompt to clipboard"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    Copy to clipboard
                  </button>
                </div>
              )}
            </div>
          )}
        </>
      ) : (
        /* Error State */
        <div className="card p-8 sm:p-12 text-center" role="alert" aria-live="assertive">
          <div className="text-6xl mb-6" aria-hidden="true">😕</div>
          <h2 className="text-3xl font-bold text-white mb-4">
            Something Went Wrong
          </h2>
          <p className="text-lg text-white/60 mb-8 max-w-md mx-auto">
            {result.error || 'Failed to generate your celebrity selfie'}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button onClick={onRetry} className="btn-primary" aria-label="Try generating image again">
              Try Again
            </button>
            <button onClick={onReset} className="btn-secondary" aria-label="Start over with new photo">
              Start Over
            </button>
          </div>
        </div>
      )}

      {/* Powered by */}
      <div className="mt-12 text-center">
        <p className="text-xs text-white/30">
          Powered by Google Gemini (Nano Banana Pro) • Replicate API
        </p>
      </div>
    </div>
  );
};

export default CelebrityResult;
