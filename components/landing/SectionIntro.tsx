"use client";

import { motion } from "framer-motion";

type SectionIntroProps = {
  eyebrow: string;
  title: string;
  description: string;
  centered?: boolean;
  className?: string;
};

export default function SectionIntro({ eyebrow, title, description, centered, className }: SectionIntroProps) {
  const baseClass = centered ? "text-center max-w-3xl mx-auto" : "max-w-3xl";
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.5 }}
      className={`${baseClass}${className ? ` ${className}` : ""}`}
    >
      <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">{eyebrow}</p>
      <h2 className="mt-3 text-3xl font-semibold text-zinc-900">{title}</h2>
      <p className="mt-2 text-zinc-600">{description}</p>
    </motion.div>
  );
}

