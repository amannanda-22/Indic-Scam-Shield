import type { Metadata } from "next";
import { Reveal, SectionHead } from "@/components/ui";

export const metadata: Metadata = {
  title: "Architecture",
  description: "How Indic Scam Shield is built: pipeline, tools, and every technology with what it does and why it was chosen.",
};

const TRACKS = {
  AI: "text-signal border-signal/40 bg-signal/10",
  ML: "text-cyan border-cyan/40 bg-cyan/10",
  DS: "text-violet border-violet/40 bg-violet/10",
  DA: "text-warn border-warn/40 bg-warn/10",
  SWE: "text-fg border-line bg-white/5",
} as const;

type Track = keyof typeof TRACKS;
interface Row {
  tech: string;
  track: Track[];
  does: string;
  why: string;
  where: string;
}

const ROWS: Row[] = [
  { tech: "Agentic tool pipeline (8 tools, streamed trace)", track: ["AI"], does: "A planner runs small single-purpose tools in order and streams each call to the UI.", why: "Makes the system auditable: every verdict can be traced to tool outputs, which is what regulated teams ask for.", where: "lib/engine/analyze.ts, /api/analyze (NDJSON streaming)" },
  { tech: "RAG-lite: BM25 retrieval over curated advisories", track: ["AI", "DS"], does: "Finds the most relevant safety advisories for the message and shows them with official source links.", why: "Grounds the advice in documents instead of model memory, cutting hallucinated guidance. BM25 needs no embedding API, so it runs offline and free.", where: "lib/engine/advisories.ts" },
  { tech: "Optional LLM explainer (Gemini / Claude)", track: ["AI"], does: "Rewrites the findings as 2-3 plain sentences in English, Hindi or Telugu.", why: "Language quality without giving an LLM the power to change the verdict. Message text is passed as untrusted data to blunt prompt injection.", where: "lib/engine/llm.ts" },
  { tech: "MCP server (Model Context Protocol)", track: ["AI", "SWE"], does: "Exposes analyze_message, check_url and search_advisories as tools any MCP-capable assistant can call.", why: "Shows the engine is reusable infrastructure, not just a web page, and uses the 2026 standard for agent tooling.", where: "mcp/server.ts (npm run mcp)" },
  { tech: "TF-IDF char n-grams + Logistic Regression (scikit-learn)", track: ["ML", "DS"], does: "Turns raw characters into weighted features and learns a linear scam/safe boundary; a second head predicts the scam family.", why: "Character n-grams survive transliteration chaos (kyc / KYC / k.y.c) where word models break. Linear models are fast, explainable and tiny (one JSON file).", where: "ml/train.py -> lib/data/model.json" },
  { tech: "Pure-TypeScript model inference + parity test", track: ["ML", "SWE"], does: "Re-implements sklearn's char_wb analyzer, sublinear TF, IDF and L2 norm in TS.", why: "Deploys on Vercel with no Python runtime. A parity test proves the TS output matches Python to 2e-6 on 32 sentences.", where: "lib/engine/classifier.ts, scripts/selftest.ts" },
  { tech: "Template-held-out evaluation + blind sets", track: ["DS"], does: "Splits train/test by message template, plus 64 hand-written and 40 blind messages.", why: "Prevents leakage that makes random splits report ~99-100% F1. Reporting the gap is the point.", where: "ml/train.py, /benchmark" },
  { tech: "Calibration & error analysis (ECE, AUC, confusion)", track: ["DS", "ML"], does: "Measures whether probabilities mean what they say and lists exactly which messages fail.", why: "A probability of 0.9 should be right ~90% of the time. The model is over-confident, so it feeds a fusion layer instead of being shown raw.", where: "ml/train.py -> results.json" },
  { tech: "Local explainability (per-word contributions)", track: ["ML", "DS"], does: "Sums each n-gram's TF-IDF x coefficient into a per-word score and paints it on the message.", why: "Linear-model equivalent of SHAP: the user sees which words drove the score, and I found dataset shortcuts ('nov', 'rs') this way.", where: "lib/engine/classifier.ts, <HeatText />" },
  { tech: "Rule engine: 15 multilingual scam-anatomy signals", track: ["DS"], does: "Regex features for urgency, secrecy, authority impersonation, OTP asks, advance fees, remote-access apps.", why: "Catches new wording the ML model has not seen, and every rule carries a human-readable label and weight.", where: "lib/engine/signals.ts" },
  { tech: "URL forensics (offline)", track: ["DS", "SWE"], does: "Flags IP hosts, shorteners, abused TLDs, brand look-alikes and typo-squats using Levenshtein distance.", why: "Phishing links are the highest-signal evidence and need no network call, so it is private, fast and cannot be used to probe attacker servers.", where: "lib/engine/urlforensics.ts" },
  { tech: "Score fusion (logit blend)", track: ["DS", "ML"], does: "risk = sigmoid(0.5*ML + 0.7*rules + 2.0*URL - 1.1*safety - 0.6).", why: "Transparent, hand-tunable alternative to a stacked model when only ~100 labelled hold-out messages exist.", where: "lib/engine/analyze.ts" },
  { tech: "Corpus generation + data-quality iteration", track: ["DA", "DS"], does: "198 templates x slot filling across 5 scripts; first benchmark exposed over-flagging of ordinary receipts, so legit coverage was widened.", why: "Shows the loop analysts actually run: measure, find the segment that fails, fix the data, re-measure.", where: "ml/build_corpus.py" },
  { tech: "Segment analysis (language x outcome)", track: ["DA"], does: "Breaks accuracy down by language and scam family; surfaces the Hindi weakness.", why: "Averages hide the segment that fails users. Slicing is how analysts find it.", where: "/benchmark" },
  { tech: "FastAPI + Docker microservice for the same model", track: ["SWE", "ML"], does: "Serves the pickled sklearn pipeline over HTTP for teams that prefer a Python backend.", why: "Gives a second deployment path: Vercel (TS) or container (Python).", where: "ml/serve/app.py, Dockerfile" },
  { tech: "Next.js 14 App Router, React 18, TypeScript (strict)", track: ["SWE"], does: "Server components for the data-heavy pages, client components for interaction, route handlers for the API.", why: "One repo, one deploy, type safety from model JSON to UI.", where: "app/, components/" },
  { tech: "Tailwind CSS, Framer Motion, design tokens", track: ["SWE"], does: "Dark HUD design system, scroll reveals, animated gauge, live agent trace, reduced-motion support.", why: "Perceived quality: first impressions decide if a reviewer opens the code.", where: "globals.css, components/" },
  { tech: "Security & privacy hardening", track: ["SWE"], does: "Zod input validation, 2,000-char cap, per-IP rate limit, security headers, stateless API, no logging of message text.", why: "A scam tool receives sensitive messages; not storing them is the safest design.", where: "app/api/analyze/route.ts, next.config.mjs" },
];

const FLOW = [
  { id: "in", label: "Message", sub: "SMS / WhatsApp", x: 20 },
  { id: "lang", label: "Language", sub: "5 script styles", x: 150 },
  { id: "ml", label: "ML", sub: "char n-gram LR", x: 280, y: -52 },
  { id: "rules", label: "Rules", sub: "15 signals", x: 280, y: 0 },
  { id: "url", label: "URL forensics", sub: "offline", x: 280, y: 52 },
  { id: "rag", label: "Advisories", sub: "BM25 RAG", x: 430, y: 26 },
  { id: "fuse", label: "Fuse", sub: "risk 0-100", x: 560 },
  { id: "out", label: "Verdict", sub: "EN / हिं / తె", x: 690 },
];

export default function ArchitecturePage() {
  return (
    <div className="mx-auto max-w-6xl px-4 pb-8 pt-12 sm:px-6">
      <header className="max-w-3xl">
        <p className="hud-label mb-3 text-signal">Architecture</p>
        <h1 className="text-balance text-3xl font-semibold tracking-tight sm:text-5xl">What is inside, and why each piece is there</h1>
        <p className="mt-4 text-lg text-muted">One request flows through independent, testable tools. The verdict is computed deterministically; the optional LLM only writes the explanation.</p>
      </header>

      <Reveal className="mt-12">
        <div className="glass overflow-x-auto rounded-3xl p-6">
          <svg viewBox="0 0 800 170" className="mx-auto min-w-[720px]" role="img" aria-label="Pipeline: message to language detection, then ML, rules and URL forensics in parallel, advisory retrieval, risk fusion and verdict">
            <defs>
              <linearGradient id="flow" x1="0" x2="1">
                <stop offset="0" stopColor="#3dffa0" stopOpacity="0" />
                <stop offset="0.5" stopColor="#3dffa0" />
                <stop offset="1" stopColor="#4dd8ff" stopOpacity="0" />
              </linearGradient>
            </defs>
            {[
              ["in", "lang"], ["lang", "ml"], ["lang", "rules"], ["lang", "url"], ["ml", "rag"], ["rules", "rag"], ["url", "rag"], ["rag", "fuse"], ["fuse", "out"],
            ].map(([a, b], i) => {
              const A = FLOW.find((f) => f.id === a)!;
              const B = FLOW.find((f) => f.id === b)!;
              const ay = 85 + (A.y ?? 0);
              const by = 85 + (B.y ?? 0);
              return (
                <g key={i}>
                  <path d={`M${A.x + 100},${ay} C${A.x + 125},${ay} ${B.x - 25},${by} ${B.x},${by}`} stroke="rgba(255,255,255,0.14)" fill="none" strokeWidth="1.5" />
                  <path d={`M${A.x + 100},${ay} C${A.x + 125},${ay} ${B.x - 25},${by} ${B.x},${by}`} stroke="url(#flow)" fill="none" strokeWidth="2" strokeDasharray="14 120">
                    <animate attributeName="stroke-dashoffset" from="134" to="0" dur={`${2.2 + (i % 3) * 0.3}s`} repeatCount="indefinite" />
                  </path>
                </g>
              );
            })}
            {FLOW.map((f) => (
              <g key={f.id} transform={`translate(${f.x},${85 + (f.y ?? 0) - 21})`}>
                <rect width="100" height="42" rx="11" fill="#0b1114" stroke="rgba(61,255,160,0.35)" />
                <text x="50" y="18" textAnchor="middle" fill="#e8eff2" fontSize="11.5" fontWeight="600" fontFamily="Space Grotesk Variable, sans-serif">{f.label}</text>
                <text x="50" y="32" textAnchor="middle" fill="#8d9ea8" fontSize="8.5" fontFamily="JetBrains Mono Variable, monospace">{f.sub}</text>
              </g>
            ))}
          </svg>
        </div>
      </Reveal>

      <section className="mt-24">
        <SectionHead eyebrow="Skills & technologies" title="What I used, what it does, why" sub="Tagged by the hiring track it demonstrates: AI, ML, Data Science, Data Analytics and Software Engineering." />
        <div className="mb-6 flex flex-wrap justify-center gap-2">
          {(Object.keys(TRACKS) as Track[]).map((t) => (
            <span key={t} className={`rounded-full border px-3 py-1 font-mono text-xs ${TRACKS[t]}`}>{t}</span>
          ))}
        </div>
        <div className="space-y-3">
          {ROWS.map((r, i) => (
            <Reveal key={r.tech} delay={Math.min(i, 5) * 0.03}>
              <article className="glass grid gap-4 rounded-2xl p-5 transition hover:border-signal/30 md:grid-cols-[1.1fr_1.5fr_1.5fr_auto] md:items-start">
                <div>
                  <h3 className="font-medium">{r.tech}</h3>
                  <p className="mt-2 flex flex-wrap gap-1.5">
                    {r.track.map((t) => (<span key={t} className={`rounded-full border px-2 py-0.5 font-mono text-[10px] ${TRACKS[t]}`}>{t}</span>))}
                  </p>
                </div>
                <p className="text-sm text-muted"><span className="hud-label mb-1 block !text-[10px]">What it does</span>{r.does}</p>
                <p className="text-sm text-muted"><span className="hud-label mb-1 block !text-[10px]">Why</span>{r.why}</p>
                <p className="font-mono text-xs text-cyan md:max-w-[190px] md:text-right">{r.where}</p>
              </article>
            </Reveal>
          ))}
        </div>
      </section>
    </div>
  );
}
