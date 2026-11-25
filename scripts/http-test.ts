/**
 * Tests a RUNNING deployment (local `npm run dev:all`, or your Vercel URL):
 *   BASE=https://your-app.vercel.app npm run test:http
 * Calls the web API, the remote MCP endpoint (with the official MCP client) and the Python function.
 */
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

import fs from "node:fs";
import path from "node:path";
function defaultBase() {
  try {
    const j = JSON.parse(fs.readFileSync(path.resolve(__dirname, "../.dev-ports.json"), "utf8")); // written by npm run dev:all
    return `http://localhost:${j.web}`;
  } catch {
    return "http://localhost:3000";
  }
}
const BASE = (process.env.BASE || defaultBase()).replace(/\/$/, "");
const SCAM = "Aapka SBI account block ho jayega. KYC update karein: http://sbi-kyc-verify.top/login aur OTP bhejein";
const SAFE = "Your OTP is 482913. Do not share it with anyone. -HDFC Bank";
const results: [string, boolean, string][] = [];
const check = (name: string, ok: boolean, info = "") => {
  results.push([name, ok, info]);
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${info ? "  (" + info + ")" : ""}`);
};

async function web(text: string) {
  const r = await fetch(`${BASE}/api/analyze`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ text, lang: "en" }) });
  const lines = (await r.text()).trim().split("\n").map((l) => JSON.parse(l));
  return { status: r.status, last: lines[lines.length - 1], steps: lines.filter((l) => l.type === "step").length };
}

(async () => {
  const h = await fetch(`${BASE}/api/health`);
  check("GET /api/health", h.ok);
  const a = await web(SCAM);
  check("web: scam message -> scam", a.last.analysis?.verdict === "scam", `risk ${a.last.analysis?.riskScore}, ${a.steps} streamed steps`);
  const b = await web(SAFE);
  check("web: genuine OTP -> safe", b.last.analysis?.verdict === "safe", `risk ${b.last.analysis?.riskScore}`);
  const bad = await fetch(`${BASE}/api/analyze`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ text: "hi" }) });
  check("web: 2-char input rejected", bad.status === 400);

  try {
    const c = new Client({ name: "http-test", version: "1" });
    await c.connect(new StreamableHTTPClientTransport(new URL(`${BASE}/api/mcp`)));
    const names = (await c.listTools()).tools.map((t) => t.name);
    check("mcp: tools/list via official client", names.length === 3, names.join(", "));
    const r = (await c.callTool({ name: "analyze_message", arguments: { text: SCAM } })) as { content: { text: string }[] };
    check("mcp: analyze_message -> scam", JSON.parse(r.content[0].text).verdict === "scam");
    await c.close();
  } catch (e) {
    check("mcp over HTTP", false, e instanceof Error ? e.message : "error");
  }

  if (process.env.SKIP_PYTHON) {
    console.log("SKIP  python checks (SKIP_PYTHON set)");
    const f = results.filter((r) => !r[1]).length;
    console.log(f ? `\n${f} FAILED` : "\nALL HTTP CHECKS PASSED (python skipped)");
    process.exit(f ? 1 : 0);
  }
  const p = await fetch(`${BASE}/api/py/predict`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ text: SCAM }) });
  const pj = p.ok ? await p.json() : null;
  check("python: scam message -> scam", pj?.label === "scam", pj ? `p=${pj.p_scam}` : `HTTP ${p.status} (local: use npm run dev:all)`);
  const p2 = await fetch(`${BASE}/api/py/predict`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ text: SAFE }) });
  check("python: genuine OTP -> legit", p2.ok && (await p2.json()).label === "legit");

  const failed = results.filter((r) => !r[1]).length;
  console.log(failed ? `\n${failed} FAILED` : "\nALL HTTP CHECKS PASSED");
  process.exit(failed ? 1 : 0);
})();
