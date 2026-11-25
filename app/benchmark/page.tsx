import type { Metadata } from "next";
import { AlertTriangle, FlaskConical, Info, Languages, TriangleAlert } from "lucide-react";
import { BarList, Confusion, type Bar } from "@/components/Charts";
import { Reveal, SectionHead } from "@/components/ui";
import results from "@/lib/data/results.json";
import hybrid from "@/lib/data/hybrid.json";
import blind from "@/lib/data/blind.json";
import llm from "@/lib/data/llm_bench.json";

export const metadata: Metadata = {
  title: "Benchmark",
  description: "Leak-proof evaluation of the scam classifier: template-held-out, hand-written and blind test sets, with failures shown.",
};

const pct = (x: number | null | undefined) => (x == null ? "-" : (x * 100).toFixed(1) + "%");
const M = results.models;
const LANGNAME: Record<string, string> = { en: "English", hinglish: "Hinglish", hindi: "Hindi", telugu_roman: "Telugu (roman)", telugu_script: "Telugu (script)" };

export default function BenchmarkPage() {
  const bars: Bar[] = [
    { label: "Random row split", sub: "Same templates in train and test", value: results.protocol.A_random_split_char_lr.f1, n: results.protocol.A_random_split_char_lr.n, tone: "warn", badge: "leaky - do not trust" },
    { label: "Template-held-out test", sub: "ML model, unseen templates", value: M.char_tfidf_lr.template_test.f1, n: M.char_tfidf_lr.template_test.n, tone: "good" },
    { label: "Hand-written holdout (ML only)", sub: "64 messages, new phrasings & scam types", value: M.char_tfidf_lr.handwritten.f1, n: 64, tone: "info" },
    { label: "Blind-40 (ML only)", sub: "Written after the rules were frozen", value: blind.ml_only.f1, n: blind.n, tone: "info" },
    { label: "Hybrid engine - hand-written holdout", sub: "Rules were authored while seeing this set", value: hybrid.hybrid_flagged_or_suspicious.f1, n: hybrid.n, tone: "warn", badge: "optimistic" },
    { label: "Hybrid engine - blind-40", sub: "Best estimate of real-world behaviour", value: blind.hybrid.f1, n: blind.n, tone: "good" },
  ];
  const models: [string, typeof M.rules_keywords][] = [
    ["Keyword rules (baseline)", M.rules_keywords],
    ["Word TF-IDF + LR", M.word_tfidf_lr as typeof M.rules_keywords],
    ["Char n-gram TF-IDF + LR (shipped)", M.char_tfidf_lr as typeof M.rules_keywords],
  ];
  const langs = Object.keys(M.char_tfidf_lr.template_test_by_lang);
  const allErrors = [
    ...blind.errors.map((e) => ({ ...e, set: "blind-40" })),
    ...hybrid.errors.map((e) => ({ ...e, set: "hand-written" })),
  ];
  const ds = results.dataset;

  return (
    <div className="mx-auto max-w-6xl px-4 pb-8 pt-12 sm:px-6">
      <header className="max-w-3xl">
        <p className="hud-label mb-3 text-signal">Evaluation</p>
        <h1 className="text-balance text-3xl font-semibold tracking-tight sm:text-5xl">
          An honest benchmark - including <span className="text-warn">where it fails</span>
        </h1>
        <p className="mt-4 text-lg text-muted">
          Anyone can print 99% by testing on training data. Here every number says what it was tested on, how many messages that was, and what is biased about it.
        </p>
      </header>

      <Reveal className="mt-8">
        <aside className="flex gap-4 rounded-2xl border border-warn/30 bg-warn/[0.06] p-5 text-sm">
          <Info className="mt-0.5 h-5 w-5 shrink-0 text-warn" aria-hidden />
          <div className="space-y-2 text-fg/90">
            <p><strong>Read this first.</strong> Small, synthetic data: {ds.rows.toLocaleString()} template-generated rows for training, 64 + 40 hand-written test messages. Hindi and Telugu text needs native-speaker review. Treat every number as a rough estimate, not a guarantee.</p>
            <details className="text-fg/80">
              <summary className="cursor-pointer text-warn">Why some scores are optimistic</summary>
              <p className="mt-2">The hybrid engine&apos;s 15 rules were written by the same author who wrote the hand-written holdout, so that score is optimistic. The blind-40 set was written <em>after</em> the rules were frozen and run once with no tuning, so it is the better estimate. With only 40 to 64 messages, a single message moves F1 by about 1.5 points.</p>
            </details>
          </div>
        </aside>
      </Reveal>

      {/* Bars */}
      <section className="mt-20">
        <SectionHead eyebrow="Same system, six test conditions" title="Why the protocol matters more than the model" sub="F1 for the 'scam' class. A leaky split flatters the model; honest holdouts are 10 to 15 points lower." />
        <Reveal><div className="glass rounded-3xl p-6 sm:p-10"><BarList bars={bars} /></div></Reveal>
      </section>

      {/* Table */}
      <section className="mt-24">
        <SectionHead eyebrow="Model comparison" title="Three models, two fair test sets" sub="Character n-grams beat word n-grams on messy transliterated text, and both crush keyword rules." />
        <Reveal>
          <div className="glass overflow-x-auto rounded-3xl">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="hud-label border-b border-line">
                <tr>
                  <th className="p-4 font-normal">Model</th>
                  <th className="p-4 font-normal">F1 · template-test</th>
                  <th className="p-4 font-normal">AUC</th>
                  <th className="p-4 font-normal">ECE ↓</th>
                  <th className="p-4 font-normal">F1 · hand-written</th>
                  <th className="p-4 font-normal">Precision</th>
                  <th className="p-4 font-normal">Recall</th>
                </tr>
              </thead>
              <tbody className="font-mono tabular-nums">
                {models.map(([name, m]) => (
                  <tr key={name} className="border-b border-line/60 last:border-0 hover:bg-white/[0.02]">
                    <td className="p-4 font-sans font-medium">{name}</td>
                    <td className="p-4">{pct(m.template_test.f1)}</td>
                    <td className="p-4">{m.template_test.auc?.toFixed(3)}</td>
                    <td className="p-4">{m.template_test.ece?.toFixed(3)}</td>
                    <td className="p-4">{pct(m.handwritten.f1)}</td>
                    <td className="p-4">{pct(m.handwritten.precision)}</td>
                    <td className="p-4">{pct(m.handwritten.recall)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-xs text-muted">ECE = expected calibration error (lower is better). The model is over-confident (ECE ≈ 0.10): its probabilities are used as one input to a fusion layer, not shown as a standalone &quot;confidence&quot;.</p>
        </Reveal>
      </section>

      {/* Confusion + languages */}
      <section className="mt-24 grid gap-6 lg:grid-cols-2">
        <Reveal>
          <div className="glass h-full rounded-3xl p-6 sm:p-8">
            <h3 className="mb-6 font-semibold">Errors that hurt: hybrid engine, blind-40</h3>
            <Confusion {...blind.hybrid.confusion} title={`${blind.n} unseen messages · suspicious counts as flagged`} />
            <p className="mt-5 text-sm text-muted">Precision {pct(blind.hybrid.precision)} · recall {pct(blind.hybrid.recall)}. For a safety tool a missed scam (bottom-right of &quot;real scam&quot;) is costlier than a false alarm, so the thresholds lean cautious.</p>
          </div>
        </Reveal>
        <Reveal delay={0.06}>
          <div className="glass h-full rounded-3xl p-6 sm:p-8">
            <h3 className="mb-6 flex items-center gap-2 font-semibold"><Languages className="h-4 w-4 text-cyan" /> Accuracy by language (template-test)</h3>
            <BarList
              bars={langs.map((l) => {
                const v = (M.char_tfidf_lr.template_test_by_lang as Record<string, { n: number; accuracy: number }>)[l];
                return { label: LANGNAME[l] ?? l, value: v.accuracy, n: v.n, tone: v.accuracy < 0.95 ? "warn" : "good" } as Bar;
              })}
            />
            <p className="mt-5 text-sm text-muted">Hindi (Devanagari) is the weakest language on held-out templates. On the 64 hand-written messages, Telugu script has only 2 examples, so that cell is anecdotal.</p>
          </div>
        </Reveal>
      </section>

      {/* Deep dive (collapsed by default so the page stays short for a first-time visitor) */}
      <details className="mt-20 rounded-3xl border border-line bg-panel/40 p-4 sm:p-6">
        <summary className="cursor-pointer text-base font-medium text-fg">Deep dive: what the model learned and where it still fails</summary>
        <div className="-mt-12">
      {/* Explainability */}
      <section className="mt-24">
        <SectionHead eyebrow="What did the model learn?" title="Top words - and the shortcuts hiding in them" sub="Reading the coefficients is how I found the dataset's biases." />
        <div className="grid gap-6 md:grid-cols-2">
          <Reveal>
            <div className="glass rounded-3xl p-6">
              <h3 className="hud-label mb-4 text-danger">Pushes toward scam</h3>
              <div className="flex flex-wrap gap-2">
                {results.top_words_scam.slice(0, 14).map((w) => (
                  <span key={w.w} className="rounded-lg border border-danger/30 bg-danger/[0.07] px-2.5 py-1 font-mono text-xs">{w.w} <span className="text-danger">+{w.c.toFixed(1)}</span></span>
                ))}
              </div>
            </div>
          </Reveal>
          <Reveal delay={0.06}>
            <div className="glass rounded-3xl p-6">
              <h3 className="hud-label mb-4 text-signal">Pushes toward safe</h3>
              <div className="flex flex-wrap gap-2">
                {results.top_words_legit.slice(0, 14).map((w) => (
                  <span key={w.w} className="rounded-lg border border-signal/30 bg-signal/[0.07] px-2.5 py-1 font-mono text-xs">{w.w} <span className="text-signal">{w.c.toFixed(1)}</span></span>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
        <Reveal className="mt-4">
          <div className="flex gap-3 rounded-2xl border border-line bg-panel/60 p-5 text-sm text-muted">
            <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-warn" aria-hidden />
            <p>
              <span className="text-fg">Spurious shortcuts spotted:</span> <code className="text-warn">nov</code> (month names appear mostly in my legitimate templates), <code className="text-warn">rs</code> (amounts appear mostly in scams) and single Devanagari/Telugu letters (the word tokenizer splits combining marks). This is exactly why the shipped model uses character n-grams plus rules, and why real-world data collection is the next step.
            </p>
          </div>
        </Reveal>
      </section>

      {/* Failures */}
      <section className="mt-24">
        <SectionHead eyebrow="Failure analysis" title="What it still gets wrong" />
        <Reveal>
          <div className="glass overflow-hidden rounded-3xl">
            <ul className="divide-y divide-line">
              {allErrors.map((e, i) => (
                <li key={i} className="grid gap-2 p-5 sm:grid-cols-[1fr_auto] sm:items-center">
                  <p className="break-words text-sm text-fg/90">{e.text}</p>
                  <p className="flex shrink-0 items-center gap-2 font-mono text-xs">
                    <span className="rounded-md border border-line px-2 py-0.5 text-muted">{e.set}</span>
                    <span className={e.truth === "scam" ? "text-danger" : "text-warn"}>{e.truth === "scam" ? "missed scam" : "false alarm"}</span>
                    <span className="text-muted">risk {e.risk}</span>
                  </p>
                </li>
              ))}
            </ul>
          </div>
          <div className={`mt-4 grid gap-4 ${llm.status !== "not_run" ? "md:grid-cols-2" : ""}`}>
            <div className="rounded-2xl border border-line bg-panel/60 p-5 text-sm text-muted">
              <p className="mb-2 flex items-center gap-2 font-medium text-fg"><AlertTriangle className="h-4 w-4 text-danger" /> Known gaps</p>
              <ul className="list-inside list-disc space-y-1.5">
                <li>Hindi (Devanagari) &quot;send me your PIN/OTP&quot; phrasing is only partly covered by the rules.</li>
                <li>Novel &quot;move money to a protected/safe account&quot; wording from impersonated regulators.</li>
                <li>Genuine messages that legitimately say &quot;share OTP with the delivery person&quot; can look suspicious.</li>
                <li>No image/QR analysis yet; scammers often send screenshots.</li>
              </ul>
            </div>
            {llm.status !== "not_run" && (
            <div className="rounded-2xl border border-line bg-panel/60 p-5 text-sm text-muted">
              <p className="mb-2 flex items-center gap-2 font-medium text-fg"><FlaskConical className="h-4 w-4 text-cyan" /> Zero-shot LLM comparison</p>
              {
                <div className="space-y-2">
                  <p>{String((llm as any).provider)} · {String((llm as any).model)} · {String((llm as any).date)} · zero-shot</p>
                  <p className="font-mono text-fg">hand-written F1 {pct((llm as any).handwritten?.f1)} · blind-40 F1 {pct((llm as any).blind?.f1)}</p>
                  <p>vs hybrid engine: {pct(hybrid.hybrid_flagged_or_suspicious.f1)} / {pct(blind.hybrid.f1)}</p>
                </div>
              }
            </div>
            )}
          </div>
        </Reveal>
      </section>
        </div>
      </details>
    </div>
  );
}
