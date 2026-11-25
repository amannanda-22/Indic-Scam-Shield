import { classify, MODEL_INFO } from "./classifier";
import { searchAdvisories } from "./advisories";
import { detectSignals } from "./signals";
import { analyzeUrl } from "./urlforensics";
import { detectLanguage, extractPhones, extractUpiIds, extractUrls, normalize } from "./normalize";
import { ACTIONS, TYPE_LABEL, VERDICT_LABEL, type UiLang } from "./i18n";
import { llmAvailable, llmExplain } from "./llm";
import type { Analysis, Signal, TraceStep, Verdict } from "./types";

const DISCLAIMER =
  "Automated screening aid, not legal or financial advice. It can be wrong - when in doubt, call your bank on the number printed on your card or dial 1930 for cyber-fraud help.";

const logit = (p: number) => Math.log(Math.min(0.999, Math.max(0.001, p)) / (1 - Math.min(0.999, Math.max(0.001, p))));
const sigmoid = (z: number) => 1 / (1 + Math.exp(-z));

/** Signals that pin the scam family regardless of the ML type head (rare/unseen families). */
function deriveType(signals: Signal[], ml: { id: string; confidence: number } | null) {
  const ids = new Set(signals.map((s) => s.id));
  if (ids.has("digital_arrest")) return { id: "digital_arrest", confidence: 0.9 };
  if (ids.has("remote_access")) return { id: "remote_access", confidence: 0.9 };
  if (ids.has("investment_pitch")) return { id: "investment_fraud", confidence: 0.85 };
  if (ids.has("contact_blackmail")) return { id: "loan_app", confidence: 0.85 };
  if (ids.has("collect_request")) return { id: "upi_refund", confidence: 0.8 };
  if (ids.has("task_job")) return { id: "job_task", confidence: 0.8 };
  if (ml && ml.confidence >= 0.5) return ml;
  if (ids.has("credential_ask") || ids.has("kyc_pretext")) return { id: "kyc_block", confidence: 0.55 };
  if (ids.has("reward_bait") && ids.has("advance_fee")) return { id: "lottery_prize", confidence: 0.6 };
  return ml ?? { id: "other", confidence: 0.4 };
}

export interface CoreOutput {
  analysis: Omit<Analysis, "explanation" | "explainedBy" | "trace" | "elapsedMs">;
  trace: TraceStep[];
}

/** The deterministic core. Pure + synchronous so it can be unit-tested and benchmarked offline. */
export function analyzeCore(text: string): CoreOutput {
  const trace: TraceStep[] = [];
  const step = <T,>(tool: string, fn: () => { out: T; summary: string; data?: unknown }): T => {
    const t0 = performance.now();
    const r = fn();
    trace.push({ tool, summary: r.summary, ms: Math.round((performance.now() - t0) * 100) / 100, data: r.data });
    return r.out;
  };

  const language = step("detect_language", () => {
    const l = detectLanguage(text);
    return { out: l, summary: `Detected script/language: ${l.replace("_", " ")}` };
  });

  const entities = step("extract_entities", () => {
    const urls = extractUrls(text);
    const phones = extractPhones(text);
    const upi = extractUpiIds(text);
    return { out: { urls, phones, upi }, summary: `${urls.length} link(s), ${phones.length} phone number(s), ${upi.length} UPI id(s)` };
  });

  const ml = step("ml_classifier", () => {
    const r = classify(text);
    return { out: r, summary: `Char n-gram TF-IDF + LR: P(scam) = ${(r.pScam * 100).toFixed(1)}%`, data: { features: MODEL_INFO.features } };
  });

  const sig = step("rule_signals", () => {
    const r = detectSignals(text);
    return { out: r, summary: `${r.signals.length} scam signal(s), ${r.safetyHints.length} reassuring signal(s)` };
  });

  const urls = step("url_forensics", () => {
    const u = entities.urls.map(analyzeUrl).sort((a, b) => b.risk - a.risk);
    return { out: u, summary: u.length ? `Worst link risk ${(u[0].risk * 100).toFixed(0)}% (${u[0].host})` : "No links to inspect" };
  });

  const scamType = step("scam_type", () => {
    const t = deriveType(sig.signals, ml.scamType);
    return { out: t, summary: `Family: ${t.id}` };
  });

  const advisories = step("retrieve_advisories", () => {
    const q = [normalize(text), ...sig.signals.map((s) => s.id.replace("_", " ")), scamType.id.replace("_", " ")].join(" ");
    const hits = searchAdvisories(q, advisoryBoost(scamType.id, sig.signals), 3);
    return { out: hits.map((h) => h.advisory), summary: `BM25 over ${14} advisories -> ${hits.map((h) => h.advisory.id).join(", ") || "none"}` };
  });

  const risk = step("fuse_risk", () => {
    const mlL = Math.max(-6, Math.min(6, logit(ml.pScam)));
    const S = Math.min(sig.rawSum, 6);
    const U = urls.length ? urls[0].risk : 0;
    const z = 0.5 * mlL + 0.7 * S + 2.0 * U - 1.1 * sig.safetyWeight - 0.6;
    const r = sigmoid(z);
    return { out: r, summary: `risk = sigmoid(0.5*ML + 0.7*rules + 2.0*URL - 1.1*safety - 0.6) = ${(r * 100).toFixed(0)}/100`, data: { mlL, S, U, safety: sig.safetyWeight, z } };
  });

  const verdict: Verdict = risk >= 0.7 ? "scam" : risk >= 0.4 ? "suspicious" : "safe";

  return {
    analysis: {
      verdict,
      riskScore: Math.min(99, Math.max(1, Math.round(risk * 100))), // never claim 0% or 100% certainty
      mlProbability: ml.pScam,
      ruleScore: sig.ruleScore,
      language,
      scamType: verdict === "safe" ? null : { id: scamType.id, label: TYPE_LABEL[scamType.id]?.en ?? scamType.id, confidence: scamType.confidence },
      signals: sig.signals,
      safetyHints: sig.safetyHints,
      urls,
      phones: entities.phones,
      upiIds: entities.upi,
      words: ml.words,
      advisories: verdict === "safe" ? [] : advisories,
      actions: [],
      disclaimer: DISCLAIMER,
    },
    trace,
  };
}

function advisoryBoost(typeId: string, signals: Signal[]): string[] {
  const map: Record<string, string[]> = {
    digital_arrest: ["digital-arrest", "report-1930"],
    kyc_block: ["kyc-links", "never-share-otp"],
    upi_refund: ["upi-receive"],
    lottery_prize: ["lottery-fee"],
    job_task: ["task-jobs"],
    loan_app: ["loan-apps"],
    utility_disconnect: ["utility-cut"],
    parcel_customs: ["parcel-customs"],
    investment_fraud: ["investment-groups"],
    remote_access: ["remote-access"],
  };
  const ids = new Set(map[typeId] ?? []);
  if (signals.some((s) => s.id === "credential_ask")) ids.add("never-share-otp");
  if (signals.some((s) => s.id === "collect_request")) ids.add("upi-receive");
  return [...ids];
}

export function buildActions(verdict: Verdict, typeId: string | undefined, lang: UiLang): string[] {
  const base = verdict === "scam" ? ACTIONS._scam : verdict === "suspicious" ? ACTIONS._suspicious : ACTIONS._safe;
  const extra = typeId && verdict !== "safe" ? ACTIONS[typeId] ?? [] : [];
  return [...extra, ...base].map((a) => a[lang]).slice(0, 5);
}

function templateExplanation(a: CoreOutput["analysis"], lang: UiLang): string {
  const top = a.signals.slice(0, 3).map((s) => s.label.toLowerCase());
  const typeLabel = a.scamType ? TYPE_LABEL[a.scamType.id]?.[lang] ?? a.scamType.label : "";
  const bad = a.urls.find((u) => u.risk >= 0.5);
  const badFlag = bad ? bad.flags.find((f) => /not an official|typo-squat|raw ip/i.test(f)) ?? bad.flags[0] : "";
  if (lang === "hi") {
    if (a.verdict === "safe") return `जोखिम स्कोर ${a.riskScore}/100। इसमें ठगी के मजबूत संकेत नहीं मिले${a.safetyHints.length ? " और यह सामान्य सूचना जैसा लगता है" : ""}।`;
    return `जोखिम स्कोर ${a.riskScore}/100। यह "${typeLabel}" जैसा लगता है।${bad ? ` लिंक (${bad.host}) असली नहीं लगता।` : ""} पहले आधिकारिक ऐप/हेल्पलाइन से जांचें।`;
  }
  if (lang === "te") {
    if (a.verdict === "safe") return `రిస్క్ స్కోర్ ${a.riskScore}/100. బలమైన మోసపు సూచనలు కనపడలేదు${a.safetyHints.length ? ", ఇది సాధారణ సమాచార సందేశంలా ఉంది" : ""}.`;
    return `రిస్క్ స్కోర్ ${a.riskScore}/100. ఇది "${typeLabel}" లాగా ఉంది.${bad ? ` లింక్ (${bad.host}) నిజమైనది కాదు.` : ""} ముందు అధికారిక యాప్/హెల్ప్‌లైన్‌లో ధృవీకరించండి.`;
  }
  if (a.verdict === "safe") {
    return `Risk ${a.riskScore}/100. No strong scam indicators${a.safetyHints.length ? `; it reads like a routine notice (${a.safetyHints[0].toLowerCase()})` : ""}.`;
  }
  const why = top.length ? ` Main red flags: ${top.join("; ")}.` : "";
  const link = bad ? ` The link ${bad.host} looks fake (${badFlag.toLowerCase()}).` : "";
  return `Risk ${a.riskScore}/100. This resembles a "${typeLabel}".${why}${link} Verify through the official app or helpline before doing anything.`;
}

export type StreamEvent = { type: "step"; step: TraceStep } | { type: "result"; analysis: Analysis };

/** Streams the agent's tool calls one by one, then the final result. Used by /api/analyze (NDJSON). */
export async function* analyzeStream(text: string, lang: UiLang = "en"): AsyncGenerator<StreamEvent> {
  const t0 = performance.now();
  const { analysis, trace } = analyzeCore(text);
  for (const s of trace) yield { type: "step", step: s };

  analysis.actions = buildActions(analysis.verdict, analysis.scamType?.id, lang);
  let explanation = templateExplanation(analysis, lang);
  let explainedBy: "template" | "llm" = "template";

  if (llmAvailable()) {
    const t1 = performance.now();
    const out = await llmExplain(analysis, text, lang);
    const step: TraceStep = { tool: "llm_explain", summary: out ? `Explanation written by ${llmAvailable()} (verdict unchanged)` : "LLM unavailable - using template explanation", ms: Math.round(performance.now() - t1) };
    trace.push(step);
    yield { type: "step", step };
    if (out) {
      explanation = out;
      explainedBy = "llm";
    }
  } else {
    const step: TraceStep = { tool: "compose_explanation", summary: "Template explanation (set GEMINI_API_KEY or ANTHROPIC_API_KEY for LLM wording)", ms: 0 };
    trace.push(step);
    yield { type: "step", step };
  }

  yield { type: "result", analysis: { ...analysis, explanation, explainedBy, trace, elapsedMs: Math.round(performance.now() - t0) } };
}

export { VERDICT_LABEL };
