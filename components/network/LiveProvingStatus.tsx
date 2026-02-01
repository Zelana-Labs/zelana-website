/**
 * Live Proving Status Component
 *
 * Shows real-time proving activity from the prover network.
 * Displays active jobs, worker utilization, and recent proof completions.
 */

"use client";

import { useState, useEffect, useMemo } from 'react';
import { useBatches, useProverWorkers, useProverHealth } from '@/hooks/useZelanaData';
import { Skeleton, StatusBadge } from '@/components/explorer/ExplorerUI';

// Icons

function BoltIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  );
}

function CpuIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
    </svg>
  );
}

function CheckCircleIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

// Progress Bar Component

interface ProgressBarProps {
  progress: number; // 0-100
  color?: 'purple' | 'emerald' | 'cyan' | 'yellow';
  animated?: boolean;
}

function ProgressBar({ progress, color = 'purple', animated = true }: ProgressBarProps) {
  const colorClasses = {
    purple: 'bg-purple-500',
    emerald: 'bg-emerald-500',
    cyan: 'bg-cyan-500',
    yellow: 'bg-yellow-500',
  };

  return (
    <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
      <div
        className={`h-full ${colorClasses[color]} transition-all duration-500 ${animated ? 'animate-pulse' : ''}`}
        style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
      />
    </div>
  );
}

// Active Proof Job Card

interface ActiveJobCardProps {
  batchId: number;
  txCount: number;
  startedAt: number;
  workerId?: number;
}

function ActiveJobCard({ batchId, txCount, startedAt, workerId }: ActiveJobCardProps) {
  const [elapsedMs, setElapsedMs] = useState(0);

  // Update elapsed time every second
  useEffect(() => {
    const updateElapsed = () => {
      const now = Date.now();
      const startMs = startedAt > 1e12 ? startedAt : startedAt * 1000;
      setElapsedMs(now - startMs);
    };

    updateElapsed();
    const interval = setInterval(updateElapsed, 1000);
    return () => clearInterval(interval);
  }, [startedAt]);

  // Estimate progress based on elapsed time (rough estimate: 30s avg proving time)
  const estimatedTotalMs = 30000 + (txCount * 3000); // Base + per-tx time
  const progress = Math.min(95, (elapsedMs / estimatedTotalMs) * 100);

  const elapsedSecs = Math.floor(elapsedMs / 1000);
  const elapsedStr = elapsedSecs < 60
    ? `${elapsedSecs}s`
    : `${Math.floor(elapsedSecs / 60)}m ${elapsedSecs % 60}s`;

  return (
    <div className="bg-zinc-800/50 rounded-xl p-4 border border-purple-500/30">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
          <span className="text-sm font-semibold text-white">Batch #{batchId}</span>
        </div>
        <StatusBadge status="proving" size="sm" />
      </div>

      <div className="mb-3">
        <ProgressBar progress={progress} color="purple" animated />
      </div>

      <div className="flex items-center justify-between text-xs text-white/60">
        <div className="flex items-center gap-3">
          {workerId && (
            <span className="flex items-center gap-1">
              <CpuIcon />
              Worker {workerId}
            </span>
          )}
          <span>{txCount} txns</span>
        </div>
        <span className="text-purple-400">{elapsedStr} elapsed</span>
      </div>
    </div>
  );
}

// Worker Activity Ring

interface WorkerActivityRingProps {
  total: number;
  active: number;
  ready: number;
}

function WorkerActivityRing({ total, active, ready }: WorkerActivityRingProps) {
  const radius = 36;
  const stroke = 6;
  const normalizedRadius = radius - stroke / 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  
  const activePercent = total > 0 ? (active / total) * 100 : 0;
  const readyPercent = total > 0 ? (ready / total) * 100 : 0;
  
  const activeStroke = circumference - (activePercent / 100) * circumference;
  const readyStroke = circumference - (readyPercent / 100) * circumference;

  return (
    <div className="relative w-20 h-20">
      <svg width="80" height="80" className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx="40"
          cy="40"
          r={normalizedRadius}
          fill="none"
          stroke="rgba(255,255,255,0.1)"
          strokeWidth={stroke}
        />
        {/* Ready circle */}
        <circle
          cx="40"
          cy="40"
          r={normalizedRadius}
          fill="none"
          stroke="rgba(16, 185, 129, 0.5)"
          strokeWidth={stroke}
          strokeDasharray={circumference}
          strokeDashoffset={readyStroke}
          strokeLinecap="round"
        />
        {/* Active circle (on top) */}
        <circle
          cx="40"
          cy="40"
          r={normalizedRadius}
          fill="none"
          stroke="#a855f7"
          strokeWidth={stroke}
          strokeDasharray={circumference}
          strokeDashoffset={activeStroke}
          strokeLinecap="round"
          className={active > 0 ? 'animate-pulse' : ''}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-lg font-bold text-white">{active}/{total}</span>
        <span className="text-[10px] text-white/40">active</span>
      </div>
    </div>
  );
}

// Main Component

export function LiveProvingStatus() {
  const { data: batches, isLoading: batchesLoading } = useBatches(0, 20);
  const { data: workers, isLoading: workersLoading } = useProverWorkers(2000); // Faster refresh
  const { data: health } = useProverHealth(2000);

  // Find batches currently being proved
  const provingBatches = useMemo(() => {
    if (!batches?.items) return [];
    return batches.items.filter(b => b.status === 'proving');
  }, [batches]);

  // Count recently settled batches (last 5)
  const recentlySettled = useMemo(() => {
    if (!batches?.items) return [];
    return batches.items.filter(b => b.status === 'settled').slice(0, 5);
  }, [batches]);

  // Calculate worker stats
  const workerStats = useMemo(() => {
    if (!workers) return { total: 0, ready: 0, active: 0, totalProofs: 0, avgTime: 0 };
    
    const total = workers.length;
    const ready = workers.filter(w => w.ready).length;
    const active = workers.reduce((sum, w) => sum + w.active_jobs, 0);
    const totalProofs = workers.reduce((sum, w) => sum + w.total_proofs, 0);
    const avgTime = workers.length > 0
      ? workers.reduce((sum, w) => sum + w.avg_proving_time_ms, 0) / workers.length
      : 0;
    
    return { total, ready, active, totalProofs, avgTime };
  }, [workers]);

  const isLoading = batchesLoading || workersLoading;

  if (isLoading) {
    return (
      <div className="bg-zinc-900/50 backdrop-blur-sm rounded-2xl border border-white/5 p-6">
        <Skeleton className="h-6 w-40 mb-4" />
        <div className="space-y-3">
          <Skeleton className="h-24" />
          <Skeleton className="h-16" />
        </div>
      </div>
    );
  }

  const hasActivity = provingBatches.length > 0 || workerStats.active > 0;

  return (
    <div className="bg-zinc-900/50 backdrop-blur-sm rounded-2xl border border-white/5 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <BoltIcon />
          Live Proving
          {hasActivity && (
            <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
          )}
        </h3>
        {health?.mock_prover && (
          <span className="px-2 py-1 text-xs rounded bg-yellow-400/20 text-yellow-400">
            Mock Mode
          </span>
        )}
      </div>

      {/* Worker Activity Overview */}
      <div className="flex items-center gap-6 mb-6">
        <WorkerActivityRing
          total={workerStats.total}
          active={workerStats.active}
          ready={workerStats.ready}
        />
        <div className="flex-1 grid grid-cols-2 gap-4">
          <div>
            <div className="text-2xl font-bold text-emerald-400">{workerStats.totalProofs}</div>
            <div className="text-xs text-white/40">Total Proofs</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-cyan-400">
              {workerStats.avgTime > 0 ? `${(workerStats.avgTime / 1000).toFixed(1)}s` : '-'}
            </div>
            <div className="text-xs text-white/40">Avg Time</div>
          </div>
        </div>
      </div>

      {/* Active Proof Jobs */}
      {provingBatches.length > 0 ? (
        <div className="space-y-3">
          <div className="text-xs text-white/40 uppercase tracking-wider">Active Jobs</div>
          {provingBatches.map((batch) => (
            <ActiveJobCard
              key={batch.batch_id}
              batchId={batch.batch_id}
              txCount={batch.tx_count}
              startedAt={batch.created_at}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-6 bg-white/5 rounded-xl">
          <div className="text-white/40 mb-1">
            {workerStats.ready > 0 ? (
              <>
                <CheckCircleIcon />
                <span className="ml-2">Workers ready</span>
              </>
            ) : (
              'No active proofs'
            )}
          </div>
          <div className="text-xs text-white/30">
            {workerStats.ready > 0
              ? `${workerStats.ready} workers standing by`
              : 'Waiting for proof requests'}
          </div>
        </div>
      )}

      {/* Recent Completions */}
      {recentlySettled.length > 0 && (
        <div className="mt-4 pt-4 border-t border-white/5">
          <div className="text-xs text-white/40 mb-2">Recent Proofs</div>
          <div className="flex gap-2 flex-wrap">
            {recentlySettled.slice(0, 5).map((batch) => (
              <span
                key={batch.batch_id}
                className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-500/10 text-emerald-400 text-xs rounded-md"
              >
                <CheckCircleIcon />
                #{batch.batch_id}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default LiveProvingStatus;
