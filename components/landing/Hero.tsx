"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Bolt, ClipboardCopy, CopyCheck, ArrowRight } from "lucide-react";
import HeroPanel from "./HeroPanel";


function PrimaryButton({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      className="group inline-flex items-center gap-2 rounded-xl bg-zinc-900 px-6 py-3 text-sm font-medium text-white shadow-lg hover:bg-zinc-800 transition-all hover:shadow-xl hover:scale-[1.02]"
    >
      {children}
      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
    </a>
  );
}

function GhostButton({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-6 py-3 text-sm font-medium text-zinc-900 shadow-sm hover:border-zinc-300 hover:bg-zinc-50 transition-all"
    >
      {children}
    </a>
  );
}

export default function Hero() {
  const features = [
    { text: "Total unlinkability.", delay: 0.1 },
    { text: "Zero leaks.", delay: 0.15 },
    { text: "No front-running.", delay: 0.2 }
  ];

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
            testnet
          </motion.div>

          <div className="space-y-4">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: feature.delay, duration: 0.6, ease: "easeOut" }}
                className="overflow-hidden"
              >
                <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-none text-zinc-900">
                  <span className="bg-gradient-to-r from-zinc-900 via-zinc-700 to-zinc-900 bg-clip-text text-transparent">
                    {feature.text}
                  </span>
                </h1>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.6 }}
            className="relative"
          >
            <p className="text-lg sm:text-xl text-zinc-700 leading-relaxed max-w-2xl font-light">
              When execution is{" "}
              <span className="font-semibold text-zinc-900 relative">
                unlinkable
                <span className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-red-600 to-red200" />
              </span>
              , institutions move faster, markets become fairer, and privacy becomes{" "}
              <span className="font-semibold text-zinc-900">universal</span>.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45, duration: 0.4 }}
            className="flex flex-wrap gap-3"
          >
            <PrimaryButton href="https://x.com/zelanalabs">Follow along</PrimaryButton>
            <GhostButton href="https://form.typeform.com/to/akKCUvuh">Contact us</GhostButton>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.6 }}
            className="flex items-center gap-3 pt-2"
          >
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
        } catch { }
      }}
      className="group inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-3 py-1.5 font-mono text-[11px] text-zinc-800 shadow-sm hover:border-zinc-400"
      title={value}
    >
      <span className="truncate max-w-[220px] sm:max-w-[360px]">{value}</span>
      {copied ? <CopyCheck className="h-3.5 w-3.5 text-zinc-900" /> : <ClipboardCopy className="h-3.5 w-3.5 text-zinc-400 group-hover:text-zinc-600" />}
    </button>
  );
}