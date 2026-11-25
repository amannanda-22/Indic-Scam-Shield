// Cross-platform Python launcher: node scripts/py.mjs <args...>
// Prefers the project's .venv, then python3 / python / py -3. Fixes "python3 not found" on Windows.
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";

export const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1")), "..");
const venvPy = process.platform === "win32" ? path.join(ROOT, ".venv", "Scripts", "python.exe") : path.join(ROOT, ".venv", "bin", "python");

const probe = (cmd, pre = []) => {
  const r = spawnSync(cmd, [...pre, "-c", "import sys;print('%d.%d'%sys.version_info[:2])"], { encoding: "utf8" });
  if (r.status !== 0) return null;
  const [maj, min] = r.stdout.trim().split(".").map(Number);
  return { cmd, pre, version: `${maj}.${min}`, ok: maj === 3 && min >= 9 };
};

/** Returns {cmd, pre, version, ok, venv} or null if no Python 3 is found. */
export function findPython({ preferVenv = true } = {}) {
  const cands = [];
  if (preferVenv && existsSync(venvPy)) cands.push([venvPy, [], true]);
  cands.push(["python3", [], false], ["python", [], false], ["py", ["-3"], false]);
  for (const [c, pre, venv] of cands) {
    const r = probe(c, pre);
    if (r) return { ...r, venv };
  }
  return null;
}

if (process.argv[1] && process.argv[1].endsWith("py.mjs")) {
  const py = findPython();
  if (!py) {
    console.error("Python 3.9+ not found. Install it from https://www.python.org/downloads/ (tick 'Add to PATH' on Windows), then run: npm run setup");
    process.exit(1);
  }
  const r = spawnSync(py.cmd, [...py.pre, ...process.argv.slice(2)], { stdio: "inherit", cwd: ROOT, env: process.env });
  process.exit(r.status ?? 1);
}
