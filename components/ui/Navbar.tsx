"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import Image from "next/image";

// Simple helper to style active links
function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  const pathname = usePathname();
  const isActive = pathname === href;
  return (
    <Link
      href={href}
      className={
        "px-3 py-2 rounded-md text-sm font-medium transition-colors " +
        (isActive
          ? "bg-gray-900 text-white"
          : "text-gray-700 hover:text-gray-900 hover:bg-gray-100")
      }
    >
      {children}
    </Link>
  );
}

export default function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="border-b bg-white/80 backdrop-blur sticky top-0 z-40">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-14 items-center justify-between">
          {/* Left: Brand */}
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2">
              {/* logo circle */}
                <Image
                src="/logo.png"
                alt="Zelana logo"
                width={50}
                height={50}
                className="rounded"
              />
              <span className="text-base font-semibold tracking-tight">Zelana</span>
            </Link>
          </div>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-1">
            <NavLink href="/">Home</NavLink>
            <NavLink href="/proofs">Proofs</NavLink>
            {/* add more: */}
            {/* <NavLink href="/tx">Transactions</NavLink> */}
            {/* <NavLink href="/docs">Docs</NavLink> */}
          </div>

          {/* Right: actions (optional) */}
          <div className="hidden md:flex items-center gap-2">
            {/* placeholder for wallet/connect/button */}
            <Link
              href="https://github.com/Zelana-Labs"
              className="px-3 py-2 text-sm rounded-md border hover:bg-gray-50"
              target="_blank"
            >
              GitHub
            </Link>
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden inline-flex items-center justify-center rounded-md p-2 hover:bg-gray-100"
            aria-label="Menu"
            onClick={() => setOpen(!open)}
          >
            {/* burger icon */}
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* Mobile panel */}
        {open && (
          <div className="md:hidden pb-3 border-t">
            <div className="flex flex-col gap-1 pt-3">
              <NavLink href="/">Home</NavLink>
              <NavLink href="/proofs">Proofs</NavLink>
              {/* more mobile links here */}
              <Link
                href="https://github.com/Zelana-Labs"
                className="px-3 py-2 rounded-md text-sm border hover:bg-gray-50"
                target="_blank"
              >
                GitHub
              </Link>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
