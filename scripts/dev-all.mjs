// npm run dev:all -> web app (+ /api/mcp) AND the real scikit-learn FastAPI service, one command.
//  - picks free ports automatically (3000 / 8000 busy? no problem)
//  - runs `npm run setup` once automatically if the Python half is not ready
//  - if Python cannot be set up, the web app still starts and says exactly why
import { spawn, spawnSync } from "node:child_process";
import { existsSync, writeFileSync } from "node:fs";
import net from "node:net";
import path from "node:path";
import { findPython, ROOT } from "./py.mjs";

const procs = [];
const tagLines = (name) => (d) => String(d).split("\n").filter(Boolean).forEach((l) => console.log(`[${name}] ${l}`));
function start(name, cmd, args, env = {}) {
  // shell:false on purpose: cmd/args are real executables (node.exe, python.exe). With shell:true, Windows paths containing
  // spaces such as "C:\\Program Files\\nodejs\\node.exe" get split and fail.
  const p = spawn(cmd, args, { cwd: ROOT, stdio: ["ignore", "pipe", "pipe"], shell: false, env: { ...process.env, ...env } });
  p.on("error", (e) => console.log(`[${name}] could not start: ${e.message}`));
  p.stdout.on("data", tagLines(name));
  p.stderr.on("data", tagLines(name));
  p.on("exit", (c) => console.log(`[${name}] exited (${c})`));
  procs.push(p);
  return p;
}
const free = (port) =>
  new Promise((res) => {
    const s = net.createServer().once("error", () => res(false)).once("listening", () => s.close(() => res(true))).listen(port, "127.0.0.1");
  });
async function pick(start) {
  for (let p = start; p < start + 50; p++) if (await free(p)) return p;
  throw new Error(`no free port near ${start}`);
}
const wait = async (url, ms) => {
  const end = Date.now() + ms;
  while (Date.now() < end) {
    try {
      const r = await fetch(url);
      if (r.ok) return true;
    } catch {}
    await new Promise((r) => setTimeout(r, 500));
  }
  return false;
};

const joblib = path.join(ROOT, "ml", "serve", "model.joblib");
const pyReady = () => {
  const py = findPython();
  if (!py || !existsSync(joblib)) return false;
  return spawnSync(py.cmd, [...py.pre, "-c", "import fastapi,uvicorn,sklearn,joblib"], { stdio: "ignore" }).status === 0;
};

(async () => {
  if (!pyReady()) {
    console.log("[dev:all] Python half not ready -> running `npm run setup` once (1-2 min) ...");
    spawnSync(process.execPath, [path.join(ROOT, "scripts", "setup.mjs")], { stdio: "inherit", cwd: ROOT });
  }
  const webPort = await pick(3000);
  const pyPort = await pick(8000);
  let pyOk = false;
  if (pyReady()) {
    const py = findPython();
    start("python", py.cmd, [...py.pre, "-m", "uvicorn", "app:app", "--app-dir", "ml/serve", "--port", String(pyPort)]);
    pyOk = await wait(`http://127.0.0.1:${pyPort}/health`, 30000);
    if (!pyOk) console.log("[dev:all] Python service did not become healthy; see [python] lines above. Web app will still start.");
  } else {
    console.log("[dev:all] Python service NOT started (setup failed - see messages above). Web, API and MCP still work; the Python card on /live will say so.");
  }
  start("web", process.execPath, [path.join(ROOT, "node_modules", "next", "dist", "bin", "next"), "dev", "-p", String(webPort)], pyOk ? { ML_SERVICE_URL: `http://127.0.0.1:${pyPort}` } : {});
  const webOk = await wait(`http://127.0.0.1:${webPort}/api/health`, 60000);
  writeFileSync(path.join(ROOT, ".dev-ports.json"), JSON.stringify({ web: webPort, python: pyOk ? pyPort : null }));
  console.log("\n==================================================");
  console.log(` ${webOk ? "READY" : "web app did not start - see [web] lines"}  ->  http://localhost:${webPort}/live`);
  console.log(` web+API+MCP : http://localhost:${webPort}   MCP endpoint: /api/mcp`);
  console.log(` python      : ${pyOk ? `http://localhost:${pyPort} (scikit-learn FastAPI)` : "not running"}`);
  console.log(" verify      : npm run test:http   (in a second terminal)");
  console.log("==================================================\n");
})();

const stop = () => procs.forEach((p) => p.kill());
process.on("SIGINT", () => (stop(), process.exit(0)));
process.on("SIGTERM", () => (stop(), process.exit(0)));
