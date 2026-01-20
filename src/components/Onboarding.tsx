import { useState, useEffect } from 'react';

interface OnboardingProps {
  onComplete: () => void;
}

export const Onboarding = ({ onComplete }: OnboardingProps) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if user has seen onboarding before
    const hasSeenOnboarding = localStorage.getItem('hasSeenOnboarding');
    if (!hasSeenOnboarding) {
      setIsVisible(true);
    } else {
      onComplete();
    }
  }, [onComplete]);

  const handleComplete = () => {
    localStorage.setItem('hasSeenOnboarding', 'true');
    setIsVisible(false);
    onComplete();
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 backdrop-blur-xl animate-fade-in" style={{ background: 'rgba(245, 245, 247, 0.95)' }}>
      <div className="apple-card w-full max-w-sm text-center spring-in">
        {/* Icon */}
        <div className="text-6xl mb-6">✨</div>

        {/* Title */}
        <h2 className="text-3xl text-apple font-inter font-bold mb-6">
          Welcome
        </h2>

        {/* Steps */}
        <div className="space-y-6 text-left mb-8">
          {/* Step 1 */}
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-black rounded-full flex items-center justify-center text-apple flex-shrink-0">
              <span className="text-white font-inter font-semibold">1</span>
            </div>
            <div className="flex-1 pt-2">
              <p className="text-apple font-inter font-semibold text-base leading-relaxed mb-1">
                Take your photo
              </p>
              <p className="text-apple-body text-sm font-light">
                Position your face in the frame
              </p>
            </div>
          </div>

          {/* Step 2 */}
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-black rounded-full flex items-center justify-center text-apple flex-shrink-0">
              <span className="text-white font-inter font-semibold">2</span>
            </div>
            <div className="flex-1 pt-2">
              <p className="text-apple font-inter font-semibold text-base leading-relaxed mb-1">
                Choose your celebrity
              </p>
              <p className="text-apple-body text-sm font-light">
                Use voice or type their name
              </p>
            </div>
          </div>
        </div>

        {/* CTA Button */}
        <button
          onClick={handleComplete}
          className="apple-btn w-full mb-4"
        >
          Get Started
        </button>

        {/* Skip Link */}
        <button
          onClick={handleComplete}
          className="mt-2 text-sm text-apple-body hover:text-black transition-colors font-inter font-light"
        >
          Skip
        </button>
      </div>
    </div>
  );
};

export default Onboarding;
