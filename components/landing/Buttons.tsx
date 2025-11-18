"use client";

import Link from "next/link";

type ButtonProps = {
  href: string;
  children: React.ReactNode;
  target?: string;
};

export function PrimaryButton({ href, children, target }: ButtonProps) {
  return (
    <Link
      href={href}
      target={target}
      className="inline-flex items-center justify-center rounded-2xl bg-zinc-900 px-5 py-3 text-sm font-semibold text-white shadow-[0_10px_35px_rgba(15,23,42,0.25)] transition hover:bg-black"
    >
      {children}
    </Link>
  );
}

export function GhostButton({ href, children, target }: ButtonProps) {
  return (
    <Link
      href={href}
      target={target}
      className="inline-flex items-center justify-center rounded-2xl border border-zinc-900/20 bg-white px-5 py-3 text-sm font-semibold text-zinc-900 transition hover:border-zinc-900/40 hover:bg-zinc-100"
    >
      {children}
    </Link>
  );
}

