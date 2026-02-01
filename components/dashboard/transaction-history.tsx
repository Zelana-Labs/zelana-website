"use client";

import { useState } from "react";
import { useWallets as useWalletsSolana } from "@privy-io/react-auth/solana";
import { PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";
import Link from "next/link";
import { useAccountTransactions } from "@/hooks/useZelanaData";
import type { Transaction } from "@/lib/sequencer-api";

function mapL1ToL2(walletAddress: string): string {
  try {
    const pubkey = new PublicKey(walletAddress);
    const bytes = pubkey.toBytes();
    return Array.from(bytes)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  } catch {
    return '';
  }
}

function TxTypeBadge({ type }: { type: string }) {
  const config: Record<string, { color: string; icon: string; label: string }> = {
    deposit: { color: 'bg-emerald-400/20 text-emerald-400', icon: '↓', label: 'Deposit' },
    transfer: { color: 'bg-blue-400/20 text-blue-400', icon: '→', label: 'Transfer' },
    withdrawal: { color: 'bg-yellow-400/20 text-yellow-400', icon: '↑', label: 'Withdraw' },
    shielded: { color: 'bg-purple-400/20 text-purple-400', icon: '◉', label: 'Shielded' },
  };

  const cfg = config[type.toLowerCase()] || { color: 'bg-white/20 text-white/60', icon: '?', label: type };

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${cfg.color}`}>
      <span>{cfg.icon}</span>
      <span>{cfg.label}</span>
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { color: string; label: string }> = {
    pending: { color: 'text-yellow-400', label: 'Pending' },
    included: { color: 'text-blue-400', label: 'Included' },
    executed: { color: 'text-purple-400', label: 'Executed' },
    settled: { color: 'text-emerald-400', label: 'Settled' },
    failed: { color: 'text-red-400', label: 'Failed' },
  };

  const cfg = config[status.toLowerCase()] || { color: 'text-white/60', label: status };

  return (
    <span className={`text-xs font-medium ${cfg.color}`}>
      {cfg.label}
    </span>
  );
}

function TimeAgo({ timestamp }: { timestamp: number }) {
  const ms = timestamp > 1e12 ? timestamp : timestamp * 1000;
  const diff = Date.now() - ms;
  
  if (diff < 60000) return <span className="text-white/40">Just now</span>;
  if (diff < 3600000) return <span className="text-white/40">{Math.floor(diff / 60000)}m ago</span>;
  if (diff < 86400000) return <span className="text-white/40">{Math.floor(diff / 3600000)}h ago</span>;
  return <span className="text-white/40">{Math.floor(diff / 86400000)}d ago</span>;
}

function TransactionRow({ tx, userAccountId }: { tx: Transaction; userAccountId: string }) {
  const isIncoming = tx.to === userAccountId;
  const isOutgoing = tx.from === userAccountId;
  const amount = tx.amount ? tx.amount / LAMPORTS_PER_SOL : null;
  
  // Determine direction indicator
  let directionIcon = '';
  let directionColor = 'text-white/40';
  if (tx.tx_type === 'deposit') {
    directionIcon = '↓';
    directionColor = 'text-emerald-400';
  } else if (tx.tx_type === 'withdrawal') {
    directionIcon = '↑';
    directionColor = 'text-yellow-400';
  } else if (isIncoming) {
    directionIcon = '←';
    directionColor = 'text-emerald-400';
  } else if (isOutgoing) {
    directionIcon = '→';
    directionColor = 'text-red-400';
  }

  return (
    <Link 
      href={`/explorer/transactions?hash=${tx.tx_hash}`}
      className="flex items-center gap-4 p-4 hover:bg-white/5 rounded-xl transition-colors"
    >
      {/* Direction Icon */}
      <div className={`w-10 h-10 rounded-full bg-zinc-800/50 flex items-center justify-center text-lg ${directionColor}`}>
        {directionIcon}
      </div>

      {/* Main Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <TxTypeBadge type={tx.tx_type} />
          <StatusBadge status={tx.status} />
        </div>
        <div className="text-xs font-mono text-white/40 truncate">
          {tx.tx_hash}
        </div>
      </div>

      {/* Amount */}
      <div className="text-right">
        {amount !== null && (
          <div className={`font-mono font-medium ${
            tx.tx_type === 'deposit' || isIncoming ? 'text-emerald-400' : 
            tx.tx_type === 'withdrawal' || isOutgoing ? 'text-red-400' : 
            'text-white'
          }`}>
            {tx.tx_type === 'deposit' || isIncoming ? '+' : tx.tx_type === 'withdrawal' || isOutgoing ? '-' : ''}
            {amount.toFixed(4)} zeSOL
          </div>
        )}
        <TimeAgo timestamp={tx.received_at} />
      </div>
    </Link>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="w-16 h-16 rounded-full bg-zinc-800/50 flex items-center justify-center mb-4">
        <svg className="w-8 h-8 text-white/20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      </div>
      <h3 className="text-lg font-medium text-white/60 mb-1">No transactions yet</h3>
      <p className="text-sm text-white/40 max-w-xs">
        Your transaction history will appear here after you make your first deposit or transfer.
      </p>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-2">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-4">
          <div className="w-10 h-10 rounded-full bg-white/10 animate-pulse" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-24 bg-white/10 rounded animate-pulse" />
            <div className="h-3 w-48 bg-white/10 rounded animate-pulse" />
          </div>
          <div className="space-y-2">
            <div className="h-4 w-20 bg-white/10 rounded animate-pulse" />
            <div className="h-3 w-16 bg-white/10 rounded animate-pulse ml-auto" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function TransactionHistory() {
  const { wallets } = useWalletsSolana();
  const wallet = wallets[0];
  const [page, setPage] = useState(0);
  const pageSize = 10;

  const l2AccountId = wallet ? mapL1ToL2(wallet.address) : null;
  const { data, isLoading, error } = useAccountTransactions(l2AccountId, page * pageSize, pageSize);
  const transactions = data?.items || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / pageSize);

  if (!wallet) {
    return (
      <div className="text-center py-8 text-white/40">
        Connect wallet to view transaction history
      </div>
    );
  }

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (error) {
    return (
      <div className="text-center py-8 text-red-400">
        Failed to load transactions. The sequencer may be offline.
      </div>
    );
  }

  if (transactions.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="space-y-4">
      {/* Stats header */}
      <div className="flex items-center justify-between text-sm text-white/40">
        <span>{total} transaction{total !== 1 ? 's' : ''}</span>
        <Link href="/explorer/transactions" className="text-emerald-400 hover:underline">
          View in Explorer
        </Link>
      </div>

      {/* Transaction list */}
      <div className="divide-y divide-white/5">
        {transactions.map((tx) => (
          <TransactionRow key={tx.tx_hash} tx={tx} userAccountId={l2AccountId!} />
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <button
            onClick={() => setPage(p => Math.max(0, p - 1))}
            disabled={page === 0}
            className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-sm text-white/60 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Previous
          </button>
          <span className="text-sm text-white/40">
            Page {page + 1} of {totalPages}
          </span>
          <button
            onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
            className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-sm text-white/60 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
