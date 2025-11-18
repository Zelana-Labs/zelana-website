"use client";

import Image from "next/image";
import { X, Github } from "lucide-react";
import Hero from "@/components/landing/Hero";
import Mission from "@/components/landing/Mission";
import Vision from "@/components/landing/Vision";
import Principles from "@/components/landing/Principles";
import CTASection from "@/components/landing/CTASection";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-zinc-900">
      <GradientBG />

      <main className="relative z-10 space-y-32 pb-40">
        <Hero />
        <Mission />
        <Vision />
        <Principles />
        <CTASection />
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-200 bg-white/90 backdrop-blur">
        <div className="max-w-6xl mx-auto px-6 py-10 text-sm text-zinc-500 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3 text-zinc-600">
            <Image src="/logo.png" alt="Zelana logo" width={32} height={32} className="rounded-lg border border-zinc-200" />
            <span>© {new Date().getFullYear()} Zelana Rollup. All rights reserved.</span>
          </div>
          <div className="flex items-center gap-5">
            {/* GitHub */}
            <a
              href="https://github.com/zelanalabs"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 hover:text-zinc-900 transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 16 16"
                className="h-4 w-4"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M8 0C3.58 0 0 3.58 0 8c0 3.54
        2.29 6.53 5.47 7.59.4.07.55-.17.55-.38
        0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52
        -.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87
        2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95
        0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12
        0 0 .67-.21 2.2.82.64-.18 1.32-.27
        2-.27.68 0 1.36.09 2 .27 1.53-1.04
        2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82
        1.27.82 2.15 0 3.07-1.87 3.75-3.65
        3.95.29.25.54.73.54 1.48 0 1.07-.01
        1.93-.01 2.19 0 .21.15.46.55.38A8.013
        8.013 0 0 0 16 8c0-4.42-3.58-8-8-8Z"
                />
              </svg>
            </a>

            {/* X / Twitter */}
            <a
              href="https://x.com/zelanalabs"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 hover:text-zinc-900 transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 1200 1227"
                className="h-4 w-4"
                fill="currentColor"
              >
                <path d="M714.163 519.284L1160.89 0h-105.24L666.97 454.86 412.684 0H0l468.492 
      809.016L0 1226.37h105.237l409.016-476.11 268.079 476.11H1200L714.163 
      519.284zm-144.77 168.49l-47.43-82.25L143.14 80.14h201.65l228.21 
      395.442 47.43 82.25 394.102 683.39H812.883L569.393 
      687.774z"/>
              </svg>
            </a>
          </div>

        </div>
      </footer>
    </div>
  );
}

/* ----------------------- UI bits ----------------------- */

function GradientBG() {
  return (
    <div aria-hidden className="fixed inset-0 -z-20 bg-white">
      <div className="absolute inset-0 opacity-[0.35] blur-3xl bg-[radial-gradient(65%_40%_at_50%_0%,rgba(24,24,27,0.08),transparent)]" />
      <div className="absolute inset-0 opacity-[0.25] bg-[radial-gradient(40%_40%_at_20%_20%,rgba(113,113,122,0.08),transparent)]" />
    </div>
  );
}

