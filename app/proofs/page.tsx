"use client";

import { useEffect, useMemo, useState } from "react";
import { Connection, PublicKey } from "@solana/web3.js";
import BN from "bn.js";

/** === Config === */
const PROGRAM_ID = new PublicKey("Aa3rXCBoxPVZ537nqccEiVsLBoZ2G7gdfNjypM9wP8Yi");
const RPC_URL = "https://api.devnet.solana.com";
const DISC_VERIFIED_GROTH16_PROOF = Uint8Array.from([130, 178, 2, 37, 203, 80, 13, 207]);

/** === Types === */
type Groth16Proof = { pi_a: string; pi_b: string; pi_c: string };
type PublicInputs = { inputs: string[] };

type VerifiedGroth16Proof = {
    pubkey: string;             // PDA
    lamports: number;           // SOL balance (lamports)
    authority: string;          // base58
    verifying_key_hash: string; // hex
    verified_at: number;        // epoch seconds
    bump: number;               // PDA bump
    proof: Groth16Proof;        // hex blobs
    public_inputs: PublicInputs;// hex[32] list
};

type Filters = {
    authority: string;
    from?: string; // yyyy-mm-dd
    to?: string;   // yyyy-mm-dd
};

/** === Binary helpers (Borsh/Anchor) === */
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

/** Parse VerifiedGroth16Proof from raw account data */
function parseVerifiedGroth16Proof(data: Buffer): Omit<VerifiedGroth16Proof, "pubkey" | "lamports"> {
    let off = 0;

    const disc = data.subarray(off, off + 8); off += 8;
    if (!eq8(disc, DISC_VERIFIED_GROTH16_PROOF)) {
        throw new Error("Not a VerifiedGroth16Proof account");
    }

    const authority = new PublicKey(data.subarray(off, off + 32)); off += 32;

    let pi_a, pi_b, pi_c: Buffer;
    [pi_a, off] = readU8Arr(data, off, 64);
    [pi_b, off] = readU8Arr(data, off, 128);
    [pi_c, off] = readU8Arr(data, off, 64);
    const proof: Groth16Proof = {
        pi_a: Buffer.from(pi_a).toString("hex"),
        pi_b: Buffer.from(pi_b).toString("hex"),
        pi_c: Buffer.from(pi_c).toString("hex"),
    };

    let inputsHex: string[];[inputsHex, off] = readVecU8x32(data, off);
    const public_inputs: PublicInputs = { inputs: inputsHex };

    let vkHash: Buffer;[vkHash, off] = readU8Arr(data, off, 32);
    const verifying_key_hash = Buffer.from(vkHash).toString("hex");

    let verified_at: number;[verified_at, off] = readI64LE(data, off);
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

/** Utils */
const fmtDate = (secs: number) =>
    isFinite(secs) && secs > 0 ? new Date(secs * 1000).toLocaleString() : "—";

const short = (s: string, n = 8) => (s.length <= 2 * n + 3 ? s : `${s.slice(0, n)}…${s.slice(-n)}`);

const copy = async (text: string) => {
    try { await navigator.clipboard.writeText(text); } catch { }
};

function toCSV(items: VerifiedGroth16Proof[]): string {
    const header = [
        "pda", "authority", "verified_at", "bump", "lamports", "verifying_key_hash", "proof.pi_a", "proof.pi_b", "proof.pi_c", "public_inputs_len"
    ].join(",");
    const rows = items.map(i =>
        [
            i.pubkey, i.authority, i.verified_at, i.bump, i.lamports, i.verifying_key_hash,
            i.proof.pi_a, i.proof.pi_b, i.proof.pi_c, i.public_inputs.inputs.length
        ].join(",")
    );
    return [header, ...rows].join("\n");
}

/** === Main Page === */
export default function ProofsPage() {
    const [all, setAll] = useState<VerifiedGroth16Proof[]>([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState<Filters>({ authority: "" });
    const [page, setPage] = useState(1);
    const pageSize = 10;

    useEffect(() => {
        (async () => {
            setLoading(true);
            const connection = new Connection(RPC_URL, "confirmed");
            const accounts = await connection.getProgramAccounts(PROGRAM_ID);
            const proofs: VerifiedGroth16Proof[] = [];

            for (const acc of accounts) {
                const data = Buffer.from(acc.account.data);
                if (!eq8(data.subarray(0, 8), DISC_VERIFIED_GROTH16_PROOF)) continue;
                try {
                    const parsed = parseVerifiedGroth16Proof(data);
                    proofs.push({
                        pubkey: acc.pubkey.toBase58(),
                        lamports: acc.account.lamports,
                        ...parsed,
                    });
                } catch {
                    // skip malformed or other account types
                }
            }

            proofs.sort((a, b) => (b.verified_at ?? 0) - (a.verified_at ?? 0));
            setAll(proofs);
            setLoading(false);
        })();
    }, []);

    /** filtering */
    const filtered = useMemo(() => {
        const f = filters;
        return all.filter((p) => {
            if (f.authority && !p.authority.includes(f.authority)) return false;
            if (f.from) {
                const fromTs = Math.floor(new Date(f.from + "T00:00:00Z").getTime() / 1000);
                if ((p.verified_at ?? 0) < fromTs) return false;
            }
            if (f.to) {
                const toTs = Math.floor(new Date(f.to + "T23:59:59Z").getTime() / 1000);
                if ((p.verified_at ?? 0) > toTs) return false;
            }
            return true;
        });
    }, [all, filters]);

    /** pagination */
    const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
    const current = filtered.slice((page - 1) * pageSize, page * pageSize);

    /** stats */
    const total = all.length;
    const totalAuthorities = useMemo(() => new Set(all.map(a => a.authority)).size, [all]);
    const lastUpdated = useMemo(
        () => (all[0]?.verified_at ? fmtDate(all[0].verified_at) : "—"),
        [all]
    );

    const exportJSON = () => {
        const blob = new Blob([JSON.stringify(filtered, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a"); a.href = url; a.download = "verified_groth16_proofs.json"; a.click();
        URL.revokeObjectURL(url);
    };
    const exportCSV = () => {
        const blob = new Blob([toCSV(filtered)], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a"); a.href = url; a.download = "verified_groth16_proofs.csv"; a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="max-w-7xl mx-auto p-6 grid lg:grid-cols-3 gap-6">
            {/* LEFT: content (2 cols) */}
            <div className="lg:col-span-2 space-y-6">
                {/* Header */}
                <header className="space-y-2">
                    <h1 className="text-3xl font-bold text-gray-900">Groth16 Proofs (devnet)</h1>
                    <p className="text-gray-600">
                        Program: <span className="font-mono">{PROGRAM_ID.toBase58()}</span>
                    </p>
                </header>

                {/* Stats */}
                <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <StatCard label="Total Proofs" value={total.toString()} />
                    <StatCard label="Unique Authorities" value={totalAuthorities.toString()} />
                    <StatCard label="Last Verified" value={lastUpdated} />
                </section>

                {/* Controls */}
                <section className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm space-y-3">
                    <div className="grid md:grid-cols-4 gap-3">
                        <div className="md:col-span-2">
                            <label className="block text-sm text-gray-600 mb-1">Filter by Authority</label>
                            <input
                                className="w-full border rounded-lg px-3 py-2 font-mono text-sm"
                                placeholder="Enter authority pubkey (partial ok)"
                                value={filters.authority}
                                onChange={(e) => { setPage(1); setFilters(prev => ({ ...prev, authority: e.target.value.trim() })); }}
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-gray-600 mb-1">From</label>
                            <input
                                type="date"
                                className="w-full border rounded-lg px-3 py-2"
                                value={filters.from || ""}
                                onChange={(e) => { setPage(1); setFilters(prev => ({ ...prev, from: e.target.value || undefined })); }}
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-gray-600 mb-1">To</label>
                            <input
                                type="date"
                                className="w-full border rounded-lg px-3 py-2"
                                value={filters.to || ""}
                                onChange={(e) => { setPage(1); setFilters(prev => ({ ...prev, to: e.target.value || undefined })); }}
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-2 pt-2">
                        <button
                            className="px-3 py-2 text-sm rounded-lg border hover:bg-gray-50"
                            onClick={() => { setFilters({ authority: "" }); setPage(1); }}
                        >
                            Clear Filters
                        </button>
                        <div className="ml-auto flex gap-2">
                            <button className="px-3 py-2 text-sm rounded-lg border hover:bg-gray-50" onClick={exportJSON}>
                                Export JSON
                            </button>
                            <button className="px-3 py-2 text-sm rounded-lg border hover:bg-gray-50" onClick={exportCSV}>
                                Export CSV
                            </button>
                        </div>
                    </div>
                </section>

                {/* List */}
                <section className="space-y-3">
                    {loading && <div className="text-gray-600">Loading program accounts…</div>}
                    {!loading && filtered.length === 0 && (
                        <div className="text-gray-600">No proofs match your filters.</div>
                    )}

                    {!loading && filtered.length > 0 && current.map((p) => (
                        <article key={p.pubkey} className="bg-white border border-gray-200 rounded-xl shadow-sm p-5 space-y-3">
                            <div className="flex flex-wrap gap-2 justify-between items-center">
                                <div className="space-y-1 min-w-0">
                                    <div className="text-sm text-gray-500">PDA</div>
                                    <div className="font-mono text-blue-700 break-all">{p.pubkey}</div>
                                </div>
                                <div className="flex flex-wrap gap-2 text-xs">
                                    <Badge>Lamports: {p.lamports}</Badge>
                                    <Badge>Bump: {p.bump}</Badge>
                                    <Badge>Verified: {fmtDate(p.verified_at)}</Badge>
                                </div>
                            </div>


                            <div className="grid md:grid-cols-2 gap-4 text-sm min-w-0">
                                <div className="min-w-0">
                                    <LabelVal label="Authority">
                                        <code className="font-mono text-xs break-all block">{p.authority}</code>
                                        <CopyBtn onClick={() => copy(p.authority)} />
                                    </LabelVal>
                                </div>
                                <div className="min-w-0">
                                    <LabelVal label="Verifying Key Hash">
                                        <code className="font-mono text-xs break-all block">{p.verifying_key_hash}</code>
                                        <CopyBtn onClick={() => copy(p.verifying_key_hash)} />
                                    </LabelVal>
                                </div>
                            </div>


                <details className="group">
  <summary className="cursor-pointer text-blue-700 font-semibold">
    Proof (Groth16)
  </summary>
  <div className="mt-2 grid gap-3 text-xs sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
    <CodeBlock label="pi_a" value={p.proof.pi_a} />
    <CodeBlock label="pi_b" value={p.proof.pi_b} />
    <CodeBlock label="pi_c" value={p.proof.pi_c} />
  </div>
</details>




                            <details className="group">
                                <summary className="cursor-pointer text-blue-700 font-semibold">
                                    Public Inputs ({p.public_inputs.inputs.length})
                                </summary>
                                <ul className="mt-2 grid md:grid-cols-2 gap-2 text-xs">
                                    {p.public_inputs.inputs.map((inp, i) => (
                                        <li key={i} className="p-2 rounded bg-gray-50 border font-mono break-all min-w-0">
                                            {inp}
                                            <button className="ml-2 text-blue-700 hover:underline" onClick={() => copy(inp)}>copy</button>
                                        </li>
                                    ))}
                                </ul>

                            </details>

                            <div className="text-xs text-gray-500">
                                Tip: click the blue labels to expand raw data panels.
                            </div>
                        </article>
                    ))}

                    {/* Pagination */}
                    {!loading && filtered.length > 0 && (
                        <div className="flex items-center justify-between pt-2">
                            <div className="text-sm text-gray-600">
                                Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, filtered.length)} of {filtered.length}
                            </div>
                            <div className="flex gap-2">
                                <button
                                    className="px-3 py-2 text-sm rounded-lg border hover:bg-gray-50 disabled:opacity-50"
                                    disabled={page <= 1}
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                >
                                    Prev
                                </button>
                                <span className="text-sm text-gray-700 px-2 py-2">{page} / {pageCount}</span>
                                <button
                                    className="px-3 py-2 text-sm rounded-lg border hover:bg-gray-50 disabled:opacity-50"
                                    disabled={page >= pageCount}
                                    onClick={() => setPage(p => Math.min(pageCount, p + 1))}
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    )}
                </section>
            </div>

            {/* RIGHT: Legend (sticky) */}
            <aside className="space-y-4">
                <div className="bg-white border rounded-xl shadow-sm p-5 sticky top-6">
                    <h2 className="text-xl font-bold mb-3">Legend & What you can do</h2>
                    <ul className="list-disc list-inside text-sm text-gray-700 space-y-2">
                        <li><strong>PDA</strong>: Program Derived Account storing one verified proof. Seeds <code>["groth16_proof", authority, proof_id]</code>.</li>
                        <li><strong>Authority</strong>: Wallet that submitted the proof. Filter/group by this to track provenance.</li>
                        <li><strong>Verifying Key Hash</strong>: 32-byte hash of the VK used during verification; cross-check off-chain VKs.</li>
                        <li><strong>Verified At</strong>: UNIX timestamp when the proof was accepted on-chain.</li>
                        <li><strong>Bump</strong>: PDA bump seed used in derivation.</li>
                        <li><strong>Lamports</strong>: SOL held by the PDA account (rent, etc.).</li>
                        <li><strong>Proof</strong>: Groth16 elements (pi_a/pi_b/pi_c) as hex. Usually not needed for UI logic.</li>
                        <li><strong>Public Inputs</strong>: 32-byte field elements exposed by the circuit; can drive app logic (e.g., rollup state).</li>
                        <li><strong>Export</strong>: Use JSON/CSV export for analysis or indexing.</li>
                    </ul>
                </div>
            </aside>
        </div>
    );
}

/** === Small UI bits === */
function StatCard({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-4">
            <div className="text-sm text-gray-500">{label}</div>
            <div className="text-2xl font-semibold text-gray-900">{value}</div>
        </div>
    );
}

function Badge({ children }: { children: React.ReactNode }) {
    return <span className="px-2 py-1 rounded-full bg-gray-100 border text-gray-700">{children}</span>;
}

function LabelVal({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="grid grid-cols-[auto,1fr] items-start gap-2 min-w-0">
            <div className="text-xs uppercase tracking-wide text-gray-500">{label}</div>
            <div className="flex items-center gap-2 min-w-0">
                {/* Children can now wrap/scroll */}
                <div className="min-w-0 break-all">{children}</div>
            </div>
        </div>
    );
}

function CopyBtn({ onClick }: { onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            className="text-xs px-2 py-1 rounded border hover:bg-gray-50"
            title="Copy to clipboard"
        >
            Copy
        </button>
    );
}

function CodeBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="w-full">
      <div className="text-xs text-gray-500 mb-1">{label}</div>
      <pre className="p-2 bg-gray-50 border rounded font-mono text-[11px] break-all whitespace-pre-wrap">
        {value}
      </pre>
      <button
        className="mt-1 text-xs text-blue-700 hover:underline"
        onClick={() => navigator.clipboard.writeText(value)}
      >
        copy
      </button>
    </div>
  );
}