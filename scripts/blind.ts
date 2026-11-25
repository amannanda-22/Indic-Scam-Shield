import fs from "node:fs";
import path from "node:path";
import { analyzeCore } from "../lib/engine/analyze";
const root = path.resolve(__dirname, "..");
const rows = JSON.parse(fs.readFileSync(path.join(root, "ml/data/fresh_blind.json"), "utf8"));
let tp=0,fp=0,fn=0,tn=0, mtp=0,mfp=0,mfn=0,mtn=0; const errs:any[]=[];
for (const r of rows) {
  const a = analyzeCore(r.text).analysis; const t = r.label==="scam"; const p = a.verdict!=="safe"; const m = a.mlProbability>=0.5;
  if(t&&p)tp++;else if(!t&&p)fp++;else if(t&&!p)fn++;else tn++;
  if(t&&m)mtp++;else if(!t&&m)mfp++;else if(t&&!m)mfn++;else mtn++;
  if(t!==p) errs.push({text:r.text,truth:r.label,verdict:a.verdict,risk:a.riskScore});
}
const f=(tp:number,fp:number,fn:number,tn:number)=>{const p=tp/Math.max(1,tp+fp),r=tp/Math.max(1,tp+fn);return {precision:+p.toFixed(3),recall:+r.toFixed(3),f1:+(2*p*r/Math.max(1e-9,p+r)).toFixed(3),accuracy:+((tp+tn)/(tp+fp+fn+tn)).toFixed(3),confusion:{tp,fp,fn,tn}};};
const out={n:rows.length,ml_only:f(mtp,mfp,mfn,mtn),hybrid:f(tp,fp,fn,tn),errors:errs};
console.log(JSON.stringify(out.ml_only)); console.log(JSON.stringify(out.hybrid));
for(const e of errs) console.log(" ERR",e.truth,e.verdict,e.risk,e.text.slice(0,80));
fs.writeFileSync(path.join(root,"lib/data/blind.json"),JSON.stringify(out,null,1));
