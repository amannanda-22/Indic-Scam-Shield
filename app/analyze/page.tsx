import type { Metadata } from "next";
import Analyzer from "@/components/Analyzer";

export const metadata: Metadata = {
  title: "Analyzer",
  description: "Paste a suspicious message and watch the agent investigate it step by step.",
};

export default function Page() {
  return <Analyzer />;
}
