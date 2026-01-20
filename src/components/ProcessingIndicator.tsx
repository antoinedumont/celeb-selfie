import { useEffect, useState } from 'react';

interface ProcessingIndicatorProps {
  progress: number;
  celebrityName: string;
  promptText?: string;
  isGeneratingPrompt?: boolean;
}

export const ProcessingIndicator = ({
  progress,
  celebrityName,
  promptText,
  isGeneratingPrompt,
}: ProcessingIndicatorProps) => {
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    // Show prompt after it's generated
    if (promptText && !isGeneratingPrompt) {
      setTimeout(() => setShowPrompt(true), 500);
    }
  }, [promptText, isGeneratingPrompt]);

  // Get current stage message based on progress
  const getStageMessage = () => {
    if (progress < 30) {
      return {
        icon: '🎬',
        title: 'Analyzing your photo...',
        description: 'AI is studying facial features and lighting conditions'
      };
    } else if (progress < 50) {
      return {
        icon: '🎨',
        title: 'Matching celebrity style...',
        description: 'Blending your features with celebrity characteristics'
      };
    } else if (progress < 70) {
      return {
        icon: '✨',
        title: 'Generating composition...',
        description: 'Creating a photorealistic scene with perfect lighting'
      };
    } else if (progress < 90) {
      return {
        icon: '🖌️',
        title: 'Applying final touches...',
        description: 'Refining textures, shadows, and color grading'
      };
    } else {
      return {
        icon: '🎉',
        title: 'Almost ready...',
        description: 'Finalizing your celebrity selfie masterpiece'
      };
    }
  };

  const currentStage = getStageMessage();

  return (
    <div className="w-full py-8 fade-in" role="region" aria-label="Image generation progress">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl sm:text-5xl font-black text-gradient mb-4" aria-live="polite">
          Creating Magic
        </h1>
        <p className="text-lg sm:text-xl text-white/70">
          Generating your selfie with <span className="text-gradient font-bold">{celebrityName}</span>
        </p>
      </div>

      {/* Animated Circles */}
      <div className="relative h-64 mb-12 flex items-center justify-center" aria-hidden="true">
        {/* Outer rotating gradient ring */}
        <div className="absolute w-48 h-48 rounded-full opacity-50"
             style={{
               background: 'conic-gradient(from 0deg, #f79533, #ef4e7b, #5073b8, #07b39b, #f79533)',
               animation: 'spin 3s linear infinite'
             }}>
        </div>

        {/* Middle pulsing ring */}
        <div className="absolute w-40 h-40 rounded-full bg-gradient-to-r from-brand-pink to-brand-purple opacity-30 animate-pulse">
        </div>

        {/* Inner solid circle */}
        <div className="absolute w-32 h-32 rounded-full glass-strong flex items-center justify-center">
          {/* Sparkle Icon */}
          <div className="text-6xl animate-pulse">
            ✨
          </div>
        </div>

        {/* Floating dots around the circle */}
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="absolute w-3 h-3 rounded-full bg-white"
            style={{
              top: '50%',
              left: '50%',
              transform: `rotate(${i * 90}deg) translateX(120px)`,
              animation: `float 2s ease-in-out infinite ${i * 0.2}s`,
              opacity: 0.6,
            }}
          />
        ))}
      </div>

      {/* Progress Bar */}
      <div className="mb-8" role="progressbar" aria-valuenow={Math.round(progress)} aria-valuemin={0} aria-valuemax={100} aria-label="Image generation progress">
        <div className="flex justify-between items-center mb-3">
          <span className="text-sm font-semibold text-white/80">Progress</span>
          <span className="text-sm font-bold text-gradient">{Math.round(progress)}%</span>
        </div>
        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Enhanced Status Messages with Multi-Stage Feedback */}
      <div className="card p-6 mb-6" role="status" aria-live="polite" aria-atomic="true">
        <div className="space-y-4">
          {isGeneratingPrompt ? (
            <div className="flex items-start gap-4">
              <div className="text-3xl mt-1 animate-pulse" aria-hidden="true">🤖</div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <div className="spinner w-4 h-4" aria-hidden="true"></div>
                  <span className="text-sm font-semibold text-white">Analyzing celebrity context with AI...</span>
                </div>
                <p className="text-xs text-white/50">Gemini is crafting the perfect prompt for your selfie</p>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3 text-green-400 mb-4">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-sm font-semibold">AI prompt generated successfully</span>
              </div>

              {/* Current Stage with Icon and Description */}
              <div className="flex items-start gap-4 p-4 rounded-xl bg-white/5 border border-white/10">
                <div className="text-3xl animate-pulse" aria-hidden="true">{currentStage.icon}</div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="spinner w-4 h-4" aria-hidden="true"></div>
                    <h4 className="text-sm font-bold text-white">{currentStage.title}</h4>
                  </div>
                  <p className="text-xs text-white/60 leading-relaxed">{currentStage.description}</p>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* AI Prompt Display */}
      {showPrompt && promptText && (
        <div className="card p-6 slide-up">
          <div className="flex items-start gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-orange to-brand-pink flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-white mb-2">AI Prompt</h3>
              <p className="text-sm text-white/60 leading-relaxed">
                {promptText}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Tips and Fun Facts */}
      <div className="mt-8 text-center">
        <div className="card p-4 max-w-lg mx-auto">
          <p className="text-xs font-semibold text-white/60 mb-2">
            {progress < 20 && '💡 Did you know?'}
            {progress >= 20 && progress < 40 && '✨ Pro Tip'}
            {progress >= 40 && progress < 60 && '🎨 Behind the Scenes'}
            {progress >= 60 && progress < 80 && '🚀 Fun Fact'}
            {progress >= 80 && '🎉 Almost Done!'}
          </p>
          <p className="text-sm text-white/80">
            {progress < 20 && 'AI processes billions of pixels to create photorealistic selfies'}
            {progress >= 20 && progress < 40 && 'Better lighting in your photo = better results'}
            {progress >= 40 && progress < 60 && 'The AI analyzes facial structure, skin tone, and expression'}
            {progress >= 60 && progress < 80 && 'Each generation is unique and takes 60-90 seconds'}
            {progress >= 80 && 'Your celebrity selfie is being finalized!'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default ProcessingIndicator;
