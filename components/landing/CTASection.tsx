"use client";

import SectionIntro from "./SectionIntro";
import { PrimaryButton, GhostButton } from "./Buttons";

export default function CTASection() {
  return (
    <section className="max-w-6xl mx-auto px-6">
      <div className="relative overflow-hidden rounded-3xl border border-zinc-200 bg-gradient-to-r from-white via-zinc-100 to-zinc-200 p-12 md:p-16 shadow-[0_40px_140px_rgba(15,23,42,0.08)]">
        <div aria-hidden className="absolute inset-0 opacity-40 blur-3xl bg-gradient-to-r from-white via-transparent to-zinc-200" />
        <div className="relative z-10 space-y-6">
          <SectionIntro
            eyebrow="Stay in the loop"
            title="Want to help define Solana’s privacy layer?"
            description="We’re inviting early partners to review specs, co-design governance, and pressure-test the first circuits."
          />
          <div className="flex flex-wrap gap-3">
            <PrimaryButton href="mailto:hello@zelana.xyz">Say hello</PrimaryButton>
            <GhostButton href="/app">Track progress</GhostButton>
          </div>
        </div>
      </div>
    </section>
  );
}

