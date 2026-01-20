/**
 * Authentication Utilities
 *
 * Simple client-side password protection for Celeb Selfie app.
 * Uses localStorage for session management and environment variable for password configuration.
 *
 * Security Note: This is a simple client-side protection mechanism suitable for
 * casual access control, demos, and cost management. NOT suitable for protecting
 * sensitive data or production security requirements.
 */

const AUTH_SESSION_KEY = 'celeb-selfie-auth-session';

/**
 * Auth session data stored in localStorage
 */
interface AuthSession {
  authenticated: boolean;
  timestamp: number;
}

/**
 * Get the configured app password from environment variable
 * Returns null if no password is configured
 */
export function getAppPassword(): string | null {
  const password = import.meta.env.VITE_APP_PASSWORD;
  return password && password.trim().length > 0 ? password.trim() : null;
}

/**
 * Check if password protection is enabled
 * Returns true if VITE_APP_PASSWORD is configured
 */
export function isPasswordRequired(): boolean {
  return getAppPassword() !== null;
}

/**
 * Verify if the provided password matches the configured password
 *
 * @param inputPassword - The password entered by the user
 * @returns true if password is correct, false otherwise
 */
export function verifyPassword(inputPassword: string): boolean {
  const configuredPassword = getAppPassword();

  // If no password is configured, allow access
  if (!configuredPassword) {
    return true;
  }

  // Simple string comparison (not hashed, client-side only)
  return inputPassword.trim() === configuredPassword;
}

/**
 * Store authenticated session in localStorage
 * Session persists across page refreshes until manually cleared
 */
export function setAuthSession(): void {
  const session: AuthSession = {
    authenticated: true,
    timestamp: Date.now(),
  };

  try {
    localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(session));
  } catch (error) {
    console.error('[Auth] Failed to store session:', error);
  }
}

/**
 * Retrieve authenticated session from localStorage
 *
 * @returns true if user is authenticated, false otherwise
 */
export function getAuthSession(): boolean {
  try {
    const sessionData = localStorage.getItem(AUTH_SESSION_KEY);

    if (!sessionData) {
      return false;
    }

    const session: AuthSession = JSON.parse(sessionData);
    return session.authenticated === true;
  } catch (error) {
    console.error('[Auth] Failed to retrieve session:', error);
    return false;
  }
}

/**
 * Clear authenticated session from localStorage (logout)
 * User will need to enter password again on next access
 */
export function clearAuthSession(): void {
  try {
    localStorage.removeItem(AUTH_SESSION_KEY);
    console.log('[Auth] Session cleared');
  } catch (error) {
    console.error('[Auth] Failed to clear session:', error);
  }
}
