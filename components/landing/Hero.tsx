"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Bolt, ClipboardCopy, CopyCheck } from "lucide-react";
import HeroPanel from "./HeroPanel";
import { PrimaryButton, GhostButton } from "./Buttons";

export default function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-zinc-100 pb-16">
      <div className="pointer-events-none absolute inset-0 -z-10 opacity-80 [mask-image:radial-gradient(circle_at_top,white,transparent_75%)]">
        <div className="absolute inset-x-0 top-0 mx-auto max-w-5xl h-[42rem] blur-[140px] bg-gradient-to-r from-zinc-100 via-white to-zinc-200" />
      </div>

      <div className="max-w-6xl mx-auto py-28 grid gap-16 lg:grid-cols-[1.2fr_0.8fr] items-center">
        <div className="space-y-8 px-2 sm:px-6 lg:px-0">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-4 py-2 text-[11px] uppercase tracking-[0.25em] text-zinc-500"
          >
            <span className="inline-flex items-center gap-1 rounded-full bg-zinc-900 text-white px-2 py-0.5 text-[10px]">
              <Bolt className="h-3 w-3" />
              zk rollup
            </span>
            devnet
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05, duration: 0.5 }} className="space-y-6">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight leading-tight text-zinc-900">
              A privacy mission for the Next Generation of builders.
            </h1>
            <p className="text-lg text-zinc-600 leading-relaxed max-w-2xl">
              Zelana is an emerging ZK rollup exploring how proof systems and encrypted execution can give Solana and other chains a native privacy layer.
            </p>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.4 }} className="flex flex-wrap gap-3">
            <PrimaryButton href="https://x.com/zelanalabs">Follow along</PrimaryButton>
            <GhostButton href="mailto:hello@zelana.xyz">Reach out</GhostButton>
          </motion.div>

          {/* <motion.div className="flex flex-wrap items-center gap-2 text-xs text-zinc-500">
            <span>Rollup program</span>
            <CodePill value="Aa3rXCBoxPVZ537nqccEiVsLBoZ2G7gdfNjypM9wP8Yi" />
          </motion.div> */}
        </div>

        <HeroPanel />
      </div>
    </section>
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
      className="group inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-3 py-1.5 font-mono text-[11px] text-zinc-800 shadow-sm hover:border-zinc-400"
      title={value}
    >
      <span className="truncate max-w-[220px] sm:max-w-[360px]">{value}</span>
      {copied ? <CopyCheck className="h-3.5 w-3.5 text-zinc-900" /> : <ClipboardCopy className="h-3.5 w-3.5 text-zinc-400 group-hover:text-zinc-600" />}
    </button>
  );
}

