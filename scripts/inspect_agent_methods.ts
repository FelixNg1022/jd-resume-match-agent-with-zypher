/**
 * scripts/inspect_agent_methods.ts
 * Creates a ZypherAgent (no model calls) and prints prototype method names.
 * This helps with API discovery when the package updates.
 * Usage: deno run --config deno.json -A scripts/inspect_agent_methods.ts
 */
import { createZypherContext, ZypherAgent, OpenAIModelProvider } from "@corespeed/zypher";

async function main() {
  try {
    const ctx = await createZypherContext(Deno.cwd());
    console.log("Context created:", ctx.workingDirectory);
    // OpenAIModelProvider currently only needs `apiKey` in options
    const provider = new OpenAIModelProvider({ apiKey: Deno.env.get("OPENAI_API_KEY") ?? "fake" });
    const agent = new ZypherAgent(ctx, provider);
    console.log("Agent prototype methods: ", Object.getOwnPropertyNames(Object.getPrototypeOf(agent)).sort());
  } catch (err) {
    console.error("Error creating agent", err);
    Deno.exit(1);
  }
}

main();
