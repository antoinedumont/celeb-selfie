import { useState, useEffect } from 'react';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Camera } from './components/Camera';
import { CustomCelebrityInput } from './components/CustomCelebrityInput';
import { ProcessingIndicator } from './components/ProcessingIndicator';
import { CelebrityResult } from './components/CelebrityResult';
import { AdminGallery } from './components/admin/AdminGallery';
import { Onboarding } from './components/Onboarding';
import { PasswordProtection } from './components/PasswordProtection';
import { compositeWithNanoBanana, type CompositeResult } from './services/composite';
import { buildFreestyleSelfiePrompt } from './services/composite/promptBuilder';
import type { AppStep, CapturedPhoto, AppError, GalleryMetadata } from './types';
import { savePhoto } from './services/galleryStorage.service';
import { isPasswordRequired, getAuthSession, clearAuthSession } from './utils/auth.utils';

function App() {
  const [step, setStep] = useState<AppStep>('camera');
  const [userPhoto, setUserPhoto] = useState<CapturedPhoto | null>(null);
  const [error, setError] = useState<AppError | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingPrompt, setIsGeneratingPrompt] = useState(false);
  const [showAdminGallery, setShowAdminGallery] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    // Check if password is required and if user is already authenticated
    if (!isPasswordRequired()) {
      return true; // No password required, allow access
    }
    return getAuthSession(); // Check localStorage for existing session
  });

  // Celebrity state
  const [celebrityName, setCelebrityName] = useState<string>('');
  const [celebrityResult, setCelebrityResult] = useState<CompositeResult | null>(null);
  const [celebrityProgress, setCelebrityProgress] = useState(0);
  const [generatedPrompt, setGeneratedPrompt] = useState<string>('');
  const [generatedJsonTemplate, setGeneratedJsonTemplate] = useState<any>(null);

  // Keyboard shortcuts (Ctrl+Shift+G for admin, Ctrl+Shift+L for logout)
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'G') {
        e.preventDefault();
        setShowAdminGallery(true);
      }
      if (e.ctrlKey && e.shiftKey && e.key === 'L') {
        e.preventDefault();
        handleLogout();
      }
    };
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  // Check URL hash for admin gallery
  useEffect(() => {
    if (window.location.hash === '#/admin' || window.location.hash === '#admin') {
      setShowAdminGallery(true);
    }
  }, []);

  const handleCapture = (photo: CapturedPhoto) => {
    console.log('[App] Photo captured');
    setUserPhoto(photo);
    setStep('select');
  };

  const handleCustomCelebritySubmit = async (customCelebrityInput: string) => {
    console.log('[App] Custom celebrity input:', customCelebrityInput);

    setCelebrityName(customCelebrityInput);

    if (!userPhoto) {
      console.error('[App] No user photo available');
      return;
    }

    // Set loading states immediately
    setIsLoading(true);
    setStep('processing');
    setCelebrityProgress(0);
    setError(null);

    console.log('[App] Starting Nano Banana Pro composition (freestyle mode)...');

    try {
      // Always use freestyle mode
      setIsGeneratingPrompt(true);
      console.log('[App] Generating AI prompt with Gemini...');

      const promptResult = await buildFreestyleSelfiePrompt(customCelebrityInput);
      const displayPrompt = promptResult.naturalLanguage;
      const jsonTemplate = promptResult.jsonTemplate;

      console.log('[App] Freestyle prompt source:', promptResult.source);
      console.log('[App] JSON Template:', jsonTemplate);

      setIsGeneratingPrompt(false);
      setGeneratedPrompt(displayPrompt);
      setGeneratedJsonTemplate(jsonTemplate);

      const result = await compositeWithNanoBanana(
        userPhoto.dataUrl,
        '', // No celebrity image URL needed for freestyle
        customCelebrityInput,
        (progress) => setCelebrityProgress(progress),
        {
          useTextPromptMode: true,
          generationMode: 'freestyle'
        },
        undefined
      );

      console.log('[App] Composition complete!', result);
      setCelebrityResult(result);

      // Save to admin gallery (including Cloudinary upload)
      if (result.success && result.imageUrl && userPhoto) {
        const metadata: GalleryMetadata = {
          celebrityName: customCelebrityInput,
          generationMode: 'freestyle',
          promptText: displayPrompt,
          userPhotoUrl: userPhoto.dataUrl,
        };
        savePhoto(result, metadata).catch((err) => {
          console.warn('[Gallery] Failed to save photo:', err);
        });
      }

      setStep('result');
    } catch (err: any) {
      console.error('[App] Celebrity composition failed:', err);

      const appError: AppError = {
        message: err.message || 'Failed to create celebrity selfie',
        code: 'CELEBRITY_COMPOSITION_ERROR',
        step: 'processing',
        retryable: true,
      };

      setError(appError);
      setStep('error');
    } finally {
      setIsLoading(false);
      setIsGeneratingPrompt(false);
    }
  };

  const handleReset = () => {
    console.log('[App] Resetting to camera');
    setStep('camera');
    setUserPhoto(null);
    setError(null);
    setCelebrityName('');
    setCelebrityResult(null);
    setCelebrityProgress(0);
  };

  const handleAuthenticated = () => {
    console.log('[App] User authenticated successfully');
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    console.log('[App] Logging out user');
    clearAuthSession();
    setIsAuthenticated(false);
    // Reset app state on logout
    handleReset();
    setShowOnboarding(true);
  };

  // Show password protection if not authenticated
  if (!isAuthenticated) {
    return (
      <ErrorBoundary>
        <PasswordProtection onAuthenticated={handleAuthenticated} />
      </ErrorBoundary>
    );
  }

  // Show admin gallery if requested
  if (showAdminGallery) {
    return (
      <ErrorBoundary>
        <AdminGallery onClose={() => {
          setShowAdminGallery(false);
          window.location.hash = '';
        }} />
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      {/* Onboarding Overlay */}
      {showOnboarding && (
        <Onboarding onComplete={() => setShowOnboarding(false)} />
      )}

      <div className="min-h-screen relative overflow-x-hidden flex justify-center bg-apple-bg">
        {/* HUD Top Bar (only visible on camera and select steps) - Minimal */}
        {(step === 'camera' || step === 'select') && !showOnboarding && (
          <div className="hud-top">
            <div className="hud-apple flex items-center gap-3">
              <div className="w-2 h-2 bg-black rounded-full animate-pulse"></div>
              <span className="text-apple-light text-sm">
                {step === 'camera' ? 'Ready' : 'Create'}
              </span>
            </div>
          </div>
        )}

        {/* Desktop centered container */}
        <div className="w-full max-w-full sm:max-w-[540px] lg:max-w-[680px] flex flex-col">
          {/* Header - Minimalist Apple Style (Hidden on camera step) */}
          {step !== 'camera' && (
            <header className="apple-glass-strong sticky top-0 z-40 backdrop-blur-xl">
              <div className="px-4 sm:px-6 py-5">
                <div className="flex items-center justify-center relative">
                  {/* Logo - Centered & Minimal */}
                  <div className="flex items-center gap-3">
                    <div className="text-2xl">✨</div>
                    <h1 className="text-xl sm:text-2xl text-apple font-inter font-bold">
                      Celeb Selfie
                    </h1>
                  </div>

                  {/* Status Badge - Minimal dot indicator */}
                  <div className="absolute right-0 hud-apple text-xs">
                    {step === 'select' && 'Select'}
                    {step === 'processing' && 'Creating'}
                    {step === 'result' && 'Done'}
                    {step === 'error' && 'Error'}
                  </div>
                </div>
              </div>
            </header>
          )}

          {/* Main Content */}
          <main className="flex-1 flex flex-col justify-center py-4">
            {/* Camera Step - Full screen, no padding */}
            {step === 'camera' && (
              <Camera onCapture={handleCapture} />
            )}

            {/* Celebrity Input Step */}
            {step === 'select' && userPhoto && (
              <div className="px-4">
                <CustomCelebrityInput
                  onSubmit={handleCustomCelebritySubmit}
                  disabled={isLoading}
                  isLoading={isLoading}
                />
                <div className="text-center mt-8">
                  <button
                    onClick={handleReset}
                    className="btn-secondary"
                  >
                    ← Back to Camera
                  </button>
                </div>
              </div>
            )}

            {/* Processing Step */}
            {step === 'processing' && celebrityName && (
              <ProcessingIndicator
                progress={celebrityProgress}
                celebrityName={celebrityName}
                promptText={generatedPrompt}
                isGeneratingPrompt={isGeneratingPrompt}
              />
            )}

            {/* Result Step */}
            {step === 'result' && celebrityResult && celebrityName && (
              <CelebrityResult
                result={celebrityResult}
                onReset={handleReset}
                onRetry={() => {
                  setStep('select');
                  setCelebrityName('');
                  setCelebrityResult(null);
                }}
                promptText={generatedPrompt}
                jsonTemplate={generatedJsonTemplate}
                celebrityName={celebrityName}
              />
            )}

            {/* Error Step */}
            {step === 'error' && error && (
              <div className="text-center py-16 px-4 fade-in">
                <div className="card max-w-2xl mx-auto p-8 sm:p-12">
                  <div className="text-6xl mb-6">😕</div>
                  <h2 className="text-3xl font-bold text-white mb-4">
                    Something Went Wrong
                  </h2>
                  <p className="text-lg text-white/60 mb-8">
                    {error.message}
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <button onClick={handleReset} className="btn-secondary">
                      Start Over
                    </button>
                  </div>
                </div>
              </div>
            )}
          </main>

          {/* Footer */}
          <footer className="border-t border-white/10 py-3">
            <div className="px-4 text-center">
              <p className="text-xs text-white/30">
                Powered by AI
              </p>
            </div>
          </footer>
        </div>
      </div>
    </ErrorBoundary>
  );
}

export default App;

