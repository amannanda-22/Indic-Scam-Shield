"use client";

import { motion, useInView, useReducedMotion } from "framer-motion";
import { useRef } from "react";
import { EASE } from "@/components/ui";

export interface Bar {
  label: string;
  sub?: string;
  value: number; // 0..1
  n?: number;
  tone?: "good" | "warn" | "bad" | "info";
  badge?: string;
}

const TONE: Record<NonNullable<Bar["tone"]>, string> = {
  good: "linear-gradient(90deg,#1fbf75,#3dffa0)",
  warn: "linear-gradient(90deg,#c98512,#ffb224)",
  bad: "linear-gradient(90deg,#c93a49,#ff4d5e)",
  info: "linear-gradient(90deg,#2aa6c9,#4dd8ff)",
};

export function BarList({ bars }: { bars: Bar[] }) {
  const ref = useRef<HTMLUListElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const reduce = useReducedMotion();
  return (
    <ul ref={ref} className="space-y-5">
      {bars.map((b, i) => (
        <li key={b.label}>
          <div className="mb-1.5 flex flex-wrap items-baseline justify-between gap-2">
            <p className="text-sm">
              {b.label}
              {b.badge && <span className="ml-2 rounded-md border border-warn/40 bg-warn/10 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-warn">{b.badge}</span>}
              {b.sub && <span className="block text-xs text-muted">{b.sub}</span>}
            </p>
            <p className="font-mono text-sm tabular-nums">
              {(b.value * 100).toFixed(1)}%
              {b.n !== undefined && <span className="ml-2 text-xs text-muted">n={b.n}</span>}
            </p>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-white/[0.06]" role="img" aria-label={`${b.label}: ${(b.value * 100).toFixed(1)} percent`}>
            <motion.div
              className="h-full rounded-full"
              style={{ background: TONE[b.tone ?? "good"], boxShadow: "0 0 18px rgba(61,255,160,0.25)" }}
              initial={{ width: reduce ? `${b.value * 100}%` : 0 }}
              animate={{ width: inView ? `${b.value * 100}%` : reduce ? `${b.value * 100}%` : 0 }}
              transition={{ duration: 1, delay: i * 0.08, ease: EASE }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

export function Confusion({ tp, fp, fn, tn, title }: { tp: number; fp: number; fn: number; tn: number; title: string }) {
  const total = tp + fp + fn + tn;
  const cell = (v: number, label: string, good: boolean) => (
    <div
      className="relative grid aspect-[4/3] place-items-center overflow-hidden rounded-xl border border-line"
      style={{ background: `color-mix(in srgb, ${good ? "var(--signal)" : "var(--danger)"} ${8 + (v / Math.max(1, total)) * 160}%, transparent)` }}
    >
      <div className="text-center">
        <p className="font-mono text-2xl font-semibold tabular-nums">{v}</p>
        <p className="hud-label mt-0.5 !text-[9px]">{label}</p>
      </div>
    </div>
  );
  return (
    <figure aria-label={title}>
      <figcaption className="hud-label mb-3">{title}</figcaption>
      <div className="grid grid-cols-[auto_1fr_1fr] items-center gap-2 text-center text-xs text-muted">
        <span />
        <span className="font-mono">pred: scam</span>
        <span className="font-mono">pred: safe</span>
        <span className="font-mono [writing-mode:vertical-rl] rotate-180">real scam</span>
        {cell(tp, "caught", true)}
        {cell(fn, "missed", false)}
        <span className="font-mono [writing-mode:vertical-rl] rotate-180">real safe</span>
        {cell(fp, "false alarm", false)}
        {cell(tn, "cleared", true)}
      </div>
    </figure>
  );
}
