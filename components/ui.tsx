"use client";

import { animate, motion, useInView, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";

export const EASE = [0.22, 1, 0.36, 1] as const;

/** Scroll-reveal wrapper. Opacity+translate only (GPU friendly), skipped for reduced-motion users. */
export function Reveal({ children, delay = 0, y = 18, className }: { children: ReactNode; delay?: number; y?: number; className?: string }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduce ? false : { opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.6, delay, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}

export function CountUp({ to, decimals = 0, suffix = "", prefix = "" }: { to: number; decimals?: number; suffix?: string; prefix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const reduce = useReducedMotion();
  const [v, setV] = useState(reduce ? to : 0);
  useEffect(() => {
    if (!inView || reduce) return;
    const c = animate(0, to, { duration: 1.4, ease: EASE, onUpdate: (x) => setV(x) });
    return () => c.stop();
  }, [inView, to, reduce]);
  return (
    <span ref={ref} className="tabular-nums">
      {prefix}
      {v.toFixed(decimals)}
      {suffix}
    </span>
  );
}

export function SectionHead({ eyebrow, title, sub }: { eyebrow: string; title: ReactNode; sub?: ReactNode }) {
  return (
    <Reveal className="mx-auto mb-12 max-w-2xl text-center">
      <p className="hud-label mb-3 text-signal">{eyebrow}</p>
      <h2 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h2>
      {sub && <p className="mt-4 text-pretty text-muted">{sub}</p>}
    </Reveal>
  );
}

/** Animated circular risk gauge. Colour encodes verdict, number + label carry the same meaning (not colour-only). */
export function RiskRing({ value, verdict, size = 168 }: { value: number; verdict: "safe" | "suspicious" | "scam"; size?: number }) {
  const reduce = useReducedMotion();
  const color = verdict === "scam" ? "var(--danger)" : verdict === "suspicious" ? "var(--warn)" : "var(--signal)";
  const r = size / 2 - 12;
  const c = 2 * Math.PI * r;
  const [shown, setShown] = useState(reduce ? value : 0);
  useEffect(() => {
    if (reduce) {
      setShown(value);
      return;
    }
    const ctl = animate(0, value, { duration: 1.1, ease: EASE, onUpdate: (x) => setShown(Math.round(x)) });
    return () => ctl.stop();
  }, [value, reduce]);
  return (
    <div className="relative grid place-items-center" style={{ width: size, height: size }} role="img" aria-label={`Risk score ${value} out of 100, verdict ${verdict}`}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="10" />
        {Array.from({ length: 40 }).map((_, i) => {
          const a = (i / 40) * Math.PI * 2;
          return (
            <line
              key={i}
              x1={size / 2 + Math.cos(a) * (r + 9)}
              y1={size / 2 + Math.sin(a) * (r + 9)}
              x2={size / 2 + Math.cos(a) * (r + 12)}
              y2={size / 2 + Math.sin(a) * (r + 12)}
              stroke="rgba(255,255,255,0.12)"
              strokeWidth="1"
            />
          );
        })}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: reduce ? c * (1 - value / 100) : c }}
          animate={{ strokeDashoffset: c * (1 - value / 100) }}
          transition={{ duration: 1.1, ease: EASE }}
          style={{ filter: `drop-shadow(0 0 10px ${color})` }}
        />
      </svg>
      <div className="absolute text-center">
        <div className={`font-mono font-semibold tabular-nums ${size < 130 ? "text-3xl" : "text-4xl"}`} style={{ color }}>
          {shown}
        </div>
        {size >= 130 && <div className="hud-label mt-1">risk / 100</div>}
      </div>
    </div>
  );
}

/** Colours the user's own words by how much each one pushed the ML model toward "scam" (red) or "safe" (green). */
export function HeatText({ words, active = true }: { words: { word: string; weight: number }[]; active?: boolean }) {
  const max = Math.max(0.0001, ...words.map((w) => Math.abs(w.weight)));
  return (
    <p className="text-pretty leading-[1.9] text-fg/90">
      {words.map((w, i) => {
        const k = Math.min(1, Math.abs(w.weight) / max);
        const hot = active && k > 0.28;
        const bg = !hot ? "transparent" : w.weight > 0 ? `rgba(255,77,94,${0.12 + k * 0.38})` : `rgba(61,255,160,${0.1 + k * 0.3})`;
        return (
          <span
            key={i}
            className="tok-hot"
            style={{ background: bg, transitionDelay: `${Math.min(i * 18, 900)}ms` }}
            title={hot ? `${w.weight > 0 ? "+" : ""}${w.weight.toFixed(2)} ${w.weight > 0 ? "toward scam" : "toward safe"}` : undefined}
          >
            {w.word}{" "}
          </span>
        );
      })}
    </p>
  );
}

export function VerdictBadge({ verdict, label }: { verdict: "safe" | "suspicious" | "scam"; label: string }) {
  const cls =
    verdict === "scam"
      ? "border-danger/50 bg-danger/10 text-danger"
      : verdict === "suspicious"
        ? "border-warn/50 bg-warn/10 text-warn"
        : "border-signal/50 bg-signal/10 text-signal";
  return (
    <span className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 font-mono text-xs font-medium uppercase tracking-wider ${cls}`}>
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-current opacity-60" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-current" />
      </span>
      {label}
    </span>
  );
}
