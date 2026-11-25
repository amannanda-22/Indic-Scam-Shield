"""Python serverless function for Vercel: POST /api/py/predict  {"text": "..."} (or {"texts": [...]}).

Pure standard library (no numpy / scikit-learn), so it fits Vercel's size limit. It re-implements the
scikit-learn TF-IDF char_wb(2-4) + LogisticRegression inference from lib/data/model.json, using the same
ml/textnorm.py as training. Response shape matches the FastAPI service (ml/serve/app.py).
Locally, `npm run dev:all` proxies this path to the real scikit-learn FastAPI service instead.
"""
import json
import math
import sys
from http.server import BaseHTTPRequestHandler
from pathlib import Path

def _find_root():
    # Locally and on Vercel the project root holds lib/data/model.json; try the file's location first, then the cwd
    # (Vercel documents the cwd of a Python function as the project root).
    for cand in (Path(__file__).resolve().parents[2], Path.cwd(), Path("/var/task")):
        if (cand / "lib" / "data" / "model.json").exists() and (cand / "ml" / "textnorm.py").exists():
            return cand
    raise RuntimeError("model.json / textnorm.py not found in the function bundle")


ROOT = _find_root()
sys.path.insert(0, str(ROOT / "ml"))
from textnorm import norm  # noqa: E402

_M = json.loads((ROOT / "lib" / "data" / "model.json").read_text(encoding="utf-8"))
_BIN, _TYPE = _M["binary"], _M["type"]
_BIN_IDX = {t: i for i, t in enumerate(_BIN["terms"])}
_TYPE_IDX = {t: i for i, t in enumerate(_TYPE["terms"])}


def _grams(doc, lo=2, hi=4):
    out = []
    for word in " ".join(doc.split()).split():
        w = " " + word + " "
        n_chars = len(w)
        for n in range(lo, hi + 1):
            offset = 0
            out.append(w[offset:offset + n])
            while offset + n < n_chars:
                offset += 1
                out.append(w[offset:offset + n])
            if offset == 0:
                break
    return out


def _vec(grams, idx, idf):
    tf = {}
    for g in grams:
        i = idx.get(g)
        if i is not None:
            tf[i] = tf.get(i, 0) + 1
    v = {i: (1 + math.log(c)) * idf[i] for i, c in tf.items()}
    n = math.sqrt(sum(x * x for x in v.values())) or 1.0
    return {i: x / n for i, x in v.items()}


def predict_one(text):
    g = _grams(norm(text[:2000]))
    v = _vec(g, _BIN_IDX, _BIN["idf"])
    z = _BIN["intercept"] + sum(x * _BIN["coef"][i] for i, x in v.items())
    p = 1 / (1 + math.exp(-z))
    scam_type = None
    if p >= 0.35:
        tv = _vec(g, _TYPE_IDX, _TYPE["idf"])
        scores = [b + sum(x * row[i] for i, x in tv.items()) for row, b in zip(_TYPE["coef"], _TYPE["intercept"])]
        scam_type = _TYPE["classes"][max(range(len(scores)), key=scores.__getitem__)]
    return {"p_scam": round(p, 4), "label": "scam" if p >= 0.5 else "legit", "scam_type": scam_type, "engine": "python-stdlib (vercel function)"}


class handler(BaseHTTPRequestHandler):
    def _send(self, code, obj):
        body = json.dumps(obj).encode()
        self.send_response(code)
        self.send_header("content-type", "application/json")
        self.send_header("cache-control", "no-store")
        self.send_header("content-length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        self._send(200, {"status": "ok", "features": len(_BIN["terms"]), "stores_data": False, "engine": "python-stdlib (vercel function)"})

    def do_POST(self):
        try:
            n = int(self.headers.get("content-length") or 0)
            if n > 400_000:
                return self._send(413, {"error": "Body too large"})
            data = json.loads(self.rfile.read(n) or b"{}")
        except Exception:
            return self._send(400, {"error": "Invalid JSON body"})
        if isinstance(data.get("texts"), list):
            texts = data["texts"][:200]
            if not texts or any((not isinstance(t, str)) or len(t) < 3 for t in texts):
                return self._send(422, {"error": "every text needs at least 3 characters"})
            return self._send(200, [predict_one(t) for t in texts])
        t = data.get("text")
        if not isinstance(t, str) or len(t) < 3 or len(t) > 2000:
            return self._send(422, {"error": "text must be 3-2000 characters"})
        return self._send(200, predict_one(t))
