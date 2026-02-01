/**
 * Zelana Core Sequencer API Client
 * 
 * Client for interacting with the Zelana L2 sequencer.
 * Provides methods for querying state, submitting transactions, and more.
 */

import { config } from './config';


// Types


export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  offset: number;
  limit: number;
}

export interface SequencerHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  version?: string;
  uptime_secs?: number;
}

export interface SequencerStats {
  accounts: number;
  transactions: number;
  batches: number;
  blocks: number;
  nullifiers: number;
  commitments: number;
  encrypted_notes: number;
  withdrawals: number;
  deposits: number;
  latest_state_root: string;
  latest_batch_id: number;
}

export interface BatchStatus {
  current_batch_id: number;
  tx_count: number;
  state: 'building' | 'proving' | 'pending_settlement' | 'settled';
  started_at: number;
}

export interface StateRoots {
  state_root: string;
  shielded_root: string;
  withdrawal_root: string;
}

export interface Account {
  id: string;           // 64-char hex (32 bytes)
  balance: number;      // in lamports (finalized)
  nonce: number;
  pendingBalance?: number;  // in lamports (includes pending tx)
  pendingNonce?: number;
}

export type TransactionType = 'deposit' | 'transfer' | 'shielded' | 'withdrawal';
export type TransactionStatus = 'pending' | 'included' | 'executed' | 'settled' | 'failed';

export interface Transaction {
  tx_hash: string;
  tx_type: TransactionType;
  batch_id?: number;
  status: TransactionStatus;
  received_at: number;
  executed_at?: number;
  amount?: number;
  from?: string;
  to?: string;
}

export interface Batch {
  batch_id: number;
  tx_count: number;
  state_root: string;
  shielded_root: string;
  l1_tx_sig?: string;
  status: 'building' | 'proving' | 'pending_settlement' | 'settled' | 'failed';
  created_at: number;
  settled_at?: number;
}

export interface Block {
  batch_id: number;
  prev_root: string;
  new_root: string;
  tx_count: number;
  open_at: number;
  flags: number;
}

export interface Nullifier {
  nullifier: string;
}

export interface Commitment {
  position: number;
  commitment: string;
}

export interface EncryptedNote {
  commitment: string;
  ciphertext_len: number;
  ephemeral_pk: string;
}

export interface TreeMeta {
  next_position: number;
  frontier: Array<{ level: number; hash: string }>;
}

export interface Deposit {
  l1_seq: number;
  slot: number;
}

export interface Withdrawal {
  tx_hash: string;
  from: string;
  to_l1_address: string;
  amount: number;
  status: 'pending' | 'in_batch' | 'submitted' | 'finalized' | 'failed';
  batch_id?: number;
  l1_tx_sig?: string;
}

export interface WithdrawRequest {
  from: string;           // L2 account (32-byte hex)
  to_l1_address: string;  // Solana destination pubkey (32-byte hex)
  amount: number;         // Amount in lamports
  nonce: number;          // Account nonce
  signature: string;      // Ed25519 signature (hex)
  signer_pubkey: string;  // Signer public key (hex)
}

export interface WithdrawResponse {
  tx_hash: string;
  status: string;
}

export interface TransferRequest {
  from: string;           // L2 account (32-byte hex)
  to: string;             // L2 destination account (32-byte hex)
  amount: number;         // Amount in lamports
  nonce: number;          // Account nonce
  signature: string;      // Ed25519 signature (hex)
  signer_pubkey: string;  // Signer public key (base58)
}

export interface TransferResponse {
  tx_hash: string;
  status: string;
}

export interface BatchTransferRequest {
  transfers: TransferRequest[];
}

export interface BatchTransferResponse {
  tx_hashes: string[];
  status: string;
}


// API Client


class SequencerApiClient {
  private baseUrl: string;

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl || config.sequencerUrl;
  }

  /**
   * Make a GET request to the sequencer.
   */
  private async get<T>(endpoint: string): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Sequencer API error (${response.status}): ${error}`);
    }

    return response.json();
  }

  /**
   * Make a POST request to the sequencer.
   */
  private async post<T>(endpoint: string, body?: unknown): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Sequencer API error (${response.status}): ${error}`);
    }

    return response.json();
  }

   // Health & Status
    /**
   * Check sequencer health.
   */
  async getHealth(): Promise<SequencerHealth> {
    try {
      const response = await this.get<{ status: string }>('/health');
      return {
        status: response.status === 'ok' ? 'healthy' : 'unhealthy',
      };
    } catch {
      return { status: 'unhealthy' };
    }
  }

  /**
   * Get global statistics.
   * API returns different field names, so we normalize them.
   */
  async getStats(): Promise<SequencerStats> {
    const response = await this.get<{
      total_batches: number;
      total_transactions: number;
      total_deposited: number;
      total_withdrawn: number;
      current_batch_id: number;
      active_accounts: number;
      shielded_commitments: number;
      uptime_secs: number;
    }>('/status/stats');
    
    return {
      accounts: response.active_accounts,
      transactions: response.total_transactions,
      batches: response.total_batches,
      blocks: 0, // Not provided by backend
      nullifiers: 0, // Not provided by backend
      commitments: response.shielded_commitments,
      encrypted_notes: 0, // Not provided by backend
      withdrawals: response.total_withdrawn > 0 ? 1 : 0, // Approximation from value
      deposits: response.total_deposited > 0 ? 1 : 0, // Approximation from value
      latest_state_root: '', // Not provided by this endpoint
      latest_batch_id: response.current_batch_id,
    };
  }

  /**
   * Get current batch status.
   */
  async getBatchStatus(): Promise<BatchStatus> {
    return this.get<BatchStatus>('/status/batch');
  }

  /**
   * Get current state roots.
   */
  async getStateRoots(): Promise<StateRoots> {
    return this.get<StateRoots>('/status/roots');
  }

   // Accounts
    /**
   * Get account by ID.
   * API returns { account_id, balance, nonce } - we normalize to { id, balance, nonce }
   */
  async getAccount(accountId: string): Promise<Account | null> {
    try {
      const response = await this.post<{ 
        account_id: string; 
        balance: number; 
        nonce: number;
        pending_balance?: number;
        pending_nonce?: number;
      }>('/account', { account_id: accountId });
      return {
        id: response.account_id,
        balance: response.balance,
        nonce: response.nonce,
        pendingBalance: response.pending_balance,
        pendingNonce: response.pending_nonce,
      };
    } catch {
      return null;
    }
  }

   // Transactions
    /**
   * Get transaction by hash.
   * API returns { tx: TxSummary | null } - we unwrap it.
   */
  async getTransaction(txHash: string): Promise<Transaction | null> {
    try {
      const response = await this.post<{ tx: Transaction | null }>('/tx', { tx_hash: txHash });
      return response.tx;
    } catch {
      return null;
    }
  }

  /**
   * Get transactions for an account.
   */
  async getAccountTransactions(accountId: string, offset = 0, limit = 25): Promise<PaginatedResponse<Transaction>> {
    // API returns { transactions: [...] } but we normalize to { items: [...] }
    const response = await this.post<{ transactions: Transaction[]; total: number; offset: number; limit: number }>('/txs', { account_id: accountId, offset, limit });
    return {
      items: response.transactions,
      total: response.total,
      offset: response.offset,
      limit: response.limit,
    };
  }

  /**
   * Get recent transactions (all).
   */
  async getRecentTransactions(offset = 0, limit = 25): Promise<PaginatedResponse<Transaction>> {
    // API returns { transactions: [...] } but we normalize to { items: [...] }
    const response = await this.post<{ transactions: Transaction[]; total: number; offset: number; limit: number }>('/txs', { offset, limit });
    return {
      items: response.transactions,
      total: response.total,
      offset: response.offset,
      limit: response.limit,
    };
  }

   // Batches
    /**
   * List batches with pagination.
   * API returns { batches: [...] } but we normalize to { items: [...] }
   */
  async getBatches(offset = 0, limit = 25): Promise<PaginatedResponse<Batch>> {
    const response = await this.post<{ batches: Batch[]; total: number; offset: number; limit: number }>('/batches', { offset, limit });
    return {
      items: response.batches,
      total: response.total,
      offset: response.offset,
      limit: response.limit,
    };
  }

  /**
   * Get batch by ID.
   * API returns { batch: BatchSummary | null } - we unwrap it.
   */
  async getBatch(batchId: number): Promise<Batch | null> {
    try {
      const response = await this.post<{ batch: Batch | null }>('/batch', { batch_id: batchId });
      return response.batch;
    } catch {
      return null;
    }
  }

   // Withdrawals
    /**
   * Submit a withdrawal request.
   */
  async submitWithdrawal(request: WithdrawRequest): Promise<WithdrawResponse> {
    return this.post<WithdrawResponse>('/withdraw', request);
  }

  /**
   * Get withdrawal status.
   */
  async getWithdrawalStatus(txHash: string): Promise<Withdrawal | null> {
    try {
      return await this.post<Withdrawal>('/withdraw/status', { tx_hash: txHash });
    } catch {
      return null;
    }
  }

   // Transfers
    /**
   * Submit a single transfer request.
   */
  async submitTransfer(request: TransferRequest): Promise<TransferResponse> {
    return this.post<TransferResponse>('/transfer', request);
  }

  /**
   * Submit multiple transfers in a batch.
   */
  async submitBatchTransfer(requests: TransferRequest[]): Promise<BatchTransferResponse> {
    return this.post<BatchTransferResponse>('/transfer/batch', { transfers: requests });
  }

   // Shielded (Privacy)
    /**
   * Get merkle path for a commitment.
   */
  async getMerklePath(commitment: string): Promise<{ path: string[]; index: number } | null> {
    try {
      return await this.post<{ path: string[]; index: number }>('/shielded/merkle_path', { commitment });
    } catch {
      return null;
    }
  }

   // Encrypted Transactions
    /**
   * Get committee info for encrypted transactions.
   */
  async getCommitteeInfo(): Promise<{ members: string[]; threshold: number }> {
    return this.get<{ members: string[]; threshold: number }>('/encrypted/committee');
  }
}

// Export singleton instance
export const sequencerApi = new SequencerApiClient();

// Export class for custom instances
export { SequencerApiClient };
