"use client";

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { isDemoMode } from '@/lib/demo-mode';
import { useAccount } from '@/hooks/useZelanaData';
import { sequencerApi } from '@/lib/sequencer-api';
import { 
  HashDisplay, 
  Skeleton, 
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

// Account Detail View
function AccountDetail({ accountId }: { accountId: string }) {
  const { data: account, isLoading, error } = useAccount(accountId);

  if (isLoading) {
    return (
      <div className="bg-zinc-900/50 backdrop-blur-sm rounded-2xl border border-white/5 p-6">
        <Skeleton className="h-8 w-48 mb-4" />
        <Skeleton className="h-6 w-full mb-2" />
        <Skeleton className="h-6 w-32" />
      </div>
    );
  }

  if (error || !account) {
    return (
      <div className="bg-zinc-900/50 backdrop-blur-sm rounded-2xl border border-white/5 p-6">
        <EmptyState
          title="Account not found"
          description={`No account found with ID: ${accountId}`}
        />
      </div>
    );
  }

  return (
    <div className="bg-zinc-900/50 backdrop-blur-sm rounded-2xl border border-white/5 p-6">
      <h2 className="text-xl font-semibold text-white mb-6">Account Details</h2>
      
      <div className="space-y-4">
        <div>
          <div className="text-xs text-white/40 uppercase tracking-wider mb-1">Account ID</div>
          <HashDisplay hash={account.id} truncate={false} copyable={true} />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-zinc-800/50 rounded-xl p-4">
            <div className="text-xs text-white/40 uppercase tracking-wider mb-1">Balance</div>
            <div className="text-2xl font-semibold text-emerald-400">
              <AmountDisplay amount={account.balance} />
            </div>
          </div>
          
          <div className="bg-zinc-800/50 rounded-xl p-4">
            <div className="text-xs text-white/40 uppercase tracking-wider mb-1">Nonce</div>
            <div className="text-2xl font-semibold text-white">
              {account.nonce}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Account Search
function AccountSearch({ onSearch }: { onSearch: (id: string) => void }) {
  const [searchId, setSearchId] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchId.length === 64) {
      onSearch(searchId);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 mb-6">
      <input
        type="text"
        value={searchId}
        onChange={(e) => setSearchId(e.target.value)}
        placeholder="Enter account ID (64 hex characters)..."
        className="flex-1 bg-zinc-900/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/40 focus:outline-none focus:border-white/20 transition-colors font-mono"
      />
      <button
        type="submit"
        disabled={searchId.length !== 64}
        className="px-6 py-3 bg-emerald-500/20 border border-emerald-500/30 rounded-xl text-sm font-medium text-emerald-400 hover:bg-emerald-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        Search
      </button>
    </form>
  );
}

// Recent Accounts List (placeholder - would need pagination API)
function AccountsList() {
  const [accounts, setAccounts] = useState<Array<{ id: string; balance: number; nonce: number }>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchedId, setSearchedId] = useState<string | null>(null);

  const handleSearch = async (id: string) => {
    setIsLoading(true);
    setSearchedId(id);
    try {
      const account = await sequencerApi.getAccount(id);
      if (account) {
        setAccounts([account]);
      } else {
        setAccounts([]);
      }
    } catch {
      setAccounts([]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <AccountSearch onSearch={handleSearch} />
      
      {isLoading ? (
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : accounts.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-xs text-white/40 uppercase tracking-wider border-b border-white/5">
                <th className="pb-3 font-medium">Account ID</th>
                <th className="pb-3 font-medium">Balance</th>
                <th className="pb-3 font-medium">Nonce</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {accounts.map((account) => (
                <tr key={account.id} className="hover:bg-white/5 transition-colors">
                  <td className="py-4">
                    <HashDisplay hash={account.id} />
                  </td>
                  <td className="py-4">
                    <AmountDisplay amount={account.balance} />
                  </td>
                  <td className="py-4 text-white/80">
                    {account.nonce}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : searchedId ? (
        <EmptyState
          title="No account found"
          description="Try searching for a different account ID"
        />
      ) : (
        <div className="text-center py-12">
          <div className="text-white/40 mb-2">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <p className="text-white/60">Enter an account ID to search</p>
          <p className="text-sm text-white/40 mt-1">Account IDs are 64 character hex strings (32 bytes)</p>
        </div>
      )}
    </div>
  );
}

function AccountsPageContent() {
  const searchParams = useSearchParams();
  const accountId = searchParams.get('id');

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <BackButton />
        
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-white mb-2">Accounts</h1>
          <p className="text-white/60">Search and view L2 account balances and nonces</p>
        </div>

        {accountId ? (
          <AccountDetail accountId={accountId} />
        ) : (
          <div className="bg-zinc-900/50 backdrop-blur-sm rounded-2xl border border-white/5 p-6">
            <AccountsList />
          </div>
        )}
      </main>
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
      <div className="text-white/40">Loading...</div>
    </div>
  );
}

export default function AccountsPage() {
  const router = useRouter();
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    if (isDemoMode()) {
      setIsRedirecting(true);
      router.push('/demo');
    }
  }, [router]);

  if (isRedirecting) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-white/60 text-sm">Redirecting...</div>
      </div>
    );
  }

  return (
    <Suspense fallback={<LoadingFallback />}>
      <AccountsPageContent />
    </Suspense>
  );
}
