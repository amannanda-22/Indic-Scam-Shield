export type Lang = "en" | "hinglish" | "hindi" | "telugu_roman" | "telugu_script" | "unknown";
export type Verdict = "safe" | "suspicious" | "scam";

export interface Signal {
  id: string;
  label: string;
  weight: number; // contribution to the rule score (logit space)
  evidence: string[]; // matched snippets
}

export interface UrlFinding {
  raw: string;
  host: string;
  risk: number; // 0..1
  flags: string[];
  lookalikeOf?: string;
}

export interface Advisory {
  id: string;
  title: string;
  body: string;
  action: string;
  tags: string[];
  source: string;
  sourceUrl: string;
}

export interface TraceStep {
  tool: string;
  summary: string;
  ms: number;
  data?: unknown;
}

export interface WordWeight {
  word: string;
  weight: number; // + pushes towards scam, - towards legit
}

export interface Analysis {
  verdict: Verdict;
  riskScore: number; // 0..100
  mlProbability: number; // 0..1 (char n-gram TF-IDF logistic regression)
  ruleScore: number; // 0..1
  language: Lang;
  scamType: { id: string; label: string; confidence: number } | null;
  signals: Signal[];
  safetyHints: string[]; // things that reduce risk (e.g. "never share OTP" warnings)
  urls: UrlFinding[];
  phones: string[];
  upiIds: string[];
  words: WordWeight[];
  advisories: Advisory[];
  actions: string[];
  explanation: string;
  explainedBy: "template" | "llm";
  trace: TraceStep[];
  elapsedMs: number;
  disclaimer: string;
}
