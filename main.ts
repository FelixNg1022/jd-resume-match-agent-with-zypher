import { Agent, ChatMessage } from "jsr:@corespeed/zypher";

const agent = new Agent({
  name: "JobSearchAgent",
  systemPrompt: "You are an AI agent that helps the user explore software engineering jobs, summarize roles, generate tailored resume bullets, and suggest next actions.",
});

const input = prompt("Ask your Job Search Agent: ");
const response = await agent.run([new ChatMessage("user", input!)]);

console.log("\n🤖 Job Search Agent:");
console.log(response.outputText);
