"use client";

import Card from "./Card";
import SectionIntro from "./SectionIntro";
import { ShieldCheck, LayoutGrid } from "lucide-react";

export default function Mission() {
  return (
    <section className="max-w-6xl mx-auto px-6 space-y-12">
      <SectionIntro
        eyebrow="Mission"
        title="Ship credible privacy without sacrificing Solana speed"
        description="We’re intentionally focusing on principles before product so the eventual experience is trustworthy, legible, and interoperable."
        centered
      />

      <div className="grid gap-8 md:grid-cols-2">
        <Card
          icon={<ShieldCheck className="h-5 w-5 text-zinc-900" />}
          title="Privacy as a utility"
          body="Encrypted rails should feel as simple as sending an SPL token. Think selective sharing, clear operator states, and fast confirmations."
        />
        <Card
          icon={<LayoutGrid className="h-5 w-5 text-zinc-900" />}
          title="Transparent intent"
          body="Before explorers or dashboards, we’re publishing the foundational principles, governance model, and disclosure policies."
        />
      </div>
    </section>
  );
}

