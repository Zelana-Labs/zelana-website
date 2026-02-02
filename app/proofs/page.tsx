"use client";

import { useState, useEffect, useMemo } from "react";
import { Connection, PublicKey } from "@solana/web3.js";
import BN from "bn.js";
import DarkNavbar from "@/components/ui/DarkNavbar";
import { useProverHealth, useBatches } from "@/hooks/useZelanaData";
import { config, getExplorerUrl } from "@/lib/config";
import {
  StatCard,
  StatusBadge,
  Skeleton,
  HashDisplay,
  TimeDisplay,
} from "@/components/explorer/ExplorerUI";

// =============================================================================
// Types
// =============================================================================

type Groth16Proof = { pi_a: string; pi_b: string; pi_c: string };
type PublicInputs = { inputs: string[] };

type VerifiedGroth16Proof = {
  pubkey: string;
  lamports: number;
  authority: string;
  verifying_key_hash: string;
  verified_at: number;
  bump: number;
  proof: Groth16Proof;
  public_inputs: PublicInputs;
};

// =============================================================================
// Icons
// =============================================================================

function ShieldCheckIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  );
}

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

function LinkExternalIcon() {
  return (
    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
    </svg>
  );
}

// =============================================================================
// Binary helpers for on-chain proof parsing
// =============================================================================

const DISC_VERIFIED_GROTH16_PROOF = Uint8Array.from([130, 178, 2, 37, 203, 80, 13, 207]);

function eq8(a: Uint8Array, b: Uint8Array) {
  for (let i = 0; i < 8; i++) if (a[i] !== b[i]) return false;
  return true;
}

function readU32LE(buf: Buffer, off: number): [number, number] {
  return [buf.readUInt32LE(off), off + 4];
}

function readI64LE(buf: Buffer, off: number): [number, number] {
  const slice = buf.subarray(off, off + 8);
  const bn = new BN(slice, undefined, "le");
  const isNeg = (slice[7] & 0x80) !== 0;
  const val = isNeg ? bn.sub(new BN(1).ushln(64)).toNumber() : bn.toNumber();
  return [val, off + 8];
}

function readU8Arr(buf: Buffer, off: number, len: number): [Buffer, number] {
  return [buf.subarray(off, off + len), off + len];
}

function readVecU8x32(buf: Buffer, off: number): [string[], number] {
  let len: number;
  [len, off] = readU32LE(buf, off);
  const out: string[] = [];
  for (let i = 0; i < len; i++) {
    let item: Buffer;
    [item, off] = readU8Arr(buf, off, 32);
    out.push(Buffer.from(item).toString("hex"));
  }
  return [out, off];
}

function parseVerifiedGroth16Proof(data: Buffer): Omit<VerifiedGroth16Proof, "pubkey" | "lamports"> {
  let off = 0;
  const disc = data.subarray(off, off + 8);
  off += 8;
  if (!eq8(disc, DISC_VERIFIED_GROTH16_PROOF)) {
    throw new Error("Not a VerifiedGroth16Proof account");
  }

  const authority = new PublicKey(data.subarray(off, off + 32));
  off += 32;

  const [pi_a, o1] = readU8Arr(data, off, 64);
  const [pi_b, o2] = readU8Arr(data, o1, 128);
  const [pi_c, o3] = readU8Arr(data, o2, 64);
  off = o3;

  const proof: Groth16Proof = {
    pi_a: Buffer.from(pi_a).toString("hex"),
    pi_b: Buffer.from(pi_b).toString("hex"),
    pi_c: Buffer.from(pi_c).toString("hex"),
  };

  const [inputsHex, o4] = readVecU8x32(data, off);
  off = o4;
  const public_inputs: PublicInputs = { inputs: inputsHex };

  const [vkHash, o5] = readU8Arr(data, off, 32);
  off = o5;
  const verifying_key_hash = Buffer.from(vkHash).toString("hex");

  const [verified_at, o6] = readI64LE(data, off);
  off = o6;

  const bump = data[off];

  return {
    authority: authority.toBase58(),
    proof,
    public_inputs,
    verifying_key_hash,
    verified_at,
    bump,
  };
}

// =============================================================================
// Custom hook for on-chain proofs
// =============================================================================

function useOnChainProofs() {
  const [proofs, setProofs] = useState<VerifiedGroth16Proof[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    (async () => {
      setIsLoading(true);
      try {
        const connection = new Connection(config.solanaRpc, "confirmed");
        const programId = new PublicKey(config.sunspotProgramId);
        const accounts = await connection.getProgramAccounts(programId);
        const parsed: VerifiedGroth16Proof[] = [];

        for (const acc of accounts) {
          const data = Buffer.from(acc.account.data);
          if (!eq8(data.subarray(0, 8), DISC_VERIFIED_GROTH16_PROOF)) continue;
          try {
            const p = parseVerifiedGroth16Proof(data);
            parsed.push({
              pubkey: acc.pubkey.toBase58(),
              lamports: acc.account.lamports,
              ...p,
            });
          } catch {
            // skip malformed
          }
        }

        parsed.sort((a, b) => (b.verified_at ?? 0) - (a.verified_at ?? 0));
        setProofs(parsed);
        setError(null);
      } catch (e) {
        setError(e instanceof Error ? e : new Error(String(e)));
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  return { proofs, isLoading, error };
}

// =============================================================================
// Tab Types
// =============================================================================

type Tab = 'prover' | 'onchain';

// =============================================================================
// Prover Status Tab
// =============================================================================

function ProverStatusTab() {
  const { data: health, isLoading: healthLoading } = useProverHealth();
  const { data: batches, isLoading: batchesLoading } = useBatches(0, 20);

  // Count batches by proving status
  const provingBatches = batches?.items?.filter(b => b.status === 'proving') || [];
  const settledBatches = batches?.items?.filter(b => b.status === 'settled') || [];

  return (
    <div className="space-y-6">
      {/* Prover Health Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
              label="Prover Status"
              value={health?.status === 'healthy' ? 'Online' : 'Offline'}
              icon={<CpuIcon />}
              color={health?.status === 'healthy' ? 'green' : 'yellow'}
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
              icon={<ClockIcon />}
              color="yellow"
            />
            <StatCard
              label="Workers Ready"
              value={`${health?.workers_ready || 0}/${health?.worker_count || 0}`}
              icon={<CpuIcon />}
              color="cyan"
            />
          </>
        )}
      </div>

      {/* Mock Prover Warning */}
      {health?.mock_prover && (
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4">
          <div className="flex items-center gap-2 text-yellow-400">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span className="font-medium">Mock Prover Mode</span>
          </div>
          <p className="mt-2 text-sm text-yellow-400/80">
            The prover is running in mock mode. Proofs are simulated and not cryptographically valid.
          </p>
        </div>
      )}

      {/* Batches Being Proved */}
      <div className="bg-zinc-900/50 backdrop-blur-sm rounded-2xl border border-white/5 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Batches Being Proved</h3>
        
        {batchesLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-12" />
            <Skeleton className="h-12" />
          </div>
        ) : provingBatches.length > 0 ? (
          <div className="space-y-3">
            {provingBatches.map((batch) => (
              <div key={batch.batch_id} className="flex items-center justify-between p-4 bg-purple-500/10 border border-purple-500/20 rounded-xl">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                    <span className="text-purple-400 font-semibold">#{batch.batch_id}</span>
                  </div>
                  <div>
                    <div className="text-sm text-white">{batch.tx_count} transactions</div>
                    <div className="text-xs text-white/40">
                      <TimeDisplay timestamp={batch.created_at} />
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse" />
                  <span className="text-sm text-purple-400">Proving...</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-white/40">
            No batches currently being proved
          </div>
        )}
      </div>

      {/* Recently Settled Batches with Proofs */}
      <div className="bg-zinc-900/50 backdrop-blur-sm rounded-2xl border border-white/5 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Recently Proved & Settled</h3>
        
        {batchesLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-16" />
            <Skeleton className="h-16" />
            <Skeleton className="h-16" />
          </div>
        ) : settledBatches.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs text-white/40 uppercase tracking-wider border-b border-white/5">
                  <th className="pb-3 font-medium">Batch</th>
                  <th className="pb-3 font-medium">Txns</th>
                  <th className="pb-3 font-medium">State Root</th>
                  <th className="pb-3 font-medium">L1 Settlement</th>
                  <th className="pb-3 font-medium">Settled</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {settledBatches.slice(0, 10).map((batch) => (
                  <tr key={batch.batch_id} className="hover:bg-white/5 transition-colors">
                    <td className="py-4">
                      <span className="font-mono text-emerald-400">#{batch.batch_id}</span>
                    </td>
                    <td className="py-4 text-white/80">{batch.tx_count}</td>
                    <td className="py-4">
                      <HashDisplay hash={batch.state_root} truncate copyable={false} />
                    </td>
                    <td className="py-4">
                      {batch.l1_tx_sig ? (
                        <a
                          href={getExplorerUrl('tx', batch.l1_tx_sig)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-emerald-400 hover:text-emerald-300"
                        >
                          <HashDisplay hash={batch.l1_tx_sig} truncate copyable={false} />
                          <LinkExternalIcon />
                        </a>
                      ) : (
                        <span className="text-white/30">-</span>
                      )}
                    </td>
                    <td className="py-4">
                      {batch.settled_at ? (
                        <TimeDisplay timestamp={batch.settled_at} />
                      ) : (
                        <span className="text-white/30">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-white/40">
            No settled batches yet
          </div>
        )}
      </div>
    </div>
  );
}

// =============================================================================
// On-Chain Proofs Tab
// =============================================================================

function OnChainProofsTab() {
  const { proofs, isLoading, error } = useOnChainProofs();
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState("");
  const pageSize = 5;

  const filtered = useMemo(() => {
    if (!filter) return proofs;
    return proofs.filter(p => 
      p.authority.toLowerCase().includes(filter.toLowerCase()) ||
      p.pubkey.toLowerCase().includes(filter.toLowerCase())
    );
  }, [proofs, filter]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const current = filtered.slice((page - 1) * pageSize, page * pageSize);

  const totalAuthorities = useMemo(() => new Set(proofs.map(p => p.authority)).size, [proofs]);

  const fmtDate = (secs: number) =>
    isFinite(secs) && secs > 0 ? new Date(secs * 1000).toLocaleString() : "-";

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6 text-center">
        <p className="text-red-400">Failed to load on-chain proofs</p>
        <p className="text-sm text-red-400/60 mt-1">{error.message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {isLoading ? (
          <>
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
          </>
        ) : (
          <>
            <StatCard
              label="On-Chain Proofs"
              value={proofs.length}
              icon={<ShieldCheckIcon />}
              color="green"
            />
            <StatCard
              label="Unique Authorities"
              value={totalAuthorities}
              icon={<CpuIcon />}
              color="purple"
            />
            <StatCard
              label="Program ID"
              value={`${config.sunspotProgramId.slice(0, 8)}...`}
              icon={<CheckCircleIcon />}
              color="cyan"
            />
            <StatCard
              label="Last Verified"
              value={proofs[0] ? fmtDate(proofs[0].verified_at).split(',')[0] : '-'}
              icon={<ClockIcon />}
              color="yellow"
            />
          </>
        )}
      </div>

      {/* Filter */}
      <div className="bg-zinc-900/50 backdrop-blur-sm rounded-2xl border border-white/5 p-4">
        <input
          type="text"
          placeholder="Filter by authority or PDA..."
          value={filter}
          onChange={(e) => { setFilter(e.target.value); setPage(1); }}
          className="w-full bg-zinc-800/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/40 focus:outline-none focus:border-white/20 transition-colors font-mono"
        />
      </div>

      {/* Proofs List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-48" />
            <Skeleton className="h-48" />
          </div>
        ) : current.length > 0 ? (
          current.map((p) => (
            <div key={p.pubkey} className="bg-zinc-900/50 backdrop-blur-sm rounded-2xl border border-white/5 p-6 space-y-4">
              {/* Header */}
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <div className="text-xs text-white/40 uppercase tracking-wider mb-1">PDA</div>
                  <a
                    href={getExplorerUrl('address', p.pubkey)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-emerald-400 hover:text-emerald-300 inline-flex items-center gap-1"
                  >
                    {p.pubkey.slice(0, 16)}...{p.pubkey.slice(-8)}
                    <LinkExternalIcon />
                  </a>
                </div>
                <div className="flex gap-2">
                  <span className="px-2 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs">
                    Verified
                  </span>
                  <span className="px-2 py-1 rounded-full bg-white/10 text-white/60 text-xs">
                    Bump: {p.bump}
                  </span>
                </div>
              </div>

              {/* Details Grid */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-white/40 uppercase tracking-wider mb-1">Authority</div>
                  <a
                    href={getExplorerUrl('address', p.authority)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-sm text-cyan-400 hover:text-cyan-300 inline-flex items-center gap-1"
                  >
                    {p.authority.slice(0, 12)}...{p.authority.slice(-8)}
                    <LinkExternalIcon />
                  </a>
                </div>
                <div>
                  <div className="text-xs text-white/40 uppercase tracking-wider mb-1">Verified At</div>
                  <div className="text-sm text-white/80">{fmtDate(p.verified_at)}</div>
                </div>
              </div>

              <div>
                <div className="text-xs text-white/40 uppercase tracking-wider mb-1">Verifying Key Hash</div>
                <div className="font-mono text-xs text-white/60 break-all">
                  {p.verifying_key_hash}
                </div>
              </div>

              {/* Expandable Proof Details */}
              <details className="group">
                <summary className="cursor-pointer text-purple-400 font-medium text-sm flex items-center gap-2">
                  <svg className="w-4 h-4 transition-transform group-open:rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                  Proof Data (Groth16)
                </summary>
                <div className="mt-3 grid md:grid-cols-3 gap-3">
                  {(['pi_a', 'pi_b', 'pi_c'] as const).map((key) => (
                    <div key={key} className="bg-zinc-800/50 rounded-xl p-3">
                      <div className="text-xs text-white/40 mb-1">{key}</div>
                      <div className="font-mono text-[10px] text-white/60 break-all max-h-20 overflow-y-auto">
                        {p.proof[key]}
                      </div>
                    </div>
                  ))}
                </div>
              </details>

              {/* Expandable Public Inputs */}
              <details className="group">
                <summary className="cursor-pointer text-cyan-400 font-medium text-sm flex items-center gap-2">
                  <svg className="w-4 h-4 transition-transform group-open:rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                  Public Inputs ({p.public_inputs.inputs.length})
                </summary>
                <div className="mt-3 grid md:grid-cols-2 gap-2">
                  {p.public_inputs.inputs.map((inp, i) => (
                    <div key={i} className="bg-zinc-800/50 rounded-lg p-2">
                      <span className="text-xs text-white/40">[{i}]</span>
                      <div className="font-mono text-[10px] text-white/60 break-all">
                        {inp}
                      </div>
                    </div>
                  ))}
                </div>
              </details>
            </div>
          ))
        ) : (
          <div className="bg-zinc-900/50 backdrop-blur-sm rounded-2xl border border-white/5 p-12 text-center">
            <div className="text-white/40 mb-2">
              <ShieldCheckIcon />
            </div>
            <p className="text-white/60">No on-chain proofs found</p>
            <p className="text-sm text-white/40 mt-1">
              Verified proofs will appear here once batches are settled on L1
            </p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {!isLoading && filtered.length > pageSize && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-white/40">
            Showing {(page - 1) * pageSize + 1}-{Math.min(page * pageSize, filtered.length)} of {filtered.length}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white/60 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>
            <span className="px-4 py-2 text-sm text-white/60">{page} / {pageCount}</span>
            <button
              onClick={() => setPage(p => Math.min(pageCount, p + 1))}
              disabled={page >= pageCount}
              className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white/60 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// Main Page
// =============================================================================

export default function ProofsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('prover');
  const { data: health } = useProverHealth();

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <DarkNavbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8 slide-in-top">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-semibold text-white">ZK Proofs</h1>
            {health && (
              <StatusBadge status={health.status} size="md" />
            )}
            {health?.mock_prover && (
              <span className="px-2 py-0.5 text-xs rounded-full bg-yellow-400/20 text-yellow-400">
                Mock Mode
              </span>
            )}
          </div>
          <p className="text-white/60">
            Monitor prover status and view verified ZK proofs on Solana
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-6 slide-in-top delay-100">
          <button
            onClick={() => setActiveTab('prover')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'prover'
                ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                : 'bg-white/5 text-white/60 border border-white/10 hover:bg-white/10'
            }`}
          >
            <CpuIcon />
            Prover Status
          </button>
          <button
            onClick={() => setActiveTab('onchain')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'onchain'
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'bg-white/5 text-white/60 border border-white/10 hover:bg-white/10'
            }`}
          >
            <ShieldCheckIcon />
            On-Chain Proofs
          </button>
        </div>

        {/* Tab Content */}
        <div className="slide-in-bottom delay-200">
          {activeTab === 'prover' && <ProverStatusTab />}
          {activeTab === 'onchain' && <OnChainProofsTab />}
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
