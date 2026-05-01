"use client";

import { usePrivy } from "@privy-io/react-auth";

export default function LoginScreen() {
  const { login } = usePrivy();

  return (
    <div className="min-h-screen bg-white flex">
      <style jsx>{`
        @keyframes fadeLeft {
          from { opacity: 0; transform: translateX(-12px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        .fade-up  { animation: fadeLeft 0.5s ease-out forwards; }
        .delay-1  { animation-delay: 0.08s; opacity: 0; }
        .delay-2  { animation-delay: 0.18s; opacity: 0; }
        .delay-3  { animation-delay: 0.28s; opacity: 0; }

        @keyframes drift {
          0%, 100% { transform: translateY(0px) translateX(0px); }
          33%       { transform: translateY(-8px) translateX(4px); }
          66%       { transform: translateY(4px) translateX(-4px); }
        }
        .drift { animation: drift 12s ease-in-out infinite; }

        @keyframes shimmer {
          from { transform: translateX(-100%); }
          to   { transform: translateX(100%); }
        }
        .btn-shimmer:hover .shimmer-layer {
          animation: shimmer 0.7s ease-out;
        }
      `}</style>

      {/* ── Left panel ── */}
      <div className="w-full lg:w-[42%] xl:w-[38%] flex flex-col justify-center px-6 sm:px-10 lg:px-16 xl:px-20 py-10 lg:py-16">
        <div className="w-full max-w-[280px] sm:max-w-[340px] space-y-8">

          {/* Brand */}
          <div className="fade-up flex items-center gap-2.5">
            <img src="/zelana-no-circle-no-padding.svg" alt="Zelana" className="w-7 sm:w-9 h-auto" />
          </div>

          {/* Headline */}
          <div className="fade-up delay-1 space-y-2 sm:space-y-3">
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-zinc-900 leading-snug">
              Private by default.<br />
              <span className="text-zinc-400">Yours alone.</span>
            </h1>
            <p className="text-sm sm:text-base text-zinc-400 leading-relaxed">
              ZK-powered transfers on Solana. Sign in to access your shielded wallet.
            </p>
          </div>

          <button
            onClick={login}
            className="fade-up delay-2 btn-shimmer group relative w-full overflow-hidden bg-zinc-900 hover:bg-zinc-800 text-white py-3 rounded-xl text-sm font-medium tracking-wide transition-all duration-200 shadow-sm hover:shadow-lg hover:shadow-zinc-900/20 active:scale-[0.98]"
          >
            <span className="shimmer-layer absolute inset-0 bg-gradient-to-r from-transparent via-white/6 to-transparent" />
            <span className="relative flex items-center justify-center gap-2">
              <svg className="w-4 h-4 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M18 12H9m0 0l3-3m-3 3l3 3" />
              </svg>
              Sign in
            </span>
          </button>
        </div>
      </div>

      {/* ── Right panel ── */}
      <div className="hidden lg:block lg:w-[58%] xl:w-[62%] relative overflow-hidden bg-[#0f0f10]">
        {/* Ambient glows */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-zinc-700/20 blur-[120px]" />
        <div className="absolute top-1/4 right-1/4 w-[300px] h-[300px] rounded-full bg-emerald-950/10 blur-[80px] drift" />

        {/* Mountains */}
        <svg className="absolute bottom-0 left-0 w-full" viewBox="0 0 1440 420" preserveAspectRatio="none" fill="none">
          <path d="M0 290 L130 190 L260 250 L390 160 L520 220 L650 140 L780 200 L910 120 L1040 180 L1170 100 L1300 160 L1440 120 L1440 420 L0 420 Z" fill="#27272a" opacity="0.4" />
          <path d="M0 330 L90 265 L190 295 L300 245 L410 285 L510 225 L620 270 L730 205 L840 255 L950 190 L1060 240 L1170 175 L1280 225 L1380 165 L1440 195 L1440 420 L0 420 Z" fill="#1c1c1e" opacity="0.7" />
          <path d="M0 370 L70 325 L160 345 L260 305 L360 335 L460 295 L560 320 L660 280 L760 310 L860 265 L960 295 L1060 255 L1160 285 L1260 245 L1360 275 L1440 250 L1440 420 L0 420 Z" fill="#111113" />
        </svg>

        {/* Subtle grid */}
        <div className="absolute inset-0 opacity-[0.025]" style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
          backgroundSize: '60px 60px'
        }} />

        {/* Center logo */}
        <div className="absolute inset-0 flex items-center justify-center">
          <img src="/zelana-no-circle-no-padding.svg" alt="Zelana" className="w-16 opacity-[0.18]" />
        </div>

        {/* Bottom tag */}
        <div className="absolute bottom-8 left-0 right-0 flex justify-center">
          <span className="text-[10px] tracking-[0.25em] uppercase text-white/20">
            Zero-knowledge · Private · Solana
          </span>
        </div>
      </div>
    </div>
  );
}