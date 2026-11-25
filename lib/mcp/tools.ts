/**
 * Transport-free MCP tool implementations. Used by:
 *   - mcp/server.ts        (stdio, for Claude Desktop / Cursor)
 *   - app/api/mcp/route.ts (HTTP JSON-RPC, so the SAME tools run on Vercel)
 */
import { z } from "zod";
import { analyzeCore, buildActions } from "../engine/analyze";
import { searchAdvisories, ADVISORIES } from "../engine/advisories";
import { analyzeUrl } from "../engine/urlforensics";
import { TYPE_LABEL } from "../engine/i18n";

export const analyzeShape = {
  text: z.string().min(3).max(2000).describe("The message text to analyze"),
  language: z.enum(["en", "hi", "te"]).default("en").describe("Language for the recommended actions"),
};
export const urlShape = { url: z.string().min(3).max(500) };
export const searchShape = { query: z.string().min(2).max(300), limit: z.number().int().min(1).max(5).default(3) };

export function analyzeMessage({ text, language }: { text: string; language: "en" | "hi" | "te" }) {
  const { analysis, trace } = analyzeCore(text);
  const actions = buildActions(analysis.verdict, analysis.scamType?.id, language);
  return {
    verdict: analysis.verdict,
    riskScore: analysis.riskScore,
    scamFamily: analysis.scamType ? { id: analysis.scamType.id, label: TYPE_LABEL[analysis.scamType.id]?.[language] ?? analysis.scamType.label, confidence: +analysis.scamType.confidence.toFixed(2) } : null,
    detectedLanguage: analysis.language,
    mlProbability: +analysis.mlProbability.toFixed(3),
    redFlags: analysis.signals.map((s) => ({ id: s.id, label: s.label, evidence: s.evidence })),
    reassuringSignals: analysis.safetyHints,
    links: analysis.urls,
    phones: analysis.phones,
    upiIds: analysis.upiIds,
    advisories: analysis.advisories.map((a) => ({ id: a.id, title: a.title, action: a.action, source: a.source, url: a.sourceUrl })),
    recommendedActions: actions,
    toolTrace: trace.map((t) => `${t.tool}: ${t.summary}`),
    disclaimer: analysis.disclaimer,
  };
}

export const checkUrl = ({ url }: { url: string }) => analyzeUrl(url);

export function searchAdvisoryTool({ query, limit }: { query: string; limit: number }) {
  const hits = searchAdvisories(query, [], limit);
  return hits.length ? hits.map((h) => ({ score: +h.score.toFixed(2), ...h.advisory })) : { message: "No relevant advisory found", available: ADVISORIES.map((a) => a.id) };
}

export const TOOL_DEFS = [
  {
    name: "analyze_message",
    description: "Analyze a suspicious SMS/WhatsApp/call-transcript (English, Hinglish, Hindi, Telugu). Returns verdict (safe|suspicious|scam), risk 0-100, scam family, red flags, link forensics, advisories and recommended actions.",
    shape: analyzeShape,
    inputSchema: { type: "object", properties: { text: { type: "string", minLength: 3, maxLength: 2000, description: "The message text to analyze" }, language: { type: "string", enum: ["en", "hi", "te"], default: "en" } }, required: ["text"] },
    run: (a: unknown) => analyzeMessage(z.object(analyzeShape).parse(a)),
  },
  {
    name: "check_url",
    description: "Offline forensic check of a single link: IP hosts, shorteners, abused TLDs, brand look-alikes and typo-squats. Makes no network request.",
    shape: urlShape,
    inputSchema: { type: "object", properties: { url: { type: "string", minLength: 3, maxLength: 500 } }, required: ["url"] },
    run: (a: unknown) => checkUrl(z.object(urlShape).parse(a)),
  },
  {
    name: "search_advisories",
    description: "Search the curated safety-advisory knowledge base (BM25). Advisories are paraphrased public guidance with official source links; verify at the source.",
    shape: searchShape,
    inputSchema: { type: "object", properties: { query: { type: "string", minLength: 2, maxLength: 300 }, limit: { type: "integer", minimum: 1, maximum: 5, default: 3 } }, required: ["query"] },
    run: (a: unknown) => searchAdvisoryTool(z.object(searchShape).parse(a)),
  },
] as const;
