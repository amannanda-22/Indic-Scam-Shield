/**
 * Pure-TypeScript inference for the scikit-learn TF-IDF(char_wb 2-4) + LogisticRegression models
 * exported by ml/train.py. No Python at runtime -> deploys to Vercel as-is.
 * Re-implements sklearn's char_wb analyzer, sublinear TF, smooth IDF and L2 norm exactly.
 */
import model from "../data/model.json";
import { normalize } from "./normalize";

interface VecModel {
  terms: string[];
  idf: number[];
  coef: number[] | number[][];
  intercept: number | number[];
}

const index = (terms: string[]) => {
  const m = new Map<string, number>();
  terms.forEach((t, i) => m.set(t, i));
  return m;
};

const binary = model.binary as VecModel;
const typeM = model.type as VecModel & { classes: string[] };
const binIndex = index(binary.terms);
const typeIndex = index(typeM.terms);

function charWbNgrams(doc: string, lo = 2, hi = 4): string[] {
  const out: string[] = [];
  for (const word of doc.replace(/\s\s+/g, " ").split(/\s+/).filter(Boolean)) {
    const w = Array.from(" " + word + " ");
    const len = w.length;
    for (let n = lo; n <= hi; n++) {
      let offset = 0;
      out.push(w.slice(offset, offset + n).join(""));
      while (offset + n < len) {
        offset += 1;
        out.push(w.slice(offset, offset + n).join(""));
      }
      if (offset === 0) break;
    }
  }
  return out;
}

function vectorize(grams: string[], idx: Map<string, number>, idf: number[]): Map<number, number> {
  const tf = new Map<number, number>();
  for (const g of grams) {
    const i = idx.get(g);
    if (i !== undefined) tf.set(i, (tf.get(i) ?? 0) + 1);
  }
  let norm = 0;
  const v = new Map<number, number>();
  for (const [i, c] of tf) {
    const x = (1 + Math.log(c)) * idf[i];
    v.set(i, x);
    norm += x * x;
  }
  norm = Math.sqrt(norm) || 1;
  for (const [i, x] of v) v.set(i, x / norm);
  return v;
}

const sigmoid = (z: number) => 1 / (1 + Math.exp(-z));

export interface MlResult {
  pScam: number;
  scamType: { id: string; confidence: number } | null;
  words: { word: string; weight: number }[];
}

export function classify(text: string): MlResult {
  const norm = normalize(text);
  const grams = charWbNgrams(norm);
  const v = vectorize(grams, binIndex, binary.idf);
  const coef = binary.coef as number[];
  let z = binary.intercept as number;
  for (const [i, x] of v) z += x * coef[i];
  const pScam = sigmoid(z);

  // per-token contribution = sum of its n-gram contributions (local explanation, like linear SHAP).
  // Computed per RAW whitespace token so the UI can colour the user's original text directly.
  const words: { word: string; weight: number }[] = [];
  for (const raw of text.split(/\s+/).filter(Boolean)) {
    const nt = normalize(raw);
    if (!nt) continue;
    let s = 0;
    for (const word of nt.split(" ")) {
      const wv = Array.from(" " + word + " ");
      const seen = new Set<string>();
      for (let n = 2; n <= 4; n++) {
        for (let o = 0; o + n <= wv.length; o++) {
          const g = wv.slice(o, o + n).join("");
          if (seen.has(g)) continue;
          seen.add(g);
          const i = binIndex.get(g);
          if (i !== undefined && v.has(i)) s += (v.get(i) as number) * coef[i];
        }
      }
    }
    words.push({ word: raw, weight: s });
  }

  // scam-type model (softmax over the 8 scam families)
  let scamType: MlResult["scamType"] = null;
  if (pScam > 0.35) {
    const tv = vectorize(grams, typeIndex, typeM.idf);
    const tcoef = typeM.coef as number[][];
    const tint = typeM.intercept as number[];
    const scores = tcoef.map((row, k) => {
      let s = tint[k];
      for (const [i, x] of tv) s += x * row[i];
      return s;
    });
    const mx = Math.max(...scores);
    const ex = scores.map((s) => Math.exp(s - mx));
    const sum = ex.reduce((a, b) => a + b, 0);
    let best = 0;
    ex.forEach((e, k) => {
      if (e > ex[best]) best = k;
    });
    scamType = { id: typeM.classes[best], confidence: ex[best] / sum };
  }
  return { pScam, scamType, words };
}

export const MODEL_INFO = {
  version: (model as { version: string }).version,
  features: binary.terms.length,
  arch: "TF-IDF char_wb(2-4) + Logistic Regression (scikit-learn), inferred in TypeScript",
};
