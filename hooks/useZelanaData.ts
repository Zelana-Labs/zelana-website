/**
 * Real-time data hooks for Zelana
 * 
 * Provides React hooks for fetching and subscribing to real-time updates
 * from the sequencer and prover network.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { config } from '@/lib/config';
import { 
  sequencerApi, 
  SequencerStats, 
  SequencerHealth,
  BatchStatus,
  Batch,
  Transaction,
  Account,
  Withdrawal,
} from '@/lib/sequencer-api';
import { 
  proverApi, 
  ProverHealth, 
  Worker,
  ProofJobStatus,
} from '@/lib/prover-api';

// Types

interface UseQueryResult<T> {
  data: T | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

interface ConnectionStatus {
  sequencer: 'connected' | 'disconnected' | 'connecting';
  prover: 'connected' | 'disconnected' | 'connecting';
  solana: 'connected' | 'disconnected' | 'connecting';
}

// Generic Query Hook

/**
 * Generic hook for fetching data with automatic refetching.
 * 
 * IMPORTANT: This hook avoids setting isLoading=true on refetches to prevent UI flickering.
 * Only the initial load shows the loading state.
 */
export function useQuery<T>(
  queryFn: () => Promise<T>,
  options: {
    refetchInterval?: number;
    enabled?: boolean;
  } = {}
): UseQueryResult<T> {
  const { refetchInterval, enabled = true } = options;
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  // Store queryFn in a ref to avoid re-running effect when function reference changes
  const queryFnRef = useRef(queryFn);
  queryFnRef.current = queryFn;
  
  // Track if we've done the initial fetch
  const hasFetchedRef = useRef(false);

  const fetch = useCallback(async (isInitial = false) => {
    if (!enabled) return;
    
    try {
      // Only show loading spinner on initial load, not on refetches
      if (isInitial || !hasFetchedRef.current) {
        setIsLoading(true);
      }
      const result = await queryFnRef.current();
      setData(result);
      setError(null);
      hasFetchedRef.current = true;
    } catch (e) {
      setError(e instanceof Error ? e : new Error(String(e)));
    } finally {
      setIsLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    // Reset on enabled change
    if (!enabled) {
      hasFetchedRef.current = false;
      setIsLoading(true);
      return;
    }
    
    fetch(true);

    if (refetchInterval) {
      const interval = setInterval(() => fetch(false), refetchInterval);
      return () => clearInterval(interval);
    }
  }, [fetch, refetchInterval, enabled]);
  return { data, isLoading, error, refetch: () => fetch(true) };
}

// Sequencer Hooks

/**
 * Hook for sequencer health status.
 */
export function useSequencerHealth(refetchInterval = 5000): UseQueryResult<SequencerHealth> {
  return useQuery(() => sequencerApi.getHealth(), { refetchInterval });
}

/**
 * Hook for sequencer statistics.
 */
export function useSequencerStats(refetchInterval = 3000): UseQueryResult<SequencerStats> {
  return useQuery(() => sequencerApi.getStats(), { refetchInterval });
}

/**
 * Hook for current batch status (batch being built).
 */
export function useBatchStatus(refetchInterval = 2000): UseQueryResult<BatchStatus> {
  return useQuery(() => sequencerApi.getBatchStatus(), { refetchInterval });
}

/**
 * Hook for fetching batches with pagination.
 */
export function useBatches(offset = 0, limit = 25) {
  return useQuery(
    () => sequencerApi.getBatches(offset, limit),
    { refetchInterval: 5000 }
  );
}

/**
 * Hook for fetching a single batch.
 */
export function useBatch(batchId: number | null) {
  return useQuery(
    () => batchId !== null ? sequencerApi.getBatch(batchId) : Promise.resolve(null),
    { enabled: batchId !== null }
  );
}

/**
 * Hook for fetching account data.
 */
export function useAccount(accountId: string | null) {
  return useQuery(
    () => accountId ? sequencerApi.getAccount(accountId) : Promise.resolve(null),
    { enabled: !!accountId, refetchInterval: 5000 }
  );
}

/**
 * Hook for fetching transaction data.
 */
export function useTransaction(txHash: string | null) {
  return useQuery(
    () => txHash ? sequencerApi.getTransaction(txHash) : Promise.resolve(null),
    { enabled: !!txHash }
  );
}

/**
 * Hook for fetching account transactions.
 */
export function useAccountTransactions(accountId: string | null, offset = 0, limit = 25) {
  return useQuery(
    () => accountId ? sequencerApi.getAccountTransactions(accountId, offset, limit) : Promise.resolve({ items: [], total: 0, offset: 0, limit: 25 }),
    { enabled: !!accountId, refetchInterval: 10000 }
  );
}

/**
 * Hook for fetching recent transactions (all).
 */
export function useRecentTransactions(offset = 0, limit = 25, refetchInterval = 10000) {
  return useQuery(
    () => sequencerApi.getRecentTransactions(offset, limit),
    { refetchInterval }
  );
}

/**
 * Hook for withdrawal status polling.
 */
export function useWithdrawalStatus(txHash: string | null, refetchInterval = 5000) {
  return useQuery(
    () => txHash ? sequencerApi.getWithdrawalStatus(txHash) : Promise.resolve(null),
    { enabled: !!txHash, refetchInterval }
  );
}

// Prover Hooks

/**
 * Hook for prover health status.
 */
export function useProverHealth(refetchInterval = 5000): UseQueryResult<ProverHealth> {
  return useQuery(() => proverApi.getHealth(), { refetchInterval });
}

/**
 * Hook for prover workers.
 */
export function useProverWorkers(refetchInterval = 3000): UseQueryResult<Worker[]> {
  return useQuery(() => proverApi.getWorkers(), { refetchInterval });
}

/**
 * Hook for subscribing to proof job status (SSE).
 */
export function useProofJobStatus(jobId: string | null) {
  const [status, setStatus] = useState<ProofJobStatus | null>(null);
  const [isComplete, setIsComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!jobId) return;

    const unsubscribe = proverApi.subscribeToJobStatus(jobId, (event) => {
      switch (event.type) {
        case 'status':
          setStatus(event.data);
          break;
        case 'progress':
          setStatus((prev) => prev ? { ...prev, progress_pct: event.data.progress_pct, message: event.data.message } : null);
          break;
        case 'completed':
          setIsComplete(true);
          break;
        case 'failed':
          setError(event.data.error);
          break;
      }
    });

    return unsubscribe;
  }, [jobId]);

  return { status, isComplete, error };
}

// WebSocket Hook

interface WebSocketMessage {
  type: string;
  data: unknown;
}

/**
 * Hook for real-time WebSocket connection to the sequencer.
 */
export function useSequencerWebSocket(onMessage?: (msg: WebSocketMessage) => void) {
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    try {
      wsRef.current = new WebSocket(config.sequencerWsUrl);

      wsRef.current.onopen = () => {
        setIsConnected(true);
        console.log('[WS] Connected to sequencer');
      };

      wsRef.current.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data) as WebSocketMessage;
          setLastMessage(msg);
          onMessage?.(msg);
        } catch (e) {
          console.error('[WS] Failed to parse message:', e);
        }
      };

      wsRef.current.onclose = () => {
        setIsConnected(false);
        console.log('[WS] Disconnected from sequencer');
        
        // Attempt to reconnect after 3 seconds
        reconnectTimeoutRef.current = setTimeout(() => {
          connect();
        }, 3000);
      };

      wsRef.current.onerror = (error) => {
        console.error('[WS] Error:', error);
      };
    } catch (e) {
      console.error('[WS] Failed to connect:', e);
    }
  }, [onMessage]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    wsRef.current?.close();
    wsRef.current = null;
    setIsConnected(false);
  }, []);

  useEffect(() => {
    connect();
    return () => disconnect();
  }, [connect, disconnect]);

  return { isConnected, lastMessage, connect, disconnect };
}

// Connection Status Hook

/**
 * Hook for overall connection status to all services.
 */
export function useConnectionStatus(): ConnectionStatus {
  const { data: sequencerHealth } = useSequencerHealth();
  const { data: proverHealth } = useProverHealth();
  const [solanaStatus, setSolanaStatus] = useState<'connected' | 'disconnected' | 'connecting'>('connecting');

  // Check Solana RPC health
  useEffect(() => {
    const checkSolana = async () => {
      try {
        const response = await fetch(config.solanaRpc, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            id: 1,
            method: 'getHealth',
          }),
        });
        const data = await response.json();
        setSolanaStatus(data.result === 'ok' ? 'connected' : 'disconnected');
      } catch {
        setSolanaStatus('disconnected');
      }
    };

    checkSolana();
    // Poll every 60 seconds to avoid RPC rate limiting
    const interval = setInterval(checkSolana, 60000);
    return () => clearInterval(interval);
  }, []);

  return {
    sequencer: sequencerHealth?.status === 'healthy' ? 'connected' : 'disconnected',
    prover: proverHealth?.status === 'healthy' ? 'connected' : 'disconnected',
    solana: solanaStatus,
  };
}

// Search Hook

interface SearchResult {
  type: 'account' | 'transaction' | 'batch' | 'none';
  data: Account | Transaction | Batch | null;
}

/**
 * Hook for searching by hash/ID (auto-detects type).
 */
export function useSearch(query: string): UseQueryResult<SearchResult> {
  return useQuery(
    async () => {
      if (!query || query.length < 2) {
        return { type: 'none', data: null };
      }

      // Try batch ID (numeric)
      if (/^\d+$/.test(query)) {
        const batch = await sequencerApi.getBatch(parseInt(query));
        if (batch) return { type: 'batch', data: batch };
      }

      // Try transaction hash (64 hex chars)
      if (/^[0-9a-fA-F]{64}$/.test(query)) {
        const tx = await sequencerApi.getTransaction(query);
        if (tx) return { type: 'transaction', data: tx };

        const account = await sequencerApi.getAccount(query);
        if (account) return { type: 'account', data: account };
      }

      return { type: 'none', data: null };
    },
    { enabled: query.length >= 2 }
  );
}
