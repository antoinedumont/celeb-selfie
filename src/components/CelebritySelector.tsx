import { useState } from 'react';
import type { CelebritySelectorProps, Celebrity } from '../types';
import { fetchAndConvertImageUrl, blobToDataUrl, validateImage } from '../utils/image.utils';

export const CelebritySelector = ({
  celebrities,
  selectedId,
  onSelect,
  disabled = false,
  onGuestImageSelect,
  onSelectAndGenerate,
}: CelebritySelectorProps) => {
  const [guestUrl, setGuestUrl] = useState('');
  const [isLoadingGuest, setIsLoadingGuest] = useState(false);
  const [guestError, setGuestError] = useState<string | null>(null);
  const [guestPreviewUrl, setGuestPreviewUrl] = useState<string | null>(null);
  const [isCustomModalOpen, setIsCustomModalOpen] = useState(false);
  const [customCelebrityName, setCustomCelebrityName] = useState('');
  const [customNameError, setCustomNameError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const handleGuestFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = validateImage(file);
    if (!validation.valid) {
      setGuestError(validation.error || 'Invalid file');
      return;
    }

    setIsLoadingGuest(true);
    setGuestError(null);
    setGuestPreviewUrl(null);

    try {
      const dataUrl = await blobToDataUrl(file);
      setGuestPreviewUrl(dataUrl);
      setGuestError(null);

      if (onGuestImageSelect) {
        onGuestImageSelect(dataUrl, file.name);
      }
    } catch (error: any) {
      setGuestError('Failed to load image');
      setGuestPreviewUrl(null);
    } finally {
      setIsLoadingGuest(false);
    }
  };

  const handleCustomCelebritySubmit = () => {
    if (!customCelebrityName.trim()) {
      setCustomNameError('Please enter a celebrity name');
      return;
    }

    if (customCelebrityName.trim().length < 3) {
      setCustomNameError('Name must be at least 3 characters');
      return;
    }

    const customCelebrity: Celebrity = {
      id: `custom-${Date.now()}`,
      name: customCelebrityName.trim(),
      imageUrl: '',
      color: '#ef4e7b',
      category: 'other',
      description: `Custom: ${customCelebrityName.trim()}`,
      mode: 'freestyle',
    };

    setIsCustomModalOpen(false);
    setCustomCelebrityName('');
    setCustomNameError(null);

    if (onSelectAndGenerate) {
      onSelectAndGenerate(customCelebrity);
    } else {
      onSelect(customCelebrity);
    }
  };

  // Filter celebrities based on search term
  const filteredCelebrities = celebrities.filter(celebrity =>
    celebrity.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="w-full fade-in">
      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative max-w-md mx-auto">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <svg className="w-5 h-5 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search celebrities..."
            className="input pl-12 pr-10 w-full"
            aria-label="Search for celebrities"
            aria-controls="celebrity-grid"
            disabled={disabled}
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute inset-y-0 right-0 pr-4 flex items-center text-white/40 hover:text-white transition-colors"
              aria-label="Clear search"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Search results count */}
        {searchTerm && (
          <p className="text-center text-sm text-white/50 mt-3" role="status" aria-live="polite">
            {filteredCelebrities.length === 0
              ? 'No celebrities found'
              : `${filteredCelebrities.length} ${filteredCelebrities.length === 1 ? 'celebrity' : 'celebrities'} found`}
          </p>
        )}
      </div>

      {/* Celebrity Grid - Mobile-first: 2 cols mobile, 3 tablet, 4 desktop */}
      <div id="celebrity-grid" className="grid grid-cols-2 gap-3 sm:gap-4 mb-8" role="list" aria-label="Celebrity selection grid">
        {filteredCelebrities.map((celebrity) => {
          const isSelected = selectedId === celebrity.id;

          return (
            <button
              key={celebrity.id}
              onClick={() => !disabled && onSelect(celebrity)}
              disabled={disabled}
              className={`
                celebrity-card
                ${isSelected ? 'selected' : ''}
                ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
              `}
              role="listitem"
              aria-label={`Select ${celebrity.name}${isSelected ? ', currently selected' : ''}`}
              aria-pressed={isSelected}
            >
              <div className="relative">
                {/* Celebrity Image */}
                <div className="w-full aspect-square rounded-2xl overflow-hidden bg-black/20 relative">
                  <img
                    src={celebrity.imageUrl}
                    alt={celebrity.name}
                    className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
                    loading="lazy"
                  />

                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>

                  {/* Selected Overlay with Generate Button */}
                  {isSelected && (
                    <div className="absolute inset-0 glass-strong flex flex-col items-center justify-center gap-3 p-4 fade-in">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onSelectAndGenerate) {
                            onSelectAndGenerate(celebrity);
                          }
                        }}
                        disabled={disabled}
                        className="btn-primary disabled:opacity-50 shadow-xl"
                        aria-label={`Generate selfie with ${celebrity.name}`}
                      >
                        {disabled ? (
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            <span>Creating...</span>
                          </div>
                        ) : (
                          <span className="font-semibold">Generate</span>
                        )}
                      </button>

                      {/* Checkmark */}
                      <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-lg scale-in">
                        <svg className="w-5 h-5" style={{ color: '#ef4e7b' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    </div>
                  )}
                </div>

                {/* Celebrity Name */}
                <div className="mt-2 px-1">
                  <h3 className="text-sm sm:text-base font-bold text-white text-center leading-tight">
                    {celebrity.name}
                  </h3>
                </div>
              </div>
            </button>
          );
        })}

        {/* Show "Custom Celebrity" card only if not searching or if search matches "custom" */}
        {(!searchTerm || 'custom celebrity'.includes(searchTerm.toLowerCase())) && (
          <button
            onClick={() => setIsCustomModalOpen(true)}
            disabled={disabled}
            className="celebrity-card group"
            role="listitem"
            aria-label="Enter custom celebrity name"
          >
          <div className="relative">
            <div className="w-full aspect-square rounded-2xl overflow-hidden bg-gradient-to-br from-brand-orange via-brand-pink to-brand-purple flex items-center justify-center">
              <svg className="w-12 h-12 sm:w-16 sm:h-16 text-white transition-transform duration-300 group-hover:scale-110" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <div className="mt-2 px-1">
              <h3 className="text-sm sm:text-base font-bold text-white text-center leading-tight">
                Custom Celebrity
              </h3>
            </div>
          </div>
        </button>
        )}
      </div>

      {/* No results state */}
      {filteredCelebrities.length === 0 && searchTerm && (
        <div className="text-center py-12 fade-in">
          <div className="text-5xl mb-4">🔍</div>
          <h3 className="text-xl font-bold text-white mb-2">No celebrities found</h3>
          <p className="text-white/60 mb-4">
            Try searching with a different name
          </p>
          <button
            onClick={() => setSearchTerm('')}
            className="btn-secondary"
            aria-label="Clear search and show all celebrities"
          >
            Clear Search
          </button>
        </div>
      )}

      {selectedId && !disabled && (
        <p className="text-center mt-6 text-white/60 animate-fade-in text-sm">
          Click Generate to create your AI selfie! ✨
        </p>
      )}

      {/* Custom Celebrity Modal */}
      {isCustomModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm fade-in" role="dialog" aria-modal="true" aria-labelledby="custom-celebrity-title">
          <div className="card max-w-md w-full p-6 sm:p-8 relative scale-in">
            {/* Close Button */}
            <button
              onClick={() => {
                setIsCustomModalOpen(false);
                setCustomCelebrityName('');
                setCustomNameError(null);
              }}
              className="absolute top-4 right-4 text-white/40 hover:text-white transition-colors"
              aria-label="Close custom celebrity dialog"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="space-y-6">
              <div>
                <h2 id="custom-celebrity-title" className="text-2xl sm:text-3xl font-bold text-gradient mb-2">
                  Choose Any Celebrity
                </h2>
                <p className="text-sm text-white/60">
                  Enter any celebrity name and AI will generate your selfie
                </p>
              </div>

              <div>
                <label htmlFor="custom-celebrity-name" className="block text-sm font-semibold text-white mb-2">
                  Celebrity Name & Context
                </label>
                <input
                  id="custom-celebrity-name"
                  type="text"
                  value={customCelebrityName}
                  onChange={(e) => {
                    setCustomCelebrityName(e.target.value);
                    setCustomNameError(null);
                  }}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && customCelebrityName.trim()) {
                      handleCustomCelebritySubmit();
                    }
                  }}
                  placeholder="e.g. Taylor Swift at concert, Elon Musk in space..."
                  className="input"
                  autoFocus
                  aria-required="true"
                  aria-describedby={customNameError ? "custom-name-error" : undefined}
                />
                {customNameError && (
                  <p id="custom-name-error" className="text-sm text-red-400 mt-2" role="alert">❌ {customNameError}</p>
                )}
              </div>

              <div className="glass p-4 rounded-2xl">
                <h4 className="text-sm font-semibold text-white mb-2">💡 Tips for best results:</h4>
                <ul className="text-xs text-white/60 space-y-1">
                  <li>• Include context (e.g., "at the Oscars", "playing guitar")</li>
                  <li>• Be specific about the setting or activity</li>
                  <li>• AI will generate a realistic selfie scene</li>
                </ul>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setIsCustomModalOpen(false);
                    setCustomCelebrityName('');
                    setCustomNameError(null);
                  }}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCustomCelebritySubmit}
                  className="btn-primary flex-1"
                  disabled={!customCelebrityName.trim()}
                  aria-label="Generate selfie with custom celebrity"
                >
                  Generate ✨
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CelebritySelector;
