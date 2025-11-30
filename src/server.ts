// src/server.ts
import { analyzeJDResume, searchAndRankJobs } from "./agent.ts";

const PORT = Number(Deno.env.get("PORT") || 8000);
console.log(`Server listening on http://localhost:${PORT}`);

async function start() {
  try {
    await Deno.serve({ port: PORT }, async (req) => {
      try {
        const url = new URL(req.url);
        if (req.method === "POST" && url.pathname === "/analyze") {
          const body = await req.json();
          const jd = body.jd || "";
          const resume = body.resume || "";
          if (!jd || !resume) {
            return new Response(JSON.stringify({ error: "Provide both jd and resume" }), {
              status: 400,
              headers: { "Content-Type": "application/json" },
            });
          }
          console.log("📥 Received /analyze request");
          console.log(`   JD length: ${jd.length} chars`);
          console.log(`   Resume length: ${resume.length} chars`);
          const analysis = await analyzeJDResume(jd, resume);
          const isLLMGenerated = analysis.suggestions && analysis.suggestions.length > 0 && 
                                 !analysis.suggestions[0].includes("Add experience or projects demonstrating");
          console.log(`✅ Analysis complete. Score: ${analysis.score}, Suggestions: ${analysis.suggestions?.length || 0} (${isLLMGenerated ? 'LLM-generated' : 'fallback-generated'})`);
          return new Response(JSON.stringify({ analysis }), { headers: { "Content-Type": "application/json" } });
        }
        
        if (req.method === "POST" && url.pathname === "/search-jobs") {
          const body = await req.json();
          const resume = body.resume || "";
          const preferences = {
            role: body.role || body.rolePreferences?.role,
            location: body.location || body.rolePreferences?.location,
            keywords: body.keywords || body.rolePreferences?.keywords,
          };
          
          if (!resume) {
            return new Response(JSON.stringify({ error: "Provide resume text" }), {
              status: 400,
              headers: { "Content-Type": "application/json" },
            });
          }
          
          const result = await searchAndRankJobs(resume, preferences);
          return new Response(JSON.stringify({ result }), { headers: { "Content-Type": "application/json" } });
        }
        // serve index.html from project root
        const html = await Deno.readTextFile("index.html");
        return new Response(html, { headers: { "Content-Type": "text/html" } });
      } catch (err) {
        console.error(err);
        return new Response(JSON.stringify({ error: String(err) }), { status: 500, headers: { "Content-Type": "application/json" } });
      }
    });
  } catch (err) {
    console.error("Failed to start server", err);
    Deno.exit(1);
  }
}

start();
