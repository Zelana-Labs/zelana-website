"use client";

import { motion } from "framer-motion";

export default function HeroPanel() {
  return (
    <motion.div
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.2, duration: 0.6 }}
      className="rounded-[32px] border border-zinc-200 bg-white/90 p-8 space-y-6 shadow-[0_30px_90px_rgba(15,23,42,0.12)] backdrop-blur"
    >
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">Focus areas</p>
        <h3 className="mt-2 text-xl font-semibold text-zinc-900">What we’re prototyping</h3>
      </div>
      <div className="space-y-4 text-sm text-zinc-600">
        <div>
          <p className="font-semibold text-zinc-900">Zero Knowledge VM</p>
          <p>An encrypted transaction execution environment.</p>
        </div>
        <div>
          <p className="font-semibold text-zinc-900">Encrypted bridge</p>
          <p>Bridging funds between the L1 and L2 by using commitments</p>
        </div>
      </div>
      <div className="flex flex-wrap gap-2 text-[10px] uppercase tracking-[0.3em] text-zinc-500">
        <span className="inline-flex items-center gap-1 rounded-full border border-zinc-200 px-3 py-1">build in public</span>
        <span className="inline-flex items-center gap-1 rounded-full border border-zinc-200 px-3 py-1">solana native</span>
      </div>
    </motion.div>
  );
}

