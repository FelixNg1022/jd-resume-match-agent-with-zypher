/**
 * scripts/run_agent_test.ts
 * Small utility to test `ZypherAgent.runTask` streaming behavior. This will call the model provider
 * and stream events to stdout. Only run when `OPENAI_API_KEY` is configured, otherwise the script exits.
 * Usage: OPENAI_API_KEY="sk-..." deno run --config deno.json -A scripts/run_agent_test.ts
 */
import { createZypherContext, ZypherAgent, OpenAIModelProvider } from "@corespeed/zypher";
import { eachValueFrom } from "rxjs-for-await";

async function main() {
  const apiKey = Deno.env.get("OPENAI_API_KEY");
  if (!apiKey) {
    console.log("OPENAI_API_KEY is not set — skipping model run. Set the env var and re-run to test streaming.");
    return;
  }

  const ctx = await createZypherContext(Deno.cwd());
  const provider = new OpenAIModelProvider({ apiKey });
  const agent = new ZypherAgent(ctx, provider);
  const prompt = 'Summarize this: Hello world. Provide a JSON object with a single field: {"x": 1}';
  console.log('calling runTask... (this may cost API credits)');
  const model = Deno.env.get("OPENAI_MODEL") || 'gpt-4o';
  try {
    const taskEvents = agent.runTask(prompt, model, undefined, { maxIterations: 1, });
    for await (const ev of eachValueFrom(taskEvents)) {
      // Log minimal info to help inspect events without huge dumps
      if (ev.type === 'text') {
        console.log(`[text] ${ev.content?.slice(0, 120)}${ev.content && ev.content.length > 120 ? '...' : ''}`);
      } else if (ev.type === 'message') {
        console.log('[message] final message event added to history');
      } else {
        console.log('[event]', ev.type);
      }
    }
    console.log('done');
  } catch (err) {
    console.error('Error streaming events:', err);
  }
}

main();
