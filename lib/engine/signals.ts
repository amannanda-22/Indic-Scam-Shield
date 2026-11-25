import type { Signal } from "./types";

/**
 * Transparent, multilingual rule layer. Every rule has a human-readable label and a weight
 * so the UI can show *why* a message is risky (explainability for non-technical users).
 * Weights are in logit-ish units and were set from domain knowledge of scam anatomy:
 * urgency + threat + secrecy + credential/payment ask.
 */
interface Rule {
  id: string;
  label: string;
  weight: number;
  re: RegExp;
}

const RULES: Rule[] = [
  {
    id: "urgency",
    label: "Artificial urgency / deadline",
    weight: 0.7,
    re: /\b(urgent|immediately|right now|within \d+\s*(hours|hrs|minutes|mins)|\d+\s*(hours|hrs|ghante|gantallo)|turant|ventane|ippude|aaj raat|tonight|last chance|final notice|expire[sd]?|limited (seats|slots))\b|तुरंत|अभी|आज रात|जल्दी|వెంటనే|అత్యవసరం/gi,
  },
  {
    id: "threat",
    label: "Threat of arrest, blocking or disconnection",
    weight: 1.2,
    re: /\b(arrest|warrant|legal action|police case|fir\b|blocked?|suspend(ed)?|deactivat\w+|disconnect\w*|cut off|band ho jayega|block ho|band ho gayi|kat diya jayega|cut chestaru|block avtundi|close avtundi)\b|गिरफ्तार|वारंट|बंद हो जाएगा|ब्लॉक|కట్ చేస్తారు|బ్లాక్/gi,
  },
  {
    id: "authority",
    label: "Impersonates police / government / bank officer",
    weight: 1.1,
    re: /\b(cbi|enforcement directorate|\bed\b officer|trai|customs( department)?|cyber ?crime|narcotics|ncb|police station|income tax officer|rbi officer|officer from|main .{0,12} se bol raha|nenu .{0,20} nundi matladutunna)\b|सीबीआई|अधिकारी|पुलिस/gi,
  },
  {
    id: "digital_arrest",
    label: "'Digital arrest' / stay-on-video-call pressure",
    weight: 2.4,
    re: /digital arrest|डिजिटल अरेस्ट|డిజిటల్ అరెస్ట్|(stay|join|do not (disconnect|cut)|mat kaat\w*|cut cheyyakandi).{0,30}(video call|camera)|(video call|camera).{0,40}(stay|on rakh|join)|safe account/gi,
  },
  {
    id: "secrecy",
    label: "Tells you to keep it secret",
    weight: 1.7,
    re: /(do not|don't|dont|mat|na|ना|मत)\s*(tell|batana|batao|bataiye|बताइए|बताएं|बताना)\s*(anyone|family|kisi|किसी)|\b(kisi ko (mat|na) (batana|batao|batayein|bataiye)|evariki cheppakandi|don't tell anyone|do not tell anyone|do not tell family)\b|किसी को (मत|ना) बता|ఎవరికీ చెప్పకండి(?!.*otp)/gi,
  },
  {
    id: "credential_ask",
    label: "Asks for OTP / PIN / CVV / card details",
    weight: 2.6,
    re: /\b(share|send|give|tell|enter|submit|provide|type|bata\w*|batao|bhej\w*|daal\w*|pampandi|cheppandi|enter cheyyandi|nokk\w*)\b[^.\n]{0,45}\b(otp|cvv|upi pin|atm pin|pin|card (number|details)|expiry|password|verification code|6[- ]digit code|code)\b|\b(otp|cvv|upi pin|card details|verification code|6[- ]digit code)\b[^.\n]{0,30}\b(bata do|bata dijiye|bhejiye|bhejein|daalein|enter cheyyandi|pampandi|de do|share karein)\b/gi,
  },
  {
    id: "advance_fee",
    label: "Asks you to pay a fee to receive money / unlock a service",
    weight: 1.7,
    re: /\b(processing fee|clearance fee|registration (fee)?|delivery (charge|fee)|insurance fee|refundable|deposit (rs|₹)?\s*\d|tax (pehle|first)|shipping|redelivery fee|pay (only )?rs\.? ?\d)\b|(fee|charge|शुल्क|फीस) (भरें|भेजें|जमा|bharein|bhejein|kattandi)|टैक्स पहले/gi,
  },
  {
    id: "reward_bait",
    label: "Too-good-to-be-true reward / refund / cashback",
    weight: 1.3,
    re: /\b(congratulations|congrats|you have won|you've won|lucky (draw|winner)|jeeta|jeete|badhai ho|abhinandanalu|gelichaaru|cashback|prize|inaam|bahumathi|free iphone|voucher|reward points?|refund (of|pending|approved)|tax refund)\b|बधाई|इनाम|జయం|అభినందనలు/gi,
  },
  {
    id: "collect_request",
    label: "UPI 'collect request' / wrong-payment trick",
    weight: 2.0,
    re: /collect request|galti se .{0,30}(chale gaye|aa gaye)|by mistake|tappuga .{0,25}pampanu|गलती से .{0,30}चले गए|wapas (bhej|kar)\w*|return cheyyadaniki|please return|wapas bhej dijiye/gi,
  },
  {
    id: "remote_access",
    label: "Asks you to install a remote-control app",
    weight: 2.6,
    re: /anydesk|teamviewer|quicksupport|rustdesk|screen ?share|control (your|aapka) phone|phone control|download (this |the )?(apk|app)/gi,
  },
  {
    id: "contact_blackmail",
    label: "Threatens to message your contacts / leak photos",
    weight: 2.4,
    re: /(send|bhej\w*|pamput\w*|share).{0,50}(photos?|pictures?|details).{0,40}contacts|(photos?|pictures?|details).{0,60}contacts.{0,25}(bhej|send|pamput|message)|contacts (ko|ki|lo|ki).{0,20}(photo|message)|contacts ko .{0,30}message/gi,
  },
  {
    id: "investment_pitch",
    label: "Guaranteed returns / trading-tips group",
    weight: 1.9,
    re: /guaranteed (returns?|profit|income)|\d+ ?% (weekly|daily|monthly) returns?|crypto signals?|double your money|stock tips? group|vip group|premium group/gi,
  },
  {
    id: "task_job",
    label: "'Earn daily for simple tasks' job pitch",
    weight: 1.6,
    re: /(earn|kamayein|kamao|sampadinchandi|कमाएं).{0,35}(daily|per day|roz|roju|रोज़|रोज)|(like|liking) (youtube|instagram)|product review job|work from home.{0,40}(deposit|pay|registration)|simple tasks?|task complete|telegram group/gi,
  },
  {
    id: "kyc_pretext",
    label: "KYC / PAN / Aadhaar 'update or lose access' pretext",
    weight: 1.2,
    re: /\b(kyc|pan|aadhaar|aadhar|adhaar)\b.{0,50}\b(pending|expire[sd]?|update|verify|verification|expired|link|upload)\b|\b(update|verify)\b.{0,30}\b(kyc|pan|aadhaar)\b/gi,
  },
  {
    id: "link_action",
    label: "Pushes you to click a link / install an app",
    weight: 0.6,
    re: /\b(click|tap|open|visit|download|install|claim|register)\b[^.\n]{0,30}(link|here|below|now|urltok)|\bclick (here|karein|cheyyandi)\b|link par click|link kholein|link open/gi,
  },
];

// Phrases that LOWER risk: real banks/OTP messages warn you *not* to share.
const SAFETY: { re: RegExp; label: string; weight: number }[] = [
  {
    re: /(do not|don't|never|kisi ko na|na batayein|na bataye|mat share|share na karein|share mat|cheppakandi|cheyyakandi|न बताएं|न करें|साझा न करें)[^.\n]{0,35}\b(otp|pin|cvv|password|code)\b|\b(otp|pin|cvv|password)\b[^.\n]{0,40}(do not share|don't share|never share|na batayein|share na karein|न बताएं|cheppakandi|share cheyyakandi)|(never|kabhi nahi|kabhi bhi nahi)[^.\n]{0,40}(ask|maangte|manga)|will never ask|never asks? for/gi,
    label: "Message warns you NOT to share OTP/PIN (typical of genuine bank alerts)",
    weight: 1.4,
  },
  {
    re: /\b(official (app|website|portal)|official [a-z]+ app|helpline|1800[ -]?\d|1930|toll[- ]free|visit your branch|registered email|ignore if (already )?paid)\b|आधिकारिक|అధికారిక/gi,
    label: "Directs you to an official channel / helpline",
    weight: 0.9,
  },
  {
    re: /\b(avl bal|available balance|a\/c xx\d+|a\/c xx0|xx0{2,}|pnr|invoice|order #|#0|units allotted|nav\b|credited to your|debited from your|has been delivered|out for delivery|is on the way|appointment|hall ticket|statement is ready)\b/gi,
    label: "Looks like a routine transactional / service notice",
    weight: 0.8,
  },
];

export interface SignalResult {
  signals: Signal[];
  ruleScore: number; // 0..1
  rawSum: number;
  safetyHints: string[];
  safetyWeight: number;
}

function snippet(text: string, idx: number, len: number) {
  const s = Math.max(0, idx - 12);
  return text.slice(s, Math.min(text.length, idx + len + 12)).replace(/\s+/g, " ").trim();
}

export function detectSignals(text: string): SignalResult {
  const signals: Signal[] = [];
  let sum = 0;
  for (const r of RULES) {
    const re = new RegExp(r.re.source, r.re.flags.includes("g") ? r.re.flags : r.re.flags + "g");
    const ev: string[] = [];
    for (const m of text.matchAll(re)) {
      if (m[0].length === 0) continue;
      // A 'credential ask' inside a "do not share your OTP" sentence is a warning, not an ask.
      if (r.id === "credential_ask") {
        const ctx = text.slice(Math.max(0, (m.index ?? 0) - 40), (m.index ?? 0) + m[0].length + 5).toLowerCase();
        if (/(do not|don't|dont|never|na batayein|share na karein|cheppakandi|cheyyakandi|न बताएं|साझा न)/.test(ctx)) continue;
      }
      ev.push(snippet(text, m.index ?? 0, m[0].length));
      if (ev.length >= 2) break;
    }
    if (ev.length) {
      signals.push({ id: r.id, label: r.label, weight: r.weight, evidence: ev });
      sum += r.weight;
    }
  }
  const safetyHints: string[] = [];
  let safetyWeight = 0;
  for (const s of SAFETY) {
    const re = new RegExp(s.re.source, s.re.flags);
    if (re.test(text)) {
      safetyHints.push(s.label);
      safetyWeight += s.weight;
    }
  }
  signals.sort((a, b) => b.weight - a.weight);
  return { signals, ruleScore: 1 - Math.exp(-sum / 3), rawSum: sum, safetyHints, safetyWeight: Math.min(safetyWeight, 2.4) };
}
