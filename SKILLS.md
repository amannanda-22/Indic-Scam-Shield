# Indic Scam Shield: kya use kiya, kyun, aur interview mein kaise bolna hai

Har row ka format: **Kya hai -> Is project mein kya karta hai -> Interview line**. Interview lines sirf wahi hain jo is repo mein asli mein chalta hai.

## AI / GenAI

| Skill | Is project mein kya kiya | Interview mein bol |
|---|---|---|
| **Agentic tool pipeline** | 8 chhote tools (language, entities, ML, rules, URL, type, retrieval, fusion) ek ke baad ek chalte hain aur UI par stream hote hain (`lib/engine/analyze.ts`, `/api/analyze`) | "Maine ek auditable agent banaya: har verdict ke peeche tool calls ka trace hai, black box nahi." |
| **RAG (BM25 retrieval)** | 14 safety advisories par BM25 search, har verdict ke saath sahi advisory aur official source link (`advisories.ts`) | "RAG mein embeddings zaroori nahi thi, isliye BM25 chuna: offline, free, aur multilingual tags se Hinglish queries bhi match hoti hain." |
| **LLM as explainer only** | Gemini/Claude sirf explanation likhta hai, verdict nahi badal sakta; message untrusted data ki tarah bheja jaata hai (`llm.ts`) | "LLM ko decision power nahi diya, taaki hallucination ya prompt injection se verdict na badle." |
| **MCP server** | `analyze_message`, `check_url`, `search_advisories` tools, end-to-end test ke saath (`mcp/server.ts`) | "Engine ko MCP tool bana diya, to koi bhi AI assistant ise call kar sakta hai." |

## Machine Learning

| Skill | Is project mein kya kiya | Interview mein bol |
|---|---|---|
| **TF-IDF char n-grams + Logistic Regression** | Binary scam/safe model + 8-family type model (`ml/train.py`) | "Transliterated Hinglish mein spelling badalti rehti hai, isliye character n-grams use kiye; word model se behtar nikla." |
| **Model ko TypeScript mein re-implement karna** | sklearn ka `char_wb`, sublinear TF, IDF, L2 norm TS mein; parity test max difference 2e-6 | "Vercel par Python nahi chahiye tha, to maine inference TS mein likha aur parity test se prove kiya ki output same hai." |
| **Calibration (ECE) aur over-confidence** | ECE ~ 0.10 mila, isliye probability ko seedha confidence nahi dikhaya | "Model over-confident tha, to uska output fusion layer ka ek input bana." |
| **Local explainability** | Har word ka contribution (linear SHAP jaisa), message par colour (`HeatText`) | "Linear model mein coefficient x TF-IDF se per-word contribution nikala, isse dataset ke shortcuts bhi mile (`nov`, `rs`)." |

## Data Science

| Skill | Is project mein kya kiya | Interview mein bol |
|---|---|---|
| **Leakage-free evaluation** | Template-wise split, 64 hand-written holdout, 40 blind set. Random split 99.7% F1 deta tha, honest number 85-95% | "Random split ne 99.7% diya, jo leakage tha. Template-held-out aur blind sets se asli performance nikali." |
| **Error analysis** | Har galat message list mein (`/benchmark`), known gaps documented | "Maine failures ko chhupaya nahi, page par dikhaya." |
| **Score fusion** | `risk = sigmoid(0.5*ML + 0.7*rules + 2.0*URL - 1.1*safety - 0.6)` | "Sirf ~100 labelled hold-out messages the, isliye stacked model ki jagah transparent logit blend rakha." |
| **Feature engineering** | 15 multilingual rules, URL features (Levenshtein typo-squat, TLD, brand look-alike) | "Rules unseen wording pakadte hain aur har rule ka label aur weight explainable hai." |

## Data Analytics

| Skill | Is project mein kya kiya | Interview mein bol |
|---|---|---|
| **Segment analysis** | Language-wise accuracy; Hindi sabse kamzor mila | "Average accuracy ne Hindi ki kamzori chhupa di thi, slice karne par dikhi." |
| **Data-quality iteration** | Pehle benchmark mein normal receipts galat flag hue, to legit coverage badhayi (5 naye types) | "Measure, fail hone wala segment dhoondha, data fix kiya, dobara measure kiya." |

## Software Engineering / Deployment

| Skill | Is project mein kya kiya | Interview mein bol |
|---|---|---|
| **Next.js 16 + TypeScript strict + Tailwind + Framer Motion** | 4 pages, streaming API, responsive (390px tak test), reduced-motion support | "Server components data pages ke liye, client components interaction ke liye." |
| **FastAPI + Docker** | Same sklearn pipeline ka Python service, Dockerfile image ke andar train karta hai (`ml/serve/`) | "Do deployment paths: Vercel (TS) ya container (Python)." |
| **Security** | Zod validation, 2,000-char cap, per-IP rate limit, security headers, stateless, text log nahi | "Scam tool sensitive messages dekhta hai, isliye kuch store hi nahi kiya." |
| **Testing** | `npm run test:all`: type-check, TS/Python parity, benchmarks, MCP end-to-end | "Har claim ke peeche ek test hai." |

## Interview mein ye limits zaroor bol (credibility badhti hai)

1. Training data template-generated hai, real victims ka data nahi.
2. Hybrid ka 0.969 optimistic hai (rules mene holdout dekh ke likhe), blind-40 par 0.947 hai, aur n sirf 40 hai.
3. Hindi/Telugu text native speaker se review nahi hua.
4. LLM baseline abhi run nahi hua (key chahiye), is liye koi LLM number claim mat karna.

## 30-second pitch

"Scammers Hinglish aur Telugu mein likhte hain, par zyada detectors English par bane hain. Maine ek agent banaya jo message padhta hai, ML model, rules, offline URL forensics aur advisory retrieval chalata hai, aur 3 bhasha mein samjhata hai kya karna hai. Maine ise honest tarike se evaluate kiya: random split 99.7% de raha tha jo leakage tha, to template-held-out aur blind sets banaye, aur failures page par dikhaye. Sab Vercel par deployable hai, MCP server aur FastAPI service ke saath."
