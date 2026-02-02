/**
 * Safe Fetch - API Request Interceptor for Demo Mode
 * 
 * Wraps the native fetch function to block API calls to localhost
 * when running in production/demo mode. Returns mock responses
 * to prevent errors and provide graceful degradation.
 */

import { shouldBlockApiCalls, isLocalhostUrl } from './demo-mode';

/**
 * Mock response data for blocked API calls
 * Returns sensible defaults that won't crash the UI
 */
function getMockResponse(url: string): Response {
  // Determine mock data based on the URL pattern
  let mockData: unknown = {};
  
  if (url.includes('/health')) {
    mockData = { 
      status: 'demo',
      healthy: false,
      message: 'Demo mode - backend not available' 
    };
  } else if (url.includes('/status/stats')) {
    mockData = {
      total_batches: 0,
      total_transactions: 0,
      total_deposited: 0,
      total_withdrawn: 0,
      current_batch_id: 0,
      active_accounts: 0,
      shielded_commitments: 0,
      uptime_secs: 0,
    };
  } else if (url.includes('/status/batch')) {
    mockData = {
      current_batch_id: 0,
      tx_count: 0,
      state: 'building',
      started_at: 0,
    };
  } else if (url.includes('/v2/health')) {
    mockData = {
      status: 'success',
      data: {
        status: 'demo',
        active_jobs: 0,
        cached_proofs: 0,
        max_concurrent_jobs: 0,
        mock_prover: true,
      }
    };
  } else if (url.includes('/workers')) {
    mockData = {
      status: 'success',
      data: {
        workers: [],
        total: 0,
        ready: 0,
      }
    };
  } else if (url.includes('/batches')) {
    mockData = {
      batches: [],
      total: 0,
      offset: 0,
      limit: 25,
    };
  } else if (url.includes('/txs') || url.includes('/transactions')) {
    mockData = {
      transactions: [],
      total: 0,
      offset: 0,
      limit: 25,
    };
  }

  // Create a mock Response object
  return new Response(JSON.stringify(mockData), {
    status: 200,
    statusText: 'OK (Demo Mode)',
    headers: {
      'Content-Type': 'application/json',
      'X-Demo-Mode': 'true',
    },
  });
}

/**
 * Safe fetch wrapper that blocks localhost API calls in demo mode
 * 
 * @param input - URL or Request object
 * @param init - Fetch options
 * @returns Promise<Response> - Real or mock response
 */
export async function safeFetch(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> {
  // Extract URL string from input
  const url = typeof input === 'string' 
    ? input 
    : input instanceof URL 
      ? input.toString() 
      : input.url;

  // Check if we should block this request
  if (shouldBlockApiCalls() && isLocalhostUrl(url)) {
    // Return mock response silently (no console spam)
    return getMockResponse(url);
  }

  // Normal fetch for allowed requests
  return fetch(input, init);
}

/**
 * Type-safe wrapper that returns JSON directly
 * Useful for simple GET requests
 */
export async function safeFetchJson<T>(
  url: string,
  init?: RequestInit
): Promise<T> {
  const response = await safeFetch(url, init);
  return response.json();
}

export default safeFetch;
