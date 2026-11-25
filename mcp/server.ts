/**
 * Indic Scam Shield as a Model Context Protocol (MCP) server over stdio.
 * Any MCP-capable assistant (Claude Desktop, Claude Code, Cursor...) can call these tools.
 * The same tools are also served over HTTP at /api/mcp (works on Vercel).
 *
 *   npm run mcp
 *
 * Claude Desktop config:
 *   { "mcpServers": { "indic-scam-shield": { "command": "npx", "args": ["tsx", "/ABS/PATH/mcp/server.ts"] } } }
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { analyzeShape, urlShape, searchShape, analyzeMessage, checkUrl, searchAdvisoryTool, TOOL_DEFS } from "../lib/mcp/tools";

const server = new McpServer({ name: "indic-scam-shield", version: "1.0.0" });
const asText = (o: unknown) => ({ content: [{ type: "text" as const, text: JSON.stringify(o, null, 2) }] });
const desc = (n: string) => TOOL_DEFS.find((t) => t.name === n)!.description;

server.tool("analyze_message", desc("analyze_message"), analyzeShape, async (a) => asText(analyzeMessage(a)));
server.tool("check_url", desc("check_url"), urlShape, async (a) => asText(checkUrl(a)));
server.tool("search_advisories", desc("search_advisories"), searchShape, async (a) => asText(searchAdvisoryTool(a)));

async function main() {
  await server.connect(new StdioServerTransport());
  console.error("indic-scam-shield MCP server running on stdio");
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
