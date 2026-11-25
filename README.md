# Indic Scam Shield

[![CI](https://github.com/amannanda-22/Indic-Scam-Shield/actions/workflows/ci.yml/badge.svg)](https://github.com/amannanda-22/Indic-Scam-Shield/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

**Live demo: https://indicscamshield.vercel.app** (one-click proof of everything: [/live](https://indicscamshield.vercel.app/live))

Built by **Aman Nanda** · [GitHub](https://github.com/amannanda-22) · [LinkedIn](https://linkedin.com/in/nanda-aman)

Agentic scam detection for the languages Indian scammers actually use: **English, Hinglish, Hindi and Telugu (roman + script)**.
Paste a suspicious SMS / WhatsApp message; an agent runs a chain of tools (language detection, ML classifier, scam-signal rules, offline URL forensics, advisory retrieval, risk fusion) and explains the verdict in plain words in English, Hindi or Telugu.

Everything below runs for real. Nothing is mocked in the product path.

| Piece | What it is | How to run |
|---|---|---|
| Web app | Next.js 16 (App Router, TS strict): landing, live analyzer with streamed agent trace, benchmark, architecture | `npm run dev` |
| API | `POST /api/analyze` (NDJSON stream), `GET /api/health`. Zod validation, 2,000-char cap, rate limit, stateless | part of the app |
| ML | scikit-learn TF-IDF char n-gram + Logistic Regression; **inferred in pure TypeScript** (no Python on Vercel) | `npm run ml:all` to rebuild |
| MCP server | `analyze_message`, `check_url`, `search_advisories`. stdio for Claude Desktop **and** HTTP JSON-RPC at `/api/mcp` (works on Vercel) | `npm run mcp` / part of the app |
| Python service | Vercel Python function `api/py/predict.py` (stdlib re-implementation, parity-tested vs sklearn) **and** FastAPI + Docker with the real sklearn pipeline | part of the app / `npm run serve:ml` |
| Live page | `/live`: one click runs one message through web engine, MCP and Python at once | part of the app |
| LLM explainer | optional; writes the explanation only, never the verdict | set `GEMINI_API_KEY` or `ANTHROPIC_API_KEY` |
| LLM baseline | zero-shot LLM on the same hold-outs | `npm run bench:llm` (needs a key) |

## Quick start

```bash
npm install
npm run dev          # http://localhost:3000  (web + /api/mcp; works with zero API keys)
npm run dev:all      # same, plus the real scikit-learn FastAPI service on :8000 (needs `pip install -r ml/serve/requirements.txt` and `npm run ml:all` once)
npm run test:all     # type-check + TS/Python parity + hybrid benchmarks + MCP end-to-end (stdio)
npm run test:http    # tests a RUNNING server (BASE=https://your-app.vercel.app npm run test:http)
```

## Deploy to Vercel (2 minutes)

1. Push this folder to a GitHub repo.
2. Vercel -> *Add New Project* -> import the repo. Framework is auto-detected (Next.js). No build settings needed.
3. Optional env vars: `GEMINI_API_KEY` / `ANTHROPIC_API_KEY` (LLM-written explanations). The app works without them.

The trained model (`lib/data/model.json`, ~650 KB) and benchmark results are committed. The web app and `/api/mcp` need no Python. `api/py/predict.py` is a dependency-free Python function (`vercel.json` bundles `ml/textnorm.py` and the model JSON). After deploying, open `/live` and run `BASE=<your url> npm run test:http`.

Not verified by the author yet: the actual Vercel build of the Python function and the Docker image build. `npm run dev` (plain) has no Python endpoint; use `npm run dev:all` for that.

## Honest evaluation (please read)

* The training corpus is **template-generated** (198 hand-written templates x slot filling), **not scraped real-world data**.
* Hindi/Telugu text was written by an AI model and needs native-speaker review.
* Evaluation never tests on templates seen in training. Results (F1 on the scam class):

| Test | F1 | n | Caveat |
|---|---|---|---|
| Random row split | 0.997 | 580 | **leaky** - shown only to illustrate why not to trust it |
| Template-held-out (ML) | 0.973 | 604 | unseen templates, same generator |
| Hand-written holdout (ML only) | 0.853 | 64 | corpus legit-coverage was widened after seeing its errors -> slightly optimistic |
| Blind-40 (ML only) | 0.919 | 40 | written after rules were frozen; same author |
| Hybrid on hand-written | 0.969 | 64 | rules were written while seeing this set -> **optimistic** |
| Hybrid on blind-40 | 0.947 | 40 | best estimate; ~1.5 pts per message; 2 misses |

* "ML only" rows in the table use the split-trained model; `npm test` prints 0.800 for the shipped model (retrained on all generated data) on the same 64 messages.
* The classifier is over-confident (ECE ~ 0.10), so its probability is one input to a fusion layer, never shown as "confidence".
* Dataset shortcuts found by reading coefficients (`nov`, `rs`, split Devanagari letters) are documented on `/benchmark`.
* Known gaps: Hindi "send PIN/OTP" phrasing, novel "safe account" wording, no image/QR analysis.
* The LLM zero-shot comparison shows nothing until `npm run bench:llm` has actually been run with a key.

Advisories in `lib/engine/advisories.ts` are **paraphrased** public guidance with links to the official top-level sites. Verify wording at the source.

## Layout

```
app/                 Next.js routes (/, /analyze, /benchmark, /architecture, /api/*)
components/          UI (Analyzer, HeroDemo, charts, design primitives)
lib/engine/          normalize, classifier (TS inference), signals, urlforensics, advisories (BM25), llm, analyze (agent)
lib/data/            model.json, results.json, hybrid.json, blind.json (generated; committed)
ml/                  build_corpus.py, train.py, textnorm.py, data/, serve/ (FastAPI + Dockerfile)
mcp/server.ts        Model Context Protocol server
scripts/             selftest (parity + benchmark), blind, mcp-test, bench-llm
```

## Privacy & safety

Stateless API (no database, message text is never logged), offline link analysis (no network request to attacker URLs), LLM isolated from the verdict and given the message as untrusted data. If you lose money to a scam: **call 1930** and report on **cybercrime.gov.in**.

## One-page runbook (local)

```bash
npm install
npm run doctor      # tells you exactly what is missing and the fix
npm run dev:all     # first run auto-installs the Python half (.venv + scikit-learn model); prints the URL to open (…/live)
npm run test:http   # second terminal: 8 live checks (web, MCP via the official client, Python)
npm run test:all    # offline suite: type-check, TS/Python parity, benchmarks, blind-40, MCP stdio
```

* No Python on the machine? Web app, API and MCP still work; run `SKIP_PYTHON=1 npm run test:http`. Install Python 3.9+ later and run `npm run setup`.
* Ports 3000/8000 busy? `dev:all` picks the next free ones and writes them to `.dev-ports.json` (used by `test:http`).
* Production build locally: `ML_SERVICE_URL=http://127.0.0.1:8000 npm run build && npm start` (Next evaluates rewrites at **build** time). On Vercel leave `ML_SERVICE_URL` unset: `api/py/predict.py` serves the Python endpoint.
* **Vercel gotcha:** never put a `requirements.txt` / `pyproject.toml` with FastAPI at the repo root. Vercel would treat the whole repo as a Python framework app and ignore Next.js. Python deps live in `ml/serve/requirements.txt` on purpose.
* Next.js is pinned to 16.4.6 with React 19 (the whole 14.x line has open security advisories; `npm audit` reports 0 vulnerabilities on this pin). Do NOT run `npm audit fix --force`, it is not needed.

## Author

**Aman Nanda**: AI / ML engineer (BSc Artificial Intelligence, 2026).
[GitHub: amannanda-22](https://github.com/amannanda-22) · [LinkedIn: nanda-aman](https://linkedin.com/in/nanda-aman)

Released under the MIT License (see `LICENSE`).
