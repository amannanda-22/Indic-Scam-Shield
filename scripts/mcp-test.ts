/** End-to-end test: spawns the MCP server over stdio and calls every tool through the official MCP client. */
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import path from "node:path";

async function main() {
  const transport = new StdioClientTransport({ command: "npx", args: ["tsx", path.resolve(__dirname, "../mcp/server.ts")], stderr: "ignore" });
  const client = new Client({ name: "selftest", version: "1.0.0" });
  await client.connect(transport);
  const tools = await client.listTools();
  console.log("tools:", tools.tools.map((t) => t.name).join(", "));
  const call = async (name: string, args: Record<string, unknown>) => {
    const r = await client.callTool({ name, arguments: args });
    const c = r.content as { type: string; text: string }[];
    return JSON.parse(c[0].text);
  };
  const a = await call("analyze_message", { text: "Aapka SBI account block ho jayega. KYC update karein: http://sbi-kyc-verify.top/login aur OTP bhejein", language: "en" });
  console.log("analyze_message ->", a.verdict, a.riskScore, a.scamFamily?.id);
  const u = await call("check_url", { url: "http://hdfc-secure-update.xyz" });
  console.log("check_url ->", u.host, u.risk, u.flags[0]);
  const s = await call("search_advisories", { query: "digital arrest video call CBI" });
  console.log("search_advisories ->", s[0]?.id);
  const ok = a.verdict === "scam" && u.risk > 0.6 && s[0]?.id === "digital-arrest";
  console.log(ok ? "MCP OK" : "MCP FAIL");
  await client.close();
  process.exit(ok ? 0 : 1);
}
main();
