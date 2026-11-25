// MUST stay equivalent to norm() in ml/train.py. Parity is verified by `npm test`.
const URL_RE =
  /(https?:\/\/\S+|www\.\S+|(?<![a-z0-9-])[a-z0-9-]+(?:\.[a-z0-9-]+)*\.(?:com|in|top|xyz|live|icu|cc|online|site|co|me|ly|gy|net|org|app|link|click|info)(?:\/\S*)?)/g;
const PHONE_RE = /(?:\+?91[\s-]?)?[6-9][0-9]{4}[\s-]?[0-9]{5}/g;
const DIGITS_RE = /[0-9]+/g;
const WS_RE = /\s+/g;

export function normalize(text: string): string {
  let t = text.normalize("NFKC").toLowerCase();
  t = t.replace(URL_RE, " urltok ");
  t = t.replace(PHONE_RE, " phonetok ");
  t = t.replace(DIGITS_RE, "0");
  return t.replace(WS_RE, " ").trim();
}

// ---- entity extraction (on the RAW text) ----
export const RAW_URL_RE = new RegExp(URL_RE.source, "gi");
export function extractUrls(text: string): string[] {
  const out = new Set<string>();
  for (const m of text.matchAll(RAW_URL_RE)) out.add(m[0].replace(/[).,;!?]+$/, ""));
  return [...out];
}

export function extractPhones(text: string): string[] {
  const out = new Set<string>();
  for (const m of text.matchAll(new RegExp(PHONE_RE.source, "g"))) out.add(m[0].trim());
  return [...out];
}

export function extractUpiIds(text: string): string[] {
  const out = new Set<string>();
  for (const m of text.matchAll(/[a-z0-9._-]{2,}@(?:ok[a-z]+|ybl|ibl|axl|paytm|upi|apl|sbi|hdfcbank|icici)\b/gi)) out.add(m[0]);
  return [...out];
}

export function detectLanguage(text: string): "en" | "hinglish" | "hindi" | "telugu_roman" | "telugu_script" {
  if (/[ఀ-౿]/.test(text)) return "telugu_script";
  if (/[ऀ-ॿ]/.test(text)) return "hindi";
  const t = text.toLowerCase();
  const te = (t.match(/\b(mee|meeru|cheyyandi|cheyyakandi|undi|avtundi|ayyindi|ventane|ippude|lekapothe|kattandi|pampandi|nenu|ee roju|leda|kosam|nundi|chestanu|vachindi|unnaru|ledu)\b/g) || []).length;
  const hi = (t.match(/\b(aapka|aapke|aapki|aap|hai|hain|karein|kijiye|bhejein|turant|warna|nahi|kya|ghar|paisa|wapas|bhai|mat|ho gaya|jayega|raha|rahe|kar do|bata do|batayein|karke|abhi|aaj|kal|ke liye|mein|par)\b/g) || []).length;
  if (te >= 2 && te >= hi * 0.6) return "telugu_roman";
  if (hi >= 2) return "hinglish";
  return "en";
}
