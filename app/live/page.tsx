import type { Metadata } from "next";
import LiveRun from "@/components/LiveRun";

export const metadata: Metadata = {
  title: "Live system",
  description: "One click runs the same message through the web engine, the MCP server and the Python ML service, live.",
};

export default function Page() {
  return <LiveRun />;
}
