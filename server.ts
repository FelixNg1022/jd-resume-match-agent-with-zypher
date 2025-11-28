import { Agent, ChatMessage } from "jsr:@corespeed/zypher";

const agent = new Agent({
  name: "JobSearchAgentGUI",
  systemPrompt: "You are an AI job search assistant who helps users analyze job postings, generate insights, and support job applications.",
});

Deno.serve(async (req) => {
  if (req.method === "POST") {
    const { message } = await req.json();
    const response = await agent.run([new ChatMessage("user", message)]);
    return new Response(JSON.stringify({ reply: response.outputText }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(await Deno.readTextFile("index.html"), {
    headers: { "Content-Type": "text/html" },
  });
});
