/**
 * Batch Pipeline Components
 * 
 * Components for displaying the batch proving and settlement pipeline.
 */

"use client";

import { useBatchStatus, useBatches, useSequencerStats } from '@/hooks/useZelanaData';
import { StatusBadge, Skeleton, HashDisplay, TimeDisplay } from '@/components/explorer/ExplorerUI';
import { getExplorerUrl } from '@/lib/config';
import { Batch } from '@/lib/sequencer-api';

// =============================================================================
// Icons
// =============================================================================

function CubeIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
    </svg>
  );
}

function ArrowRightIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function LinkExternalIcon() {
  return (
    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
    </svg>
  );
}

// =============================================================================
// Current Batch Status
// =============================================================================

export function CurrentBatchStatus() {
  const { data: batchStatus, isLoading } = useBatchStatus();

  if (isLoading) {
    return (
      <div className="bg-zinc-900/50 backdrop-blur-sm rounded-2xl border border-white/5 p-6">
        <Skeleton className="h-6 w-32 mb-4" />
        <Skeleton className="h-20" />
      </div>
    );
  }

  if (!batchStatus) {
    return (
      <div className="bg-zinc-900/50 backdrop-blur-sm rounded-2xl border border-white/5 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Current Batch</h3>
        <div className="text-center py-4 text-white/40">
          Sequencer not connected
        </div>
      </div>
    );
  }

  // Calculate time since batch started (handle missing/invalid values)
  let elapsedStr = '-';
  if (batchStatus.started_at && batchStatus.started_at > 0) {
    const now = Date.now();
    const startedAt = batchStatus.started_at > 1e12 ? batchStatus.started_at : batchStatus.started_at * 1000;
    const elapsedSecs = Math.floor((now - startedAt) / 1000);
    if (elapsedSecs >= 0 && isFinite(elapsedSecs)) {
      elapsedStr = elapsedSecs < 60 
        ? `${elapsedSecs}s` 
        : `${Math.floor(elapsedSecs / 60)}m ${elapsedSecs % 60}s`;
    }
  }

  return (
    <div className="bg-zinc-900/50 backdrop-blur-sm rounded-2xl border border-emerald-500/20 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          Current Batch
        </h3>
        <StatusBadge status={batchStatus.state} size="md" />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-white">#{batchStatus.current_batch_id ?? '-'}</div>
          <div className="text-xs text-white/40 mt-1">Batch ID</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-emerald-400">{batchStatus.tx_count ?? 0}</div>
          <div className="text-xs text-white/40 mt-1">Transactions</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-cyan-400">{elapsedStr}</div>
          <div className="text-xs text-white/40 mt-1">Elapsed</div>
        </div>
      </div>

      {batchStatus.state === 'building' && (
        <div className="mt-4 pt-4 border-t border-white/5">
          <div className="flex items-center gap-2 text-sm text-white/60">
            <ClockIcon />
            <span>Accumulating transactions...</span>
          </div>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// Batch Pipeline Visualization
// =============================================================================

interface PipelineStageProps {
  label: string;
  count: number;
  color: 'yellow' | 'purple' | 'blue' | 'green';
  active?: boolean;
}

function PipelineStage({ label, count, color, active = false }: PipelineStageProps) {
  const colorClasses = {
    yellow: 'bg-yellow-400/20 text-yellow-400 border-yellow-400/30',
    purple: 'bg-purple-400/20 text-purple-400 border-purple-400/30',
    blue: 'bg-blue-400/20 text-blue-400 border-blue-400/30',
    green: 'bg-emerald-400/20 text-emerald-400 border-emerald-400/30',
  };

  return (
    <div className={`flex-1 rounded-xl border p-4 ${colorClasses[color]} ${active ? 'ring-2 ring-offset-2 ring-offset-zinc-900' : ''}`}>
      <div className="text-center">
        <div className="text-3xl font-bold">{count}</div>
        <div className="text-xs mt-1 opacity-80">{label}</div>
      </div>
    </div>
  );
}

export function BatchPipeline() {
  const { data: batches, isLoading } = useBatches(0, 50);

  if (isLoading) {
    return (
      <div className="bg-zinc-900/50 backdrop-blur-sm rounded-2xl border border-white/5 p-6">
        <Skeleton className="h-6 w-40 mb-4" />
        <div className="flex gap-4">
          <Skeleton className="flex-1 h-24" />
          <Skeleton className="flex-1 h-24" />
          <Skeleton className="flex-1 h-24" />
          <Skeleton className="flex-1 h-24" />
        </div>
      </div>
    );
  }

  // Count batches by status
  const counts = {
    building: 0,
    proving: 0,
    pending_settlement: 0,
    settled: 0,
  };

  if (batches?.items) {
    for (const batch of batches.items) {
      if (batch.status in counts) {
        counts[batch.status as keyof typeof counts]++;
      }
    }
  }

  return (
    <div className="bg-zinc-900/50 backdrop-blur-sm rounded-2xl border border-white/5 p-6">
      <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
        <CubeIcon />
        Batch Pipeline
      </h3>

      <div className="flex items-center gap-2">
        <PipelineStage 
          label="Building" 
          count={counts.building} 
          color="yellow" 
          active={counts.building > 0}
        />
        <ArrowRightIcon />
        <PipelineStage 
          label="Proving" 
          count={counts.proving} 
          color="purple"
          active={counts.proving > 0}
        />
        <ArrowRightIcon />
        <PipelineStage 
          label="Settling" 
          count={counts.pending_settlement} 
          color="blue"
          active={counts.pending_settlement > 0}
        />
        <ArrowRightIcon />
        <PipelineStage 
          label="Finalized" 
          count={counts.settled} 
          color="green"
        />
      </div>

      <div className="mt-4 pt-4 border-t border-white/5 text-xs text-white/40">
        Showing counts from last {batches?.items?.length || 0} batches
      </div>
    </div>
  );
}

// =============================================================================
// Recent Batches Table
// =============================================================================

interface BatchRowProps {
  batch: Batch;
}

function BatchRow({ batch }: BatchRowProps) {
  return (
    <tr className="border-b border-white/5 hover:bg-white/5 transition-colors">
      <td className="py-3 px-4">
        <span className="font-mono text-white">#{batch.batch_id}</span>
      </td>
      <td className="py-3 px-4">
        <StatusBadge status={batch.status} />
      </td>
      <td className="py-3 px-4">
        <span className="text-white/80">{batch.tx_count}</span>
      </td>
      <td className="py-3 px-4">
        <HashDisplay hash={batch.state_root} truncate copyable={false} />
      </td>
      <td className="py-3 px-4">
        {batch.l1_tx_sig ? (
          <a
            href={getExplorerUrl('tx', batch.l1_tx_sig)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-emerald-400 hover:text-emerald-300 transition-colors"
          >
            <HashDisplay hash={batch.l1_tx_sig} truncate copyable={false} />
            <LinkExternalIcon />
          </a>
        ) : (
          <span className="text-white/30">-</span>
        )}
      </td>
      <td className="py-3 px-4">
        <TimeDisplay timestamp={batch.created_at} />
      </td>
    </tr>
  );
}

export function RecentBatches() {
  const { data: batches, isLoading } = useBatches(0, 10);

  if (isLoading) {
    return (
      <div className="bg-zinc-900/50 backdrop-blur-sm rounded-2xl border border-white/5 p-6">
        <Skeleton className="h-6 w-32 mb-4" />
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-12" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-zinc-900/50 backdrop-blur-sm rounded-2xl border border-white/5 overflow-hidden">
      <div className="p-6 border-b border-white/5">
        <h3 className="text-lg font-semibold text-white">Recent Batches</h3>
      </div>

      {batches?.items && batches.items.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-white/5 text-xs text-white/40 uppercase tracking-wider">
                <th className="py-3 px-4 text-left font-medium">Batch</th>
                <th className="py-3 px-4 text-left font-medium">Status</th>
                <th className="py-3 px-4 text-left font-medium">Txns</th>
                <th className="py-3 px-4 text-left font-medium">State Root</th>
                <th className="py-3 px-4 text-left font-medium">L1 Transaction</th>
                <th className="py-3 px-4 text-left font-medium">Created</th>
              </tr>
            </thead>
            <tbody>
              {batches.items.map((batch) => (
                <BatchRow key={batch.batch_id} batch={batch} />
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="p-6 text-center text-white/40">
          No batches yet
        </div>
      )}
    </div>
  );
}

// =============================================================================
// Settlement Stats
// =============================================================================

export function SettlementStats() {
  const { data: stats, isLoading } = useSequencerStats();
  const { data: batches } = useBatches(0, 100);

  if (isLoading) {
    return (
      <div className="bg-zinc-900/50 backdrop-blur-sm rounded-2xl border border-white/5 p-6">
        <Skeleton className="h-6 w-36 mb-4" />
        <div className="grid grid-cols-2 gap-4">
          <Skeleton className="h-16" />
          <Skeleton className="h-16" />
        </div>
      </div>
    );
  }

  // Count settled batches and find last settled
  let settledCount = 0;
  let lastSettled: Batch | null = null;

  if (batches?.items) {
    for (const batch of batches.items) {
      if (batch.status === 'settled') {
        settledCount++;
        if (!lastSettled || batch.batch_id > lastSettled.batch_id) {
          lastSettled = batch;
        }
      }
    }
  }

  return (
    <div className="bg-zinc-900/50 backdrop-blur-sm rounded-2xl border border-white/5 p-6">
      <h3 className="text-lg font-semibold text-white mb-4">Settlement Stats</h3>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-white/60">Total Batches</span>
          <span className="text-xl font-semibold text-white">{stats?.batches || 0}</span>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-white/60">Settled (Recent)</span>
          <span className="text-xl font-semibold text-emerald-400">{settledCount}</span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-white/60">Total Transactions</span>
          <span className="text-xl font-semibold text-cyan-400">{stats?.transactions || 0}</span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-white/60">Total Withdrawals</span>
          <span className="text-xl font-semibold text-yellow-400">{stats?.withdrawals || 0}</span>
        </div>

        {lastSettled?.l1_tx_sig && (
          <div className="pt-4 border-t border-white/5">
            <div className="text-xs text-white/40 mb-2">Last L1 Settlement</div>
            <a
              href={getExplorerUrl('tx', lastSettled.l1_tx_sig)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm text-emerald-400 hover:text-emerald-300 transition-colors"
            >
              <CheckIcon />
              <span>Batch #{lastSettled.batch_id}</span>
              <LinkExternalIcon />
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

// =============================================================================
// Network Overview (combines everything)
// =============================================================================

export function NetworkOverview() {
  return (
    <div className="space-y-6">
      {/* Current Batch + Pipeline */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CurrentBatchStatus />
        <SettlementStats />
      </div>

      {/* Pipeline Visualization */}
      <BatchPipeline />

      {/* Recent Batches Table */}
      <RecentBatches />
    </div>
  );
}
