"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { useL2Wallet } from "@/contexts/L2WalletContext";
import { PublicKey as ZelanaPublicKey } from "@zelana/sdk";

interface TransferEntry {
  id: string;
  recipientType: 'l1' | 'l2';
  recipient: string;
  amount: string;
}

const MAX_TRANSFERS = 5;

function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

/**
 * Convert a Solana address (base58) to L2 account ID (hex)
 */
function solanaAddressToL2(address: string): string | null {
  if (!address || address.trim().length === 0) {
    return null;
  }
  
  // Trim whitespace
  const trimmed = address.trim();
  
  try {
    const pubkey = new ZelanaPublicKey(trimmed);
    const hex = pubkey.toHex();
    
    // Validate we got a 64-char hex string (32 bytes)
    if (hex.length === 64 && /^[0-9a-fA-F]+$/.test(hex)) {
      return hex;
    }
    console.warn('[solanaAddressToL2] Unexpected hex length:', hex.length);
    return null;
  } catch (err) {
    console.warn('[solanaAddressToL2] Failed to convert address:', trimmed, err);
    return null;
  }
}

/**
 * Check if a recipient address is valid (for real-time validation UI)
 */
function isValidRecipient(recipient: string, recipientType: 'l1' | 'l2'): boolean {
  if (!recipient || recipient.trim().length === 0) {
    return false;
  }
  
  const trimmed = recipient.trim();
  
  if (recipientType === 'l2') {
    // L2 address must be exactly 64 hex characters
    return /^[0-9a-fA-F]{64}$/.test(trimmed);
  } else {
    // L1 address must be a valid Solana base58 public key
    return solanaAddressToL2(trimmed) !== null;
  }
}

export function BatchTransfer() {
  const { isReady, client, l2Address } = useL2Wallet();
  
  const [transfers, setTransfers] = useState<TransferEntry[]>([
    { id: generateId(), recipientType: 'l1', recipient: '', amount: '' }
  ]);
  const [sending, setSending] = useState(false);
  const [results, setResults] = useState<{ success: boolean; txHash?: string; error?: string }[]>([]);
  const [globalError, setGlobalError] = useState<string | null>(null);
  
  // Fetch account balance
  const [balance, setBalance] = useState<bigint | null>(null);
  const [balanceLoading, setBalanceLoading] = useState(false);
  
  // Fetch balance when client/address changes
  const fetchBalance = useCallback(async () => {
    if (!client || !l2Address) {
      setBalance(null);
      return;
    }
    
    setBalanceLoading(true);
    try {
      const account = await client.getAccountFor(l2Address.toString());
      setBalance(account.balance);
    } catch (e) {
      console.error('Failed to fetch balance:', e);
      setBalance(null);
    } finally {
      setBalanceLoading(false);
    }
  }, [client, l2Address]);
  
  // Fetch balance on mount and when dependencies change
  useEffect(() => {
    fetchBalance();
  }, [fetchBalance]);

  const totalAmount = useMemo(() => {
    return transfers.reduce((sum, t) => {
      const amt = parseFloat(t.amount) || 0;
      return sum + amt;
    }, 0);
  }, [transfers]);

  const balanceInSol = balance !== null ? Number(balance) / LAMPORTS_PER_SOL : 0;
  const hasEnoughBalance = balanceInSol >= totalAmount;

  const addTransfer = () => {
    if (transfers.length >= MAX_TRANSFERS) return;
    setTransfers([...transfers, { id: generateId(), recipientType: 'l1', recipient: '', amount: '' }]);
  };

  const removeTransfer = (id: string) => {
    if (transfers.length > 1) {
      setTransfers(transfers.filter(t => t.id !== id));
    }
  };

  const updateTransfer = (id: string, field: keyof TransferEntry, value: string) => {
    setTransfers(transfers.map(t => 
      t.id === id ? { ...t, [field]: value } : t
    ));
  };

  const handleSubmit = async () => {
    if (!client || !l2Address) return;
    
    setSending(true);
    setResults([]);
    setGlobalError(null);

    try {
      // Validate all transfers first
      const validTransfers = transfers.filter(t => t.recipient && t.amount);
      if (validTransfers.length === 0) {
        throw new Error("No valid transfers to submit");
      }

      // Calculate total
      const totalLamports = validTransfers.reduce((sum, t) => {
        return sum + BigInt(Math.floor(parseFloat(t.amount) * LAMPORTS_PER_SOL));
      }, 0n);

      if (balance !== null && totalLamports > balance) {
        throw new Error(`Insufficient L2 balance. You have ${balanceInSol.toFixed(4)} zeSOL, need ${(Number(totalLamports) / LAMPORTS_PER_SOL).toFixed(4)} zeSOL`);
      }

      // Process transfers one by one (nonce increments)
      const transferResults: { success: boolean; txHash?: string; error?: string }[] = [];
      let successfulAmount = 0n; // Track total amount successfully sent for optimistic update

      for (const transfer of validTransfers) {
        try {
          // Determine recipient L2 address
          let toL2Hex: string;
          if (transfer.recipientType === 'l1') {
            const converted = solanaAddressToL2(transfer.recipient);
            if (!converted) {
              throw new Error(`Invalid Solana address: "${transfer.recipient.slice(0, 20)}..." - must be a valid base58 public key`);
            }
            toL2Hex = converted;
          } else {
            // Already hex - trim and validate
            const trimmed = transfer.recipient.trim();
            if (!/^[0-9a-fA-F]{64}$/.test(trimmed)) {
              throw new Error("Invalid L2 address (must be exactly 64 hex characters)");
            }
            toL2Hex = trimmed.toLowerCase();
          }

          const amountLamports = BigInt(Math.floor(parseFloat(transfer.amount) * LAMPORTS_PER_SOL));

          // Use SDK client to transfer (handles signing internally)
          const result = await client.transfer(toL2Hex, amountLamports);
          
          if (result.accepted) {
            transferResults.push({ success: true, txHash: result.txHash });
            successfulAmount += amountLamports;
            
            // Optimistic balance update after each successful transfer
            if (balance !== null) {
              setBalance(prev => prev !== null ? prev - amountLamports : null);
            }
          } else {
            transferResults.push({ success: false, error: result.message || 'Transfer rejected' });
          }
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : 'Unknown error';
          transferResults.push({ success: false, error: message });
        }
      }

      setResults(transferResults);
      
      // Fetch actual balance after a short delay to confirm
      // This ensures the sequencer has processed the transactions
      setTimeout(async () => {
        try {
          await fetchBalance();
        } catch {
          // Ignore errors during background refresh
        }
      }, 1500);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setGlobalError(message);
    } finally {
      setSending(false);
    }
  };

  const clearAll = () => {
    setTransfers([{ id: generateId(), recipientType: 'l1', recipient: '', amount: '' }]);
    setResults([]);
    setGlobalError(null);
  };

  // If wallet not connected, show connect prompt
  if (!isReady) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <div className="w-16 h-16 bg-purple-500/10 rounded-full flex items-center justify-center mb-2">
          <svg className="w-8 h-8 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-white">Connect Wallet</h3>
        <p className="text-sm text-white/60 text-center max-w-sm">
          Connect your Solana wallet to make L2 transfers.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with balance */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-white/60">
          L2 Balance: <span className={`font-mono font-medium transition-all ${
            sending ? 'text-yellow-400' : hasEnoughBalance ? 'text-emerald-400' : 'text-red-400'
          }`}>
            {balanceLoading ? '...' : sending ? `~${balanceInSol.toFixed(4)} zeSOL` : `${balanceInSol.toFixed(4)} zeSOL`}
          </span>
          {sending && <span className="ml-1 text-yellow-400/60 text-xs">(updating)</span>}
          <button 
            onClick={fetchBalance} 
            disabled={sending || balanceLoading}
            className="ml-2 text-white/40 hover:text-white/60 transition-colors disabled:opacity-30"
            title="Refresh balance"
          >
            <svg className={`w-3 h-3 inline ${balanceLoading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
        <div className="text-sm text-white/60">
          Total: <span className="font-mono font-medium text-purple-400">{totalAmount.toFixed(4)} zeSOL</span>
        </div>
      </div>

      {/* Transfer entries */}
      <div className="space-y-3">
        {transfers.map((transfer, index) => (
          <div key={transfer.id} className="bg-zinc-800/50 rounded-xl p-4 border border-white/5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-white/40">Transfer #{index + 1}</span>
              {transfers.length > 1 && (
                <button
                  onClick={() => removeTransfer(transfer.id)}
                  className="text-red-400/60 hover:text-red-400 text-xs transition-colors"
                >
                  Remove
                </button>
              )}
            </div>

            <div className="space-y-3">
              {/* Recipient type selector */}
              <div className="flex gap-2">
                <button
                  onClick={() => updateTransfer(transfer.id, 'recipientType', 'l1')}
                  className={`flex-1 px-3 py-1.5 text-xs rounded-lg transition-all ${
                    transfer.recipientType === 'l1'
                      ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                      : 'bg-zinc-700/50 text-white/60 hover:text-white'
                  }`}
                >
                  L1 Address (Solana)
                </button>
                <button
                  onClick={() => updateTransfer(transfer.id, 'recipientType', 'l2')}
                  className={`flex-1 px-3 py-1.5 text-xs rounded-lg transition-all ${
                    transfer.recipientType === 'l2'
                      ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                      : 'bg-zinc-700/50 text-white/60 hover:text-white'
                  }`}
                >
                  L2 Address (Hex)
                </button>
              </div>

              {/* Recipient input */}
              <div>
                <div className="relative">
                  <input
                    type="text"
                    placeholder={transfer.recipientType === 'l1' ? 'Solana address (e.g., 5FH...xyz)' : 'L2 account ID (64 hex chars)'}
                    value={transfer.recipient}
                    onChange={(e) => updateTransfer(transfer.id, 'recipient', e.target.value)}
                    className={`w-full px-3 py-2 rounded-lg bg-zinc-900 text-white text-sm border focus:outline-none font-mono pr-8 ${
                      transfer.recipient.length === 0
                        ? 'border-white/10 focus:border-white/20'
                        : isValidRecipient(transfer.recipient, transfer.recipientType)
                          ? 'border-emerald-500/30 focus:border-emerald-500/50'
                          : 'border-red-500/30 focus:border-red-500/50'
                    }`}
                  />
                  {/* Validation indicator */}
                  {transfer.recipient.length > 0 && (
                    <span className={`absolute right-3 top-1/2 -translate-y-1/2 text-xs ${
                      isValidRecipient(transfer.recipient, transfer.recipientType)
                        ? 'text-emerald-400'
                        : 'text-red-400'
                    }`}>
                      {isValidRecipient(transfer.recipient, transfer.recipientType) ? '✓' : '✗'}
                    </span>
                  )}
                </div>
                {/* L2 hex preview for L1 addresses */}
                {transfer.recipientType === 'l1' && transfer.recipient.length > 0 && isValidRecipient(transfer.recipient, transfer.recipientType) && (
                  <div className="text-[10px] text-white/40 mt-1 font-mono truncate">
                    L2: {solanaAddressToL2(transfer.recipient)?.slice(0, 16)}...
                  </div>
                )}
              </div>

              {/* Amount input */}
              <div className="flex gap-2">
                <input
                  type="number"
                  step="0.001"
                  min="0"
                  placeholder="Amount (zeSOL)"
                  value={transfer.amount}
                  onChange={(e) => updateTransfer(transfer.id, 'amount', e.target.value)}
                  className="flex-1 px-3 py-2 rounded-lg bg-zinc-900 text-white text-sm border border-white/10 focus:outline-none focus:border-white/20"
                />
                <button
                  onClick={() => {
                    const remaining = balanceInSol - transfers.filter(t => t.id !== transfer.id).reduce((s, t) => s + (parseFloat(t.amount) || 0), 0);
                    updateTransfer(transfer.id, 'amount', Math.max(0, remaining).toFixed(4));
                  }}
                  className="px-3 py-2 rounded-lg bg-white/5 text-white/60 text-xs hover:bg-white/10 transition-colors"
                >
                  Max
                </button>
              </div>

              {/* Result indicator */}
              {results[index] && (
                <div className={`text-xs ${results[index].success ? 'text-emerald-400' : 'text-red-400'}`}>
                  {results[index].success ? (
                    <span>Success: {results[index].txHash?.slice(0, 16)}...</span>
                  ) : (
                    <span>Failed: {results[index].error}</span>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Add more button */}
      <button
        onClick={addTransfer}
        disabled={transfers.length >= MAX_TRANSFERS}
        className={`w-full py-2 rounded-lg border border-dashed transition-colors ${
          transfers.length >= MAX_TRANSFERS
            ? 'border-white/10 text-white/30 cursor-not-allowed'
            : 'border-white/20 text-white/60 hover:border-white/40 hover:text-white'
        }`}
      >
        {transfers.length >= MAX_TRANSFERS
          ? `Maximum ${MAX_TRANSFERS} transfers reached`
          : '+ Add Another Transfer'}
      </button>

      {/* Error display */}
      {globalError && (
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          {globalError}
        </div>
      )}

      {/* Action buttons */}
      <div className="flex gap-3">
        <button
          onClick={clearAll}
          className="flex-1 px-4 py-3 rounded-xl bg-white/5 text-white/60 text-sm font-medium hover:bg-white/10 transition-colors"
        >
          Clear All
        </button>
        <button
          onClick={handleSubmit}
          disabled={sending || !hasEnoughBalance || transfers.every(t => !t.recipient || !t.amount)}
          className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 text-white text-sm font-semibold shadow-lg shadow-blue-500/20 disabled:opacity-40 disabled:shadow-none transition-all disabled:cursor-not-allowed"
        >
          {sending ? "Processing..." : `Send ${transfers.filter(t => t.recipient && t.amount).length} Transfer(s)`}
        </button>
      </div>

      {/* Summary of successful transfers */}
      {results.length > 0 && results.some(r => r.success) && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
          <div className="text-sm font-medium text-emerald-400 mb-2">
            {results.filter(r => r.success).length} / {results.length} transfers successful
          </div>
          <div className="space-y-1">
            {results.filter(r => r.success).map((r, i) => (
              <div key={i} className="text-xs text-white/60 font-mono">
                {r.txHash}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
