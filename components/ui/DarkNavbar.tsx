"use client";

import { usePathname } from "next/navigation";
import { useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import Link from "next/link";

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/explorer", label: "Explorer" },
  { href: "/network", label: "Network" },
  { href: "/proofs", label: "Proofs" },
];

function NavLink({ href, children, isActive }: { href: string; children: React.ReactNode; isActive: boolean }) {
  return (
    <Link href={href} className="relative px-3 py-2 text-sm font-medium text-white/60 hover:text-white transition-colors">
      <span className="relative z-10">{children}</span>
      {isActive && (
        <motion.span
          layoutId="dark-navbar-pill"
          className="absolute inset-0 rounded-full bg-white/10"
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
        />
      )}
    </Link>
  );
}

function DarkNavbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // Check if path starts with a route (for nested routes like /explorer/accounts)
  const isActiveRoute = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <header className="sticky top-0 z-40 border-b border-white/5 bg-[#0a0a0a]/80 backdrop-blur-xl">
      <nav className="max-w-7xl mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2.5 transition-opacity hover:opacity-80">
          <Image 
            src="/logo-name-2.png" 
            alt="Zelana logo" 
            width={100} 
            height={100}
            className="brightness-0 invert"
          />
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-1">
          {NAV_LINKS.map((link) => (
            <NavLink key={link.href} href={link.href} isActive={isActiveRoute(link.href)}>
              {link.label}
            </NavLink>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-2">
          <Link 
            href="https://form.typeform.com/to/akKCUvuh" 
            className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white hover:bg-white/10 transition-colors"
          >
            Contact
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden inline-flex items-center justify-center rounded-md p-2 text-white/60 hover:bg-white/10 hover:text-white"
          aria-label="Menu"
          onClick={() => setOpen((v) => !v)}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            {open ? (
              <path d="M6 6l12 12M6 18L18 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            ) : (
              <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            )}
          </svg>
        </button>
      </nav>

      {/* Mobile Navigation */}
      {open && (
        <div className="md:hidden border-t border-white/5 bg-[#0a0a0a]/95 backdrop-blur-xl">
          <div className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-4">
            {NAV_LINKS.map((link) => (
              <Link 
                key={link.href} 
                href={link.href} 
                onClick={() => setOpen(false)}
                className={`rounded-lg px-4 py-3 text-sm font-medium transition-colors ${
                  isActiveRoute(link.href) 
                    ? 'bg-white/10 text-white' 
                    : 'text-white/60 hover:bg-white/5 hover:text-white'
                }`}
              >
                {link.label}
              </Link>
            ))}
            <hr className="my-2 border-white/10" />
            <Link 
              href="https://form.typeform.com/to/akKCUvuh" 
              onClick={() => setOpen(false)}
              className="rounded-lg border border-white/10 px-4 py-3 text-sm font-medium text-white/80 hover:bg-white/5 text-center"
            >
              Contact Us
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}

export default DarkNavbar;
