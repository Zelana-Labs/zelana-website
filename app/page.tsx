"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { motion } from "framer-motion";
import {
  ShieldCheck,
  GitBranch,
  ClipboardCopy,
  CopyCheck,
  Bolt,
  LayoutGrid,
  SlidersHorizontal,
  Github,
  ExternalLink,
} from "lucide-react";
import Navbar from "@/components/ui/Navbar";

/**
 * Drop this file in `src/app/(marketing)/page.tsx` or similar.
 * You can split Navbar, Card, Feature, etc. into separate files later.
 * Tailwind + framer-motion + lucide-react are used. No shadcn imports needed.
 */

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <GradientBG />

      {/* Hero */}
      <section className="relative overflow-hidden">
        {/* soft radial glow behind content */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_70%)]"
        >
          <div className="absolute left-1/2 top-[-20%] h-[70vh] w-[90vw] -translate-x-1/2 rounded-full bg-gradient-to-r from-indigo-200 via-purple-200 to-cyan-200 blur-3xl opacity-60" />
        </div>

        <div className="max-w-7xl mx-auto px-6 pt-20 pb-12">
          <div className="flex flex-col items-center text-center gap-7">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-3"
            >
              <div className="relative">
                <Image
                  src="/logo.png"
                  alt="Zelana logo"
                  width={84}
                  height={84}
                  className="rounded-xl shadow-sm ring-1 ring-black/5"
                />
                <span className="absolute -right-2 -bottom-2 inline-flex items-center gap-1 rounded-full bg-black text-white text-[10px] px-2 py-1">
                  <Bolt className="h-3 w-3" />
                  devnet
                </span>
              </div>
              <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight leading-tight">
                Zelana
              </h1>
            </motion.div>

            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.4 }}
              className="max-w-2xl text-lg md:text-xl text-gray-600"
            >
              A lightweight dashboard to explore verified ZK proofs on Solana devnet —
              built for builders who want clarity, speed, and simple integrations.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.4 }}
              className="flex flex-wrap items-center justify-center gap-3"
            >
              <PrimaryButton href="/proofs">View Proofs</PrimaryButton>
              <GhostButton href="https://github.com/Zelana-Labs" target="_blank">
                <Github className="h-4 w-4 mr-1.5" /> GitHub
              </GhostButton>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.4 }}
              className="text-xs text-gray-500 flex items-center gap-1"
            >
              <span>Program ID:</span>
              <CodePill value="Aa3rXCBoxPVZ537nqccEiVsLBoZ2G7gdfNjypM9wP8Yi" />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Value props */}
      <section className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid md:grid-cols-3 gap-6">
          <Card
            icon={<ShieldCheck className="h-5 w-5" />}
            title="Instant visibility"
            body="Scan all program accounts of the Groth16 proof type and sort by most recent verification."
          />
          <Card
            icon={<LayoutGrid className="h-5 w-5" />}
            title="Structured decoding"
            body="Account bytes are parsed into authority, public inputs, verifying key hash, timestamps, and more."
          />
          <Card
            icon={<SlidersHorizontal className="h-5 w-5" />}
            title="Builder friendly"
            body="Copy addresses, export JSON/CSV, and plug data into downstream pipelines or dashboards."
          />
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-7xl mx-auto px-6 pb-12">
        <div className="bg-white/80 backdrop-blur border rounded-2xl shadow-sm p-6 md:p-8">
          <div className="flex items-center gap-2 mb-4">
            <GitBranch className="h-5 w-5 text-gray-700" />
            <h2 className="text-2xl font-bold">How it works</h2>
          </div>

          <ol className="list-decimal list-inside space-y-2 text-gray-700">
            <li>Connect to Solana devnet and fetch accounts owned by your verifier program.</li>
            <li>
              Filter by the
              <code className="ml-1 font-mono text-sm bg-gray-50 px-1.5 py-0.5 rounded border">
                VerifiedGroth16Proof
              </code>
              discriminator.
            </li>
            <li>
              Decode Borsh data into readable fields: authority, proof elements, public inputs, verifying key hash, and timestamps.
            </li>
            <li>Explore, filter by authority or date, and export what you need.</li>
          </ol>

          <div className="mt-6 flex flex-wrap gap-3">
            <PrimaryButton href="/proofs">Open Proofs Dashboard</PrimaryButton>
            <GhostButton href="https://docs.solana.com/" target="_blank">
              Solana Docs <ExternalLink className="h-4 w-4 ml-1" />
            </GhostButton>
          </div>
        </div>
      </section>

      {/* Feature grid */}
      <section className="max-w-7xl mx-auto px-6 pb-12">
        <div className="grid lg:grid-cols-2 gap-6">
          <Feature
            title="Groth16 Proofs"
            points={[
              "View pi_a, pi_b, pi_c as hex (wrapped neatly).",
              "Public inputs rendered as compact blocks with copy buttons.",
              "Legend explains each field and how to use it.",
            ]}
          />
          <Feature
            title="Clean UI"
            points={[
              "Responsive layout with accessible components.",
              "No heavy dependencies — just Next.js and Tailwind.",
              "Ready to extend with wallet connect or custom filters.",
            ]}
          />
        </div>
      </section>

      {/* CTA band */}
      <section className="max-w-7xl mx-auto px-6 pb-16">
        <div className="rounded-2xl border bg-gradient-to-r from-black to-gray-800 text-white p-6 md:p-8 overflow-hidden relative">
          <div aria-hidden className="absolute -right-8 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
          <h3 className="text-2xl font-bold">Ready to explore proofs?</h3>
          <p className="text-gray-300 mt-1">Jump into the dashboard and filter by authority or time range.</p>
          <div className="mt-4">
            <a href="/proofs" className="inline-block px-5 py-3 rounded-lg bg-white text-black hover:opacity-90 transition">
              Go to Proofs
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-white/80 backdrop-blur">
        <div className="max-w-7xl mx-auto px-6 py-8 text-sm text-gray-500 flex flex-col md:flex-row items-center justify-between gap-2">
          <div>© {new Date().getFullYear()} Elzzen. All rights reserved.</div>
          <div className="flex items-center gap-4">
            <a href="https://github.com/Zelana-Labs" target="_blank" rel="noreferrer" className="hover:text-gray-700 inline-flex items-center gap-1">
              <Github className="h-4 w-4" /> GitHub
            </a>
            <Link href="/proofs" className="hover:text-gray-700">
              Proofs
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

/* ----------------------- UI bits ----------------------- */

function GradientBG() {
  return (
    <div aria-hidden className="fixed inset-0 -z-20 bg-[radial-gradient(60%_60%_at_50%_0%,#e2e8f0_0%,transparent_60%)]" />
  );
}

function PrimaryButton({ href, children, target }: { href: string; children: React.ReactNode; target?: string }) {
  return (
    <Link
      href={href}
      target={target}
      className="px-5 py-3 rounded-xl bg-black text-white shadow-sm ring-1 ring-black/10 hover:opacity-95 transition inline-flex items-center"
    >
      {children}
    </Link>
  );
}

function GhostButton({ href, children, target }: { href: string; children: React.ReactNode; target?: string }) {
  return (
    <Link
      href={href}
      target={target}
      className="px-5 py-3 rounded-xl border bg-white/70 hover:bg-white transition inline-flex items-center"
    >
      {children}
    </Link>
  );
}

function Card({ title, body, icon }: { title: string; body: string; icon?: React.ReactNode }) {
  return (
    <div className="bg-white border rounded-2xl shadow-sm p-6">
      <div className="flex items-start gap-3">
        {icon && (
          <div className="mt-0.5 h-8 w-8 rounded-xl border flex items-center justify-center text-gray-700">
            {icon}
          </div>
        )}
        <div>
          <h3 className="text-lg font-semibold tracking-tight">{title}</h3>
          <p className="text-gray-600 mt-1 leading-relaxed">{body}</p>
        </div>
      </div>
    </div>
  );
}

function Feature({ title, points }: { title: string; points: string[] }) {
  return (
    <div className="bg-white border rounded-2xl shadow-sm p-6 md:p-8">
      <h3 className="text-xl font-bold">{title}</h3>
      <ul className="mt-3 space-y-2 text-gray-700">
        {points.map((p) => (
          <li key={p} className="flex gap-2 items-start">
            <span className="mt-2 h-1.5 w-1.5 rounded-full bg-gray-400" />
            <span>{p}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function CodePill({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          setTimeout(() => setCopied(false), 1200);
        } catch {}
      }}
      className="group inline-flex items-center gap-1.5 rounded-lg border bg-white/70 px-2.5 py-1 font-mono text-xs text-gray-700 hover:bg-white"
      title={value}
    >
      <span className="truncate max-w-[220px] sm:max-w-[360px]">{value}</span>
      {copied ? <CopyCheck className="h-3.5 w-3.5" /> : <ClipboardCopy className="h-3.5 w-3.5 opacity-70 group-hover:opacity-100" />}
    </button>
  );
}
