import { MODEL_INFO } from "@/lib/engine/classifier";
import { llmAvailable } from "@/lib/engine/llm";

export const dynamic = "force-dynamic";

export function GET() {
  return Response.json({ status: "ok", model: MODEL_INFO, llmExplainer: llmAvailable(), stores: "nothing - stateless" });
}
