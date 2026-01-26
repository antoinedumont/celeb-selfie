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
          {/* Success Header - Minimal */}
          <div className="text-center mb-6">
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2" role="status">
              Your Selfie
            </h1>
            <p className="text-sm text-white/50">
              with {celebrityName}
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

          {/* Share Link - Minimal */}
          {cloudinaryUrl && (
            <div className="mb-6">
              <button
                onClick={handleCopyLink}
                className="btn-secondary w-full flex items-center justify-center gap-2"
                aria-label={copiedLink ? "Link copied" : "Copy link"}
              >
                {copiedLink ? (
                  <>
                    <svg className="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Copied
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                    </svg>
                    Share
                  </>
                )}
              </button>
            </div>
          )}

          {/* Action Buttons - Minimal */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <button
              onClick={handleDownload}
              disabled={isDownloading}
              className="btn-primary flex-1 flex items-center justify-center gap-2"
              aria-label={isDownloading ? "Downloading" : "Download"}
              aria-busy={isDownloading}
            >
              {isDownloading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
              )}
              {isDownloading ? 'Saving...' : 'Download'}
            </button>

            <button
              onClick={onRetry}
              className="btn-secondary flex-1 flex items-center justify-center gap-2"
              aria-label="Try again"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Retry
            </button>

            <button
              onClick={onReset}
              className="btn-ghost flex items-center justify-center gap-2"
              aria-label="New photo"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              </svg>
              New
            </button>
          </div>

          {/* AI Prompt - Collapsible, Minimal */}
          {promptText && (
            <button
              onClick={() => setShowPrompt(!showPrompt)}
              className="w-full text-left text-xs text-white/30 hover:text-white/50 transition-colors"
              aria-expanded={showPrompt}
            >
              {showPrompt ? 'Hide prompt ↑' : 'View prompt ↓'}
            </button>
          )}
          {showPrompt && promptText && (
            <div className="mt-2 p-4 rounded-xl bg-white/5 text-xs text-white/40 leading-relaxed">
              {promptText}
            </div>
          )}
        </>
      ) : (
        /* Error State - With Debug Prompt */
        <div className="text-center py-8 px-4" role="alert" aria-live="assertive">
          <h2 className="text-2xl font-bold text-white mb-2">
            Generation failed
          </h2>
          <p className="text-sm text-white/50 mb-6">
            {result.error || 'Please try again'}
          </p>
          <div className="flex gap-3 justify-center mb-6">
            <button onClick={onRetry} className="btn-primary">
              Retry
            </button>
            <button onClick={onReset} className="btn-secondary">
              New Photo
            </button>
          </div>

          {/* Debug: Show failed prompt */}
          {(result.metadata?.promptUsed || promptText) && (
            <div className="mt-6 text-left">
              <button
                onClick={() => setShowPrompt(!showPrompt)}
                className="w-full text-left text-xs text-white/40 hover:text-white/60 transition-colors mb-2"
                aria-expanded={showPrompt}
              >
                {showPrompt ? '▼ Hide failed prompt (debug)' : '▶ Show failed prompt (debug)'}
              </button>
              {showPrompt && (
                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20">
                  <p className="text-xs text-red-400 mb-2 font-medium">
                    Mode: {result.metadata?.mode || 'unknown'} | Resolution: {result.metadata?.resolution || 'unknown'}
                  </p>
                  <pre className="text-xs text-white/60 leading-relaxed whitespace-pre-wrap break-words max-h-96 overflow-y-auto">
                    {result.metadata?.promptUsed || promptText}
                  </pre>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(result.metadata?.promptUsed || promptText || '');
                      alert('Prompt copied to clipboard!');
                    }}
                    className="mt-3 text-xs text-white/50 hover:text-white/80 underline"
                  >
                    Copy prompt to clipboard
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

    </div>
  );
};

export default CelebrityResult;
