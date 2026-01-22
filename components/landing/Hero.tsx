"use client";

import { motion } from "framer-motion";
import { Bolt, ArrowRight } from "lucide-react";
import HeroPanel from "./HeroPanel";

function PrimaryButton({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      className="group relative inline-flex items-center gap-2 rounded-2xl bg-zinc-900 px-7 py-3.5 text-sm font-semibold text-white shadow-[0_10px_40px_rgba(0,0,0,0.15)] hover:shadow-[0_20px_50px_rgba(0,0,0,0.25)] transition-all duration-300 hover:scale-[1.02] overflow-hidden"
    >
      <span className="absolute inset-0 bg-gradient-to-r from-zinc-800 via-zinc-900 to-zinc-800 opacity-0 group-hover:opacity-100 transition-opacity" />
      <span className="relative">{children}</span>
      <ArrowRight className="relative h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
    </a>
  );
}

function GhostButton({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      className="group inline-flex items-center gap-2 rounded-2xl border border-zinc-200 bg-white/80 backdrop-blur-sm px-7 py-3.5 text-sm font-semibold text-zinc-900 shadow-sm hover:border-zinc-300 hover:bg-white hover:shadow-md transition-all duration-300"
    >
      {children}
    </a>
  );
}

export default function Hero() {
  const features = [
    { text: "Total unlinkability.", delay: 0.15 },
    { text: "Zero leaks.", delay: 0.25 },
    { text: "No front-running.", delay: 0.35 }
  ];

  return (
    <section className="relative overflow-hidden pb-20">
      {/* Animated gradient orbs */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-40 -right-40 h-[600px] w-[600px] rounded-full bg-gradient-to-br from-zinc-200/50 via-zinc-100/30 to-transparent blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute -bottom-20 -left-40 h-[500px] w-[500px] rounded-full bg-gradient-to-tr from-zinc-300/40 via-zinc-200/20 to-transparent blur-3xl"
        />
      </div>

      {/* Grid pattern overlay */}
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(to_right,#f5f5f5_1px,transparent_1px),linear-gradient(to_bottom,#f5f5f5_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_110%)]" />

      <div className="max-w-6xl mx-auto pt-24 pb-12 grid gap-16 lg:grid-cols-[1.2fr_0.8fr] items-center px-6">
        <div className="space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2.5 rounded-full border border-zinc-200/80 bg-white/90 backdrop-blur-sm px-4 py-2 text-[11px] uppercase tracking-[0.2em] text-zinc-500 shadow-sm"
          >
            <span className="inline-flex items-center gap-1.5 rounded-full bg-zinc-900 text-white px-2.5 py-1 text-[10px] font-medium">
              <Bolt className="h-3 w-3" />
              zk rollup
            </span>
            <span className="flex items-center gap-1">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
              </span>
              testnet soon
            </span>
          </motion.div>

          <div className="space-y-3">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: feature.delay, duration: 0.7, ease: [0.25, 0.4, 0.25, 1] }}
                className="overflow-hidden"
              >
                <h1 className="text-5xl sm:text-6xl lg:text-[4.5rem] font-bold tracking-tight leading-[1.1] text-zinc-900">
                  <span className="inline-block bg-gradient-to-r from-zinc-900 via-zinc-600 to-zinc-900 bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient">
                    {feature.text}
                  </span>
                </h1>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
          >
            <p className="text-lg sm:text-xl text-zinc-600 leading-relaxed max-w-xl">
              When execution is{" "}
              <span className="font-semibold text-zinc-900 relative inline-block">
                unlinkable
                <motion.span
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ delay: 0.8, duration: 0.4 }}
                  className="absolute -bottom-0.5 left-0 right-0 h-[2px] bg-gradient-to-r from-zinc-400 to-zinc-600 origin-left"
                />
              </span>
              , institutions move faster, markets become fairer, and privacy becomes{" "}
              <span className="font-semibold text-zinc-900">universal</span>.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.5 }}
            className="flex flex-wrap gap-4 pt-2"
          >
            <PrimaryButton href="https://x.com/zelanalabs">Follow along</PrimaryButton>
            <GhostButton href="https://form.typeform.com/to/akKCUvuh">Contact us</GhostButton>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3, duration: 0.7 }}
        >
          <HeroPanel />
        </motion.div>
      </div>
    </section>
  );
}