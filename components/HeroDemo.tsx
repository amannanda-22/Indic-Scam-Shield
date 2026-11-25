"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Cpu, Link2, ShieldAlert, ShieldCheck } from "lucide-react";
import { EASE, HeatText, RiskRing, VerdictBadge } from "@/components/ui";

export interface DemoItem {
  text: string;
  lang: string;
  verdict: "safe" | "suspicious" | "scam";
  risk: number;
  type: string | null;
  words: { word: string; weight: number }[];
  tools: { tool: string; summary: string }[];
}

type Phase = "scan" | "result";

/** Auto-playing product demo built from REAL engine outputs computed at build/request time on the server. */
export default function HeroDemo({ items }: { items: DemoItem[] }) {
  const reduce = useReducedMotion();
  const [i, setI] = useState(0);
  const [phase, setPhase] = useState<Phase>(reduce ? "result" : "scan");
  const [toolsShown, setToolsShown] = useState(reduce ? 99 : 0);
  const paused = useRef(false);
  const item = items[i % items.length];

  useEffect(() => {
    if (reduce) return;
    setPhase("scan");
    setToolsShown(0);
    const timers: ReturnType<typeof setTimeout>[] = [];
    item.tools.forEach((_, k) => timers.push(setTimeout(() => setToolsShown(k + 1), 350 + k * 330)));
    timers.push(setTimeout(() => setPhase("result"), 350 + item.tools.length * 330 + 250));
    timers.push(
      setTimeout(() => {
        if (!paused.current) setI((x) => x + 1);
      }, 350 + item.tools.length * 330 + 5200),
    );
    return () => timers.forEach(clearTimeout);
  }, [i, item, reduce]);

  const Icon = item.verdict === "safe" ? ShieldCheck : ShieldAlert;
  const accent = item.verdict === "scam" ? "var(--danger)" : item.verdict === "suspicious" ? "var(--warn)" : "var(--signal)";

  return (
    <div
      className="glass scanlines relative overflow-hidden rounded-[28px] p-5 shadow-[0_30px_90px_-30px_rgba(61,255,160,0.35)] sm:p-6"
      onMouseEnter={() => (paused.current = true)}
      onMouseLeave={() => (paused.current = false)}
      aria-label="Live demo of the analyzer on sample messages"
    >
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-widest text-muted">
          <span className="flex gap-1.5">
            <i className="h-2.5 w-2.5 rounded-full bg-danger/70" />
            <i className="h-2.5 w-2.5 rounded-full bg-warn/70" />
            <i className="h-2.5 w-2.5 rounded-full bg-signal/70" />
          </span>
          <span className="ml-2">incoming · {item.lang}</span>
        </div>
        <div className="flex gap-1.5" aria-hidden>
          {items.map((_, k) => (
            <span key={k} className={`h-1.5 rounded-full transition-all duration-500 ${k === i % items.length ? "w-6 bg-signal" : "w-1.5 bg-white/15"}`} />
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.4, ease: EASE }}>
          <div className="relative rounded-2xl border border-line bg-black/35 p-4 text-[0.92rem]">
            <HeatText words={item.words} active={phase === "result"} />
            {phase === "scan" && !reduce && (
              <div className="pointer-events-none absolute inset-x-0 h-14 animate-scan bg-gradient-to-b from-transparent via-signal/25 to-transparent" aria-hidden />
            )}
          </div>

          <ul className="mt-4 space-y-1.5 font-mono text-[11.5px]" aria-label="Agent tool calls">
            {item.tools.map((t, k) => (
              <motion.li
                key={t.tool}
                initial={false}
                animate={{ opacity: k < toolsShown ? 1 : 0.18, x: k < toolsShown ? 0 : -6 }}
                transition={{ duration: 0.3 }}
                className="flex min-w-0 gap-2"
              >
                {t.tool === "url_forensics" ? <Link2 className="mt-0.5 h-3 w-3 shrink-0 text-cyan" /> : <Cpu className="mt-0.5 h-3 w-3 shrink-0 text-signal" />}
                <span className="min-w-0 truncate">
                  <span className="text-signal">{t.tool}</span> <span className="text-muted">→ {t.summary}</span>
                </span>
              </motion.li>
            ))}
          </ul>

          <AnimatePresence>
            {phase === "result" && (
              <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: EASE }}
                className="mt-5 flex items-center gap-5 rounded-2xl border p-4"
                style={{ borderColor: `color-mix(in srgb, ${accent} 35%, transparent)`, background: `color-mix(in srgb, ${accent} 7%, transparent)` }}
              >
                <RiskRing value={item.risk} verdict={item.verdict} size={104} />
                <div className="min-w-0">
                  <VerdictBadge verdict={item.verdict} label={item.verdict === "scam" ? "Likely scam" : item.verdict === "suspicious" ? "Suspicious" : "Looks safe"} />
                  <p className="mt-2 flex items-center gap-2 text-sm font-medium">
                    <Icon className="h-4 w-4 shrink-0" style={{ color: accent }} aria-hidden />
                    <span className="truncate">{item.type ?? "Routine notice - nothing alarming"}</span>
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
