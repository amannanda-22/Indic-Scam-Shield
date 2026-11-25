"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  AlertTriangle, BookOpenCheck, CheckCircle2, ClipboardCopy, Cpu, ExternalLink, Globe2, Link2, Loader2,
  PhoneCall, ScanSearch, ShieldAlert, ShieldCheck, Sparkles, Terminal, Trash2,
} from "lucide-react";
import { EASE, HeatText, RiskRing, VerdictBadge } from "@/components/ui";
import { SAMPLES } from "@/lib/samples";
import type { Analysis, TraceStep } from "@/lib/engine/types";
import { TYPE_LABEL, VERDICT_LABEL, UI, type UiLang } from "@/lib/engine/i18n";

const LANGS: { id: UiLang; label: string }[] = [
  { id: "en", label: "English" },
  { id: "hi", label: "हिंदी" },
  { id: "te", label: "తెలుగు" },
];

const TOOL_META: Record<string, { label: string; icon: typeof Cpu }> = {
  detect_language: { label: "detect_language", icon: Globe2 },
  extract_entities: { label: "extract_entities", icon: ScanSearch },
  ml_classifier: { label: "ml_classifier", icon: Cpu },
  rule_signals: { label: "rule_signals", icon: ShieldAlert },
  url_forensics: { label: "url_forensics", icon: Link2 },
  scam_type: { label: "scam_type", icon: Sparkles },
  retrieve_advisories: { label: "retrieve_advisories", icon: BookOpenCheck },
  fuse_risk: { label: "fuse_risk", icon: Terminal },
  compose_explanation: { label: "compose_explanation", icon: Sparkles },
  llm_explain: { label: "llm_explain", icon: Sparkles },
};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export default function Analyzer() {
  const reduce = useReducedMotion();
  const [text, setText] = useState("");
  const [lang, setLang] = useState<UiLang>("en");
  const [running, setRunning] = useState(false);
  const [steps, setSteps] = useState<TraceStep[]>([]);
  const [result, setResult] = useState<Analysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [history, setHistory] = useState<{ t: string; risk: number; v: string }[]>([]);
  const resultRef = useRef<HTMLDivElement>(null);
  const abort = useRef<AbortController | null>(null);

  useEffect(() => {
    try {
      const h = sessionStorage.getItem("iss-history");
      if (h) setHistory(JSON.parse(h));
    } catch {
      /* storage can be blocked - the app works without it */
    }
  }, []);

  const run = useCallback(
    async (override?: string) => {
      const body = (override ?? text).trim();
      if (body.length < 3 || running) return;
      abort.current?.abort();
      const ctrl = new AbortController();
      abort.current = ctrl;
      setRunning(true);
      setError(null);
      setResult(null);
      setSteps([]);
      try {
        const res = await fetch("/api/analyze", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ text: body, lang }),
          signal: ctrl.signal,
        });
        if (!res.ok || !res.body) {
          const j = await res.json().catch(() => ({}));
          throw new Error(j.error ?? `Request failed (${res.status})`);
        }
        const reader = res.body.getReader();
        const dec = new TextDecoder();
        let buf = "";
        let final: Analysis | null = null;
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          buf += dec.decode(value, { stream: true });
          let nl: number;
          while ((nl = buf.indexOf("\n")) >= 0) {
            const line = buf.slice(0, nl).trim();
            buf = buf.slice(nl + 1);
            if (!line) continue;
            const ev = JSON.parse(line);
            if (ev.type === "step") {
              setSteps((s) => [...s, ev.step]);
              if (!reduce) await sleep(170); // pace the real trace so humans can follow the agent's tool calls
            } else if (ev.type === "result") final = ev.analysis;
            else if (ev.type === "error") throw new Error(ev.message);
          }
        }
        if (final) {
          setResult(final);
          try {
            const next = [{ t: body.slice(0, 70), risk: final.riskScore, v: final.verdict }, ...history].slice(0, 5);
            setHistory(next);
            sessionStorage.setItem("iss-history", JSON.stringify(next));
          } catch {
            /* ignore */
          }
          setTimeout(() => resultRef.current?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" }), 120);
        }
      } catch (e) {
        if ((e as Error).name !== "AbortError") setError((e as Error).message || "Something went wrong");
      } finally {
        setRunning(false);
      }
    },
    [text, lang, running, history, reduce],
  );

  // Re-explain in another language without retyping
  useEffect(() => {
    if (result && !running) void run(text);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang]);

  const typeLabel = useMemo(() => (result?.scamType ? TYPE_LABEL[result.scamType.id]?.[lang] ?? result.scamType.label : null), [result, lang]);

  const copyReport = async () => {
    if (!result) return;
    const r = [
      `Indic Scam Shield report - ${VERDICT_LABEL[result.verdict][lang]} (risk ${result.riskScore}/100)`,
      typeLabel ? `Type: ${typeLabel}` : "",
      `Why: ${result.explanation}`,
      result.urls.length ? `Links: ${result.urls.map((u) => `${u.host} (${Math.round(u.risk * 100)}% risk)`).join(", ")}` : "",
      "Do now: " + result.actions.join(" | "),
      "Report fraud: call 1930 or visit cybercrime.gov.in",
    ]
      .filter(Boolean)
      .join("\n");
    try {
      await navigator.clipboard.writeText(r);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard may be blocked */
    }
  };

  const verdictIcon =
    result?.verdict === "scam" ? <ShieldAlert className="h-5 w-5" /> : result?.verdict === "suspicious" ? <AlertTriangle className="h-5 w-5" /> : <CheckCircle2 className="h-5 w-5" />;
  const headline = result ? UI[`headline_${result.verdict}`][lang] : "";

  return (
    <div className="mx-auto max-w-6xl px-4 pb-8 pt-10 sm:px-6">
      <header className="mb-8 max-w-2xl">
        <p className="hud-label mb-3 text-signal">Live analyzer</p>
        <h1 className="text-balance text-3xl font-semibold tracking-tight sm:text-5xl">Paste the message. Watch the agent investigate.</h1>
        <p className="mt-4 text-muted">
          Works on SMS, WhatsApp, email or a call transcript in English, Hinglish, Hindi or Telugu. Nothing is stored on the server.
        </p>
      </header>

      {/* INPUT */}
      <section aria-label="Message input" className="glass relative overflow-hidden rounded-3xl p-4 sm:p-6">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <label htmlFor="msg" className="hud-label">Suspicious message</label>
          <div role="radiogroup" aria-label="Explain in language" className="flex rounded-xl border border-line p-1">
            {LANGS.map((l) => (
              <button
                key={l.id}
                role="radio"
                aria-checked={lang === l.id}
                onClick={() => setLang(l.id)}
                className={`min-h-[36px] rounded-lg px-3 text-sm transition ${lang === l.id ? "bg-signal text-black" : "text-muted hover:text-fg"}`}
              >
                {l.label}
              </button>
            ))}
          </div>
        </div>

        <div className="relative">
          <textarea
            id="msg"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if ((e.metaKey || e.ctrlKey) && e.key === "Enter") void run();
            }}
            maxLength={2000}
            rows={6}
            placeholder="Paste a message here - e.g. 'Aapka SBI account block ho jayega, abhi KYC update karein: ...'"
            className="w-full resize-y rounded-2xl border border-line bg-black/30 p-4 font-mono text-[0.95rem] leading-relaxed text-fg placeholder:text-muted/70 focus:border-signal/60 focus:outline-none focus:ring-2 focus:ring-signal/20"
          />
          {running && !reduce && <div className="pointer-events-none absolute inset-x-0 h-24 animate-scan bg-gradient-to-b from-transparent via-signal/15 to-transparent" />}
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2" aria-label="Sample messages">
            {SAMPLES.map((s) => (
              <button key={s.id} className="chip" onClick={() => { setText(s.text); setResult(null); setSteps([]); }}>
                {s.label} <span className="text-muted">· {s.lang}</span>
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            {text && (
              <button className="btn-ghost !px-3" aria-label="Clear message" onClick={() => { setText(""); setResult(null); setSteps([]); setError(null); }}>
                <Trash2 className="h-4 w-4" />
              </button>
            )}
            <button className="btn-primary" disabled={running || text.trim().length < 3} onClick={() => void run()}>
              {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <ScanSearch className="h-4 w-4" />}
              {running ? "Investigating..." : "Analyze"}
              <kbd className="ml-1 hidden rounded border border-black/20 px-1.5 font-mono text-[10px] opacity-70 sm:inline">Ctrl ↵</kbd>
            </button>
          </div>
        </div>
        <p className="mt-2 text-right font-mono text-xs text-muted">{text.length}/2000</p>
      </section>

      {error && (
        <div role="alert" className="mt-6 rounded-2xl border border-danger/40 bg-danger/10 p-4 text-sm text-danger">
          {error}
        </div>
      )}

      {/* AGENT TRACE */}
      <AnimatePresence>
        {(steps.length > 0 || running) && (
          <motion.section
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: EASE }}
            aria-label="Agent tool calls"
            className="scanlines relative mt-6 overflow-hidden rounded-3xl border border-line bg-black/40 p-4 font-mono text-[0.8rem] sm:p-6"
          >
            <p className="hud-label mb-3 flex items-center gap-2 text-cyan"><Terminal className="h-3.5 w-3.5" /> agent.trace()</p>
            <ol className="space-y-1.5" aria-live="polite">
              {steps.map((s, i) => {
                const M = TOOL_META[s.tool]?.icon ?? Cpu;
                return (
                  <motion.li
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.28, ease: EASE }}
                    className="flex items-start gap-3"
                  >
                    <M className="mt-0.5 h-3.5 w-3.5 shrink-0 text-signal" aria-hidden />
                    <span className="min-w-0 flex-1">
                      <span className="text-signal">{TOOL_META[s.tool]?.label ?? s.tool}</span>
                      <span className="text-muted"> → </span>
                      <span className="break-words text-fg/85">{s.summary}</span>
                    </span>
                    <span className="shrink-0 text-muted">{s.ms.toFixed(1)}ms</span>
                  </motion.li>
                );
              })}
              {running && (
                <li className="flex items-center gap-2 text-muted">
                  <span className="inline-block h-3.5 w-2 animate-blink bg-signal" /> thinking
                </li>
              )}
            </ol>
          </motion.section>
        )}
      </AnimatePresence>

      {/* RESULT */}
      <div ref={resultRef} className="scroll-mt-24">
        <AnimatePresence mode="wait">
          {result && (
            <motion.div
              key={result.verdict + result.riskScore + lang}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, ease: EASE }}
              className="mt-8 grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)]"
            >
              <div className="space-y-6">
                <section className="glass relative overflow-hidden rounded-3xl p-6 sm:p-8">
                  <div
                    aria-hidden
                    className="absolute -right-24 -top-24 h-64 w-64 rounded-full blur-[90px]"
                    style={{ background: result.verdict === "scam" ? "rgba(255,77,94,.25)" : result.verdict === "suspicious" ? "rgba(255,178,36,.2)" : "rgba(61,255,160,.2)" }}
                  />
                  <div className="relative flex flex-col items-center gap-6 sm:flex-row sm:items-start">
                    <RiskRing value={result.riskScore} verdict={result.verdict} />
                    <div className="min-w-0 flex-1 text-center sm:text-left">
                      <VerdictBadge verdict={result.verdict} label={VERDICT_LABEL[result.verdict][lang]} />
                      <h2 className="mt-3 flex items-center justify-center gap-2 text-2xl font-semibold sm:justify-start">{verdictIcon}{headline}</h2>
                      {typeLabel && <p className="mt-1 font-mono text-sm text-warn">{typeLabel}</p>}
                      <p className="mt-3 text-pretty text-fg/85">{result.explanation}</p>
                      <p className="mt-3 font-mono text-[11px] uppercase tracking-widest text-muted">
                        explained by {result.explainedBy === "llm" ? "LLM (verdict set by engine)" : "template engine"} · {result.elapsedMs}ms · ML {Math.round(result.mlProbability * 100)}% · rules {Math.round(result.ruleScore * 100)}%
                      </p>
                    </div>
                  </div>
                </section>

                <section className="glass rounded-3xl p-6">
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                    <h3 className="font-semibold">Why the model flagged these words</h3>
                    <span className="flex items-center gap-3 font-mono text-[11px] text-muted">
                      <span className="flex items-center gap-1.5"><i className="inline-block h-2.5 w-2.5 rounded-sm bg-danger/60" /> toward scam</span>
                      <span className="flex items-center gap-1.5"><i className="inline-block h-2.5 w-2.5 rounded-sm bg-signal/50" /> toward safe</span>
                    </span>
                  </div>
                  <HeatText words={result.words} />
                </section>

                {result.signals.length > 0 && (
                  <section className="glass rounded-3xl p-6">
                    <h3 className="mb-4 font-semibold">Red flags found ({result.signals.length})</h3>
                    <ul className="space-y-3">
                      {result.signals.map((s, i) => (
                        <motion.li key={s.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06, duration: 0.35 }} className="rounded-2xl border border-line bg-black/20 p-4">
                          <div className="flex items-center justify-between gap-3">
                            <p className="font-medium">{s.label}</p>
                            <span className="rounded-md bg-danger/10 px-2 py-0.5 font-mono text-xs text-danger">+{s.weight.toFixed(1)}</span>
                          </div>
                          {s.evidence[0] && <p className="mt-1.5 break-words font-mono text-xs text-muted">“…{s.evidence[0]}…”</p>}
                        </motion.li>
                      ))}
                    </ul>
                  </section>
                )}

                {result.safetyHints.length > 0 && (
                  <section className="rounded-3xl border border-signal/25 bg-signal/[0.05] p-6">
                    <h3 className="mb-3 flex items-center gap-2 font-semibold text-signal"><ShieldCheck className="h-4 w-4" /> Reassuring signals</h3>
                    <ul className="list-inside list-disc space-y-1.5 text-sm text-fg/85">
                      {result.safetyHints.map((h) => (<li key={h}>{h}</li>))}
                    </ul>
                  </section>
                )}
              </div>

              <aside className="space-y-6">
                <section className="rounded-3xl border border-signal/30 bg-signal/[0.06] p-6">
                  <h3 className="mb-4 flex items-center gap-2 font-semibold"><PhoneCall className="h-4 w-4 text-signal" /> What to do now</h3>
                  <ol className="space-y-3">
                    {result.actions.map((a, i) => (
                      <li key={i} className="flex gap-3 text-sm">
                        <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-signal/20 font-mono text-[11px] text-signal">{i + 1}</span>
                        <span className="text-fg/90">{a}</span>
                      </li>
                    ))}
                  </ol>
                  <button onClick={copyReport} className="btn-ghost mt-5 w-full justify-center text-sm">
                    <ClipboardCopy className="h-4 w-4" /> {copied ? "Copied!" : "Copy report to share"}
                  </button>
                </section>

                {result.urls.length > 0 && (
                  <section className="glass rounded-3xl p-6">
                    <h3 className="mb-4 flex items-center gap-2 font-semibold"><Link2 className="h-4 w-4 text-cyan" /> Link forensics</h3>
                    <ul className="space-y-3">
                      {result.urls.map((u) => (
                        <li key={u.raw} className="rounded-2xl border border-line bg-black/25 p-3">
                          <div className="flex items-center justify-between gap-2">
                            <code className="min-w-0 break-all text-xs text-fg">{u.host}</code>
                            <span className={`shrink-0 rounded-md px-2 py-0.5 font-mono text-xs ${u.risk >= 0.6 ? "bg-danger/15 text-danger" : u.risk >= 0.3 ? "bg-warn/15 text-warn" : "bg-signal/15 text-signal"}`}>{Math.round(u.risk * 100)}%</span>
                          </div>
                          <ul className="mt-2 space-y-1 text-xs text-muted">
                            {u.flags.map((f) => (<li key={f}>• {f}</li>))}
                          </ul>
                          {u.lookalikeOf && <p className="mt-2 text-xs text-warn">Imitates: {u.lookalikeOf}</p>}
                        </li>
                      ))}
                    </ul>
                  </section>
                )}

                {(result.phones.length > 0 || result.upiIds.length > 0) && (
                  <section className="glass rounded-3xl p-6 text-sm">
                    <h3 className="mb-3 font-semibold">Contact details in the message</h3>
                    <ul className="space-y-1 font-mono text-xs text-fg/85">
                      {result.phones.map((p) => (<li key={p}>📞 {p}</li>))}
                      {result.upiIds.map((p) => (<li key={p}>💸 {p}</li>))}
                    </ul>
                    <p className="mt-3 text-xs text-muted">Report these on Sanchar Saathi (Chakshu) - do not call back.</p>
                  </section>
                )}

                {result.advisories.length > 0 && (
                  <section className="glass rounded-3xl p-6">
                    <h3 className="mb-4 flex items-center gap-2 font-semibold"><BookOpenCheck className="h-4 w-4 text-violet" /> Retrieved advisories</h3>
                    <ul className="space-y-4">
                      {result.advisories.map((a) => (
                        <li key={a.id}>
                          <p className="text-sm font-medium">{a.title}</p>
                          <p className="mt-1 text-xs leading-relaxed text-muted">{a.body}</p>
                          <a href={a.sourceUrl} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1 text-xs text-cyan hover:underline">
                            {a.source} <ExternalLink className="h-3 w-3" />
                          </a>
                        </li>
                      ))}
                    </ul>
                  </section>
                )}
              </aside>

              <p className="lg:col-span-2 text-center text-xs text-muted">{result.disclaimer}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {history.length > 0 && !running && (
        <section className="mt-10" aria-label="Recent checks on this device">
          <p className="hud-label mb-3">Recent checks (this browser tab only)</p>
          <ul className="grid grid-cols-[minmax(0,1fr)] gap-2 sm:grid-cols-2">
            {history.map((h, i) => (
              <li key={i} className="flex items-center justify-between gap-3 rounded-xl border border-line bg-panel/60 px-4 py-2.5 text-sm">
                <span className="truncate text-muted">{h.t}</span>
                <span className={`shrink-0 font-mono text-xs ${h.v === "scam" ? "text-danger" : h.v === "suspicious" ? "text-warn" : "text-signal"}`}>{h.risk}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
