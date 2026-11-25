import Link from "next/link";
import {
  ArrowRight, BookOpenCheck, Cpu, FileCheck2, Globe2, LockKeyhole, Network, ScanSearch, ShieldCheck, Sparkles, Waypoints, Link2, FlaskConical, Languages, Zap,
} from "lucide-react";
import HeroDemo, { type DemoItem } from "@/components/HeroDemo";
import { CountUp, Reveal, SectionHead } from "@/components/ui";
import { analyzeCore } from "@/lib/engine/analyze";
import { TYPE_LABEL } from "@/lib/engine/i18n";
import { ADVISORIES } from "@/lib/engine/advisories";
import { SAMPLES } from "@/lib/samples";
import results from "@/lib/data/results.json";

const DEMO_IDS = ["digital-arrest", "kyc-link", "genuine-otp", "upi-hindi"];

function buildDemo(): DemoItem[] {
  return DEMO_IDS.map((id) => {
    const s = SAMPLES.find((x) => x.id === id)!;
    const { analysis, trace } = analyzeCore(s.text);
    return {
      text: s.text,
      lang: s.lang,
      verdict: analysis.verdict,
      risk: analysis.riskScore,
      type: analysis.scamType ? TYPE_LABEL[analysis.scamType.id]?.en ?? analysis.scamType.label : null,
      words: analysis.words,
      tools: trace
        .filter((t) => ["ml_classifier", "rule_signals", "url_forensics", "retrieve_advisories", "fuse_risk"].includes(t.tool))
        .map((t) => ({ tool: t.tool, summary: t.summary.length > 74 ? t.summary.slice(0, 72) + "…" : t.summary })),
    };
  });
}

const PIPELINE = [
  { icon: Globe2, name: "detect_language", text: "Tells English, Hinglish, Hindi and Telugu (roman or script) apart - the first fork in how a message is read." },
  { icon: Cpu, name: "ml_classifier", text: "Character n-gram TF-IDF + logistic regression trained on a multilingual corpus. Robust to spelling chaos like 'kyc', 'KYC' and 'k y c'." },
  { icon: ScanSearch, name: "rule_signals", text: "15 transparent scam-anatomy rules: urgency, secrecy, 'digital arrest', OTP asks, advance fees, remote-access apps." },
  { icon: Link2, name: "url_forensics", text: "Offline link analysis: look-alike brand domains, typo-squats, IP hosts, shorteners and abused TLDs." },
  { icon: BookOpenCheck, name: "retrieve_advisories", text: "BM25 retrieval over curated safety advisories, so every verdict cites what to do and where to report." },
  { icon: Sparkles, name: "fuse_risk + explain", text: "Fuses all evidence into one risk score and explains it in English, Hindi or Telugu. An optional LLM only writes the words." },
];

const FAMILIES = Object.values(TYPE_LABEL).map((t) => t.en);

export default function Home() {
  const demo = buildDemo();
  const ds = results.dataset;
  return (
    <>
      {/* HERO */}
      <section className="mx-auto grid max-w-6xl grid-cols-[minmax(0,1fr)] items-center gap-12 px-4 pb-16 pt-14 sm:px-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] lg:pt-24">
        <div>
          <Reveal>
            <p className="hud-label mb-5 inline-flex items-center gap-2 rounded-full border border-signal/30 bg-signal/[0.07] px-3 py-1.5 text-signal">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-signal" /> Agentic · Multilingual · Explainable
            </p>
          </Reveal>
          <Reveal delay={0.05}>
            <h1 className="text-balance text-4xl font-semibold leading-[1.04] tracking-tight sm:text-6xl">
              Scammers speak <span className="gradient-text">Hinglish &amp; Telugu.</span> Most detectors don&apos;t.
            </h1>
          </Reveal>
          <Reveal delay={0.12}>
            <p className="mt-6 max-w-xl text-pretty text-lg text-muted">
              An AI agent that reads a suspicious SMS or WhatsApp message in the language it was written in, investigates the links, checks it against safety advisories and tells you - in plain words - what to do next.
            </p>
          </Reveal>
          <Reveal delay={0.18} className="mt-9 flex flex-wrap gap-3">
            <Link href="/analyze" className="btn-primary">
              Analyze a message <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/live" className="btn-ghost">
              <Zap className="h-4 w-4" /> Run everything live
            </Link>
            <Link href="/benchmark" className="btn-ghost">
              <FlaskConical className="h-4 w-4" /> See the honest benchmark
            </Link>
          </Reveal>
          <Reveal delay={0.25}>
            <ul className="mt-10 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted">
              <li className="flex items-center gap-2"><LockKeyhole className="h-4 w-4 text-signal" /> Nothing stored</li>
              <li className="flex items-center gap-2"><Languages className="h-4 w-4 text-signal" /> English · हिंदी · తెలుగు</li>
              <li className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-signal" /> Works with zero API keys</li>
            </ul>
          </Reveal>
        </div>
        <Reveal delay={0.1} y={30}>
          <HeroDemo items={demo} />
        </Reveal>
      </section>

      {/* STATS */}
      <section aria-label="Project facts" className="mx-auto max-w-6xl px-4 sm:px-6">
        <Reveal>
          <dl className="glass grid grid-cols-2 gap-px overflow-hidden rounded-3xl bg-line md:grid-cols-4">
            {[
              { v: 5, s: "", l: "scripts & dialect styles handled" },
              { v: ds.templates, s: "", l: "hand-written message templates" },
              { v: ADVISORIES.length, s: "", l: "curated safety advisories (RAG)" },
              { v: 104, s: "", l: "messages in the two blind test sets" },
            ].map((x) => (
              <div key={x.l} className="bg-ink/80 p-6 text-center sm:p-8">
                <dt className="sr-only">{x.l}</dt>
                <dd>
                  <p className="font-mono text-4xl font-semibold text-signal sm:text-5xl"><CountUp to={x.v} suffix={x.s} /></p>
                  <p className="mt-2 text-sm text-muted">{x.l}</p>
                </dd>
              </div>
            ))}
          </dl>
        </Reveal>
      </section>

      {/* PIPELINE */}
      <section className="mx-auto max-w-6xl px-4 py-28 sm:px-6">
        <SectionHead
          eyebrow="How the agent works"
          title={<>Six tools. One verdict. <span className="text-signal">Every step visible.</span></>}
          sub="Not a black box: you can watch each tool call, see the milliseconds it took and read exactly which words and links moved the score."
        />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {PIPELINE.map((p, i) => (
            <Reveal key={p.name} delay={i * 0.05}>
              <article className="glass group relative h-full overflow-hidden rounded-3xl p-6 transition duration-300 hover:-translate-y-1 hover:border-signal/40">
                <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-signal/0 blur-3xl transition duration-500 group-hover:bg-signal/20" aria-hidden />
                <div className="mb-5 flex items-center justify-between">
                  <span className="grid h-11 w-11 place-items-center rounded-xl border border-line bg-black/30 text-signal transition group-hover:border-signal/50">
                    <p.icon className="h-5 w-5" aria-hidden />
                  </span>
                  <span className="font-mono text-xs text-muted">0{i + 1}</span>
                </div>
                <h3 className="font-mono text-sm text-signal">{p.name}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{p.text}</p>
              </article>
            </Reveal>
          ))}
        </div>
      </section>

      {/* MARQUEE */}
      <section aria-label="Scam families covered" className="relative overflow-hidden border-y border-line py-6">
        <div className="flex w-max animate-marquee gap-4 hover:[animation-play-state:paused]">
          {[...FAMILIES, ...FAMILIES, ...FAMILIES, ...FAMILIES].map((f, i) => (
            <span key={i} className="whitespace-nowrap rounded-full border border-line bg-panel/70 px-5 py-2 font-mono text-sm text-muted">
              <span className="mr-2 text-danger">●</span>{f}
            </span>
          ))}
        </div>
      </section>

      {/* DIFFERENTIATORS */}
      <section className="mx-auto max-w-6xl px-4 py-28 sm:px-6">
        <SectionHead
          eyebrow="Why it is different"
          title="Built like a product, evaluated like research"
          sub="Most scam-detector demos report 99% accuracy on data they trained on. This one shows where it fails."
        />
        <div className="grid gap-4 md:grid-cols-6">
          <Reveal className="md:col-span-4">
            <article className="glass h-full rounded-3xl p-8">
              <FlaskConical className="h-6 w-6 text-signal" aria-hidden />
              <h3 className="mt-4 text-xl font-semibold">Leak-proof benchmark</h3>
              <p className="mt-2 max-w-lg text-muted">
                Test messages come from templates the model never saw, plus 104 hand-written messages across two holdouts. A leaky random split would score <span className="font-mono text-warn">{(results.protocol.A_random_split_char_lr.f1 * 100).toFixed(1)}% F1</span> - the honest number is lower, and it is on the benchmark page.
              </p>
              <Link href="/benchmark" className="mt-5 inline-flex items-center gap-2 text-sm text-signal hover:underline">Read the evaluation <ArrowRight className="h-4 w-4" /></Link>
            </article>
          </Reveal>
          <Reveal className="md:col-span-2" delay={0.06}>
            <article className="glass h-full rounded-3xl p-8">
              <FileCheck2 className="h-6 w-6 text-cyan" aria-hidden />
              <h3 className="mt-4 text-lg font-semibold">Explains itself</h3>
              <p className="mt-2 text-sm text-muted">Per-word heat map, weighted red flags and the exact link tricks - in 3 languages.</p>
            </article>
          </Reveal>
          <Reveal className="md:col-span-2" delay={0.04}>
            <article className="glass h-full rounded-3xl p-8">
              <Network className="h-6 w-6 text-violet" aria-hidden />
              <h3 className="mt-4 text-lg font-semibold">MCP-ready tools</h3>
              <p className="mt-2 text-sm text-muted">The same engine runs as a Model Context Protocol server, so any AI assistant can call it.</p>
            </article>
          </Reveal>
          <Reveal className="md:col-span-2" delay={0.08}>
            <article className="glass h-full rounded-3xl p-8">
              <LockKeyhole className="h-6 w-6 text-warn" aria-hidden />
              <h3 className="mt-4 text-lg font-semibold">Private by design</h3>
              <p className="mt-2 text-sm text-muted">Stateless API, offline link analysis, LLM kept out of the verdict and shielded from prompt injection.</p>
            </article>
          </Reveal>
          <Reveal className="md:col-span-2" delay={0.12}>
            <article className="glass h-full rounded-3xl p-8">
              <Waypoints className="h-6 w-6 text-signal" aria-hidden />
              <h3 className="mt-4 text-lg font-semibold">Deploys in one click</h3>
              <p className="mt-2 text-sm text-muted">Pure TypeScript inference of the scikit-learn model: no Python server needed on Vercel.</p>
            </article>
          </Reveal>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-4xl px-4 pb-8 sm:px-6">
        <Reveal>
          <div className="glass relative overflow-hidden rounded-[32px] p-10 text-center sm:p-14">
            <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,rgba(61,255,160,0.16),transparent_65%)]" aria-hidden />
            <h2 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">Got a message that feels off?</h2>
            <p className="mx-auto mt-3 max-w-lg text-muted">Paste it in. In under a second the agent shows you what it found and what to do.</p>
            <Link href="/analyze" className="btn-primary mt-8">Open the analyzer <ArrowRight className="h-4 w-4" /></Link>
          </div>
        </Reveal>
      </section>
    </>
  );
}
