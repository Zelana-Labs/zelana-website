"use client";

import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import Link from "next/link";
import { isDemoMode } from "@/lib/demo-mode";

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/explorer", label: "Explorer" },
  { href: "/network", label: "Network" },
  { href: "/proofs", label: "Proofs" },
];

// Routes that should redirect to /demo in production
const DEMO_PROTECTED_ROUTES = ["/dashboard", "/explorer", "/network", "/proofs"];

function NavLink({ href, children, isActive }: { href: string; children: React.ReactNode; isActive: boolean }) {
  const router = useRouter();
  
  const handleClick = (e: React.MouseEvent) => {
    // Check if this is a demo-protected route and we're in demo mode
    if (isDemoMode() && DEMO_PROTECTED_ROUTES.includes(href)) {
      e.preventDefault();
      router.push('/demo');
    }
  };

  return (
    <Link 
      href={href} 
      onClick={handleClick}
      className="relative px-3 py-2 text-sm font-medium text-zinc-600 hover:text-zinc-900 transition-colors"
    >
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
  const router = useRouter();
  const [open, setOpen] = useState(false);

  // Check if path starts with a route (for nested routes like /explorer/accounts)
  const isActiveRoute = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  // Handle mobile link clicks with demo mode check
  const handleMobileLinkClick = (href: string) => {
    setOpen(false);
    if (isDemoMode() && DEMO_PROTECTED_ROUTES.includes(href)) {
      router.push('/demo');
    } else {
      router.push(href);
    }
  };

  return (
    <header className="sticky top-0 z-40 border-b border-white/5 bg-white/80 backdrop-blur-xl">
      <nav className="max-w-7xl mx-auto flex h-18 items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2.5 transition-opacity hover:opacity-80">
          <Image 
            src="/logo-name-2.png" 
            alt="Zelana logo" 
            width={120} 
            height={120} 
          />
        </Link>

        {/* Desktop Navigation
        <div className="hidden md:flex items-center gap-1">
          {NAV_LINKS.map((link) => (
            <NavLink key={link.href} href={link.href} isActive={isActiveRoute(link.href)}>
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

        {/* Mobile Menu Button */}
        <button
          className="md:hidden inline-flex items-center justify-center rounded-md p-2 hover:bg-zinc-100"
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
        <div className="md:hidden border-t border-zinc-200 bg-white/95 backdrop-blur-xl">
          <div className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-4">
            {NAV_LINKS.map((link) => (
              <button 
                key={link.href} 
                onClick={() => handleMobileLinkClick(link.href)}
                className={`rounded-lg px-4 py-3 text-sm font-medium transition-colors text-left ${
                  isActiveRoute(link.href) 
                    ? 'bg-zinc-100 text-zinc-900' 
                    : 'text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900'
                }`}
              >
                {link.label}
              </button>
            ))}
            <hr className="my-2 border-zinc-200" />
            <Link 
              href="https://form.typeform.com/to/akKCUvuh" 
              onClick={() => setOpen(false)}
              className="rounded-lg border border-zinc-200 px-4 py-3 text-sm font-medium text-zinc-700 hover:bg-zinc-50 text-center"
            >
              Contact Us
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}

export default Navbar;
