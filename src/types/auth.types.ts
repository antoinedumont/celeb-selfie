/**
 * Authentication Type Definitions
 *
 * TypeScript types for simple password protection system
 */

/**
 * Authentication state interface
 */
export interface AuthState {
  /** Whether the user is currently authenticated */
  isAuthenticated: boolean;
  /** Optional timestamp of when authentication occurred */
  timestamp?: number;
}

/**
 * Result of password verification attempt
 */
export type PasswordVerificationResult = {
  /** Whether verification was successful */
  success: boolean;
  /** Optional error message if verification failed */
  error?: string;
};

/**
 * Props for PasswordProtection component
 */
export interface PasswordProtectionProps {
  /** Callback fired when authentication is successful */
  onAuthenticated: () => void;
  /** Optional children to render when authenticated */
  children?: React.ReactNode;
}
