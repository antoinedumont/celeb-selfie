/**
 * Password Protection Component
 *
 * Simple password entry screen matching Pure Apple design system.
 * Displays before main app when VITE_APP_PASSWORD is configured.
 */

import { useState, FormEvent } from 'react';
import { verifyPassword, setAuthSession } from '../utils/auth.utils';

interface PasswordProtectionProps {
  onAuthenticated: () => void;
}

export const PasswordProtection = ({ onAuthenticated }: PasswordProtectionProps) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    // Validate input
    if (!password.trim()) {
      setError('Please enter a password');
      return;
    }

    setIsLoading(true);

    // Simulate brief delay for better UX
    await new Promise(resolve => setTimeout(resolve, 300));

    // Verify password
    const isValid = verifyPassword(password);

    if (isValid) {
      // Store session and notify parent
      setAuthSession();
      onAuthenticated();
    } else {
      setError('Incorrect password. Please try again.');
      setPassword('');
      setIsLoading(false);
    }
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
    if (error) {
      setError(null);
    }
  };

  return (
    <div className="password-container">
      <div className="password-card spring-in">
        {/* Lock Icon */}
        <div className="text-6xl mb-6">🔒</div>

        {/* Title */}
        <h2 className="text-3xl text-apple font-inter font-bold mb-6">
          Protected Access
        </h2>

        {/* Description */}
        <p className="text-apple-body text-base font-light mb-8">
          Enter password to access Celeb Selfie
        </p>

        {/* Password Form */}
        <form onSubmit={handleSubmit} className="w-full">
          <div className="mb-6">
            <input
              type="password"
              value={password}
              onChange={handlePasswordChange}
              placeholder="Enter password"
              className="password-input w-full text-center"
              disabled={isLoading}
              autoFocus
              aria-label="Password"
              aria-invalid={!!error}
              aria-describedby={error ? 'password-error' : undefined}
            />
            {error && (
              <p id="password-error" className="password-error mt-3 text-center" role="alert">
                🚫 {error}
              </p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={!password.trim() || isLoading}
            className="apple-btn w-full disabled:opacity-50 disabled:cursor-not-allowed"
            aria-busy={isLoading}
          >
            {isLoading ? 'Verifying...' : 'Unlock'}
          </button>
        </form>

        {/* Security Note */}
        <p className="text-xs text-apple-body font-light mt-6 opacity-60">
          Client-side password protection
        </p>
      </div>
    </div>
  );
};

export default PasswordProtection;
