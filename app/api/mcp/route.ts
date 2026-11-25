/**
 * Remote MCP endpoint (stateless JSON-RPC 2.0 over HTTP POST), same tools as the stdio server.
 * Implements: initialize, ping, tools/list, tools/call, notifications/* (ignored).
 * Try it:  curl -X POST $URL/api/mcp -H 'content-type: application/json' \
 *            -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'
 */
import { TOOL_DEFS } from "@/lib/mcp/tools";

export const runtime = "nodejs";
const PROTOCOL = "2025-03-26";
const hits = new Map<string, { n: number; t: number }>();
function limited(ip: string) {
  const now = Date.now();
  const h = hits.get(ip);
  if (!h || now - h.t > 60_000) {
    hits.set(ip, { n: 1, t: now });
    return false;
  }
  h.n += 1;
  if (hits.size > 5000) hits.clear();
  return h.n > 60;
}

const ok = (id: unknown, result: unknown) => ({ jsonrpc: "2.0", id, result });
const err = (id: unknown, code: number, message: string) => ({ jsonrpc: "2.0", id, error: { code, message } });

function handle(msg: { id?: unknown; method?: string; params?: Record<string, unknown> }) {
  const { id, method, params } = msg;
  if (typeof method !== "string") return err(id ?? null, -32600, "Invalid request");
  if (method.startsWith("notifications/")) return null;
  switch (method) {
    case "initialize":
      return ok(id, { protocolVersion: PROTOCOL, capabilities: { tools: {} }, serverInfo: { name: "indic-scam-shield", version: "1.0.0" } });
    case "ping":
      return ok(id, {});
    case "tools/list":
      return ok(id, { tools: TOOL_DEFS.map((t) => ({ name: t.name, description: t.description, inputSchema: t.inputSchema })) });
    case "tools/call": {
      const tool = TOOL_DEFS.find((t) => t.name === params?.name);
      if (!tool) return err(id, -32602, `Unknown tool: ${String(params?.name)}`);
      try {
        const out = tool.run(params?.arguments ?? {});
        return ok(id, { content: [{ type: "text", text: JSON.stringify(out, null, 2) }] });
      } catch (e) {
        const m = e instanceof Error ? e.message : "Tool failed";
        return ok(id, { isError: true, content: [{ type: "text", text: `Invalid arguments: ${m.slice(0, 300)}` }] });
      }
    }
    default:
      return err(id ?? null, -32601, `Method not found: ${method}`);
  }
}

export async function POST(req: Request) {
  const ip = (req.headers.get("x-forwarded-for") ?? "local").split(",")[0].trim();
  if (limited(ip)) return Response.json(err(null, -32000, "Too many requests"), { status: 429 });
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json(err(null, -32700, "Parse error"), { status: 400 });
  }
  if (Array.isArray(body)) {
    const out = body.slice(0, 20).map(handle).filter((x) => x !== null);
    return out.length ? Response.json(out, { headers: { "cache-control": "no-store" } }) : new Response(null, { status: 202 });
  }
  const res = handle(body as never);
  return res === null ? new Response(null, { status: 202 }) : Response.json(res, { headers: { "cache-control": "no-store" } });
}

export async function GET() {
  return Response.json({ name: "indic-scam-shield", transport: "http-jsonrpc", protocol: PROTOCOL, tools: TOOL_DEFS.map((t) => t.name), usage: "POST JSON-RPC 2.0 to this URL" });
}
