"use client";

import Hero from "@/components/landing/Hero";
import Mission from "@/components/landing/Mission";
import Vision from "@/components/landing/Vision";
import Principles from "@/components/landing/Principles";
import CTASection from "@/components/landing/CTASection";
import Footer from "@/components/landing/Footer";
import Navbar from "@/components/ui/Navbar";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-zinc-900">
      <GradientBG />
       <Navbar />
      <main className="relative z-10 space-y-32 pb-40">
        <Hero />
        <Mission />
        <Vision />
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
    <div aria-hidden className="fixed inset-0 -z-20 bg-white">
      <div className="absolute inset-0 opacity-[0.35] blur-3xl bg-[radial-gradient(65%_40%_at_50%_0%,rgba(24,24,27,0.08),transparent)]" />
      <div className="absolute inset-0 opacity-[0.25] bg-[radial-gradient(40%_40%_at_20%_20%,rgba(113,113,122,0.08),transparent)]" />
    </div>
  );
}

