// npm run setup  -> makes the Python half work on any machine, safely and repeatably.
//   1) checks Node + Python  2) creates .venv  3) pip installs  4) builds ml/serve/model.joblib for YOUR scikit-learn
//   5) proves the Python service answers correctly.   Re-running is safe.
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";
import { findPython, ROOT } from "./py.mjs";

const say = (m) => console.log(`\n[setup] ${m}`);
const run = (cmd, args, opts = {}) => spawnSync(cmd, args, { stdio: "inherit", cwd: ROOT, env: { ...process.env, ...(opts.env || {}) } });
const fail = (m) => {
  console.error(`\n[setup] FAILED: ${m}`);
  process.exit(1);
};

const [maj, min] = process.versions.node.split(".").map(Number);
if (maj < 20 || (maj === 20 && min < 9)) fail(`Node ${process.versions.node} is too old (Next.js 16 needs 20.9+). Install the LTS version from https://nodejs.org`);
say(`Node ${process.versions.node} OK`);

let sys = findPython({ preferVenv: false });
if (!sys) fail("Python 3 not found. Install Python 3.11+ from https://www.python.org/downloads/ (Windows: tick 'Add python.exe to PATH'), reopen the terminal, run `npm run setup` again. (The web app, MCP and API work without Python; only the FastAPI half needs it.)");
if (!sys.ok) fail(`Python ${sys.version} is too old (need 3.9+).`);
say(`Python ${sys.version} found (${sys.cmd})`);

const venvDir = path.join(ROOT, ".venv");
if (!existsSync(venvDir)) {
  say("Creating .venv ...");
  const r = run(sys.cmd, [...sys.pre, "-m", "venv", ".venv"]);
  if (r.status !== 0) say("venv unavailable (on Debian/Ubuntu: `sudo apt install python3-venv`). Falling back to the system Python.");
}
const py = findPython();
const base = [...py.pre];
const pipArgs = ["-m", "pip", "install", "--disable-pip-version-check", "-r", "ml/serve/requirements.txt"];
say(`Installing Python packages into ${py.venv ? ".venv" : "system Python"} (1-2 min the first time) ...`);
let r = run(py.cmd, [...base, ...pipArgs]);
if (r.status !== 0 && !py.venv) {
  say("Retrying with --user --break-system-packages ...");
  r = run(py.cmd, [...base, ...pipArgs, "--user", "--break-system-packages"]);
}
if (r.status !== 0) fail("pip install failed. Check your internet connection / proxy, then re-run `npm run setup`.");

say("Building the scikit-learn model file for your installed version ...");
if (!existsSync(path.join(ROOT, "ml", "data", "corpus.jsonl")) && !existsSync(path.join(ROOT, "ml", "data", "corpus.json"))) {
  r = run(py.cmd, [...base, "ml/build_corpus.py"]);
  if (r.status !== 0) fail("corpus build failed");
}
r = run(py.cmd, [...base, "ml/train.py"], { env: { SERVE_ONLY: "1" } });
if (r.status !== 0 || !existsSync(path.join(ROOT, "ml", "serve", "model.joblib"))) fail("model training failed");

say("Self-check: loading the service ...");
r = run(py.cmd, [...base, "-c", "import sys;sys.argv=['x'];sys.path.insert(0,'ml/serve');import app;from fastapi.testclient import TestClient as T;c=T(app.app);j=c.post('/predict',json={'text':'KYC expire ho gaya, link par click karein'}).json();assert j['label']=='scam',j;print('FastAPI self-check OK',j)"]);
if (r.status !== 0) {
  say("TestClient check failed (maybe httpx missing). Trying a plain import check ...");
  r = run(py.cmd, [...base, "-c", "import sys;sys.path.insert(0,'ml/serve');import app;print('FastAPI import OK')"]);
  if (r.status !== 0) fail("FastAPI service does not load");
}
say("SETUP OK. Next: npm run dev:all");
