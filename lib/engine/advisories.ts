import type { Advisory } from "./types";

/**
 * Small curated knowledge base used for retrieval (RAG-lite, BM25 - no API key or embeddings needed).
 * IMPORTANT: entries are PARAPHRASED general safety guidance, not verbatim RBI/NPCI/MHA text.
 * Always verify at the official source linked on each card. Only top-level official URLs are linked
 * on purpose, so no deep link can go stale or be fabricated.
 * Tags deliberately mix English, Hinglish and Telugu-roman keywords so retrieval works cross-lingually.
 */
export const ADVISORIES: Advisory[] = [
  {
    id: "digital-arrest",
    title: "'Digital arrest' is not a real legal procedure",
    body:
      "Police, CBI, ED, customs or courts do not arrest people over a video call, do not ask you to stay on camera, and do not ask you to move money to a 'safe' or 'verification' account. Callers who threaten arrest over a parcel, drugs or money laundering and tell you to keep it secret are running a scam.",
    action: "Cut the call, do not transfer anything, tell a family member, and report on 1930 or cybercrime.gov.in.",
    tags: ["digital arrest", "video call", "cbi", "ed", "police", "customs", "parcel", "money laundering", "safe account", "secret", "arrest", "warrant", "trai", "ncb", "narcotics"],
    source: "Ministry of Home Affairs / I4C public awareness advisories (paraphrased)",
    sourceUrl: "https://i4c.mha.gov.in",
  },
  {
    id: "report-1930",
    title: "Report cyber-fraud quickly: 1930 and cybercrime.gov.in",
    body:
      "If money has left your account because of a scam, report it as fast as possible. The National Cyber Crime Helpline 1930 and the portal cybercrime.gov.in accept financial-fraud complaints; early reporting improves the chance of freezing the money.",
    action: "Call 1930 immediately, then file the complaint on cybercrime.gov.in. Also inform your bank.",
    tags: ["report", "1930", "helpline", "complaint", "lost money", "fraud", "cybercrime", "paisa gaya", "dabbulu poyayi", "freeze"],
    source: "National Cyber Crime Reporting Portal",
    sourceUrl: "https://cybercrime.gov.in",
  },
  {
    id: "never-share-otp",
    title: "Never share OTP, PIN or CVV - not even with 'bank staff'",
    body:
      "A genuine bank, UPI app, government office or delivery company does not need your OTP, UPI PIN, card PIN, CVV or full card number over a call, SMS or chat. Anyone asking for them is attempting to authorise a transaction from your account.",
    action: "Do not share the code. If you already did, call your bank's official helpline to block the card/account and report on 1930.",
    tags: ["otp", "pin", "cvv", "card", "upi pin", "password", "verification code", "6 digit", "code", "bank staff", "share"],
    source: "RBI customer-awareness guidance (paraphrased)",
    sourceUrl: "https://www.rbi.org.in",
  },
  {
    id: "upi-receive",
    title: "You never need a PIN to RECEIVE money on UPI",
    body:
      "Entering a UPI PIN always sends money out. Scammers use fake refunds, cashback and 'sent by mistake' messages to make you approve a collect request or scan a QR, which debits you instead of crediting you.",
    action: "Decline unknown collect requests. For a genuine mistaken transfer, ask your bank to raise a dispute instead of paying back to a stranger's number.",
    tags: ["upi", "collect request", "refund", "cashback", "qr", "scan", "galti se", "by mistake", "phonepe", "gpay", "paytm", "wapas", "tappuga", "return"],
    source: "NPCI UPI safety awareness (paraphrased)",
    sourceUrl: "https://www.npci.org.in",
  },
  {
    id: "kyc-links",
    title: "KYC 'update or be blocked' links are a classic phishing trick",
    body:
      "Banks and wallets may ask for KYC, but they do it in the official app, on the official website or at a branch. A message that threatens blocking within hours and sends a link on an unfamiliar or look-alike domain is phishing.",
    action: "Do not tap the link. Open the bank's official app or type its website yourself, or call the number printed on your card.",
    tags: ["kyc", "pan", "aadhaar", "account blocked", "net banking", "phishing", "link", "update", "sbi", "hdfc", "icici", "axis", "paytm", "wallet", "yono", "verify"],
    source: "RBI / bank customer-awareness guidance (paraphrased)",
    sourceUrl: "https://www.rbi.org.in",
  },
  {
    id: "lottery-fee",
    title: "Real prizes never ask for a fee first",
    body:
      "Lucky-draw, KBC, gift or 'iPhone winner' messages that ask for a processing, delivery, tax or registration fee before you receive the prize are advance-fee scams. The money you pay is the entire point of the scam.",
    action: "Ignore and block. Never pay to receive money or a prize.",
    tags: ["lottery", "lucky draw", "kbc", "prize", "winner", "inaam", "badhai", "abhinandanalu", "fee", "processing fee", "delivery charge", "iphone", "voucher", "gift", "advance fee"],
    source: "Public consumer-awareness guidance (paraphrased)",
    sourceUrl: "https://consumerhelpline.gov.in",
  },
  {
    id: "task-jobs",
    title: "'Earn daily by liking videos' and deposit-for-tasks are job scams",
    body:
      "Genuine employers do not pay for liking videos or reviews and do not ask you to deposit money to unlock tasks or 'premium groups'. These schemes show small early payouts to build trust, then demand larger deposits.",
    action: "Do not deposit money or join task groups. Verify employers on their official careers page and report the Telegram/WhatsApp account.",
    tags: ["job", "task", "part time", "work from home", "telegram", "like videos", "youtube", "review", "daily", "earn", "deposit", "premium", "registration", "hr", "roju", "roz"],
    source: "Cyber-crime awareness advisories on task/part-time job fraud (paraphrased)",
    sourceUrl: "https://cybercrime.gov.in",
  },
  {
    id: "loan-apps",
    title: "Predatory instant-loan apps: only borrow from RBI-regulated lenders",
    body:
      "Unregulated loan apps ask for contacts and gallery access and then harass or blackmail borrowers. Legitimate lenders are regulated, do not charge an 'insurance fee' before disbursal, and do not message your contacts.",
    action: "Do not install the app or grant contacts access. Check the lender in the RBI's list of regulated entities and report harassment on 1930.",
    tags: ["loan", "instant loan", "app", "contacts", "photos", "harass", "blackmail", "insurance fee", "pre-approved", "documents", "pending"],
    source: "RBI public notices on digital lending (paraphrased)",
    sourceUrl: "https://www.rbi.org.in",
  },
  {
    id: "utility-cut",
    title: "Electricity/gas 'disconnection tonight' messages are usually fake",
    body:
      "Utilities send bill reminders from their official channels and do not ask you to call a personal mobile number or install an app to avoid same-night disconnection. The number in the SMS is the scammer.",
    action: "Check your bill on the utility's official app/website or at the nearest office. Never pay through a link or call the number in the SMS.",
    tags: ["electricity", "bijli", "current", "power", "gas", "bill", "disconnect", "cut", "tonight", "bescom", "tsspdcl", "apepdcl", "msedcl", "indane", "connection"],
    source: "Utility consumer-awareness notices (paraphrased)",
    sourceUrl: "https://cybercrime.gov.in",
  },
  {
    id: "parcel-customs",
    title: "Customs / courier fee messages: verify through the carrier itself",
    body:
      "Messages claiming your parcel is stuck at customs, or that a redelivery fee is due, often lead to fake payment pages or to a 'FedEx/Police' call that escalates into a digital-arrest scam.",
    action: "Track the parcel on the courier's official site or app. Never pay a clearance fee through an SMS link.",
    tags: ["parcel", "courier", "customs", "fedex", "india post", "delivery failed", "clearance", "redelivery", "package", "restricted items", "address"],
    source: "Public courier-scam awareness guidance (paraphrased)",
    sourceUrl: "https://www.indiapost.gov.in",
  },
  {
    id: "sim-block",
    title: "Check suspicious calls and messages on Sanchar Saathi",
    body:
      "Threats that your SIM or number will be disconnected are common. Government telecom portals let you report suspected fraud communication and check mobile connections registered in your name.",
    action: "Use Sanchar Saathi (Chakshu) to report the number and review connections under your Aadhaar.",
    tags: ["sim", "block", "disconnect", "trai", "number", "mobile", "call", "sanchar saathi", "chakshu", "report number", "telecom"],
    source: "Department of Telecommunications - Sanchar Saathi",
    sourceUrl: "https://sancharsaathi.gov.in",
  },
  {
    id: "remote-access",
    title: "Never install AnyDesk/TeamViewer for a stranger",
    body:
      "'Support' agents ask you to install remote-access apps and read out a code. That gives them full control of your phone, including your banking apps and SMS OTPs.",
    action: "Uninstall the app, switch on airplane mode, call your bank from another phone, and change your banking passwords.",
    tags: ["anydesk", "teamviewer", "remote", "screen share", "support", "microsoft", "virus", "apk", "control phone", "install app"],
    source: "Cyber-security awareness guidance (paraphrased)",
    sourceUrl: "https://www.cert-in.org.in",
  },
  {
    id: "investment-groups",
    title: "'Guaranteed returns' trading and crypto groups are a red flag",
    body:
      "No legitimate investment can guarantee fixed high returns. WhatsApp/Telegram groups promising weekly profits or 'VIP signals' often show fake profit screenshots before asking you to deposit larger amounts.",
    action: "Invest only through SEBI-registered intermediaries and verify them on the SEBI website before sending any money.",
    tags: ["investment", "guaranteed returns", "crypto", "signals", "trading", "stock tips", "vip group", "weekly returns", "profit", "ipo", "telegram", "whatsapp group"],
    source: "SEBI investor-awareness guidance (paraphrased)",
    sourceUrl: "https://investor.sebi.gov.in",
  },
  {
    id: "family-emergency",
    title: "'Relative in hospital, send money now' - call them back first",
    body:
      "Fraudsters hijack or spoof a contact (or use a new number claiming to be a friend/relative) and invent an accident or hospital emergency to rush an urgent UPI transfer.",
    action: "Pause and call the person on their known number or another family member before paying anything.",
    tags: ["accident", "hospital", "emergency", "friend", "relative", "urgent money", "google pay", "kal wapas", "dost", "new number", "send money"],
    source: "Public cyber-fraud awareness guidance (paraphrased)",
    sourceUrl: "https://cybercrime.gov.in",
  },
  {
    id: "refund-tax",
    title: "Income-tax refund / bank-detail forms on random sites",
    body:
      "The Income Tax Department does not ask for card details or OTPs to release a refund through links in SMS. Fake refund pages harvest bank and card details.",
    action: "Check refund status only on the official e-filing portal, typed into your browser.",
    tags: ["income tax", "refund", "itr", "tax refund", "bank details", "approved", "e-filing", "pan"],
    source: "Income Tax Department public notices (paraphrased)",
    sourceUrl: "https://www.incometax.gov.in",
  },
];

// ---------------- BM25 retrieval ----------------
const tok = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFKC")
    .replace(/[^a-z0-9ऀ-ॿఀ-౿\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 1);

const docs = ADVISORIES.map((a) => {
  // tags are weighted by repetition (they hold the multilingual vocabulary)
  const text = [a.title, a.title, a.body, ...a.tags, ...a.tags].join(" ");
  const t = tok(text);
  const tf = new Map<string, number>();
  t.forEach((w) => tf.set(w, (tf.get(w) ?? 0) + 1));
  return { a, tf, len: t.length };
});
const avgLen = docs.reduce((s, d) => s + d.len, 0) / docs.length;
const df = new Map<string, number>();
docs.forEach((d) => d.tf.forEach((_, w) => df.set(w, (df.get(w) ?? 0) + 1)));

export function searchAdvisories(query: string, boostIds: string[] = [], k = 3): { advisory: Advisory; score: number }[] {
  const q = tok(query);
  const K1 = 1.4;
  const B = 0.75;
  const scored = docs.map((d) => {
    let s = 0;
    for (const w of new Set(q)) {
      const f = d.tf.get(w);
      if (!f) continue;
      const n = df.get(w) ?? 0;
      const idf = Math.log(1 + (docs.length - n + 0.5) / (n + 0.5));
      s += idf * ((f * (K1 + 1)) / (f + K1 * (1 - B + (B * d.len) / avgLen)));
    }
    if (boostIds.includes(d.a.id)) s += 6;
    return { advisory: d.a, score: s };
  });
  const ranked = scored.filter((x) => x.score > 0.6).sort((a, b) => b.score - a.score);
  // relative cut-off: drop weak tail matches (e.g. a stray 'pan' tag) so only genuinely relevant advisories are shown
  const top = ranked[0]?.score ?? 0;
  return ranked.filter((x) => x.score >= top * 0.45).slice(0, k);
}
