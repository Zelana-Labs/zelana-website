"use client";

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { isDemoMode } from '@/lib/demo-mode';
import { useBatches, useBatch } from '@/hooks/useZelanaData';
import { getExplorerUrl } from '@/lib/config';
import { 
  HashDisplay, 
  Skeleton, 
  StatusBadge,
  TimeDisplay,
  Pagination,
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

// Batch Detail View
function BatchDetail({ batchId }: { batchId: number }) {
  const { data: batch, isLoading, error } = useBatch(batchId);

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

  if (error || !batch) {
    return (
      <div className="bg-zinc-900/50 backdrop-blur-sm rounded-2xl border border-white/5 p-6">
        <EmptyState
          title="Batch not found"
          description={`No batch found with ID: ${batchId}`}
        />
      </div>
    );
  }

  return (
    <div className="bg-zinc-900/50 backdrop-blur-sm rounded-2xl border border-white/5 p-6">
      <div className="flex items-center gap-3 mb-6">
        <h2 className="text-xl font-semibold text-white">Batch #{batch.batch_id}</h2>
        <StatusBadge status={batch.status} size="md" />
      </div>
      
      <div className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-zinc-800/50 rounded-xl p-4">
            <div className="text-xs text-white/40 uppercase tracking-wider mb-1">Transactions</div>
            <div className="text-2xl font-semibold text-white">{batch.tx_count}</div>
          </div>
          
          <div className="bg-zinc-800/50 rounded-xl p-4">
            <div className="text-xs text-white/40 uppercase tracking-wider mb-1">Created</div>
            <TimeDisplay timestamp={batch.created_at} relative={false} />
          </div>
          
          {batch.settled_at && (
            <div className="bg-zinc-800/50 rounded-xl p-4">
              <div className="text-xs text-white/40 uppercase tracking-wider mb-1">Settled</div>
              <TimeDisplay timestamp={batch.settled_at} relative={false} />
            </div>
          )}
          
          {batch.l1_tx_sig && (
            <div className="bg-zinc-800/50 rounded-xl p-4">
              <div className="text-xs text-white/40 uppercase tracking-wider mb-1">L1 Transaction</div>
              <a 
                href={getExplorerUrl('tx', batch.l1_tx_sig)} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-emerald-400 hover:underline text-sm"
              >
                View on Solana
              </a>
            </div>
          )}
        </div>

        <div>
          <div className="text-xs text-white/40 uppercase tracking-wider mb-2">State Root</div>
          <div className="bg-zinc-800/50 rounded-xl p-4">
            <HashDisplay hash={batch.state_root} truncate={false} copyable={true} />
          </div>
        </div>

        <div>
          <div className="text-xs text-white/40 uppercase tracking-wider mb-2">Shielded Root</div>
          <div className="bg-zinc-800/50 rounded-xl p-4">
            <HashDisplay hash={batch.shielded_root} truncate={false} copyable={true} />
          </div>
        </div>

        {batch.l1_tx_sig && (
          <div>
            <div className="text-xs text-white/40 uppercase tracking-wider mb-2">L1 Transaction Signature</div>
            <div className="bg-zinc-800/50 rounded-xl p-4">
              <a 
                href={getExplorerUrl('tx', batch.l1_tx_sig)} 
                target="_blank" 
                rel="noopener noreferrer"
                className="font-mono text-sm text-emerald-400 hover:underline break-all"
              >
                {batch.l1_tx_sig}
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Batches List
function BatchesList() {
  const [page, setPage] = useState(1);
  const limit = 25;
  const offset = (page - 1) * limit;
  
  const { data, isLoading } = useBatches(offset, limit);
  
  const batches = data?.items || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / limit);

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[...Array(10)].map((_, i) => (
          <Skeleton key={i} className="h-14 w-full" />
        ))}
      </div>
    );
  }

  if (batches.length === 0) {
    return (
      <EmptyState
        title="No batches yet"
        description="Batches will appear here once transactions are processed"
      />
    );
  }

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="text-left text-xs text-white/40 uppercase tracking-wider border-b border-white/5">
              <th className="pb-3 font-medium">Batch</th>
              <th className="pb-3 font-medium">Status</th>
              <th className="pb-3 font-medium">Txs</th>
              <th className="pb-3 font-medium">State Root</th>
              <th className="pb-3 font-medium">L1 Tx</th>
              <th className="pb-3 font-medium">Created</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {batches.map((batch) => (
              <tr key={batch.batch_id} className="hover:bg-white/5 transition-colors">
                <td className="py-4">
                  <Link href={`/explorer/batches?id=${batch.batch_id}`} className="text-emerald-400 font-mono hover:underline">
                    #{batch.batch_id}
                  </Link>
                </td>
                <td className="py-4">
                  <StatusBadge status={batch.status} />
                </td>
                <td className="py-4 text-white/80">{batch.tx_count}</td>
                <td className="py-4">
                  <HashDisplay hash={batch.state_root} />
                </td>
                <td className="py-4">
                  {batch.l1_tx_sig ? (
                    <a 
                      href={getExplorerUrl('tx', batch.l1_tx_sig)} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-emerald-400 hover:underline text-sm"
                    >
                      View
                    </a>
                  ) : (
                    <span className="text-white/40">-</span>
                  )}
                </td>
                <td className="py-4">
                  <TimeDisplay timestamp={batch.created_at} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          onPageChange={setPage}
        />
      )}
    </div>
  );
}

function BatchesPageContent() {
  const searchParams = useSearchParams();
  const batchIdParam = searchParams.get('id');
  const batchId = batchIdParam ? parseInt(batchIdParam) : null;

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <BackButton />
        
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-white mb-2">Batches</h1>
          <p className="text-white/60">View batch details and settlement status</p>
        </div>

        {batchId !== null ? (
          <BatchDetail batchId={batchId} />
        ) : (
          <div className="bg-zinc-900/50 backdrop-blur-sm rounded-2xl border border-white/5 p-6">
            <BatchesList />
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

export default function BatchesPage() {
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
      <BatchesPageContent />
    </Suspense>
  );
}
