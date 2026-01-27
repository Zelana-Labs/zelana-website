"use client";

import { motion } from "framer-motion";
import Image from "next/image";

const supporters = [
  { src: "/superteam-india.svg", alt: "Superteam India logo", href: "https://x.com/SuperteamIN" },
  { src: "/shipyardnl.svg", alt: "ShipyardNL logo", href: "https://x.com/ShipyardNL" },
];

export default function SupportedBy() {
  return (
    <section className="max-w-6xl mx-auto px-6">
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.6 }}
        className="flex flex-col items-center gap-5"
      >
        <p className="text-xs text-zinc-400 uppercase tracking-[0.15em]">
          Supported by
        </p>

        <div className="flex items-center gap-6 sm:gap-12">
          {supporters.map((supporter, index) => (
            <motion.a
              key={supporter.src}
              href={supporter.href}
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
            >
              <Image
                src={supporter.src}
                alt={supporter.alt}
                width={180}
                height={60}
                className="h-10 sm:h-16 w-auto object-contain grayscale hover:grayscale-0 transition-all duration-300 rounded-lg sm:rounded-xl"
              />
            </motion.a>
          ))}
        </div>
      </motion.div>
    </section>
  );
}
