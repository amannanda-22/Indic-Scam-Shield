"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Bot, Check, Copy, Globe, Play, Server, Terminal, TriangleAlert } from "lucide-react";
import { SAMPLES } from "@/lib/samples";
import { SectionHead } from "@/components/ui";

type Status = "idle" | "running" | "done" | "error";
interface Surface {
  status: Status;
  ms?: number;
  verdict?: string;
  headline?: string;
  lines: string[];
  error?: string;
}
const blank = (): Surface => ({ status: "idle", lines: [] });
const tone = (v?: string) => (v === "scam" || v === "legit-no" ? "text-danger" : v === "suspicious" ? "text-warn" : v ? "text-signal" : "text-muted");

async function timed<T>(f: () => Promise<T>): Promise<[T, number]> {
  const t = performance.now();
  const r = await f();
  return [r, Math.round(performance.now() - t)];
}

export default function LiveRun() {
  const [sample, setSample] = useState(SAMPLES[0].id);
  const [web, setWeb] = useState<Surface>(blank());
  const [mcp, setMcp] = useState<Surface>(blank());
  const [py, setPy] = useState<Surface>(blank());
  const [running, setRunning] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [base, setBase] = useState("https://YOUR-APP.vercel.app");
  useEffect(() => setBase(window.location.origin), []);

  const text = SAMPLES.find((s) => s.id === sample)?.text ?? "";

  async function runWeb() {
    setWeb({ status: "running", lines: [] });
    try {
      const [res, ms] = await timed(async () => {
        const r = await fetch("/api/analyze", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ text, lang: "en" }) });
        if (!r.ok || !r.body) throw new Error(`HTTP ${r.status}`);
        const reader = r.body.getReader();
        const dec = new TextDecoder();
        let buf = "";
        const steps: string[] = [];
        let final: { verdict: string; riskScore: number; scamType?: { label: string } | null } | null = null;
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          buf += dec.decode(value, { stream: true });
          let i;
          while ((i = buf.indexOf("\n")) >= 0) {
            const line = buf.slice(0, i).trim();
            buf = buf.slice(i + 1);
            if (!line) continue;
            const ev = JSON.parse(line);
            if (ev.type === "step") steps.push(`${ev.step.tool}: ${ev.step.summary}`);
            if (ev.type === "result") final = ev.analysis;
          }
        }
        if (!final) throw new Error("no result event");
        return { steps, final };
      });
      setWeb({
        status: "done",
        ms,
        verdict: res.final.verdict,
        headline: `${res.final.verdict.toUpperCase()}  ·  risk ${res.final.riskScore}/100${res.final.scamType ? "  ·  " + res.final.scamType.label : ""}`,
        lines: res.steps.map((s) => s.slice(0, 110)),
      });
    } catch (e) {
      setWeb({ status: "error", lines: [], error: e instanceof Error ? e.message : "failed" });
    }
  }

  async function runMcp() {
    setMcp({ status: "running", lines: [] });
    const rpc = async (id: number, method: string, params?: unknown) => {
      const r = await fetch("/api/mcp", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ jsonrpc: "2.0", id, method, params }) });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const j = await r.json();
      if (j.error) throw new Error(j.error.message);
      return j.result;
    };
    try {
      const [out, ms] = await timed(async () => {
        const init = await rpc(1, "initialize", { protocolVersion: "2025-03-26", capabilities: {}, clientInfo: { name: "live-page", version: "1" } });
        const list = await rpc(2, "tools/list");
        const call = await rpc(3, "tools/call", { name: "analyze_message", arguments: { text, language: "en" } });
        return { init, list, call: JSON.parse(call.content[0].text) };
      });
      setMcp({
        status: "done",
        ms,
        verdict: out.call.verdict,
        headline: `${String(out.call.verdict).toUpperCase()}  ·  risk ${out.call.riskScore}/100${out.call.scamFamily ? "  ·  " + out.call.scamFamily.label : ""}`,
        lines: [
          `initialize → ${out.init.serverInfo.name} v${out.init.serverInfo.version}`,
          `tools/list → ${out.list.tools.map((t: { name: string }) => t.name).join(", ")}`,
          `tools/call analyze_message → ${out.call.redFlags.length} red flags, ${out.call.links.length} link(s)`,
        ],
      });
    } catch (e) {
      setMcp({ status: "error", lines: [], error: e instanceof Error ? e.message : "failed" });
    }
  }

  async function runPy() {
    setPy({ status: "running", lines: [] });
    try {
      const [out, ms] = await timed(async () => {
        const r = await fetch("/api/py/predict", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ text }) });
        if (!r.ok) throw new Error(r.status === 404 || r.status === 500 || r.status === 502 || r.status === 504 ? "Python service not running here. Locally: npm run dev:all (needs Python 3.9+, run npm run doctor). On Vercel this is a serverless function." : `HTTP ${r.status}`);
        return r.json();
      });
      setPy({
        status: "done",
        ms,
        verdict: out.label === "scam" ? "scam" : "safe",
        headline: `${out.label.toUpperCase()}  ·  p(scam) ${(out.p_scam * 100).toFixed(1)}%${out.scam_type ? "  ·  " + out.scam_type : ""}`,
        lines: [`engine: ${out.engine ?? "scikit-learn FastAPI (local)"}`, "ML model only: no rules, no URL forensics"],
      });
    } catch (e) {
      setPy({ status: "error", lines: [], error: e instanceof Error ? e.message : "failed" });
    }
  }

  async function runAll() {
    setRunning(true);
    await Promise.all([runWeb(), runMcp(), runPy()]);
    setRunning(false);
  }

  const done = [web, mcp, py].filter((s) => s.status === "done");
  const agree = done.length >= 2 && new Set(done.map((s) => (s.verdict === "suspicious" ? "scam" : s.verdict))).size === 1;
  const curlWeb = `curl -N -X POST ${base}/api/analyze -H "content-type: application/json" -d '{"text":"KYC expire ho gaya, link par click karein","lang":"en"}'`;
  const curlMcp = `curl -X POST ${base}/api/mcp -H "content-type: application/json" -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'`;
  const curlPy = `curl -X POST ${base}/api/py/predict -H "content-type: application/json" -d '{"text":"KYC expire ho gaya, link par click karein"}'`;
  const copy = (k: string, v: string) => {
    navigator.clipboard?.writeText(v).then(() => {
      setCopied(k);
      setTimeout(() => setCopied(null), 1500);
    });
  };

  const cards: { key: string; s: Surface; title: string; sub: string; icon: typeof Globe }[] = [
    { key: "web", s: web, title: "Web engine", sub: "POST /api/analyze · TypeScript agent, streamed", icon: Globe },
    { key: "mcp", s: mcp, title: "MCP server", sub: "POST /api/mcp · JSON-RPC, same 3 tools as stdio", icon: Bot },
    { key: "py", s: py, title: "Python ML service", sub: "POST /api/py/predict · Python function", icon: Server },
  ];

  return (
    <div className="relative z-10 mx-auto max-w-6xl px-4 py-14 sm:px-6">
      <SectionHead eyebrow="One click" title={<>Everything runs <span className="text-signal">live</span>, together</>} sub="Pick a message, press run. The same message goes through the web engine, an MCP server and a Python ML service at once." />

      <div className="glass mt-8 rounded-2xl p-4 sm:p-5">
        <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Sample message">
          {SAMPLES.map((s) => (
            <button key={s.id} role="radio" aria-checked={sample === s.id} onClick={() => setSample(s.id)} className={`chip ${sample === s.id ? "border-signal/60 text-signal" : ""}`}>
              {s.label}
            </button>
          ))}
        </div>
        <p className="mt-4 rounded-xl border border-line bg-black/30 p-3 font-mono text-[13px] leading-relaxed text-muted">{text}</p>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button onClick={runAll} disabled={running} className="btn-primary min-h-[44px]">
            <Play className="h-4 w-4" aria-hidden /> {running ? "Running..." : "Run on all 3 surfaces"}
          </button>
          {done.length >= 2 && (
            <span className={`inline-flex items-center gap-2 text-sm ${agree ? "text-signal" : "text-warn"}`} role="status">
              {agree ? <Check className="h-4 w-4" aria-hidden /> : <TriangleAlert className="h-4 w-4" aria-hidden />}
              {agree ? "All surfaces agree on the verdict" : "Surfaces disagree (ML-only vs hybrid): open the details below"}
            </span>
          )}
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {cards.map(({ key, s, title, sub, icon: Icon }, i) => (
          <motion.section key={key} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }} className="glass rounded-2xl p-5" aria-live="polite">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-xl border border-line bg-black/30"><Icon className="h-5 w-5 text-cyan" aria-hidden /></span>
                <div>
                  <h2 className="font-semibold">{title}</h2>
                  <p className="text-xs text-muted">{sub}</p>
                </div>
              </div>
              {s.ms !== undefined && <span className="rounded-md border border-line px-2 py-0.5 font-mono text-xs text-muted">{s.ms} ms</span>}
            </div>
            <div className="mt-4 min-h-[120px] text-sm">
              {s.status === "idle" && <p className="text-muted">Waiting for run.</p>}
              {s.status === "running" && <p className="text-muted">Running...</p>}
              {s.status === "error" && <p className="text-danger">{s.error}</p>}
              {s.status === "done" && (
                <>
                  <p className={`font-mono text-sm font-semibold ${tone(s.verdict)}`}>{s.headline}</p>
                  <ul className="mt-3 space-y-1.5 font-mono text-[12px] leading-snug text-muted">
                    {s.lines.map((l, k) => (
                      <li key={k} className="break-words">{l}</li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          </motion.section>
        ))}
      </div>

      <details className="glass group mt-6 rounded-2xl p-5">
        <summary className="flex cursor-pointer items-center gap-2 font-semibold"><Terminal className="h-4 w-4 text-signal" aria-hidden /> For developers: call the endpoints yourself</summary>
        <div className="mt-4 space-y-3">
          {[["web", curlWeb], ["mcp", curlMcp], ["py", curlPy]].map(([k, c]) => (
            <div key={k} className="flex items-start gap-2 rounded-xl border border-line bg-black/30 p-3">
              <code className="min-w-0 flex-1 break-all font-mono text-[12px] text-muted">{c}</code>
              <button onClick={() => copy(k, c)} aria-label={`Copy ${k} command`} className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-line text-muted hover:text-fg">
                {copied === k ? <Check className="h-4 w-4 text-signal" aria-hidden /> : <Copy className="h-4 w-4" aria-hidden />}
              </button>
            </div>
          ))}
        </div>
        <p className="mt-4 text-xs text-muted">
          The Python function on Vercel re-implements the scikit-learn model with the standard library (parity-tested against the real sklearn pipeline).
          The full FastAPI + scikit-learn service runs via Docker or <code className="font-mono">npm run dev:all</code>.
        </p>
      </details>
    </div>
  );
}
