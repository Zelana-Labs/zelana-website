"use client";

import { useState } from 'react';
import Link from 'next/link';
import DarkNavbar from '@/components/ui/DarkNavbar';
import { useSequencerStats, useConnectionStatus, useBatches, useSearch } from '@/hooks/useZelanaData';
import { 
  StatCard, 
  HashDisplay, 
  StatusBadge, 
  TxTypeBadge,
  ConnectionIndicator,
  Skeleton,
  TimeDisplay,
  AmountDisplay,
} from '@/components/explorer/ExplorerUI';

// Icons
function UsersIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  );
}

function TransactionIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
    </svg>
  );
}

function BatchIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  );
}

// Search Component
function SearchBar() {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const { data: searchResult, isLoading } = useSearch(isSearching ? query : '');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.length >= 2) {
      setIsSearching(true);
    }
  };
  const handleClear = () => {
    setQuery('');
    setIsSearching(false);
  };

  return (
    <div className="relative">
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40">
            <SearchIcon />
          </span>
          <input
            type="text"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setIsSearching(false); }}
            placeholder="Search by tx hash, account ID, or batch number..."
            className="w-full bg-zinc-900/50 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-white/40 focus:outline-none focus:border-white/20 transition-colors"
          />
          {query && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/60"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
        <button
          type="submit"
          className="px-6 py-3 bg-white/10 border border-white/10 rounded-xl text-sm font-medium text-white hover:bg-white/20 transition-colors"
        >
          Search
        </button>
      </form>
          
      {/* Search Results */}
      {isSearching && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-zinc-900 border border-white/10 rounded-xl overflow-hidden z-50">
          {isLoading ? (
            <div className="p-4">
              <Skeleton className="h-6 w-full" />
            </div>
          ) : searchResult?.type === 'none' ? (
            <div className="p-4 text-sm text-white/60">
              No results found for &ldquo;{query}&rdquo;
            </div>
          ) : searchResult?.type === 'transaction' && searchResult.data ? (
            <Link
              href={`/explorer/transactions?hash=${(searchResult.data as { tx_hash: string }).tx_hash}`}
              className="block p-4 hover:bg-white/5 transition-colors"
              onClick={handleClear}
            >
              <div className="flex items-center gap-2 mb-1">
                <TxTypeBadge type={(searchResult.data as { tx_type: string }).tx_type} />
                <StatusBadge status={(searchResult.data as { status: string }).status} />
              </div>
              <HashDisplay hash={(searchResult.data as { tx_hash: string }).tx_hash} />
            </Link>
          ) : searchResult?.type === 'account' && searchResult.data ? (
            <Link
              href={`/explorer/accounts?id=${(searchResult.data as { id: string }).id}`}
              className="block p-4 hover:bg-white/5 transition-colors"
              onClick={handleClear}
            >
              <div className="text-xs text-white/40 mb-1">Account</div>
              <HashDisplay hash={(searchResult.data as { id: string }).id} />
              <div className="mt-1 text-sm text-white/60">
                Balance: <AmountDisplay amount={(searchResult.data as { balance: number }).balance} />
              </div>
            </Link>
          ) : searchResult?.type === 'batch' && searchResult.data ? (
            <Link
              href={`/explorer/batches?id=${(searchResult.data as { batch_id: number }).batch_id}`}
              className="block p-4 hover:bg-white/5 transition-colors"
              onClick={handleClear}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs text-white/40">Batch</span>
                <StatusBadge status={(searchResult.data as { status: string }).status} />
              </div>
              <div className="text-lg font-semibold text-white">
                #{(searchResult.data as { batch_id: number }).batch_id}
              </div>
              <div className="text-sm text-white/60">
                {(searchResult.data as { tx_count: number }).tx_count} transactions
              </div>
            </Link>
          ) : null}
        </div>
      )}
    </div>
  );
}

// Recent Batches Table
function RecentBatches() {
  const { data: batchesData, isLoading } = useBatches(0, 5);
  
  if (isLoading) {
    return (
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  const batches = batchesData?.items || [];

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="text-left text-xs text-white/40 uppercase tracking-wider border-b border-white/5">
            <th className="pb-3 font-medium">Batch</th>
            <th className="pb-3 font-medium">Txs</th>
            <th className="pb-3 font-medium">State Root</th>
            <th className="pb-3 font-medium">Status</th>
            <th className="pb-3 font-medium">Time</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {batches.map((batch) => (
            <tr key={batch.batch_id} className="hover:bg-white/5 transition-colors">
              <td className="py-3">
                <Link href={`/explorer/batches?id=${batch.batch_id}`} className="text-emerald-400 font-mono hover:underline">
                  #{batch.batch_id}
                </Link>
              </td>
              <td className="py-3 text-white/80">{batch.tx_count}</td>
              <td className="py-3">
                <HashDisplay hash={batch.state_root} />
              </td>
              <td className="py-3">
                <StatusBadge status={batch.status} />
              </td>
              <td className="py-3">
                <TimeDisplay timestamp={batch.created_at} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {batches.length > 0 && (
        <div className="mt-4 text-center">
          <Link href="/explorer/batches" className="text-sm text-emerald-400 hover:underline">
            View all batches
          </Link>
        </div>
      )}
    </div>
  );
}

// Main Explorer Page
export default function ExplorerPage() {
  const { data: stats, isLoading: statsLoading } = useSequencerStats();
  const connectionStatus = useConnectionStatus();

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <DarkNavbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8 slide-in-top">
          <h1 className="text-2xl font-semibold text-white mb-2">Zelana Explorer</h1>
          <p className="text-white/60">Explore transactions, batches, and accounts on the Zelana L2</p>
        </div>

        {/* Search Bar */}
        <div className="mb-8 slide-in-top delay-100">
          <SearchBar />
        </div>

        {/* Stats Grid - User-focused metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 slide-in-bottom delay-200">
          {statsLoading ? (
            <>
              <Skeleton className="h-24" />
              <Skeleton className="h-24" />
              <Skeleton className="h-24" />
              <Skeleton className="h-24" />
            </>
          ) : (
            <>
              <StatCard
                label="Total Transactions"
                value={stats?.transactions || 0}
                icon={<TransactionIcon />}
                color="blue"
                href="/explorer/transactions"
              />
              <StatCard
                label="Deposits"
                value={stats?.deposits || 0}
                icon={<UsersIcon />}
                color="green"
              />
              <StatCard
                label="Withdrawals"
                value={stats?.withdrawals || 0}
                color="yellow"
              />
              <StatCard
                label="Batches Settled"
                value={stats?.batches || 0}
                icon={<BatchIcon />}
                color="purple"
                href="/explorer/batches"
              />
            </>
          )}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 slide-in-bottom delay-300">
          {/* Recent Batches */}
          <div className="lg:col-span-2 bg-zinc-900/50 backdrop-blur-sm rounded-2xl border border-white/5 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">Recent Batches</h2>
              <Link href="/explorer/batches" className="text-sm text-emerald-400 hover:underline">
                View all
              </Link>
            </div>
            <RecentBatches />
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Network Status */}
            <div className="bg-zinc-900/50 backdrop-blur-sm rounded-2xl border border-white/5 p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Network Status</h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-white/60">L2 Sequencer</span>
                  <ConnectionIndicator status={connectionStatus.sequencer} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-white/60">Prover Network</span>
                  <ConnectionIndicator status={connectionStatus.prover} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-white/60">Solana L1</span>
                  <ConnectionIndicator status={connectionStatus.solana} />
                </div>
              </div>
            </div>

            {/* Latest Batch Info */}
            <div className="bg-zinc-900/50 backdrop-blur-sm rounded-2xl border border-white/5 p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Latest Activity</h2>
              <div className="space-y-3">
                <div>
                  <div className="text-xs text-white/40 uppercase tracking-wider mb-1">Latest Batch</div>
                  {statsLoading ? (
                    <Skeleton className="h-5 w-16" />
                  ) : (
                    <Link href={`/explorer/batches?id=${stats?.latest_batch_id}`} className="text-emerald-400 font-mono text-lg hover:underline">
                      #{stats?.latest_batch_id || 0}
                    </Link>
                  )}
                </div>
                <div>
                  <div className="text-xs text-white/40 uppercase tracking-wider mb-1">Active Accounts</div>
                  {statsLoading ? (
                    <Skeleton className="h-5 w-16" />
                  ) : (
                    <div className="text-white text-lg font-semibold">{stats?.accounts || 0}</div>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-zinc-900/50 backdrop-blur-sm rounded-2xl border border-white/5 p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Explore</h2>
              <div className="space-y-2">
                <Link href="/explorer/transactions" className="flex items-center gap-2 text-white/60 hover:text-white transition-colors py-2">
                  <TransactionIcon />
                  <span>All Transactions</span>
                </Link>
                <Link href="/explorer/batches" className="flex items-center gap-2 text-white/60 hover:text-white transition-colors py-2">
                  <BatchIcon />
                  <span>All Batches</span>
                </Link>
                <Link href="/explorer/accounts" className="flex items-center gap-2 text-white/60 hover:text-white transition-colors py-2">
                  <UsersIcon />
                  <span>All Accounts</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 mt-20">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-8">
          <div className="text-xs text-white/30 text-center uppercase tracking-widest">
            Privacy-focused ZK ROLLUP on Solana
          </div>
        </div>
      </footer>
    </div>
  );
}
