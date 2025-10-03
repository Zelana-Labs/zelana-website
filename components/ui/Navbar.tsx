"use client";

import { Github } from "lucide-react";
import { usePathname } from "next/navigation";
import { useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import Link from "next/link";

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  const pathname = usePathname();
  const isActive = pathname === href;
  return (
    <Link
      href={href}
      className="relative px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 transition-colors"
    >
      <span className="relative z-10">{children}</span>
      {isActive && (
        <motion.span
          layoutId="nav-underline"
          className="absolute inset-0 rounded-md bg-gray-900/90"
          style={{ zIndex: 0 }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
        />
      )}
      {isActive && (
        <span className="absolute inset-0 rounded-md text-white flex items-center justify-center text-sm font-medium">
          {children}
        </span>
      )}
    </Link>
  );
}

function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="border-b bg-white/70 backdrop-blur-md sticky top-0 z-40">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2">
              <Image
                src="/logo.png"
                alt="Zelana logo"
                width={36}
                height={36}
                className="rounded-lg"
              />
              <span className="text-base font-semibold tracking-tight">Zelana</span>
            </Link>
          </div>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-1">
            <NavLink href="/">Home</NavLink>
            <NavLink href="/proofs">Proofs</NavLink>
            <NavLink href="/dashboard">Dashboard</NavLink>
          </div>

          {/* Actions */}
          <div className="hidden md:flex items-center gap-2">
            <Link
              href="https://github.com/Zelana-Labs"
              className="px-3 py-2 text-sm rounded-md border bg-white/70 hover:bg-white inline-flex items-center gap-1"
              target="_blank"
            >
              <Github className="h-4 w-4" /> GitHub
            </Link>
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden inline-flex items-center justify-center rounded-md p-2 hover:bg-gray-100"
            aria-label="Menu"
            onClick={() => setOpen((v) => !v)}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path
                d="M4 7h16M4 12h16M4 17h16"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        {/* Mobile panel */}
        {open && (
          <div className="md:hidden pb-3 border-t">
            <div className="flex flex-col gap-1 pt-3">
              <NavLink href="/">Home</NavLink>
              <NavLink href="/proofs">Proofs</NavLink>
              <NavLink href="/dashboard">Dashboard</NavLink>
              <Link
                href="https://github.com/Zelana-Labs"
                className="px-3 py-2 rounded-md text-sm border bg-white/70 hover:bg-white inline-flex items-center gap-1"
                target="_blank"
              >
                <Github className="h-4 w-4" /> GitHub
              </Link>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}

export default Navbar;
