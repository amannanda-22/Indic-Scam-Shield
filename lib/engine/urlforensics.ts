import type { UrlFinding } from "./types";

/** Offline URL forensics: no network calls, so it is fast, private and cannot be abused to probe attacker servers. */

const SHORTENERS = new Set(["bit.ly", "tinyurl.com", "rb.gy", "cutt.ly", "is.gd", "t.co", "shorturl.at", "goo.gl", "ow.ly", "tiny.cc"]);
const RISKY_TLDS = new Set(["top", "xyz", "icu", "cc", "live", "click", "online", "site", "link", "info", "buzz", "shop", "work", "vip", "club"]);
const KEYWORDS = ["kyc", "verify", "secure", "update", "refund", "claim", "login", "reward", "gift", "bonus", "prize", "support", "helpdesk", "customs", "clearance", "recharge", "unlock"];

/** Registered (apex) domains of brands that scammers love to imitate. */
const OFFICIAL: Record<string, string[]> = {
  sbi: ["sbi.co.in", "onlinesbi.sbi", "sbicard.com", "sbi.bank.in"],
  hdfc: ["hdfcbank.com", "hdfc.com", "hdfclife.com"],
  icici: ["icicibank.com", "icicilombard.com", "iciciprulife.com"],
  axis: ["axisbank.com"],
  kotak: ["kotak.com"],
  paytm: ["paytm.com", "paytmbank.com"],
  phonepe: ["phonepe.com"],
  amazon: ["amazon.in", "amazon.com", "amzn.in", "amzn.to"],
  flipkart: ["flipkart.com", "fkrt.it"],
  netflix: ["netflix.com"],
  airtel: ["airtel.in", "airtel.com"],
  jio: ["jio.com", "ril.com"],
  uidai: ["uidai.gov.in"],
  aadhaar: ["uidai.gov.in"],
  incometax: ["incometax.gov.in", "incometaxindia.gov.in"],
  irctc: ["irctc.co.in"],
  bescom: ["bescom.co.in", "bescom.org"],
  tsspdcl: ["tssouthernpower.com"],
  indiapost: ["indiapost.gov.in"],
  fedex: ["fedex.com"],
  fastag: ["ihmcl.com", "netc.org.in"],
  epfo: ["epfindia.gov.in"],
};
const GOV_SUFFIX = /\.(gov\.in|nic\.in)$/;
const TWO_PART_TLDS = new Set(["co.in", "gov.in", "nic.in", "org.in", "net.in", "ac.in", "com.au", "co.uk"]);

function lev(a: string, b: string) {
  const dp = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++)
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return dp[a.length][b.length];
}

export function registeredDomain(host: string): string {
  const parts = host.split(".");
  if (parts.length <= 2) return host;
  const last2 = parts.slice(-2).join(".");
  return TWO_PART_TLDS.has(last2) ? parts.slice(-3).join(".") : last2;
}

export function analyzeUrl(raw: string): UrlFinding {
  const flags: string[] = [];
  const risks: number[] = [];
  let candidate = raw.trim();
  const hasScheme = /^https?:\/\//i.test(candidate);
  let host = "";
  try {
    host = new URL(hasScheme ? candidate : "http://" + candidate).hostname.toLowerCase();
  } catch {
    host = candidate.toLowerCase().split("/")[0];
  }
  host = host.replace(/^www\./, "");
  let lookalikeOf: string | undefined;

  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host)) {
    flags.push("Raw IP address instead of a domain name");
    risks.push(0.8);
  }
  if (SHORTENERS.has(host)) {
    flags.push("Link shortener hides the real destination");
    risks.push(0.55);
  }
  if (host === "wa.me" || host === "t.me" || host === "telegram.me") {
    flags.push("Moves the chat to WhatsApp/Telegram (common scam hand-off)");
    risks.push(0.35);
  }
  if (host.startsWith("xn--") || host.includes(".xn--")) {
    flags.push("Punycode domain (can disguise look-alike characters)");
    risks.push(0.7);
  }
  const apex = registeredDomain(host);
  const tld = host.split(".").pop() ?? "";
  if (RISKY_TLDS.has(tld)) {
    flags.push(`Cheap, frequently abused ending ".${tld}"`);
    risks.push(0.5);
  }
  if ((host.match(/-/g) || []).length >= 2) {
    flags.push("Several hyphens in the domain (typical of fake 'brand-secure-login' sites)");
    risks.push(0.3);
  }
  const kw = KEYWORDS.filter((k) => host.includes(k));
  if (kw.length) {
    flags.push(`Pressure words in the domain: ${kw.join(", ")}`);
    risks.push(Math.min(0.5, 0.25 * kw.length));
  }
  // brand impersonation: brand token in host but apex is not an official domain
  const official = GOV_SUFFIX.test(host) || Object.values(OFFICIAL).some((d) => d.includes(apex));
  if (!official) {
    for (const [brand, domains] of Object.entries(OFFICIAL)) {
      if (host.includes(brand)) {
        flags.push(`Uses the name "${brand}" but is not an official ${brand} domain`);
        risks.push(0.85);
        lookalikeOf = domains[0];
        break;
      }
    }
    if (!lookalikeOf) {
      const label = apex.split(".")[0];
      for (const [brand, domains] of Object.entries(OFFICIAL)) {
        const target = domains[0].split(".")[0];
        if (label !== target && Math.abs(label.length - target.length) <= 2 && lev(label, target) <= 2 && target.length >= 4) {
          flags.push(`Typo-squat of ${domains[0]}`);
          risks.push(0.85);
          lookalikeOf = domains[0];
          break;
        }
      }
    }
  }
  if (/^http:\/\//i.test(raw)) {
    flags.push("Not encrypted (http, not https)");
    risks.push(0.15);
  }
  if (official) {
    flags.length = 0;
    risks.length = 0;
    flags.push("Matches an official domain");
  }
  const risk = official ? 0 : 1 - risks.reduce((a, r) => a * (1 - r), 1);
  return { raw, host, risk: Math.round(risk * 100) / 100, flags, lookalikeOf };
}
