"use client";

import Hero from "@/components/landing/Hero";
import Solutions from "@/components/landing/Solutions";
import Principles from "@/components/landing/Principles";
import SupportedBy from "@/components/landing/SupportedBy";
import CTASection from "@/components/landing/CTASection";
import Footer from "@/components/landing/Footer";
import Navbar from "@/components/ui/Navbar";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-zinc-900 overflow-x-clip">
      <GradientBG />
      <Navbar />
      <main className="relative z-10 space-y-16 md:space-y-20 pb-24">
        <Hero />
        <SupportedBy />
        <Solutions />
        <Principles />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
}

/* ----------------------- UI bits ----------------------- */

function GradientBG() {
  return (
    <div aria-hidden className="fixed inset-0 -z-20 bg-gradient-to-b from-white via-zinc-50/50 to-white">
      {/* Main gradient orbs */}
      <div className="absolute top-0 left-1/4 w-[800px] h-[600px] opacity-30 blur-[120px] bg-gradient-to-br from-zinc-200 via-zinc-100 to-transparent" />
      <div className="absolute bottom-0 right-1/4 w-[600px] h-[500px] opacity-20 blur-[100px] bg-gradient-to-tl from-zinc-300 via-zinc-200 to-transparent" />

      {/* Subtle noise texture */}
      <div className="absolute inset-0 opacity-[0.015] bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJhIiB4PSIwIiB5PSIwIj48ZmVUdXJidWxlbmNlIGJhc2VGcmVxdWVuY3k9Ii43NSIgc3RpdGNoVGlsZXM9InN0aXRjaCIgdHlwZT0iZnJhY3RhbE5vaXNlIi8+PGZlQ29sb3JNYXRyaXggdHlwZT0ic2F0dXJhdGUiIHZhbHVlcz0iMCIvPjwvZmlsdGVyPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbHRlcj0idXJsKCNhKSIvPjwvc3ZnPg==')]" />
    </div>
  );
}

