"use client";

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useTransaction, useRecentTransactions, useBatch } from '@/hooks/useZelanaData';
import { sequencerApi } from '@/lib/sequencer-api';
import { getExplorerUrl, config } from '@/lib/config';
import { 
  HashDisplay, 
  Skeleton, 
  StatusBadge,
  TxTypeBadge,
  TimeDisplay,
  AmountDisplay,
  EmptyState,
} from '@/components/explorer/ExplorerUI';

function BackButton() {
  return (
    <Link href="/explorer" className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors mb-6">
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
      </svg>
      Back to Explorer
    </Link>
  );
}

// Transaction Detail View
function TransactionDetail({ txHash }: { txHash: string }) {
  const { data: tx, isLoading, error } = useTransaction(txHash);
  // Fetch batch to get L1 settlement tx signature
  const { data: batch } = useBatch(tx?.batch_id ?? null);
  
  if (isLoading) {
    return (
      <div className="bg-zinc-900/50 backdrop-blur-sm rounded-2xl border border-white/5 p-6">
        <Skeleton className="h-8 w-48 mb-4" />
        <Skeleton className="h-6 w-full mb-2" />
        <Skeleton className="h-6 w-full mb-2" />
        <Skeleton className="h-6 w-32" />
      </div>
    );
  }

  if (error || !tx) {
    return (
      <div className="bg-zinc-900/50 backdrop-blur-sm rounded-2xl border border-white/5 p-6">
        <EmptyState
          title="Transaction not found"
          description={`No transaction found with hash: ${txHash}`}
        />
      </div>
    );
  }

  return (
    <div className="bg-zinc-900/50 backdrop-blur-sm rounded-2xl border border-white/5 p-6">
      <div className="flex items-center gap-3 mb-6">
        <h2 className="text-xl font-semibold text-white">Transaction Details</h2>
        <TxTypeBadge type={tx.tx_type} size="md" />
        <StatusBadge status={tx.status} size="md" />
      </div>
      
      <div className="space-y-4">
        <div>
          <div className="text-xs text-white/40 uppercase tracking-wider mb-1">Transaction Hash</div>
          <HashDisplay hash={tx.tx_hash} truncate={false} copyable={true} />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {tx.from && (
            <div className="bg-zinc-800/50 rounded-xl p-4">
              <div className="text-xs text-white/40 uppercase tracking-wider mb-1">From</div>
              <HashDisplay hash={tx.from} link="account" />
            </div>
          )}
          
          {tx.to && (
            <div className="bg-zinc-800/50 rounded-xl p-4">
              <div className="text-xs text-white/40 uppercase tracking-wider mb-1">To</div>
              <HashDisplay hash={tx.to} link="account" />
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {tx.amount !== undefined && (
            <div className="bg-zinc-800/50 rounded-xl p-4">
              <div className="text-xs text-white/40 uppercase tracking-wider mb-1">Amount</div>
              <AmountDisplay amount={tx.amount} className="text-lg font-semibold" />
            </div>
          )}
          
          {tx.batch_id !== undefined && (
            <div className="bg-zinc-800/50 rounded-xl p-4">
              <div className="text-xs text-white/40 uppercase tracking-wider mb-1">Batch</div>
              <Link href={`/explorer/batches?id=${tx.batch_id}`} className="text-lg font-semibold text-emerald-400 hover:underline">
                #{tx.batch_id}
              </Link>
            </div>
          )}
          
          <div className="bg-zinc-800/50 rounded-xl p-4">
            <div className="text-xs text-white/40 uppercase tracking-wider mb-1">Received</div>
            <TimeDisplay timestamp={tx.received_at} relative={false} />
          </div>
          
          {tx.executed_at && (
            <div className="bg-zinc-800/50 rounded-xl p-4">
              <div className="text-xs text-white/40 uppercase tracking-wider mb-1">Executed</div>
              <TimeDisplay timestamp={tx.executed_at} relative={false} />
            </div>
          )}
        </div>

        {/* L1 Settlement Section */}
        {tx.status === 'settled' && batch?.l1_tx_sig && (
          <div className="bg-zinc-800/50 rounded-xl p-4 border border-emerald-400/20">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-white/40 uppercase tracking-wider mb-1">Solana L1 Settlement</div>
                <HashDisplay hash={batch.l1_tx_sig} truncate={true} copyable={true} />
              </div>
              <a
                href={getExplorerUrl('tx', batch.l1_tx_sig, config.network)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/20 border border-emerald-500/30 rounded-lg text-sm font-medium text-emerald-400 hover:bg-emerald-500/30 transition-colors"
              >
                View on Solana
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Transaction Search
function TransactionSearch({ onSearch }: { onSearch: (hash: string) => void }) {
  const [searchHash, setSearchHash] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchHash.length === 64) {
      onSearch(searchHash);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 mb-6">
      <input
        type="text"
        value={searchHash}
        onChange={(e) => setSearchHash(e.target.value)}
        placeholder="Enter transaction hash (64 hex characters)..."
        className="flex-1 bg-zinc-900/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/40 focus:outline-none focus:border-white/20 transition-colors font-mono"
      />
      <button
        type="submit"
        disabled={searchHash.length !== 64}
        className="px-6 py-3 bg-emerald-500/20 border border-emerald-500/30 rounded-xl text-sm font-medium text-emerald-400 hover:bg-emerald-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        Search
      </button>
    </form>
  );
}

// Transactions List
function TransactionsList() {
  const { data: recentTxs, isLoading: recentLoading } = useRecentTransactions(0, 25);
  const [searchedTransactions, setSearchedTransactions] = useState<Array<{
    tx_hash: string;
    tx_type: string;
    status: string;
    batch_id?: number;
    amount?: number;
    received_at: number;
  }> | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchedHash, setSearchedHash] = useState<string | null>(null);

  const handleSearch = async (hash: string) => {
    setIsSearching(true);
    setSearchedHash(hash);
    try {
      const tx = await sequencerApi.getTransaction(hash);
      if (tx) {
        setSearchedTransactions([tx]);
      } else {
        setSearchedTransactions([]);
      }
    } catch {
      setSearchedTransactions([]);
    } finally {
      setIsSearching(false);
    }
  };

  const clearSearch = () => {
    setSearchedHash(null);
    setSearchedTransactions(null);
  };

  // Show searched transactions if we have a search, otherwise show recent
  const transactions = searchedTransactions !== null ? searchedTransactions : (recentTxs?.items || []);
  const isLoading = searchedTransactions !== null ? isSearching : recentLoading;

  return (
    <div>
      <TransactionSearch onSearch={handleSearch} />
      
      {searchedHash && (
        <div className="mb-4 flex items-center gap-2">
          <span className="text-sm text-white/60">
            Showing results for: <span className="font-mono text-white/80">{searchedHash.slice(0, 16)}...</span>
          </span>
          <button
            onClick={clearSearch}
            className="text-sm text-emerald-400 hover:text-emerald-300 transition-colors"
          >
            Clear search
          </button>
        </div>
      )}
      
      {isLoading ? (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : transactions.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-xs text-white/40 uppercase tracking-wider border-b border-white/5">
                <th className="pb-3 font-medium">Hash</th>
                <th className="pb-3 font-medium">Type</th>
                <th className="pb-3 font-medium">Status</th>
                <th className="pb-3 font-medium">Batch</th>
                <th className="pb-3 font-medium">Amount</th>
                <th className="pb-3 font-medium">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {transactions.map((tx) => (
                <tr key={tx.tx_hash} className="hover:bg-white/5 transition-colors">
                  <td className="py-4">
                    <Link href={`/explorer/transactions?hash=${tx.tx_hash}`}>
                      <HashDisplay hash={tx.tx_hash} />
                    </Link>
                  </td>
                  <td className="py-4">
                    <TxTypeBadge type={tx.tx_type} />
                  </td>
                  <td className="py-4">
                    <StatusBadge status={tx.status} />
                  </td>
                  <td className="py-4">
                    {tx.batch_id !== undefined ? (
                      <Link href={`/explorer/batches?id=${tx.batch_id}`} className="text-emerald-400 hover:underline">
                        #{tx.batch_id}
                      </Link>
                    ) : (
                      <span className="text-white/40">-</span>
                    )}
                  </td>
                  <td className="py-4">
                    {tx.amount !== undefined ? (
                      <AmountDisplay amount={tx.amount} />
                    ) : (
                      <span className="text-white/40">-</span>
                    )}
                  </td>
                  <td className="py-4">
                    <TimeDisplay timestamp={tx.received_at} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {!searchedHash && recentTxs && recentTxs.total > 25 && (
            <div className="mt-4 text-center text-sm text-white/40">
              Showing {recentTxs.items.length} of {recentTxs.total} transactions
            </div>
          )}
        </div>
      ) : searchedHash ? (
        <EmptyState
          title="No transaction found"
          description="Try searching for a different transaction hash"
        />
      ) : (
        <div className="text-center py-12">
          <div className="text-white/40 mb-2">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <p className="text-white/60">No transactions yet</p>
          <p className="text-sm text-white/40 mt-1">Transactions will appear here once submitted to L2</p>
        </div>
      )}
    </div>
  );
}

function TransactionsContent() {
  const searchParams = useSearchParams();
  const txHash = searchParams.get('hash');

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <BackButton />
        
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-white mb-2">Transactions</h1>
          <p className="text-white/60">Search and view L2 transaction details</p>
        </div>

        {txHash ? (
          <TransactionDetail txHash={txHash} />
        ) : (
          <div className="bg-zinc-900/50 backdrop-blur-sm rounded-2xl border border-white/5 p-6">
            <TransactionsList />
          </div>
        )}
      </main>
    </div>
  );
}

export default function TransactionsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-white/40">Loading...</div>
      </div>
    }>
      <TransactionsContent />
    </Suspense>
  );
}
