/**
 * npm test  ->  1) TS<->Python parity on the classifier  2) hybrid-engine benchmark on the hand-written holdout.
 * Writes lib/data/hybrid.json which the /benchmark page renders.
 */
import fs from "node:fs";
import path from "node:path";
import { classify } from "../lib/engine/classifier";
import { normalize } from "../lib/engine/normalize";
import { analyzeCore } from "../lib/engine/analyze";

const root = path.resolve(__dirname, "..");
const parity = JSON.parse(fs.readFileSync(path.join(root, "lib/data/parity.json"), "utf8"));
let bad = 0;
let maxDiff = 0;
for (const p of parity) {
  const n = normalize(p.text);
  if (n !== p.norm) {
    bad++;
    console.log("NORM MISMATCH\n py:", p.norm, "\n ts:", n);
  }
  const d = Math.abs(classify(p.text).pScam - p.p_scam);
  maxDiff = Math.max(maxDiff, d);
  if (d > 1e-3) {
    bad++;
    console.log("PROB MISMATCH", d.toFixed(6), p.text.slice(0, 60));
  }
}
console.log(`parity: ${parity.length} samples, max |p_py - p_ts| = ${maxDiff.toExponential(2)} -> ${bad ? "FAIL" : "OK"}`);

const hold = JSON.parse(fs.readFileSync(path.join(root, "ml/data/handwritten_holdout.json"), "utf8"));
let tp = 0, fp = 0, fn = 0, tn = 0;
const errs: any[] = [];
let mlTp = 0, mlFp = 0, mlFn = 0, mlTn = 0;
for (const r of hold) {
  const a = analyzeCore(r.text).analysis;
  const truth = r.label === "scam";
  const pred = a.verdict !== "safe"; // suspicious counts as flagged (user is told to verify)
  const predStrict = a.verdict === "scam";
  if (truth && pred) tp++; else if (!truth && pred) fp++; else if (truth && !pred) fn++; else tn++;
  const mlPred = a.mlProbability >= 0.5;
  if (truth && mlPred) mlTp++; else if (!truth && mlPred) mlFp++; else if (truth && !mlPred) mlFn++; else mlTn++;
  if (truth !== pred) errs.push({ text: r.text, truth: r.label, verdict: a.verdict, risk: a.riskScore, lang: r.lang });
  void predStrict;
}
const f = (tp: number, fp: number, fn: number, tn: number) => {
  const p = tp / Math.max(1, tp + fp), rc = tp / Math.max(1, tp + fn);
  return { precision: +p.toFixed(3), recall: +rc.toFixed(3), f1: +((2 * p * rc) / Math.max(1e-9, p + rc)).toFixed(3), accuracy: +((tp + tn) / (tp + fp + fn + tn)).toFixed(3), confusion: { tp, fp, fn, tn } };
};
const out = { n: hold.length, hybrid_flagged_or_suspicious: f(tp, fp, fn, tn), ml_only: f(mlTp, mlFp, mlFn, mlTn), errors: errs };
console.log("ML only   :", JSON.stringify(out.ml_only));
console.log("Hybrid    :", JSON.stringify(out.hybrid_flagged_or_suspicious));
for (const e of errs) console.log("  ERR", e.truth, e.verdict, e.risk, e.text.slice(0, 70));
fs.writeFileSync(path.join(root, "lib/data/hybrid.json"), JSON.stringify(out, null, 1));
process.exit(bad ? 1 : 0);
