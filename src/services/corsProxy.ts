/**
 * CORS Proxy Utility
 *
 * Handles CORS proxy configuration for browser-based Replicate API calls.
 * Replicate API doesn't support CORS, so we need to proxy requests through
 * a CORS proxy service when running in the browser.
 *
 * Features:
 * - Multi-proxy failover for high availability
 * - Automatic proxy health tracking
 * - Timeout protection
 * - localStorage caching of proxy performance
 *
 * Usage:
 * - Set VITE_USE_CORS_PROXY=true in .env to enable proxy
 * - Optionally set VITE_CORS_PROXY_URL to override default proxies
 * - Use getCorsProxyUrl() to wrap Replicate API URLs
 */

/**
 * Default CORS proxy services (ordered by reliability)
 * These are used when VITE_CORS_PROXY_URL is not set
 *
 * NOTE: Disabled fallback proxies - we only use our custom VPS proxy
 * which is reliable and under our control at https://api.tmtprod.com
 */
const DEFAULT_PROXY_URLS: string[] = [];

/**
 * Proxy health data stored in localStorage
 */
interface ProxyHealth {
  url: string;
  successCount: number;
  failureCount: number;
  lastUpdated: number;
}

const PROXY_HEALTH_KEY = 'cors_proxy_health';
const HEALTH_EXPIRY_MS = 60 * 60 * 1000; // 1 hour

/**
 * Check if CORS proxy is enabled via environment variable
 *
 * @returns true if proxy should be used, false otherwise
 */
export function isProxyEnabled(): boolean {
  return import.meta.env.VITE_USE_CORS_PROXY === 'true';
}

/**
 * Get the configured CORS proxy URL (for backward compatibility)
 *
 * @returns Proxy base URL or empty string if not configured
 */
export function getProxyBaseUrl(): string {
  return import.meta.env.VITE_CORS_PROXY_URL || '';
}

/**
 * Get array of proxy URLs to try (in priority order)
 *
 * @returns Array of proxy URLs (only custom proxy, no fallbacks)
 * @throws Error if no custom proxy is configured
 */
export function getProxyUrls(): string[] {
  // We only use our custom VPS proxy - no fallback proxies
  const customProxy = getProxyBaseUrl();

  if (!customProxy) {
    throw new Error(
      'No CORS proxy configured. Please set VITE_CORS_PROXY_URL in .env to https://api.tmtprod.com/replicate/'
    );
  }

  return [customProxy];
}

/**
 * Get proxy health data from localStorage
 */
function getProxyHealth(): ProxyHealth[] {
  try {
    const data = localStorage.getItem(PROXY_HEALTH_KEY);
    if (!data) return [];

    const health: ProxyHealth[] = JSON.parse(data);
    const now = Date.now();

    // Filter out expired entries
    return health.filter(h => now - h.lastUpdated < HEALTH_EXPIRY_MS);
  } catch (error) {
    console.warn('[CORS Proxy] Failed to load health data:', error);
    return [];
  }
}

/**
 * Save proxy health data to localStorage
 */
function saveProxyHealth(health: ProxyHealth[]): void {
  try {
    localStorage.setItem(PROXY_HEALTH_KEY, JSON.stringify(health));
  } catch (error) {
    console.warn('[CORS Proxy] Failed to save health data:', error);
  }
}

/**
 * Record a successful proxy request
 *
 * @param proxyUrl - The proxy URL that succeeded
 */
export function recordProxySuccess(proxyUrl: string): void {
  const health = getProxyHealth();
  const existing = health.find(h => h.url === proxyUrl);

  if (existing) {
    existing.successCount++;
    existing.lastUpdated = Date.now();
  } else {
    health.push({
      url: proxyUrl,
      successCount: 1,
      failureCount: 0,
      lastUpdated: Date.now(),
    });
  }

  saveProxyHealth(health);
}

/**
 * Record a failed proxy request
 *
 * @param proxyUrl - The proxy URL that failed
 */
export function recordProxyFailure(proxyUrl: string): void {
  const health = getProxyHealth();
  const existing = health.find(h => h.url === proxyUrl);

  if (existing) {
    existing.failureCount++;
    existing.lastUpdated = Date.now();
  } else {
    health.push({
      url: proxyUrl,
      successCount: 0,
      failureCount: 1,
      lastUpdated: Date.now(),
    });
  }

  saveProxyHealth(health);
}

/**
 * Select the best proxy URL based on health data
 *
 * @returns Best proxy URL to try first
 */
export function selectBestProxy(): string {
  const proxies = getProxyUrls();
  if (proxies.length === 0) {
    throw new Error('No CORS proxies available');
  }
  return proxies[0];
}

/**
 * Wrap a target URL with CORS proxy if enabled (uses best available proxy)
 *
 * When proxy is enabled, wraps the URL with the best available proxy service.
 * When proxy is disabled, returns the original URL unchanged.
 *
 * For failover support, use getCorsProxyUrlWithProxy() to specify a proxy.
 *
 * Example:
 * - Input: https://api.replicate.com/v1/predictions
 * - Output (with proxy): https://corsproxy.io/?https%3A%2F%2Fapi.replicate.com%2Fv1%2Fpredictions
 * - Output (without proxy): https://api.replicate.com/v1/predictions
 *
 * @param targetUrl - The URL to wrap with proxy
 * @returns Proxied URL if enabled, original URL otherwise
 */
export function getCorsProxyUrl(targetUrl: string): string {
  if (!isProxyEnabled()) {
    return targetUrl;
  }

  const proxyBaseUrl = selectBestProxy();
  return getCorsProxyUrlWithProxy(targetUrl, proxyBaseUrl);
}

/**
 * Wrap a target URL with a specific CORS proxy
 *
 * @param targetUrl - The URL to wrap with proxy
 * @param proxyBaseUrl - The proxy service base URL
 * @returns Proxied URL
 */
export function getCorsProxyUrlWithProxy(targetUrl: string, proxyBaseUrl: string): string {
  // Detect if this is a path-based proxy (nginx) or query-based proxy (public CORS proxies)
  // Path-based proxies end with "/" without query parameter
  // Our VPS nginx proxy uses /replicate/ path prefix
  const isPathBasedProxy = proxyBaseUrl.includes('/replicate/') ||
                           (proxyBaseUrl.endsWith('/') && !proxyBaseUrl.includes('?'));

  if (isPathBasedProxy && targetUrl.startsWith('https://api.replicate.com/')) {
    // For path-based proxies, replace the API domain with the proxy base
    // Example: https://api.replicate.com/v1/predictions -> https://api.tmtprod.com/replicate/v1/predictions
    const apiPath = targetUrl.replace('https://api.replicate.com/', '');
    return `${proxyBaseUrl}${apiPath}`;
  }

  // For query-based proxies (public CORS proxies), URL encode the target URL
  const encodedUrl = encodeURIComponent(targetUrl);
  const proxiedUrl = `${proxyBaseUrl}${encodedUrl}`;

  return proxiedUrl;
}

/**
 * Get headers specific to the CORS proxy
 *
 * Some CORS proxies require special headers (e.g., cors-anywhere needs X-Requested-With)
 * This function returns proxy-specific headers based on the configured proxy.
 *
 * @returns Headers object for proxy requests
 */
export function getProxyHeaders(): Record<string, string> {
  if (!isProxyEnabled()) {
    return {};
  }

  const proxyBaseUrl = getProxyBaseUrl();

  // CORS Anywhere requires X-Requested-With header
  if (proxyBaseUrl.includes('cors-anywhere')) {
    return {
      'X-Requested-With': 'XMLHttpRequest',
    };
  }

  // AllOrigins and most other proxies don't need special headers
  return {};
}

/**
 * Unwrap response from CORS proxy
 *
 * Some CORS proxies (like AllOrigins in non-raw mode) wrap the response.
 * This function unwraps the response if needed.
 *
 * Note: When using AllOrigins with /raw endpoint, this isn't needed,
 * but we keep it for compatibility with other proxies.
 *
 * @param response - Response from fetch call
 * @returns Unwrapped response data
 */
export async function unwrapProxyResponse(response: Response): Promise<any> {
  const contentType = response.headers.get('content-type');

  // If not JSON, return as-is
  if (!contentType || !contentType.includes('application/json')) {
    return response;
  }

  const json = await response.json();

  // Check if this is an AllOrigins wrapped response
  // AllOrigins (non-raw) format: { contents: "...", status: { ... } }
  if (json.contents !== undefined) {
    console.log('[CORS Proxy] Unwrapping AllOrigins response');
    return JSON.parse(json.contents);
  }

  // Otherwise, return as-is (direct API or raw proxy response)
  return json;
}

/**
 * Log proxy configuration for debugging
 */
export function logProxyConfig(): void {
  console.log('[CORS Proxy] Configuration:');
  console.log(`  - Enabled: ${isProxyEnabled()}`);
  console.log(`  - Proxy URL: ${getProxyBaseUrl() || '(not set)'}`);

  if (isProxyEnabled() && !getProxyBaseUrl()) {
    console.warn('[CORS Proxy] WARNING: Proxy enabled but URL not configured!');
    console.warn('[CORS Proxy] Set VITE_CORS_PROXY_URL in .env file');
  }
}
