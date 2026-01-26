import { useState, useEffect } from 'react';

interface ProcessingIndicatorProps {
  progress: number;
  celebrityName: string;
  isGeneratingPrompt?: boolean;
}

export const ProcessingIndicator = ({
  progress,
  celebrityName,
  isGeneratingPrompt,
}: ProcessingIndicatorProps) => {
  // Elapsed time counter
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsedSeconds((s) => s + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Calculate estimated time remaining (assume ~40s total)
  const totalSeconds = 40;
  const remainingSeconds = Math.ceil((100 - progress) * (totalSeconds / 100));

  // SVG circle calculations
  const size = 240;
  const strokeWidth = 4;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;

  // Status text
  const getStatusText = () => {
    if (isGeneratingPrompt) return 'Preparing...';
    if (progress >= 98) return 'Finishing...';
    return `Creating with ${celebrityName}`;
  };

  return (
    <div
      className="processing-container fade-in"
      role="region"
      aria-label="Image generation progress"
    >
      {/* Progress Ring with Percentage */}
      <div className="progress-ring-container">
        <svg
          className="progress-ring"
          width={size}
          height={size}
          role="progressbar"
          aria-valuenow={Math.round(progress)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Generation progress: ${Math.round(progress)}%`}
        >
          {/* Gradient Definition */}
          <defs>
            <linearGradient id="progress-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#f79533" />
              <stop offset="50%" stopColor="#ef4e7b" />
              <stop offset="100%" stopColor="#5073b8" />
            </linearGradient>
          </defs>

          {/* Background Circle */}
          <circle
            className="progress-ring-bg"
            cx={size / 2}
            cy={size / 2}
            r={radius}
          />

          {/* Progress Circle */}
          <circle
            className="progress-ring-fill"
            cx={size / 2}
            cy={size / 2}
            r={radius}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
          />
        </svg>

        {/* Percentage Display */}
        <span className="progress-percentage" aria-hidden="true">
          {Math.round(progress)}%
        </span>
      </div>

      {/* Status Text */}
      <p className="status-text-minimal">
        {getStatusText()}
      </p>

      {/* Time Remaining */}
      {progress < 98 && !isGeneratingPrompt && (
        <p className="time-remaining">
          ~{remainingSeconds}s
        </p>
      )}

      {/* Elapsed Timer - Discrete */}
      <p className="text-xs text-white/20 mt-8">
        {elapsedSeconds}s
      </p>
    </div>
  );
};

export default ProcessingIndicator;
