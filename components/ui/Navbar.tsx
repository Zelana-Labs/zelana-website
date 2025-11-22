"use client";

import { usePathname } from "next/navigation";
import { useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import Link from "next/link";

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/proofs", label: "Proofs" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/explorer", label: "Explorer" },
];

function NavLink({ href, children, isActive }: { href: string; children: React.ReactNode; isActive: boolean }) {
  return (
    <Link href={href} className="relative px-3 py-2 text-sm font-medium text-zinc-600 hover:text-zinc-900 transition-colors">
      <span className="relative z-10">{children}</span>
      {isActive && (
        <motion.span
          layoutId="navbar-pill"
          className="absolute inset-0 rounded-full bg-zinc-900/5"
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
        />
      )}
    </Link>
  );
}

function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-white/40 bg-white/80 backdrop-blur-xl">
      <nav className="max-w-7xl mx-auto flex h-18 items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2.5 transition-opacity hover:opacity-80">
          <Image 
            src="/logo-name-2.png" 
            alt="Zelana logo" 
            width={120} 
            height={120} 
          />
        </Link>

        {/* Navbar links */}
        {/* <div className="hidden md:flex items-center gap-4">
          {NAV_LINKS.map((link) => (
            <NavLink key={link.href} href={link.href} isActive={pathname === link.href}>
              {link.label}
            </NavLink>
          ))}
        </div> */}

        <div className="hidden md:flex items-center gap-2">
          <Link 
            href="https://form.typeform.com/to/akKCUvuh" 
            className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-50 transition-colors"
          >
            Contact
          </Link>
        </div>

        <button
          className="md:hidden inline-flex items-center justify-center rounded-md p-2 hover:bg-zinc-100"
          aria-label="Menu"
          onClick={() => setOpen((v) => !v)}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
      </nav>

      {open && (
        <div className="md:hidden border-t border-zinc-200 bg-white/90">
          <div className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-4">
            {/* {NAV_LINKS.map((link) => (
              <NavLink key={link.href} href={link.href} isActive={pathname === link.href}>
                {link.label}
              </NavLink>
            ))} */}
            <Link href="https://form.typeform.com/to/akKCUvuh" className="rounded-md border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50">
              Contact us
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}

export default Navbar;