"use client";

import SectionIntro from "./SectionIntro";
import { motion } from "framer-motion";

const principles = [
  {
    title: "Human-readable privacy.",
    body: "Proofs, attestations, and failure states must be reviewable by people, not just services.",
  },
  {
    title: "Composable from day one.",
    body: "Everything we ship should drop into existing Solana workflows—RPC providers, indexers, and governance stacks.",
  },
  {
    title: "Selective transparency.",
    body: "Auditors and regulators receive exactly what they need via view keys and expirations, nothing more.",
  },
];

export default function Principles() {
  return (
    <section className="max-w-6xl mx-auto px-6">
      <div className="rounded-3xl border border-zinc-200 bg-white p-10 shadow-[0_25px_70px_rgba(15,23,42,0.08)]">
        <SectionIntro eyebrow="Principles" title="How we’ll measure ourselves" description="We’ll release updates only when these checkpoints are met." />
        <ul className="mt-8 space-y-5 text-zinc-600">
          {principles.map((item) => (
            <motion.li
              key={item.title}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.4 }}
              className="leading-relaxed"
            >
              <span className="font-semibold text-zinc-900">{item.title}</span> {item.body}
            </motion.li>
          ))}
        </ul>
      </div>
    </section>
  );
}

