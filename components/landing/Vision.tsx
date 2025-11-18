"use client";

import SectionIntro from "./SectionIntro";
import { motion } from "framer-motion";

const bullets = [
  "Groth16 and Poseidon-based circuits with Solana-friendly tooling.",
  "Operator consoles that explain proofs without exposing payloads.",
  "Selective disclosure and view-key workflows for auditors.",
  "Community partners who co-own the rollout milestones.",
];

export default function Vision() {
  return (
    <section className="max-w-6xl mx-auto px-6">
      <div className="rounded-3xl border border-zinc-200 bg-white p-10 md:p-14 shadow-[0_30px_90px_rgba(15,23,42,0.08)] space-y-10">
        <SectionIntro
          eyebrow="Vision"
          title="Bringing a privacy layer to Solana"
          description="We’re designing governance, disclosure controls, and circuit libraries in public. Product surfaces will follow once the foundation is agreed upon."
          centered
        />
        <div className="grid gap-8 md:grid-cols-2">
          {bullets.map((item) => (
            <motion.div
              key={item}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.4 }}
              className="rounded-2xl border border-zinc-200 bg-zinc-50 p-5 text-zinc-700"
            >
              {item}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

