"""
Trains and honestly evaluates the Indic Scam Shield text classifier.

Evaluation protocol (what recruiters should look at):
  A. Random row split           -> LEAKY (same template in train and test). Shown only to prove why it is misleading.
  B. Template-held-out split    -> test templates never seen in training.
  C. Hand-written holdout (64)  -> written separately, never trained on, includes unseen scam types and tricky legit messages.
Baselines: keyword rules, word n-gram TF-IDF + LR, char n-gram TF-IDF + LR (shipped).
The shipped model is re-fit on ALL generated data (never on the hand-written holdout).
"""
import json
import math
import os
import re
import sys
import unicodedata
from pathlib import Path

import joblib
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (accuracy_score, confusion_matrix, f1_score,
                             precision_score, recall_score, roc_auc_score)
from sklearn.model_selection import train_test_split

ROOT = Path(__file__).resolve().parent
DATA = ROOT / "data"
LIB = ROOT.parent / "lib" / "data"
LIB.mkdir(parents=True, exist_ok=True)

# ----------------------------------------------------------------- normalisation
from textnorm import norm  # noqa: E402  (shared with ml/serve/app.py)


# ----------------------------------------------------------------- baselines
RULE_WORDS = [
    r"\botp\b", r"\bkyc\b", r"block", r"suspend", r"arrest", r"urgent", r"turant", r"ventane", r"immediately",
    r"lottery|lucky|won |jeeta|jeet|gelich", r"refund", r"cashback", r"urltok", r"phonetok", r"upi pin",
    r"deposit|processing fee|clearance|registration", r"warrant|legal action|police", r"telegram",
    r"पैन|आधार|ओटीपी", r"digital arrest", r"cvv", r"limited|expire",
]
RULE_RES = [re.compile(w) for w in RULE_WORDS]


def rules_score(text: str) -> float:
    t = norm(text)
    return float(sum(1 for r in RULE_RES if r.search(t)))


def rules_proba(texts):
    return np.array([min(1.0, rules_score(t) / 4.0) for t in texts])


# ----------------------------------------------------------------- metrics
def ece(y, p, bins=10):
    y = np.asarray(y)
    p = np.asarray(p)
    edges = np.linspace(0, 1, bins + 1)
    total = 0.0
    for i in range(bins):
        m = (p >= edges[i]) & (p < edges[i + 1] if i < bins - 1 else p <= edges[i + 1])
        if m.sum():
            total += (m.sum() / len(y)) * abs(y[m].mean() - p[m].mean())
    return float(total)


def metrics(y, p, thr=0.5):
    y = np.asarray(y)
    pred = (np.asarray(p) >= thr).astype(int)
    tn, fp, fn, tp = confusion_matrix(y, pred, labels=[0, 1]).ravel()
    out = {
        "n": int(len(y)),
        "accuracy": round(float(accuracy_score(y, pred)), 4),
        "precision": round(float(precision_score(y, pred, zero_division=0)), 4),
        "recall": round(float(recall_score(y, pred, zero_division=0)), 4),
        "f1": round(float(f1_score(y, pred, zero_division=0)), 4),
        "ece": round(ece(y, p), 4),
        "confusion": {"tn": int(tn), "fp": int(fp), "fn": int(fn), "tp": int(tp)},
    }
    try:
        out["auc"] = round(float(roc_auc_score(y, p)), 4)
    except ValueError:
        out["auc"] = None
    return out


def by_lang(rows, p, thr=0.5):
    res = {}
    for lang in sorted({r["lang"] for r in rows}):
        idx = [i for i, r in enumerate(rows) if r["lang"] == lang]
        y = [1 if rows[i]["label"] == "scam" else 0 for i in idx]
        pp = [p[i] for i in idx]
        if len(set(y)) < 2:
            pred = [1 if x >= thr else 0 for x in pp]
            res[lang] = {"n": len(y), "accuracy": round(float(np.mean(np.array(pred) == np.array(y))), 4), "f1": None}
        else:
            m = metrics(y, pp, thr)
            res[lang] = {"n": m["n"], "accuracy": m["accuracy"], "f1": m["f1"]}
    return res


# ----------------------------------------------------------------- data
corpus = json.loads((DATA / "corpus.json").read_text(encoding="utf-8"))
hand = json.loads((DATA / "handwritten_holdout.json").read_text(encoding="utf-8"))

X_all = [norm(r["text"]) for r in corpus]
y_all = np.array([1 if r["label"] == "scam" else 0 for r in corpus])
train_idx = [i for i, r in enumerate(corpus) if r["split"] == "train"]
test_idx = [i for i, r in enumerate(corpus) if r["split"] == "test"]
Xh = [norm(r["text"]) for r in hand]
yh = np.array([1 if r["label"] == "scam" else 0 for r in hand])


def char_vec():
    return TfidfVectorizer(analyzer="char_wb", ngram_range=(2, 4), lowercase=False, sublinear_tf=True,
                           max_features=6000, min_df=2)


def word_vec():
    return TfidfVectorizer(analyzer="word", ngram_range=(1, 2), lowercase=False, sublinear_tf=True,
                           max_features=6000, min_df=2, token_pattern=r"(?u)\b\w+\b")


def fit(vec, X, y, C=10.0):
    V = vec.fit_transform(X)
    clf = LogisticRegression(C=C, max_iter=4000, class_weight="balanced")
    clf.fit(V, y)
    return vec, clf


def proba(vec, clf, X):
    return clf.predict_proba(vec.transform(X))[:, 1]


results = {"protocol": {}, "models": {}, "dataset": {}}

# dataset stats
from collections import Counter
results["dataset"] = {
    "rows": len(corpus),
    "templates": len({r["template"] for r in corpus}),
    "by_label": dict(Counter(r["label"] for r in corpus)),
    "by_lang": dict(Counter(r["lang"] for r in corpus)),
    "by_scam_type": dict(Counter(r["type"] for r in corpus if r["label"] == "scam")),
    "train_rows": len(train_idx), "test_rows": len(test_idx),
    "handwritten_holdout": {"rows": len(hand), "scam": int(yh.sum()), "legit": int((1 - yh).sum()),
                            "by_lang": dict(Counter(r["lang"] for r in hand))},
    "note": "Template-generated corpus (not scraped real data). Hindi/Telugu text needs native-speaker review.",
}

# ---- A. leaky random split
a_tr, a_te = train_test_split(np.arange(len(corpus)), test_size=0.25, random_state=7, stratify=y_all)
vec, clf = fit(char_vec(), [X_all[i] for i in a_tr], y_all[a_tr])
results["protocol"]["A_random_split_char_lr"] = metrics(y_all[a_te], proba(vec, clf, [X_all[i] for i in a_te]))

# ---- B/C. proper evaluation
tr_X = [X_all[i] for i in train_idx]
tr_y = y_all[train_idx]
te_X = [X_all[i] for i in test_idx]
te_y = y_all[test_idx]
te_rows = [corpus[i] for i in test_idx]

models = {}
# rules
pt = rules_proba([corpus[i]["text"] for i in test_idx])
ph = rules_proba([r["text"] for r in hand])
models["rules_keywords"] = {"template_test": metrics(te_y, pt, 0.5), "handwritten": metrics(yh, ph, 0.5),
                            "template_test_by_lang": by_lang(te_rows, pt), "handwritten_by_lang": by_lang(hand, ph)}
# word LR
wv, wc = fit(word_vec(), tr_X, tr_y)
pt, ph = proba(wv, wc, te_X), proba(wv, wc, Xh)
models["word_tfidf_lr"] = {"template_test": metrics(te_y, pt), "handwritten": metrics(yh, ph),
                           "template_test_by_lang": by_lang(te_rows, pt), "handwritten_by_lang": by_lang(hand, ph)}
# char LR (the shipped architecture)
cv, cc = fit(char_vec(), tr_X, tr_y)
pt, ph = proba(cv, cc, te_X), proba(cv, cc, Xh)
models["char_tfidf_lr"] = {"template_test": metrics(te_y, pt), "handwritten": metrics(yh, ph),
                           "template_test_by_lang": by_lang(te_rows, pt), "handwritten_by_lang": by_lang(hand, ph)}
# hand-written errors for transparency
errs = []
for r, p in zip(hand, ph):
    pred = p >= 0.5
    if pred != (r["label"] == "scam"):
        errs.append({"text": r["text"], "truth": r["label"], "p_scam": round(float(p), 3), "lang": r["lang"], "type": r["type"]})
models["char_tfidf_lr"]["handwritten_errors"] = errs
results["models"] = models

# explainability: most informative WORDS (from the word model) shown on the benchmark page
fn = np.array(wv.get_feature_names_out())
co = wc.coef_[0]
order = np.argsort(co)
results["top_words_scam"] = [{"w": fn[i], "c": round(float(co[i]), 3)} for i in order[::-1][:18] if fn[i] not in ("0",)]
results["top_words_legit"] = [{"w": fn[i], "c": round(float(co[i]), 3)} for i in order[:18] if fn[i] not in ("0",)]

# ---- scam-type model (trained on scam rows only)
scam_types = sorted({r["type"] for r in corpus if r["label"] == "scam"})
tr_s = [i for i in train_idx if corpus[i]["label"] == "scam"]
te_s = [i for i in test_idx if corpus[i]["label"] == "scam"]
tv = char_vec()
Vt = tv.fit_transform([X_all[i] for i in tr_s])
tclf = LogisticRegression(C=10.0, max_iter=4000)
tclf.fit(Vt, [corpus[i]["type"] for i in tr_s])
pred_t = tclf.predict(tv.transform([X_all[i] for i in te_s]))
true_t = [corpus[i]["type"] for i in te_s]
results["scam_type"] = {
    "classes": scam_types,
    "macro_f1_template_test": round(float(f1_score(true_t, pred_t, average="macro")), 4),
    "accuracy_template_test": round(float(accuracy_score(true_t, pred_t)), 4),
    "n": len(true_t),
}

# ----------------------------------------------------------------- final model on ALL generated data
fv, fc = fit(char_vec(), X_all, y_all)
sv = char_vec()
Vs = sv.fit_transform([X_all[i] for i in range(len(corpus)) if corpus[i]["label"] == "scam"])
sclf = LogisticRegression(C=10.0, max_iter=4000)
sclf.fit(Vs, [corpus[i]["type"] for i in range(len(corpus)) if corpus[i]["label"] == "scam"])
if os.environ.get("SERVE_ONLY"):
    # `npm run setup` path: rebuild ONLY the sklearn pickle for the FastAPI service, matched to the locally installed
    # scikit-learn. lib/data/*.json (model, results, parity) are left untouched.
    joblib.dump({"binary_vec": fv, "binary_clf": fc, "type_vec": sv, "type_clf": sclf}, ROOT / "serve" / "model.joblib")
    print("model.joblib written (SERVE_ONLY)")
    sys.exit(0)
ph_final = proba(fv, fc, Xh)
results["models"]["shipped_char_lr_all_data"] = {"handwritten": metrics(yh, ph_final),
                                                 "handwritten_by_lang": by_lang(hand, ph_final)}


def export_vec(vec, clf_coef, clf_int):
    vocab = vec.vocabulary_
    terms = [None] * len(vocab)
    for t, i in vocab.items():
        terms[i] = t
    return {"terms": terms, "idf": [round(float(x), 5) for x in vec.idf_],
            "coef": clf_coef, "intercept": clf_int}


binary = export_vec(fv, [round(float(x), 5) for x in fc.coef_[0]], round(float(fc.intercept_[0]), 5))
svocab = export_vec(sv, [[round(float(x), 5) for x in row] for row in sclf.coef_],
                    [round(float(x), 5) for x in sclf.intercept_])
model = {"version": "1.0.0", "ngram": [2, 4], "binary": binary, "type": {**svocab, "classes": list(sclf.classes_)}}
(LIB / "model.json").write_text(json.dumps(model, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
(LIB / "results.json").write_text(json.dumps(results, ensure_ascii=False, indent=1), encoding="utf-8")
joblib.dump({"binary_vec": fv, "binary_clf": fc, "type_vec": sv, "type_clf": sclf}, ROOT / "serve" / "model.joblib")

# parity fixtures for the TypeScript implementation
samples = [r["text"] for r in hand[:12]] + [r["text"] for r in hand[32:44]] + [corpus[i]["text"] for i in range(8)]
parity = []
for s in samples:
    n = norm(s)
    pb = float(fc.predict_proba(fv.transform([n]))[0, 1])
    parity.append({"text": s, "norm": n, "p_scam": round(pb, 6)})
(LIB / "parity.json").write_text(json.dumps(parity, ensure_ascii=False, indent=1), encoding="utf-8")

# console summary
def line(name, m):
    print(f"{name:34s} F1={m['f1']:.3f} P={m['precision']:.3f} R={m['recall']:.3f} AUC={m['auc']} ECE={m['ece']}")

print("A random split (LEAKY)", results["protocol"]["A_random_split_char_lr"]["f1"])
for k, v in models.items():
    if "template_test" in v:
        line(k + " [template-test]", v["template_test"])
        line(k + " [handwritten]", v["handwritten"])
print("shipped model on handwritten:", results["models"]["shipped_char_lr_all_data"]["handwritten"]["f1"])
print("scam-type macro F1:", results["scam_type"])
print("model.json KB:", round((LIB / "model.json").stat().st_size / 1024))
print("handwritten errors:", len(errs))
for e in errs:
    print("  ", e["truth"], e["p_scam"], e["text"][:80])
