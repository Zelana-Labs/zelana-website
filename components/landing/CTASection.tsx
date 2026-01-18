"use client";

import { motion } from "framer-motion";
import { ArrowRight, Mail } from "lucide-react";

export default function CTASection() {
  return (
    <section className="max-w-6xl mx-auto px-6">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.7 }}
        className="relative overflow-hidden rounded-[2.5rem] bg-zinc-900 p-12 md:p-16"
      >
        {/* Animated gradient background */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-zinc-700/50 via-transparent to-transparent rounded-full blur-3xl animate-pulse" />
          <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-to-tl from-zinc-600/30 via-transparent to-transparent rounded-full blur-3xl animate-pulse delay-1000" />
        </div>

        {/* Grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:3rem_3rem]" />

        <div className="relative z-10 max-w-2xl">
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-xs uppercase tracking-[0.3em] text-zinc-400 font-medium mb-4"
          >
            Stay in the loop
          </motion.p>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="text-3xl md:text-4xl font-bold text-white mb-4"
          >
            Want to help define Solana&apos;s privacy layer?
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
            className="text-lg text-zinc-400 mb-8"
          >
            We&apos;re inviting early partners to review specs, co-design governance, and pressure-test the first circuits.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.5 }}
            className="flex flex-wrap gap-4"
          >
            <a
              href="mailto:hello@zelana.xyz"
              className="group inline-flex items-center gap-2 rounded-2xl bg-white px-7 py-3.5 text-sm font-semibold text-zinc-900 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02]"
            >
              <Mail className="h-4 w-4" />
              Get in touch
              <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
            </a>
            <a
              href="https://x.com/zelanalabs"
              className="inline-flex items-center gap-2 rounded-2xl border border-zinc-700 bg-transparent px-7 py-3.5 text-sm font-semibold text-white hover:bg-zinc-800 hover:border-zinc-600 transition-all duration-300"
            >
              Track progress
            </a>
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
}

