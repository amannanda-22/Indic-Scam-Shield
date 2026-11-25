import { z } from "zod";
import { analyzeStream } from "@/lib/engine/analyze";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 20;

const Body = z.object({
  text: z.string().trim().min(3, "Paste at least a few words").max(2000, "Max 2000 characters"),
  lang: z.enum(["en", "hi", "te"]).default("en"),
});

// Best-effort in-memory limiter (per warm serverless instance). Real deployments should use Vercel WAF / Upstash.
const hits = new Map<string, { n: number; reset: number }>();
function limited(ip: string) {
  const now = Date.now();
  const h = hits.get(ip);
  if (!h || h.reset < now) {
    hits.set(ip, { n: 1, reset: now + 60_000 });
    return false;
  }
  h.n += 1;
  if (hits.size > 5000) hits.clear();
  return h.n > 30;
}

export async function POST(req: Request) {
  const ip = (req.headers.get("x-forwarded-for") ?? "local").split(",")[0].trim();
  if (limited(ip)) {
    return Response.json({ error: "Too many requests - please wait a minute." }, { status: 429 });
  }
  let parsed;
  try {
    parsed = Body.safeParse(await req.json());
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  if (!parsed.success) {
    return Response.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }
  const { text, lang } = parsed.data;

  const enc = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        for await (const ev of analyzeStream(text, lang)) {
          controller.enqueue(enc.encode(JSON.stringify(ev) + "\n"));
        }
      } catch {
        controller.enqueue(enc.encode(JSON.stringify({ type: "error", message: "Analysis failed" }) + "\n"));
      } finally {
        controller.close();
      }
    },
  });
  return new Response(stream, {
    headers: { "content-type": "application/x-ndjson; charset=utf-8", "cache-control": "no-store", "x-accel-buffering": "no" },
  });
}
