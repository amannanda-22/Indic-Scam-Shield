// npm run doctor -> tells you exactly what is missing and the one command that fixes it.
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import net from "node:net";
import path from "node:path";
import { findPython, ROOT } from "./py.mjs";

let bad = 0;
const row = (ok, name, info = "", fix = "") => {
  if (!ok) bad++;
  console.log(`${ok ? "OK  " : "FAIL"}  ${name}${info ? "  " + info : ""}${!ok && fix ? "\n        fix: " + fix : ""}`);
};
const free = (port) => new Promise((res) => { const s = net.createServer().once("error", () => res(false)).once("listening", () => s.close(() => res(true))).listen(port, "127.0.0.1"); });

const [maj, min] = process.versions.node.split(".").map(Number);
row(maj > 20 || (maj === 20 && min >= 9), "Node >= 20.9", process.versions.node, "install the LTS version from https://nodejs.org");
row(existsSync(path.join(ROOT, "node_modules", "next")), "npm packages", "", "npm install");
row(existsSync(path.join(ROOT, "lib", "data", "model.json")), "TS model (lib/data/model.json)", "", "npm run ml:all");
const py = findPython();
row(!!py && py.ok, "Python >= 3.9", py ? `${py.version}${py.venv ? " (.venv)" : ""}` : "not found", "install from https://www.python.org/downloads/ then: npm run setup");
if (py) {
  const imp = spawnSync(py.cmd, [...py.pre, "-c", "import fastapi,uvicorn,sklearn,joblib,numpy;print(sklearn.__version__)"], { encoding: "utf8" });
  row(imp.status === 0, "Python packages (fastapi, uvicorn, scikit-learn, joblib)", imp.status === 0 ? `sklearn ${imp.stdout.trim()}` : "", "npm run setup");
}
row(existsSync(path.join(ROOT, "ml", "serve", "model.joblib")), "ml/serve/model.joblib", "", "npm run setup");
for (const port of [3000, 8000]) {
  const ok = await free(port);
  console.log(`${ok ? "OK  " : "INFO"}  port ${port} ${ok ? "free" : "busy (not a problem: dev:all picks the next free port automatically)"}`);
}
console.log(`\nLLM keys (optional): GEMINI_API_KEY ${process.env.GEMINI_API_KEY ? "set" : "not set"}, ANTHROPIC_API_KEY ${process.env.ANTHROPIC_API_KEY ? "set" : "not set"} (also read from .env.local by Next)`);
console.log(bad ? `\n${bad} problem(s). Run the fix lines above.` : "\nAll good. Run: npm run dev:all");
process.exit(bad ? 1 : 0);
