// src/agent.ts

import {
  createZypherContext,
  ZypherAgent,
  OpenAIModelProvider
} from "@corespeed/zypher";
import { eachValueFrom } from "rxjs-for-await";
import { fallbackParseSkills } from "./tools/local_parser.ts";

function getProviderFromEnv() {
  const key = Deno.env.get("OPENAI_API_KEY");
  if (!key) throw new Error("Set OPENAI_API_KEY in environment to run the agent.");
  return new OpenAIModelProvider({ apiKey: key });
}

export async function analyzeJDResume(jdText: string, resumeText: string) {
  try {
    const zypherContext = await createZypherContext(Deno.cwd());

    const provider = getProviderFromEnv();
    if (!provider) {
      throw new Error("Failed to create model provider");
    }
    
    const agent = new ZypherAgent(zypherContext, provider);

  const systemPrompt = `
You are a JD-Resume Match Assistant.
Inputs:
- job_description: the text of a job posting
- resume: the full text of a candidate's resume

Produce a JSON object ONLY with fields:
{
  "score": number (0-100),
  "matched_skills": [string],
  "missing_skills": [string],
  "suggestions": [string],
  "short_summary": string
}
`;

  const userPrompt = `job_description:
"""${jdText}"""
resume:
"""${resumeText}"""`;

  const fullPrompt = systemPrompt + "\n" + userPrompt;

  let resultText = "";
  type ContentBlock = { type?: string; text?: string };
  type MessageLike = { content?: ContentBlock[] };
  type TaskEventLike = { type: string; content?: string; message?: MessageLike };
  try {
    // Validate provider before use
    if (!provider) {
      throw new Error("Model provider is not initialized");
    }
    
    const modelName = Deno.env.get("OPENAI_MODEL") || "gpt-4o";
    console.log(`🤖 Running AI agent with model: ${modelName}...`);
    const taskEvents = agent.runTask(fullPrompt, modelName, undefined, { maxIterations: 3 });
    for await (const ev of eachValueFrom(taskEvents)) {
      const e = ev as TaskEventLike;
      if (e.type === "text") {
        resultText += e.content || "";
      } else if (e.type === "message") {
        const msg = e.message as MessageLike;
        const blocks = msg?.content || [] as ContentBlock[];
        for (const b of blocks) {
          if (b?.type === "text" && typeof b.text === "string") {
            resultText += b.text;
          }
        }
      } else if (e.type === "error") {
        console.error("Task event error:", e);
        throw new Error(`Agent task error: ${JSON.stringify(e)}`);
      }
    }
    if (resultText.length > 0) {
      console.log(`✅ Agent completed. Received ${resultText.length} characters of response.`);
    }
  } catch (err: unknown) {
    // Provide user-friendly error messages for common API errors
    if (err && typeof err === "object" && "status" in err) {
      const apiError = err as { status?: number; code?: string; message?: string };
      if (apiError.status === 429) {
        if (apiError.code === "insufficient_quota") {
          console.warn("⚠️  OpenAI API quota exceeded. Using fallback parser instead.");
        } else {
          console.warn("⚠️  OpenAI API rate limit exceeded. Using fallback parser instead.");
        }
      } else if (apiError.status === 401) {
        console.warn("⚠️  OpenAI API authentication failed. Check your API key. Using fallback parser.");
      } else {
        console.warn(`⚠️  OpenAI API error (${apiError.status}). Using fallback parser instead.`);
      }
    } else {
      console.warn("⚠️  Agent error occurred. Using fallback parser instead.");
      console.error("Error details:", err);
    }
    // Don't re-throw - fall back to parser instead
    resultText = "";
  }

  let parsed = null;
  try {
    // Check if resultText contains an error message
    if (resultText.includes("(error)") || resultText.includes("error")) {
      console.warn("Agent returned error in resultText:", resultText);
      resultText = ""; // Clear to force fallback
    } else {
      const match = resultText.match(/\{[\s\S]*\}/);
      if (match) {
        const parsedJson = JSON.parse(match[0]);
        // Check if parsed JSON contains an error
        if (parsedJson.reply && parsedJson.reply.includes("(error)")) {
          console.warn("Agent returned error in JSON:", parsedJson);
          parsed = null; // Force fallback
        } else {
          parsed = parsedJson;
        }
      }
    }
  } catch (err) {
    // Ignore JSON parse errors and use fallback parser
    console.warn("Failed to parse JSON from agent output:", err);
  }

    if (!parsed) {
      console.log("📊 Using fallback parser for analysis...");
      const jdSkills = fallbackParseSkills(jdText);
      const resumeSkills = fallbackParseSkills(resumeText);

      const matched = jdSkills.filter(s => resumeSkills.includes(s));
      const missing = jdSkills.filter(s => !resumeSkills.includes(s));
      const score = Math.round((matched.length / Math.max(1, jdSkills.length)) * 100);

      parsed = {
        score,
        matched_skills: matched,
        missing_skills: missing,
        suggestions: [
          "Bring key matched skills to top of resume",
          "Add 1-2 bullets quantifying experience for missing critical skills",
          "Add a projects/skills section with examples"
        ],
        short_summary: `Estimated fit: ${score}/100. Matched ${matched.length}, missing ${missing.length}. (Using fallback parser)`
      };
    } else {
      console.log("✅ Agent analysis completed successfully");
    }

    return parsed;
  } catch (err) {
    console.error("Error in analyzeJDResume:", err);
    // Return fallback result on any error
    const jdSkills = fallbackParseSkills(jdText);
    const resumeSkills = fallbackParseSkills(resumeText);
    const matched = jdSkills.filter(s => resumeSkills.includes(s));
    const missing = jdSkills.filter(s => !resumeSkills.includes(s));
    const score = Math.round((matched.length / Math.max(1, jdSkills.length)) * 100);
    return {
      score,
      matched_skills: matched,
      missing_skills: missing,
      suggestions: [
        "Bring key matched skills to top of resume",
        "Add 1-2 bullets quantifying experience for missing critical skills",
        "Add a projects/skills section with examples"
      ],
      short_summary: `Estimated fit: ${score}/100. Matched ${matched.length}, missing ${missing.length}. (Note: Using fallback parser due to agent error)`
    };
  }
}
