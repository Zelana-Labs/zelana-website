"use client";

import SectionIntro from "./SectionIntro";
import { motion } from "framer-motion";
import { Lock, CircuitBoard, EyeOff, Users } from "lucide-react";

const bullets = [
  {
    icon: CircuitBoard,
    title: "Proof systems",
    text: "Groth16 and Poseidon-based circuits with Rust-friendly tooling.",
  },
  {
    icon: EyeOff,
    title: "Explorable privacy",
    text: "Explorers that explain proofs and transactions without exposing payloads or other details.",
  },
  {
    icon: Lock,
    title: "Selective disclosure",
    text: "View-key workflows and disclosure controls for auditors and regulators.",
  },
  {
    icon: Users,
    title: "Ecosystem alignment",
    text: "Community partners who contribute to and govern the confidential system.",
  },
];

export default function Vision() {
  return (
    <section className="max-w-6xl mx-auto px-6 py-20">
      <div className="relative rounded-3xl border border-zinc-200 bg-white/90 backdrop-blur-sm p-10 md:p-14 shadow-[0_30px_90px_rgba(0,0,0,0.07)] space-y-10 overflow-hidden">

        <SectionIntro
          eyebrow="Vision"
          title="Bringing a privacy layer to Solana"
          description="We’re designing governance, disclosure controls, and circuit libraries in public. Product surfaces will follow once the foundation is agreed upon."
          centered
        />

        <div className="grid gap-8 md:grid-cols-2 relative">
          {bullets.map(({ icon: Icon, title, text }) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.4 }}
              className="group rounded-2xl border border-zinc-200 bg-white/95 p-6 text-zinc-700 shadow-sm hover:shadow-md hover:border-zinc-300 transition"
            >
              <div className="flex items-start gap-3">
                <div className="mt-1 flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-50 border border-zinc-200 text-zinc-700">
                  <Icon className="h-4 w-4" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-semibold text-zinc-900">{title}</h3>
                  <p className="text-sm leading-relaxed">{text}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
