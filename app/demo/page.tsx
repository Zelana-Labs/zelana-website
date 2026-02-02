"use client";

import Link from "next/link";
import Image from "next/image";
import { getDemoConfig } from "@/lib/demo-mode";
import { useRef , useState} from "react";

export default function DemoPage() {
  const config = getDemoConfig();

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [showCover, setShowCover] = useState(true);

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col">
      <header className="w-full border-b border-white/5">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <Link href="/" className="transition-opacity hover:opacity-80">
            <Image
              src="/logo-name-2.png"
              alt="Zelana"
              width={100}
              height={28}
              className="invert"
            />
          </Link>
          <Link
            href="/"
            className="flex items-center gap-2 text-sm text-white/60 hover:text-white transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Home
          </Link>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-4 py-12">
        <div className="w-full max-w-5xl mx-auto space-y-10">
          
          <div className="flex justify-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-full">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
              </span>
              <span className="text-sm font-medium text-white/80 uppercase tracking-wider">
                {config.comingSoonText}
              </span>
            </div>
          </div>

          <div className="text-center space-y-3">
            <h1 className="text-3xl sm:text-4xl font-semibold text-white">
              Zelana L2 Demo
            </h1>
            <p className="text-white/50 text-base sm:text-lg">
              Privacy-focused ZK Rollup on Solana
            </p>
          </div>
          
          <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-white/5 border border-white/10 shadow-lg">
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              src="/demo/zelanademo.webm"
              playsInline
              preload="metadata"
              controls
            />
            {showCover && (
            <div
              onClick={() => {
                setShowCover(false);
                if (videoRef.current) {
                  videoRef.current.currentTime = 6;
                  videoRef.current.play();
                }
              }}
              className="absolute inset-0 z-10 flex items-center justify-center bg-black/80 cursor-pointer transition-opacity"
            >
              <div className="flex flex-col items-center gap-4">
                <Image
                  src="/og-metadata-image.png"
                  alt="Zelana"
                  width={120}
                  height={34}
                  className="invert opacity-90"
                />
                <span className="text-white/70 text-sm uppercase tracking-widest">
                  Click to Play Demo
                </span>
              </div>
            </div>
          )}
          </div>

          <div className="flex justify-center">
            <a
              href={config.twitterUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2.5 px-6 py-3 bg-white text-black rounded-xl font-medium hover:bg-white/90 transition-colors"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
              Follow for Updates
            </a>
          </div>

        </div>
      </main>

      <footer className="border-t border-white/5">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-xs text-white/20 text-center uppercase tracking-widest">
            Privacy-focused ZK Rollup on Solana
          </div>
        </div>
      </footer>
    </div>
  );
}
