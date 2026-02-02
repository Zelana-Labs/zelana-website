"use client";

import { useState } from 'react';
import DarkNavbar from '@/components/ui/DarkNavbar';
import { useProverHealth, useProverWorkers, useSequencerHealth } from '@/hooks/useZelanaData';
import { 
  StatCard, 
  StatusBadge, 
  Skeleton, 
  ConnectionIndicator,
} from '@/components/explorer/ExplorerUI';
import {
  CurrentBatchStatus,
  BatchPipeline,
  RecentBatches,
  SettlementStats,
} from '@/components/network/BatchPipeline';
import { LiveProvingStatus } from '@/components/network/LiveProvingStatus';

// Icons
function CpuIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
    </svg>
  );
}

function CheckCircleIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function QueueIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
    </svg>
  );
}

function CubeIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
    </svg>
  );
}

function ServerIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
    </svg>
  );
}

// Worker Card Component
function WorkerCard({ worker }: { worker: { 
  url: string; 
  worker_id: number; 
  ready: boolean; 
  active_jobs: number; 
  total_proofs: number; 
  avg_proving_time_ms: number;
}}) {
  return (
    <div className={`bg-zinc-800/50 rounded-xl p-4 border ${worker.ready ? 'border-emerald-500/20' : 'border-white/5'}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${worker.ready ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`} />
          <span className="text-sm font-medium text-white">Worker {worker.worker_id}</span>
        </div>
        <StatusBadge status={worker.ready ? 'healthy' : 'unhealthy'} size="sm" />
      </div>
      
      <div className="grid grid-cols-3 gap-2 text-center">
        <div>
          <div className="text-lg font-semibold text-white">{worker.active_jobs}</div>
          <div className="text-xs text-white/40">Active</div>
        </div>
        <div>
          <div className="text-lg font-semibold text-emerald-400">{worker.total_proofs}</div>
          <div className="text-xs text-white/40">Proofs</div>
        </div>
        <div>
          <div className="text-lg font-semibold text-cyan-400">{(worker.avg_proving_time_ms / 1000).toFixed(1)}s</div>
          <div className="text-xs text-white/40">Avg Time</div>
        </div>
      </div>
    </div>
  );
}

// Architecture Diagram
function ArchitectureDiagram() {
  return (
    <div className="bg-zinc-800/50 rounded-xl p-6 font-mono text-xs">
      <pre className="text-white/60 overflow-x-auto">
{`
┌─────────────────────────────────────────────────────────────────────────────┐
│                        ZELANA PROVER NETWORK (Forge)                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│    ┌─────────────────┐                                                      │
│    │  CORE SEQUENCER │                                                      │
│    │  (Batch Ready)  │                                                      │
│    └────────┬────────┘                                                      │
│             │ POST /v2/batch/prove                                          │
│             ▼                                                               │
│    ┌─────────────────┐                                                      │
│    │   COORDINATOR   │ ─────────────────────────────────────────────────    │
│    │                 │           Parallel Distribution                      │
│    └────────┬────────┘                                                      │
│             │                                                               │
│    ┌────────┴────────┬──────────────┬──────────────┬──────────────┐        │
│    ▼                 ▼              ▼              ▼              ▼        │
│ ┌──────┐         ┌──────┐      ┌──────┐      ┌──────┐      ┌──────┐       │
│ │  W1  │         │  W2  │      │  W3  │      │  W4  │      │  W5  │       │
│ │ Noir │         │ Noir │      │ Noir │      │ Noir │      │ Noir │       │
│ └──┬───┘         └──┬───┘      └──┬───┘      └──┬───┘      └──┬───┘       │
│    │                │             │             │             │            │
│    └────────────────┴─────────────┴─────────────┴─────────────┘            │
│                              │                                              │
│                              ▼                                              │
│                   ┌─────────────────┐                                       │
│                   │  PROOF RESULT   │                                       │
│                   │  388b + 236b pw │                                       │
│                   └────────┬────────┘                                       │
│                            │                                                │
│                            ▼                                                │
│                   ┌─────────────────┐                                       │
│                   │ SUNSPOT VERIFIER│                                       │
│                   │   (On-Chain)    │                                       │
│                   └─────────────────┘                                       │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
`}
      </pre>
    </div>
  );
}

// Tab types
type Tab = 'batches' | 'prover';

// Main Network Page
export default function NetworkPage() {
  const [activeTab, setActiveTab] = useState<Tab>('batches');
  const { data: health, isLoading: healthLoading } = useProverHealth();
  const { data: workers, isLoading: workersLoading } = useProverWorkers();
  const { data: sequencerHealth } = useSequencerHealth();

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <DarkNavbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8 slide-in-top">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-semibold text-white">Network Status</h1>
            {sequencerHealth && (
              <StatusBadge status={sequencerHealth.status} size="md" />
            )}
          </div>
          <p className="text-white/60">
            Monitor the Zelana L2 batch pipeline and prover network
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-6 slide-in-top delay-100">
          <button
            onClick={() => setActiveTab('batches')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'batches'
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'bg-white/5 text-white/60 border border-white/10 hover:bg-white/10'
            }`}
          >
            <CubeIcon />
            Batch Pipeline
          </button>
          <button
            onClick={() => setActiveTab('prover')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'prover'
                ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                : 'bg-white/5 text-white/60 border border-white/10 hover:bg-white/10'
            }`}
          >
            <ServerIcon />
            Prover Network
            {health?.mock_prover && (
              <span className="px-1.5 py-0.5 text-xs rounded bg-yellow-400/20 text-yellow-400">
                Mock
              </span>
            )}
          </button>
        </div>

        {/* Batch Pipeline Tab */}
        {activeTab === 'batches' && (
          <div className="space-y-6 slide-in-bottom delay-200">
            {/* Current Batch + Stats */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <CurrentBatchStatus />
              <SettlementStats />
            </div>

            {/* Pipeline Visualization */}
            <BatchPipeline />

            {/* Recent Batches Table */}
            <RecentBatches />
          </div>
        )}

        {/* Prover Network Tab */}
        {activeTab === 'prover' && (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {healthLoading ? (
                <>
                  <Skeleton className="h-24" />
                  <Skeleton className="h-24" />
                  <Skeleton className="h-24" />
                  <Skeleton className="h-24" />
                </>
              ) : (
                <>
                  <StatCard
                    label="Workers"
                    value={`${health?.workers_ready || 0}/${health?.worker_count || 0}`}
                    icon={<CpuIcon />}
                    color="green"
                  />
                  <StatCard
                    label="Total Proofs"
                    value={health?.total_proofs || 0}
                    icon={<CheckCircleIcon />}
                    color="purple"
                  />
                  <StatCard
                    label="Pending Jobs"
                    value={health?.pending_jobs || 0}
                    icon={<QueueIcon />}
                    color="yellow"
                  />
                  <StatCard
                    label="Avg Time"
                    value={workers && workers.length > 0 
                      ? `${(workers.reduce((acc, w) => acc + w.avg_proving_time_ms, 0) / workers.length / 1000).toFixed(1)}s`
                      : '-'
                    }
                    icon={<ClockIcon />}
                    color="cyan"
                  />
                </>
              )}
            </div>

            {/* Live Proving Status */}
            <div className="mb-6">
              <LiveProvingStatus />
            </div>

            {/* Main Content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Workers Grid */}
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-zinc-900/50 backdrop-blur-sm rounded-2xl border border-white/5 p-6">
                  <h2 className="text-lg font-semibold text-white mb-4">Worker Status</h2>
                  
                  {workersLoading ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {[...Array(5)].map((_, i) => (
                        <Skeleton key={i} className="h-32" />
                      ))}
                    </div>
                  ) : workers && workers.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {workers.map((worker) => (
                        <WorkerCard key={worker.worker_id} worker={worker} />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <div className="text-white/40 mb-2">
                        <CpuIcon />
                      </div>
                      <p className="text-white/60">No workers connected</p>
                      <p className="text-sm text-white/40 mt-1">
                        Workers will appear here once the prover coordinator is running
                      </p>
                    </div>
                  )}
                </div>

                {/* Architecture Diagram */}
                <div className="bg-zinc-900/50 backdrop-blur-sm rounded-2xl border border-white/5 p-6">
                  <h2 className="text-lg font-semibold text-white mb-4">Architecture</h2>
                  <ArchitectureDiagram />
                </div>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Connection Status */}
                <div className="bg-zinc-900/50 backdrop-blur-sm rounded-2xl border border-white/5 p-6">
                  <h2 className="text-lg font-semibold text-white mb-4">Connection</h2>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-white/60">Sequencer</span>
                      <ConnectionIndicator status={sequencerHealth?.status === 'healthy' ? 'connected' : 'disconnected'} />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-white/60">Coordinator</span>
                      <ConnectionIndicator status={health?.status === 'healthy' ? 'connected' : 'disconnected'} />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-white/60">Workers Ready</span>
                      <span className="text-sm text-white/80">{health?.workers_ready || 0} / {health?.worker_count || 0}</span>
                    </div>
                  </div>
                </div>

                {/* Proof Info */}
                <div className="bg-zinc-900/50 backdrop-blur-sm rounded-2xl border border-white/5 p-6">
                  <h2 className="text-lg font-semibold text-white mb-4">Proof Format</h2>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-white/60">Circuit</span>
                      <span className="text-purple-400">zelana_batch</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-white/60">Backend</span>
                      <span className="text-cyan-400">Noir + Sunspot</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-white/60">Proof Size</span>
                      <span className="text-white/80">388 bytes</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-white/60">Public Witness</span>
                      <span className="text-white/80">236 bytes</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-white/60">Verification</span>
                      <span className="text-emerald-400">On-chain</span>
                    </div>
                  </div>
                </div>

                {/* How it Works */}
                <div className="bg-zinc-900/50 backdrop-blur-sm rounded-2xl border border-white/5 p-6">
                  <h2 className="text-lg font-semibold text-white mb-4">How It Works</h2>
                  <div className="space-y-4 text-sm text-white/60">
                    <div className="flex gap-3">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs">1</span>
                      <p>Sequencer batches transactions and sends to coordinator</p>
                    </div>
                    <div className="flex gap-3">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-xs">2</span>
                      <p>Coordinator distributes work to available workers</p>
                    </div>
                    <div className="flex gap-3">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center text-xs">3</span>
                      <p>Workers generate ZK proofs using Noir circuits</p>
                    </div>
                    <div className="flex gap-3">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-xs">4</span>
                      <p>Proofs verified on Solana via Sunspot verifier</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
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
