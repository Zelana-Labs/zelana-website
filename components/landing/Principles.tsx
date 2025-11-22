"use client";

import SectionIntro from "./SectionIntro";
import { motion } from "framer-motion";

const principles = [
    {
    title: "Integrity.",
    body: "Everything we ship is open. No backdoors, no shortcuts",
  },
  {
    title: "Build for the future.",
    body: "We build the future people will thank us for when the lights go out and freedom is all that’s left.",
  },
  {
    title: "As fast as possible.",
    body: "Shipping at speed and making the systems as fast as possible.",
  },
];

export default function Principles() {
  return (
    <section className="max-w-6xl mx-auto px-6 py-20">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.5 }}
        className="relative rounded-3xl border border-zinc-200 bg-white/90 p-10 md:p-14 shadow-[0_25px_70px_rgba(15,23,42,0.08)] overflow-hidden"
      >

        <SectionIntro
          eyebrow="Principles"
          title="How we’ll measure ourselves"
          description="Standards to die for and live by."
        />

        <ul className="mt-10 space-y-6 text-zinc-600 relative">
          {principles.map((item, index) => (
            <motion.li
              key={item.title}
              initial={{ opacity: 0, x: -16 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.35, delay: index * 0.05 }}
              className="flex gap-4"
            >
              {/* Nummer badge */}
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-zinc-300 bg-zinc-50 text-xs font-medium text-zinc-700">
                {index + 1}
              </div>

              <div className="space-y-1">
                <h3 className="font-semibold text-zinc-900">
                  {item.title}
                </h3>
                <p className="leading-relaxed">
                  {item.body}
                </p>
              </div>
            </motion.li>
          ))}
        </ul>
      </motion.div>
    </section>
  );
}
