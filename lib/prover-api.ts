/**
 * Zelana Prover Coordinator API Client
 * 
 * Client for interacting with the Forge prover network.
 * Provides methods for monitoring prover status, workers, and proof jobs.
 */

import { config } from './config';
import { safeFetch } from './safe-fetch';

// =============================================================================
// Types
// =============================================================================

export interface ProverHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  worker_count: number;
  workers_ready: number;
  pending_jobs: number;
  total_proofs: number;
  mock_prover: boolean;
  version?: string;
}

export interface Worker {
  url: string;
  worker_id: number;
  ready: boolean;
  active_jobs: number;
  total_proofs: number;
  avg_proving_time_ms: number;
  last_health_check: number;
}

export type ProofJobState = 
  | 'pending'
  | 'preparing'
  | 'proving'
  | 'completed'
  | 'failed'
  | 'cancelled';

export interface ProofJobStatus {
  job_id: string;
  batch_id: number;
  state: ProofJobState;
  progress_pct: number;
  message: string;
  created_at: number;
  updated_at: number;
  completed_at?: number;
  error?: string;
}

export interface ProofResult {
  job_id: string;
  batch_id: number;
  proof_bytes: string;           // 388 bytes hex encoded
  public_witness_bytes: string;  // 236 bytes hex encoded
  batch_hash: string;
  withdrawal_root: string;
  proving_time_ms: number;
}

export interface BatchProofRequest {
  batch_id: number;
  transactions: BatchTransaction[];
  prev_state_root: string;
  prev_shielded_root: string;
}

export interface BatchTransaction {
  tx_type: 'transfer' | 'deposit' | 'withdrawal' | 'shielded';
  from_account: string;
  to_account: string;
  amount: number;
  from_balance_before: number;
  from_balance_after: number;
  to_balance_before: number;
  to_balance_after: number;
  from_nonce: number;
}

// SSE Event Types
export type ProofStatusEvent = 
  | { type: 'status'; data: ProofJobStatus }
  | { type: 'progress'; data: { job_id: string; progress_pct: number; message: string } }
  | { type: 'completed'; data: ProofResult }
  | { type: 'failed'; data: { job_id: string; error: string } };

// =============================================================================
// API Client
// =============================================================================

class ProverApiClient {
  private baseUrl: string;

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl || config.proverUrl;
  }

  /**
   * Make a GET request to the prover.
   */
  private async get<T>(endpoint: string): Promise<T> {
    const response = await safeFetch(`${this.baseUrl}${endpoint}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Prover API error (${response.status}): ${error}`);
    }

    return response.json();
  }

  /**
   * Make a POST request to the prover.
   */
  private async post<T>(endpoint: string, body?: unknown): Promise<T> {
    const response = await safeFetch(`${this.baseUrl}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Prover API error (${response.status}): ${error}`);
    }

    return response.json();
  }

  // ===========================================================================
  // Health & Status
  // ===========================================================================

  /**
   * Check prover health (Core API v2).
   * Also fetches worker counts from /workers endpoint for accuracy.
   */
  async getHealth(): Promise<ProverHealth> {
    try {
      // API returns { status: "success", data: { ... } }
      interface HealthData {
        status?: string;
        active_jobs?: number;
        cached_proofs?: number;
        max_concurrent_jobs?: number;
        mock_prover?: boolean;
        worker_count?: number;
        workers_ready?: number;
      }
      
      // Fetch both health and workers in parallel
      const [healthResponse, workersResponse] = await Promise.all([
        this.get<{ status: string; data?: HealthData }>('/v2/health'),
        this.get<{ status: string; data?: { workers: Worker[]; total: number; ready: number }; workers?: Worker[] }>('/workers').catch(() => null),
      ]);

      // Unwrap health data
      const data: HealthData = healthResponse.data || {};
      
      // Get worker counts from workers endpoint (more accurate)
      let workerCount = data.max_concurrent_jobs || data.worker_count || 0;
      let workersReady = data.workers_ready || 0;
      
      if (workersResponse?.data) {
        workerCount = workersResponse.data.total;
        workersReady = workersResponse.data.ready;
      } else if (workersResponse?.workers) {
        workerCount = workersResponse.workers.length;
        workersReady = workersResponse.workers.filter(w => w.ready).length;
      }

      return {
        status: (data.status === 'ok' || healthResponse.status === 'success') ? 'healthy' : 'unhealthy',
        worker_count: workerCount,
        workers_ready: workersReady,
        pending_jobs: data.active_jobs || 0,
        total_proofs: data.cached_proofs || 0,
        mock_prover: data.mock_prover || false,
      };
    } catch {
      return {
        status: 'unhealthy',
        worker_count: 0,
        workers_ready: 0,
        pending_jobs: 0,
        total_proofs: 0,
        mock_prover: false,
      };
    }
  }

  /**
   * Check prover health (legacy endpoint).
   */
  async getHealthLegacy(): Promise<ProverHealth> {
    try {
      const response = await this.get<{
        status: string;
        data?: {
          status?: string;
          pending_batches?: number;
          total_batches?: number;
        };
        pending_batches?: number;
        total_batches?: number;
      }>('/health');

      // Unwrap data if present
      const data = response.data || response;

      return {
        status: (data.status === 'ok' || response.status === 'success') ? 'healthy' : 'unhealthy',
        worker_count: 0,
        workers_ready: 0,
        pending_jobs: data.pending_batches || 0,
        total_proofs: data.total_batches || 0,
        mock_prover: false,
      };
    } catch {
      return {
        status: 'unhealthy',
        worker_count: 0,
        workers_ready: 0,
        pending_jobs: 0,
        total_proofs: 0,
        mock_prover: false,
      };
    }
  }

  // ===========================================================================
  // Workers
  // ===========================================================================

  /**
   * Get list of all workers and their status.
   */
  async getWorkers(): Promise<Worker[]> {
    try {
      // API returns { status: "success", data: { workers: [...], total: N, ready: N } }
      const response = await this.get<{
        status: string;
        data?: { workers: Worker[]; total: number; ready: number };
        // Also handle direct format (without wrapper)
        workers?: Worker[];
      }>('/workers');
      
      // Unwrap data if present
      if (response.data?.workers) {
        return response.data.workers;
      }
      return response.workers || [];
    } catch {
      return [];
    }
  }

  // ===========================================================================
  // Proof Jobs (Core API v2)
  // ===========================================================================

  /**
   * Submit a batch for proving.
   */
  async submitBatch(request: BatchProofRequest): Promise<{ job_id: string }> {
    return this.post<{ job_id: string }>('/v2/batch/prove', request);
  }

  /**
   * Get proof job status.
   */
  async getJobStatus(jobId: string): Promise<ProofJobStatus | null> {
    try {
      return await this.get<ProofJobStatus>(`/v2/batch/${jobId}/status`);
    } catch {
      return null;
    }
  }

  /**
   * Get completed proof.
   */
  async getProof(jobId: string): Promise<ProofResult | null> {
    try {
      return await this.get<ProofResult>(`/v2/batch/${jobId}/proof`);
    } catch {
      return null;
    }
  }

  /**
   * Cancel a proof job.
   */
  async cancelJob(jobId: string): Promise<boolean> {
    try {
      await safeFetch(`${this.baseUrl}/v2/batch/${jobId}`, { method: 'DELETE' });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Subscribe to proof job status updates via SSE.
   * Returns an EventSource that emits ProofStatusEvent.
   */
  subscribeToJobStatus(jobId: string, onEvent: (event: ProofStatusEvent) => void): () => void {
    const eventSource = new EventSource(`${this.baseUrl}/v2/batch/${jobId}/status`);

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        onEvent(data as ProofStatusEvent);
      } catch (e) {
        console.error('Failed to parse SSE event:', e);
      }
    };

    eventSource.onerror = () => {
      console.error('SSE connection error');
      eventSource.close();
    };

    // Return cleanup function
    return () => eventSource.close();
  }

  // ===========================================================================
  // Parallel Swarm (Batch Processing)
  // ===========================================================================

  /**
   * Get batch status (parallel swarm).
   */
  async getBatchStatus(batchId: string): Promise<{
    batch_id: string;
    state: string;
    chunks_total: number;
    chunks_proved: number;
    error?: string;
  } | null> {
    try {
      return await this.get(`/batch/${batchId}/status`);
    } catch {
      return null;
    }
  }
}

// Export singleton instance
export const proverApi = new ProverApiClient();

// Export class for custom instances
export { ProverApiClient };
