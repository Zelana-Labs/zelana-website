"use client";

import { motion } from "framer-motion";

type CardProps = {
  title: string;
  body: string;
  icon?: React.ReactNode;
};

export default function Card({ title, body, icon }: CardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.4 }}
      transition={{ duration: 0.5 }}
      className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm"
    >
      <div className="flex items-start gap-3">
        {icon && (
          <div className="mt-0.5 h-8 w-8 rounded-xl border border-zinc-200 bg-zinc-50 flex items-center justify-center text-zinc-900">
            {icon}
          </div>
        )}
        <div>
          <h3 className="text-lg font-semibold text-zinc-900">{title}</h3>
          <p className="text-zinc-600 mt-2 leading-relaxed">{body}</p>
        </div>
      </div>
    </motion.div>
  );
}

