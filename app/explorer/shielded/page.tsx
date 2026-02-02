"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { isDemoMode } from '@/lib/demo-mode';
import { useSequencerStats } from '@/hooks/useZelanaData';
import { 
  Skeleton, 
  StatCard,
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

// Tab type for the shielded explorer
type ShieldedTab = 'overview' | 'nullifiers' | 'commitments' | 'notes';

// Tab Button Component
function TabButton({ 
  active, 
  onClick, 
  children 
}: { 
  active: boolean; 
  onClick: () => void; 
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
        active 
          ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' 
          : 'text-white/60 hover:text-white hover:bg-white/5'
      }`}
    >
      {children}
    </button>
  );
}

// Overview Tab
function OverviewTab() {
  const { data: stats, isLoading } = useSequencerStats();

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="Nullifiers"
          value={stats?.nullifiers || 0}
          color="purple"
        />
        <StatCard
          label="Commitments"
          value={stats?.commitments || 0}
          color="purple"
        />
        <StatCard
          label="Encrypted Notes"
          value={stats?.encrypted_notes || 0}
          color="cyan"
        />
        <StatCard
          label="Shielded Txs"
          value={0}
          color="blue"
        />
      </div>

      <div className="bg-zinc-800/50 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">About Shielded Transactions</h3>
        <div className="space-y-4 text-white/60 text-sm">
          <p>
            Shielded transactions on Zelana provide privacy through zero-knowledge proofs. 
            They use a UTXO-based model similar to Zcash&apos;s Sapling protocol.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <div className="bg-zinc-900/50 rounded-lg p-4">
              <div className="text-purple-400 font-medium mb-2">Nullifiers</div>
              <p className="text-xs">
                Unique identifiers that mark a note as spent, preventing double-spending 
                while maintaining privacy.
              </p>
            </div>
            <div className="bg-zinc-900/50 rounded-lg p-4">
              <div className="text-purple-400 font-medium mb-2">Commitments</div>
              <p className="text-xs">
                Cryptographic commitments to note values stored in the Merkle tree. 
                They hide the actual amounts.
              </p>
            </div>
            <div className="bg-zinc-900/50 rounded-lg p-4">
              <div className="text-cyan-400 font-medium mb-2">Encrypted Notes</div>
              <p className="text-xs">
                Encrypted transaction data that only the recipient can decrypt 
                using their viewing key.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Nullifiers Tab (placeholder - would need API)
function NullifiersTab() {
  return (
    <div className="bg-zinc-800/50 rounded-xl p-6">
      <EmptyState
        title="Nullifier Browser"
        description="Browse spent note nullifiers. This feature requires the debug API."
        icon={
          <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        }
      />
      <div className="mt-4 text-center">
        <p className="text-sm text-white/40">
          Nullifiers are hashes that prevent double-spending of shielded notes.
          <br />
          When a note is spent, its nullifier is published to the chain.
        </p>
      </div>
    </div>
  );
}

// Commitments Tab (placeholder - would need API)
function CommitmentsTab() {
  return (
    <div className="bg-zinc-800/50 rounded-xl p-6">
      <EmptyState
        title="Commitment Browser"
        description="Browse note commitments in the Merkle tree. This feature requires the debug API."
        icon={
          <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
        }
      />
      <div className="mt-4 text-center">
        <p className="text-sm text-white/40">
          Commitments are leaves in the Merkle tree that represent shielded notes.
          <br />
          They hide the note value and owner while proving existence.
        </p>
      </div>
    </div>
  );
}

// Encrypted Notes Tab (placeholder - would need API)
function EncryptedNotesTab() {
  return (
    <div className="bg-zinc-800/50 rounded-xl p-6">
      <EmptyState
        title="Encrypted Notes Browser"
        description="Browse encrypted note ciphertexts. This feature requires the debug API."
        icon={
          <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
          </svg>
        }
      />
      <div className="mt-4 text-center">
        <p className="text-sm text-white/40">
          Encrypted notes contain the transaction details encrypted for the recipient.
          <br />
          Only the recipient can decrypt and spend the note using their private key.
        </p>
      </div>
    </div>
  );
}

export default function ShieldedPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<ShieldedTab>('overview');
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
    <div className="min-h-screen bg-[#0a0a0a]">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <BackButton />
        
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-white mb-2">Shielded Explorer</h1>
          <p className="text-white/60">Explore the privacy layer: nullifiers, commitments, and encrypted notes</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          <TabButton active={activeTab === 'overview'} onClick={() => setActiveTab('overview')}>
            Overview
          </TabButton>
          <TabButton active={activeTab === 'nullifiers'} onClick={() => setActiveTab('nullifiers')}>
            Nullifiers
          </TabButton>
          <TabButton active={activeTab === 'commitments'} onClick={() => setActiveTab('commitments')}>
            Commitments
          </TabButton>
          <TabButton active={activeTab === 'notes'} onClick={() => setActiveTab('notes')}>
            Encrypted Notes
          </TabButton>
        </div>

        {/* Tab Content */}
        <div className="bg-zinc-900/50 backdrop-blur-sm rounded-2xl border border-white/5 p-6">
          {activeTab === 'overview' && <OverviewTab />}
          {activeTab === 'nullifiers' && <NullifiersTab />}
          {activeTab === 'commitments' && <CommitmentsTab />}
          {activeTab === 'notes' && <EncryptedNotesTab />}
        </div>
      </main>
    </div>
  );
}
