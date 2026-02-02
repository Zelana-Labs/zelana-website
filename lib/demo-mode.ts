/**
 * Demo Mode Detection Utility
 * 
 * Detects if the app is running in demo mode (production without real backend).
 * In demo mode:
 * - API calls to localhost are blocked
 * - Demo overlay is shown on protected pages
 * - Users can dismiss overlay to explore blurred UI
 */

/**
 * Check if we're running in a browser environment
 */
export function isBrowser(): boolean {
  return typeof window !== 'undefined';
}

/**
 * Check if the current hostname is localhost or 127.0.0.1
 * Returns false on server-side (SSR)
 */
export function isLocalhost(): boolean {
  if (!isBrowser()) {
    // Server-side: check NODE_ENV
    return process.env.NODE_ENV === 'development';
  }
  
  const hostname = window.location.hostname;
  return (
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname === '::1' ||
    hostname.startsWith('192.168.') ||
    hostname.startsWith('10.') ||
    hostname.endsWith('.local')
  );
}

/**
 * Check if demo mode is explicitly enabled via environment variable
 */
export function isDemoModeForced(): boolean {
  return process.env.NEXT_PUBLIC_DEMO_MODE === 'true';
}

/**
 * Main function: Check if we should show demo mode
 * 
 * Demo mode is active when:
 * - We're NOT on localhost (production deployment)
 * - OR demo mode is explicitly forced via env var
 */
export function isDemoMode(): boolean {
  // If explicitly forced, always return true
  if (isDemoModeForced()) {
    return true;
  }
  
  // If we're on localhost, demo mode is OFF (normal development)
  if (isLocalhost()) {
    return false;
  }
  
  // We're in production (not localhost) = demo mode ON
  return true;
}

/**
 * Check if API calls should be blocked
 * This is used by the safe-fetch wrapper
 */
export function shouldBlockApiCalls(): boolean {
  return isDemoMode();
}

/**
 * Check if a URL points to localhost backend
 */
export function isLocalhostUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return (
      parsed.hostname === 'localhost' ||
      parsed.hostname === '127.0.0.1' ||
      parsed.hostname === '::1'
    );
  } catch {
    // If URL parsing fails, check for common patterns
    return (
      url.includes('localhost') ||
      url.includes('127.0.0.1')
    );
  }
}

/**
 * Get demo mode configuration
 */
export function getDemoConfig() {
  return {
    youtubeVideoId: process.env.NEXT_PUBLIC_YOUTUBE_VIDEO_ID || 'ibLyvDYOCvk',
    twitterUrl: process.env.NEXT_PUBLIC_TWITTER_URL || 'https://x.com/zelanalabs',
    comingSoonText: 'Coming Soon',
  };
}
