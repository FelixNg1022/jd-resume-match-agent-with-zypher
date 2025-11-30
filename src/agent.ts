// src/agent.ts

import {
  createZypherContext,
  ZypherAgent,
  OpenAIModelProvider
} from "@corespeed/zypher";
import { eachValueFrom } from "rxjs-for-await";
import { fallbackParseSkills } from "./tools/local_parser.ts";
import { searchJobs, extractJobContent, type JobListing } from "./tools/job_search.ts";

function getProviderFromEnv() {
  // Check for Groq API key first (if user wants to use Groq)
  // Groq is OpenAI-compatible, so we can use OpenAIModelProvider with Groq's endpoint
  const groqKey = Deno.env.get("GROQ_API_KEY");
  if (groqKey) {
    console.log("🔵 Using Groq API via OpenAI-compatible endpoint");
    // Set OPENAI_BASE_URL so OpenAI SDK uses Groq's endpoint
    // The OpenAI SDK (used by Zypher internally) reads this environment variable
    Deno.env.set("OPENAI_BASE_URL", "https://api.groq.com/openai/v1");
    console.log("🔧 Configured OPENAI_BASE_URL to: https://api.groq.com/openai/v1");
    // Use Groq API key as OpenAI API key (Groq accepts it)
    return new OpenAIModelProvider({ apiKey: groqKey });
  }
  
  // Fall back to OpenAI
  // Make sure OPENAI_BASE_URL is not set (in case it was set for Groq)
  Deno.env.delete("OPENAI_BASE_URL");
  const key = Deno.env.get("OPENAI_API_KEY");
  if (!key) throw new Error("Set OPENAI_API_KEY or GROQ_API_KEY in environment to run the agent.");
  console.log("🔵 Using OpenAI API");
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

  // Improved prompt with explicit scoring formula for consistency
  // Note: LLMs are probabilistic, so some variance is expected, but explicit criteria help
  const fullPrompt = `Job Description:
${jdText}

Resume:
${resumeText}

Analyze and calculate fit score: (matched_skills / total_required_skills) * 100

CRITICAL RULES FOR SKILLS:
- Skills = ONLY specific technologies, tools, frameworks, programming languages, platforms (e.g., "Python", "React", "Docker", "AWS", "TypeScript", "PostgreSQL", "Kubernetes")
- EXCLUDE: benefits, salary info, company culture, job type (full-time/part-time), location, company size, startup status, "competitive salaries", "benefits package", "active startup positions", etc.
- EXCLUDE: generic soft skills like "testing", "communication", "problem-solving", "teamwork", "collaboration"
- EXCLUDE: job requirements that are not technical skills (e.g., "years of experience", "degree required", "remote work")
- For matched_skills: ONLY include skills that are EXPLICITLY mentioned in BOTH the JD AND the resume. Check carefully - if TypeScript appears in resume, it should be in matched_skills, NOT missing_skills.
- For missing_skills: ONLY include technical skills/tools from JD that are NOT found anywhere in the resume text. Double-check the resume content before marking as missing.
- Skills must be exact matches or clear variations (e.g., "TypeScript" matches "TypeScript", "TS" matches "TypeScript" if context is clear)

Output JSON only:
{
  "score": <0-100 integer>,
  "matched_skills": [<specific technical skills/tools found in BOTH JD and resume - verify carefully>],
  "missing_skills": [<specific technical skills/tools from JD NOT found in resume - double-check resume before listing>],
  "suggestions": [<3-5 concise, actionable suggestions (one sentence each) on how to better position themselves as a candidate: what to emphasize, how to align experience, which projects to highlight - NOT formatting advice, NOT skill development advice>],
  "short_summary": "<brief explanation of match written in second person: 'You should...' or 'Your resume shows...' - use 'you' and 'your'>"
}`;

  let resultText = "";
  type ContentBlock = { type?: string; text?: string };
  type MessageLike = { content?: ContentBlock[] };
  type TaskEventLike = { type: string; content?: string; message?: MessageLike };
  try {
    // Validate provider before use
    if (!provider) {
      throw new Error("Model provider is not initialized");
    }
    
    // Model selection
    const groqKey = Deno.env.get("GROQ_API_KEY");
    let modelName: string;
    
    if (groqKey) {
      // Groq models: Check https://console.groq.com/docs/models for current available models
      // Currently available: llama-3.1-8b-instant, gemma2-9b-it
      // Note: llama-3.1-70b-versatile and mixtral-8x7b-32768 have been decommissioned
      modelName = Deno.env.get("GROQ_MODEL") || "llama-3.1-8b-instant";
      console.log(`🤖 Running AI agent with Groq model: ${modelName}...`);
      console.log(`🔑 Groq API Key present: Yes (starts with ${groqKey.substring(0, 7)}...)`);
    } else {
      // OpenAI models: gpt-4o, gpt-4o-mini, gpt-4-turbo, gpt-3.5-turbo
      modelName = Deno.env.get("OPENAI_MODEL") || "gpt-4o-mini";
      const apiKey = Deno.env.get("OPENAI_API_KEY");
      console.log(`🤖 Running AI agent with OpenAI model: ${modelName}...`);
      console.log(`🔑 API Key present: ${apiKey ? 'Yes (starts with ' + apiKey.substring(0, 7) + '...)' : 'NO - THIS IS THE PROBLEM!'}`);
      if (!apiKey) {
        throw new Error("OPENAI_API_KEY is not set in environment");
      }
    }
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
      console.log(`📝 First 500 chars of response: ${resultText.substring(0, 500)}`);
    } else {
      console.warn("⚠️  Agent returned empty response. This should not happen if API is working.");
    }
  } catch (err: unknown) {
    // Log the full error to understand what's happening
    console.error("🔍 Full error object:", err);
    console.error("🔍 Error type:", typeof err);
    console.error("🔍 Error stringified:", JSON.stringify(err, null, 2));
    
    // Provide user-friendly error messages for common API errors
    if (err && typeof err === "object" && "status" in err) {
      const apiError = err as { status?: number; code?: string; message?: string; response?: any };
      console.error("🔍 API Error details:", {
        status: apiError.status,
        code: apiError.code,
        message: apiError.message,
      });
      
      if (apiError.status === 429) {
        if (apiError.code === "insufficient_quota") {
          console.error("❌ OpenAI API QUOTA EXCEEDED!");
          console.error("   Your OpenAI account has no credits or quota remaining.");
          console.error("   Please add billing information at: https://platform.openai.com/account/billing");
          console.error("   Or check your usage at: https://platform.openai.com/usage");
          console.warn("   ⚠️  Using fallback parser instead (suggestions will be template-based).");
        } else {
          console.warn("⚠️  OpenAI API rate limit exceeded. Using fallback parser instead.");
        }
      } else if (apiError.status === 401) {
        console.error("❌ OpenAI API AUTHENTICATION FAILED!");
        console.error("   Your API key is invalid or expired.");
        console.error("   Get a new key at: https://platform.openai.com/api-keys");
        console.warn("   ⚠️  Using fallback parser instead.");
      } else {
        console.warn(`⚠️  OpenAI API error (${apiError.status}). Using fallback parser instead.`);
      }
    } else {
      console.warn("⚠️  Agent error occurred. Using fallback parser instead.");
      console.error("Error details:", err);
      if (err instanceof Error) {
        console.error("Error message:", err.message);
        console.error("Error stack:", err.stack);
      }
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
    } else if (resultText.length > 0) {
      // Try to extract JSON from the response
      // First, try to find JSON that might be wrapped in markdown code blocks
      let jsonMatch = resultText.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
      if (!jsonMatch) {
        // If no code block, try to find JSON object directly (non-greedy to avoid matching too much)
        jsonMatch = resultText.match(/\{[\s\S]*?\}/);
      }
      // If still no match, try greedy match as fallback
      if (!jsonMatch) {
        jsonMatch = resultText.match(/\{[\s\S]*\}/);
      }
      
      if (jsonMatch) {
        try {
          const jsonStr = jsonMatch[1] || jsonMatch[0];
          const parsedJson = JSON.parse(jsonStr);
          console.log("✅ Successfully parsed JSON from LLM response");
          console.log(`📊 Parsed fields: score=${parsedJson.score}, matched=${parsedJson.matched_skills?.length || 0}, missing=${parsedJson.missing_skills?.length || 0}, suggestions=${parsedJson.suggestions?.length || 0}`);
          
          // Check if parsed JSON contains an error
          if (parsedJson.reply && parsedJson.reply.includes("(error)")) {
            console.warn("Agent returned error in JSON:", parsedJson);
            parsed = null; // Force fallback
          } else {
              // Validate that we have the required fields
              if (parsedJson.score !== undefined && Array.isArray(parsedJson.matched_skills) && Array.isArray(parsedJson.missing_skills)) {
                // Cap score at 100 (in case of calculation errors from LLM)
                parsedJson.score = Math.min(100, Math.max(0, parsedJson.score || 0));
                
                // Filter out non-technical "skills" from matched_skills and missing_skills
                const nonTechnicalTerms = [
                  "competitive salaries", "benefits", "benefits package", "salary", "compensation",
                  "active startup positions", "startup", "full-time", "part-time", "remote",
                  "years of experience", "experience", "degree", "bachelor", "master",
                  "communication", "teamwork", "collaboration", "problem-solving", "testing",
                  "company culture", "culture", "location", "relocation", "visa sponsorship"
                ];
                
                const resumeLower = resumeText.toLowerCase();
                const jdLower = jdText.toLowerCase();
                
                // Filter matched_skills: remove non-technical terms and verify they're actually in both
                parsedJson.matched_skills = parsedJson.matched_skills
                  .filter((skill: string) => {
                    const skillLower = skill.toLowerCase();
                    // Exclude non-technical terms
                    if (nonTechnicalTerms.some(term => skillLower.includes(term))) {
                      return false;
                    }
                    // Verify skill appears in both JD and resume
                    return jdLower.includes(skillLower) && resumeLower.includes(skillLower);
                  })
                  .map((skill: string) => skill.trim())
                  .filter((skill: string) => skill.length > 0);
                
                // Filter missing_skills: remove non-technical terms and verify they're NOT in resume
                parsedJson.missing_skills = parsedJson.missing_skills
                  .filter((skill: string) => {
                    const skillLower = skill.toLowerCase();
                    // Exclude non-technical terms
                    if (nonTechnicalTerms.some(term => skillLower.includes(term))) {
                      return false;
                    }
                    // Verify skill is in JD but NOT in resume
                    if (!jdLower.includes(skillLower)) {
                      return false; // Not even in JD, shouldn't be in missing
                    }
                    // Double-check: if it's in resume, it shouldn't be in missing_skills
                    if (resumeLower.includes(skillLower)) {
                      console.warn(`⚠️  LLM incorrectly marked "${skill}" as missing, but it's in the resume. Moving to matched_skills.`);
                      // Move to matched_skills if not already there
                      if (!parsedJson.matched_skills.some((s: string) => s.toLowerCase() === skillLower)) {
                        parsedJson.matched_skills.push(skill);
                      }
                      return false; // Remove from missing_skills
                    }
                    return true;
                  })
                  .map((skill: string) => skill.trim())
                  .filter((skill: string) => skill.length > 0);
                
                parsed = parsedJson;
                console.log("✅ Using LLM-generated analysis with suggestions:", parsedJson.suggestions?.length || 0);
                console.log(`📊 After filtering: ${parsedJson.matched_skills.length} matched, ${parsedJson.missing_skills.length} missing`);
              } else {
                console.warn("⚠️  Parsed JSON missing required fields, using fallback");
                parsed = null;
              }
          }
        } catch (parseErr) {
          console.warn("Failed to parse JSON from agent output:", parseErr);
          console.warn("Raw response snippet:", resultText.substring(0, 500));
        }
      } else {
        console.warn("⚠️  No JSON object found in agent response. Response preview:", resultText.substring(0, 500));
        // Log more of the response to help debug
        if (resultText.length > 500) {
          console.warn("Full response length:", resultText.length, "chars");
        }
      }
    } else {
      console.warn("⚠️  resultText is empty - agent did not return any response");
    }
  } catch (err) {
    // Ignore JSON parse errors and use fallback parser
    console.warn("Failed to parse JSON from agent output:", err);
  }

  if (!parsed) {
      console.log("📊 Using fallback parser for analysis (LLM did not return valid response)...");
      const jdSkills = fallbackParseSkills(jdText);
      const resumeSkills = fallbackParseSkills(resumeText);

      const matched = jdSkills.filter(s => resumeSkills.includes(s));
      const missing = jdSkills.filter(s => !resumeSkills.includes(s));
      const score = Math.round((matched.length / Math.max(1, jdSkills.length)) * 100);

      // Generate suggestions based on missing skills
      const suggestions: string[] = [];
      if (missing.length > 0) {
        const topMissing = missing.slice(0, 3);
        suggestions.push(`Add experience or projects demonstrating: ${topMissing.join(", ")}`);
        if (missing.length > 3) {
          suggestions.push(`Consider highlighting transferable skills related to: ${missing.slice(3, 5).join(", ")}`);
        }
      }
      if (matched.length > 0) {
        suggestions.push(`Emphasize your experience with: ${matched.slice(0, 3).join(", ")} in your resume summary`);
      }
      if (suggestions.length === 0) {
        suggestions.push("Review the job description and ensure all key requirements are clearly highlighted in your resume");
      }

      parsed = {
        score,
        matched_skills: matched,
        missing_skills: missing,
        suggestions,
        short_summary: `Estimated fit: ${score}/100. Matched ${matched.length} skills, missing ${missing.length} skills.`
      };
    } else {
      console.log("✅ Agent analysis completed successfully");
      if (parsed && parsed.suggestions) {
        console.log(`💡 LLM generated ${parsed.suggestions.length} suggestions`);
      }
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
    // Generate suggestions based on missing skills
    const suggestions: string[] = [];
    if (missing.length > 0) {
      const topMissing = missing.slice(0, 3);
      suggestions.push(`Add experience or projects demonstrating: ${topMissing.join(", ")}`);
      if (missing.length > 3) {
        suggestions.push(`Consider highlighting transferable skills related to: ${missing.slice(3, 5).join(", ")}`);
      }
    }
    if (matched.length > 0) {
      suggestions.push(`Emphasize your experience with: ${matched.slice(0, 3).join(", ")} in your resume summary`);
    }
    if (suggestions.length === 0) {
      suggestions.push("Review the job description and ensure all key requirements are clearly highlighted in your resume");
    }

    return {
      score,
      matched_skills: matched,
      missing_skills: missing,
      suggestions,
      short_summary: `Estimated fit: ${score}/100. Matched ${matched.length} skills, missing ${missing.length} skills.`
    };
  }
}

export interface JobSearchPreferences {
  role?: string;
  location?: string;
  keywords?: string;
}

export interface JobSearchResult {
  jobs: JobListing[];
  totalFound: number;
  searchQuery: string;
}

/**
 * Search for jobs and rank them based on resume match
 */
export async function searchAndRankJobs(
  resumeText: string,
  preferences: JobSearchPreferences
): Promise<JobSearchResult> {
  try {
    // Build search query
    const role = preferences.role || "software engineer";
    const location = preferences.location;
    const keywords = preferences.keywords;
    
    let searchQuery = role;
    if (keywords) {
      searchQuery = `${role} ${keywords}`;
    }
    
    console.log(`🔍 Searching for jobs: "${searchQuery}"${location ? ` in ${location}` : ""}`);
    
    // Search for jobs (limit to 10 for processing)
    const searchResults = await searchJobs(searchQuery, location, 10);
    
    if (searchResults.length === 0) {
      return {
        jobs: [],
        totalFound: 0,
        searchQuery: `${searchQuery}${location ? ` ${location}` : ""}`,
      };
    }
    
    console.log(`📋 Found ${searchResults.length} job listings. Analyzing matches...`);
    
    // Filter out job boards BEFORE analysis to save time
    const jobBoardDomains = [
      // General job boards
      "linkedin.com/jobs", // LinkedIn job board
      "indeed.com", // Indeed
      "glassdoor.com", // Glassdoor
      "monster.com", // Monster
      "ziprecruiter.com", // ZipRecruiter
      "simplyhired.com", // SimplyHired
      "careerbuilder.com", // CareerBuilder
      "snagajob.com", // Snagajob
      
      // Tech-specific and specialized boards
      "dice.com", // Dice
      "builtin.com", // BuiltIn
      "builtinsf.com", // BuiltIn SF
      "crunchboard.com", // Crunchboard (TechCrunch)
      "hired.com", // Hired
      "arc.dev", // Arc.dev
      "authenticjobs.com", // Authentic Jobs
      "stackoverflow.com/jobs", // Stack Overflow jobs
      "triplebyte.com", // Triplebyte
      "jobright.ai", // JobRight AI
      "devjobsscanner.com", // Dev Jobs Scanner
      
      // Startup and remote-focused boards
      "wellfound.com", // Wellfound (formerly AngelList)
      "angel.co", // AngelList (old domain)
      "weworkremotely.com", // We Work Remotely
      "flexjobs.com", // FlexJobs
      "remote.co", // Remote.co
      "remotive.io", // Remotive
      "remoteok.com", // RemoteOK
      "relocate.me", // Relocate.me
      
      // Language-specific and niche boards
      "python.org/jobs", // Python Job Board
      "golang.cafe", // Golang Cafe
      "news.ycombinator.com", // Hacker News "Who is Hiring?"
      "reddit.com/r/python", // Reddit Python jobs
      "reddit.com/r/golang", // Reddit Golang jobs
      "reddit.com/r/forhire", // Reddit for hire
      "reddit.com/r/jobbit", // Reddit jobbit
    ];
    
    const filteredResults = searchResults.filter(result => {
      const url = (result.url || "").toLowerCase();
      const isJobBoard = jobBoardDomains.some(domain => url.includes(domain));
      return !isJobBoard; // Only keep non-job-board results
    });
    
    if (filteredResults.length === 0) {
      console.log("⚠️  All results were from job boards. No direct company job postings found.");
      return {
        jobs: [],
        totalFound: searchResults.length,
        searchQuery: `${searchQuery}${location ? ` ${location}` : ""}`,
      };
    }
    
    console.log(`✅ Filtered out ${searchResults.length - filteredResults.length} job board results. ${filteredResults.length} direct company postings remaining.`);
    
    // Extract content and score each job
    // Limit to 3 jobs for faster processing (analyzing each job takes time)
    const jobsWithScores: JobListing[] = [];
    const jobsToAnalyze = Math.min(filteredResults.length, 3);
    
    console.log(`⏱️  Analyzing ${jobsToAnalyze} jobs (this may take a minute)...`);
    
    for (let i = 0; i < jobsToAnalyze; i++) {
      const result = filteredResults[i];
      console.log(`\n[${i + 1}/${jobsToAnalyze}] Analyzing: ${result.title}`);
      
      try {
        // Extract full job description
        // Tavily provides full content in the 'content' field, use it if available
        const resultWithContent = result as { title: string; url: string; snippet: string; content?: string };
        let jobDescription = resultWithContent.content || result.snippet;
        
        // Skip fetching full content if we already have good content (saves time)
        // Only fetch if content is very short (< 200 chars)
        if (jobDescription.length < 200) {
          console.log(`   📄 Content too short, fetching full page...`);
          const fullContent = await extractJobContent(result.url);
          if (fullContent && fullContent.length > jobDescription.length) {
            jobDescription = fullContent;
          }
        }
        
        // Analyze match using existing function
        const analysis = await analyzeJDResume(jobDescription, resumeText);
        
        // Cap score at 100 (in case of calculation errors)
        const cappedScore = Math.min(100, Math.max(0, analysis.score || 0));
        
        // Extract company name from title if possible
        const titleParts = result.title.split(" - ");
        const company = titleParts.length > 1 ? titleParts[1] : undefined;
        
        // Ensure URL is valid (not empty or undefined)
        const jobUrl = result.url && result.url.trim() && result.url !== "about:blank" 
          ? result.url 
          : "#"; // Fallback to # if URL is invalid
        
        jobsWithScores.push({
          title: result.title,
          company: company,
          url: jobUrl,
          description: jobDescription.substring(0, 500), // Limit description length
          score: cappedScore,
          matchDetails: {
            matched_skills: analysis.matched_skills || [],
            missing_skills: analysis.missing_skills || [],
          },
        });
        
        console.log(`   ✅ Score: ${cappedScore}/100`);
      } catch (err) {
        console.warn(`   ⚠️  Failed to analyze job: ${err}`);
        // Still add the job but without score
        jobsWithScores.push({
          title: result.title,
          url: result.url,
          description: result.snippet,
          score: 0,
        });
      }
    }
    
    // Sort by score (highest first) and return all analyzed jobs (already limited to 3)
    jobsWithScores.sort((a, b) => (b.score || 0) - (a.score || 0));
    const topJobs = jobsWithScores; // Already limited to 3, no need to slice again
    
    console.log(`\n✅ Top ${topJobs.length} matching jobs found!`);
    
    return {
      jobs: topJobs,
      totalFound: searchResults.length,
      searchQuery: `${searchQuery}${location ? ` ${location}` : ""}`,
    };
  } catch (err) {
    console.error("Error in job search:", err);
    return {
      jobs: [],
      totalFound: 0,
      searchQuery: `${preferences.role || "jobs"}${preferences.location ? ` ${preferences.location}` : ""}`,
    };
  }
}
