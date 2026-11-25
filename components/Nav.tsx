"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldCheck, Menu, X } from "lucide-react";

const LINKS = [
  { href: "/analyze", label: "Analyzer" },
  { href: "/live", label: "Live" },
  { href: "/benchmark", label: "Benchmark" },
  { href: "/architecture", label: "Architecture" },
];

export default function Nav() {
  const path = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-ink/70 backdrop-blur-xl">
      <nav aria-label="Primary" className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="group flex items-center gap-2.5 font-semibold tracking-tight">
          <span className="relative grid h-9 w-9 place-items-center rounded-xl border border-signal/40 bg-signal/10 transition group-hover:shadow-[0_0_24px_rgba(61,255,160,0.45)]">
            <ShieldCheck className="h-5 w-5 text-signal" aria-hidden />
          </span>
          <span>
            Indic <span className="text-signal">Scam</span> Shield
          </span>
        </Link>

        <ul className="hidden items-center gap-1 md:flex">
          {LINKS.map((l) => {
            const active = path === l.href;
            return (
              <li key={l.href}>
                <Link
                  href={l.href}
                  aria-current={active ? "page" : undefined}
                  className={`relative inline-flex min-h-[44px] items-center rounded-lg px-4 text-sm transition ${active ? "text-fg" : "text-muted hover:text-fg"}`}
                >
                  {l.label}
                  {active && <motion.span layoutId="nav-underline" className="absolute inset-x-3 bottom-1.5 h-px bg-signal" />}
                </Link>
              </li>
            );
          })}
          <li className="ml-2">
            <Link href="/analyze" className="btn-primary !min-h-[40px] !px-4 !py-2 text-sm">
              Try it free
            </Link>
          </li>
        </ul>

        <button
          type="button"
          className="grid h-11 w-11 place-items-center rounded-lg border border-line md:hidden"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </nav>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="overflow-hidden border-t border-line md:hidden"
          >
            <ul className="mx-auto flex max-w-6xl flex-col gap-1 p-3">
              {LINKS.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    onClick={() => setOpen(false)}
                    className="flex min-h-[48px] items-center rounded-lg px-4 text-fg hover:bg-white/5"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
