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
    // Set OPENAI_BASE_URL so OpenAI SDK uses Groq's endpoint
    // The OpenAI SDK (used by Zypher internally) reads this environment variable
    Deno.env.set("OPENAI_BASE_URL", "https://api.groq.com/openai/v1");
    // Use Groq API key as OpenAI API key (Groq accepts it)
    return new OpenAIModelProvider({ apiKey: groqKey });
  }
  
  // Fall back to OpenAI
  // Make sure OPENAI_BASE_URL is not set (in case it was set for Groq)
  Deno.env.delete("OPENAI_BASE_URL");
  const key = Deno.env.get("OPENAI_API_KEY");
  if (!key) throw new Error("Set OPENAI_API_KEY or GROQ_API_KEY in environment to run the agent.");
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
    } else {
      // OpenAI models: gpt-4o, gpt-4o-mini, gpt-4-turbo, gpt-3.5-turbo
      modelName = Deno.env.get("OPENAI_MODEL") || "gpt-4o-mini";
      const apiKey = Deno.env.get("OPENAI_API_KEY");
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
  } catch (err: unknown) {
    // Provide user-friendly error messages for common API errors
    if (err && typeof err === "object" && "status" in err) {
      const apiError = err as { status?: number; code?: string; message?: string };
      
      if (apiError.status === 429) {
        if (apiError.code === "insufficient_quota") {
          console.error("❌ API quota exceeded. Using fallback parser.");
        } else {
          console.warn("⚠️  API rate limit exceeded. Using fallback parser.");
        }
      } else if (apiError.status === 401) {
        console.error("❌ API authentication failed. Using fallback parser.");
      } else {
        console.warn(`⚠️  API error (${apiError.status}). Using fallback parser.`);
      }
    } else if (err instanceof Error) {
      console.error("Agent error:", err.message);
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
              } else {
                console.warn("⚠️  Parsed JSON missing required fields, using fallback");
                parsed = null;
              }
          }
        } catch (parseErr) {
          // Ignore parse errors, will use fallback parser
        }
      }
    }
  } catch (err) {
    // Ignore JSON parse errors and use fallback parser
  }

  if (!parsed) {
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

export interface ResumeStrengthAnalysis {
  overall_score: number;
  ats_score: number;
  strengths: string[];
  weaknesses: string[];
  improvement_suggestions: string[];
  summary: string;
  skill_diversity_score: number;
  experience_depth_score: number;
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
    
    
    // Search for jobs (limit to 10 for processing)
    const searchResults = await searchJobs(searchQuery, location, 10);
    
    if (searchResults.length === 0) {
      return {
        jobs: [],
        totalFound: 0,
        searchQuery: `${searchQuery}${location ? ` ${location}` : ""}`,
      };
    }
    
    
    // Filter out job boards BEFORE analysis to save time
    // Using job board names (not exact domains) to catch all variations (.com, .ca, .co.uk, etc.)
    const jobBoardNames = [
      // General job boards
      "linkedin", // LinkedIn (catches linkedin.com, linkedin.ca, etc.)
      "indeed", // Indeed (catches indeed.com, indeed.ca, etc.)
      "glassdoor", // Glassdoor (catches glassdoor.com, glassdoor.ca, etc.)
      "monster", // Monster
      "ziprecruiter", // ZipRecruiter
      "simplyhired", // SimplyHired
      "careerbuilder", // CareerBuilder
      "snagajob", // Snagajob
      "eluta", // Eluta (catches eluta.ca, eluta.com, etc.)
      "workopolis", // Workopolis (catches workopolis.com, workopolis.ca, etc.)
      
      // Tech-specific and specialized boards
      "dice", // Dice
      "builtin", // BuiltIn (catches builtin.com, builtinsf.com, builtinvancouver.org, etc.)
      "crunchboard", // Crunchboard (TechCrunch)
      "hired", // Hired
      "arc.dev", // Arc.dev (keep exact match for this one)
      "authenticjobs", // Authentic Jobs
      "stackoverflow", // Stack Overflow (catches stackoverflow.com/jobs, etc.)
      "triplebyte", // Triplebyte
      "jobright", // JobRight AI
      "devjobsscanner", // Dev Jobs Scanner
      "levels.fyi", // Levels.fyi (salary and job board)
      
      // Startup and remote-focused boards
      "wellfound", // Wellfound (formerly AngelList)
      "angel.co", // AngelList (old domain - keep exact match)
      "weworkremotely", // We Work Remotely
      "flexjobs", // FlexJobs
      "remote.co", // Remote.co (keep exact match)
      "remotive", // Remotive
      "remoteok", // RemoteOK
      "relocate.me", // Relocate.me (keep exact match)
      
      // Language-specific and niche boards
      "python.org", // Python Job Board (keep exact match for python.org/jobs)
      "golang.cafe", // Golang Cafe (keep exact match)
      "ycombinator", // Hacker News "Who is Hiring?" (catches news.ycombinator.com)
      "reddit.com/r/python", // Reddit Python jobs (keep exact match)
      "reddit.com/r/golang", // Reddit Golang jobs (keep exact match)
      "reddit.com/r/forhire", // Reddit for hire (keep exact match)
      "reddit.com/r/jobbit", // Reddit jobbit (keep exact match)
    ];
    
    const filteredResults = searchResults.filter(result => {
      const url = (result.url || "").toLowerCase();
      // Check if URL contains any job board name
      const isJobBoard = jobBoardNames.some(name => url.includes(name));
      return !isJobBoard; // Only keep non-job-board results
    });
    
    if (filteredResults.length === 0) {
      return {
        jobs: [],
        totalFound: searchResults.length,
        searchQuery: `${searchQuery}${location ? ` ${location}` : ""}`,
      };
    }
    
    // Extract content and score each job
    // Limit to 3 jobs for faster processing (analyzing each job takes time)
    const jobsWithScores: JobListing[] = [];
    const jobsToAnalyze = Math.min(filteredResults.length, 3);
    
    for (let i = 0; i < jobsToAnalyze; i++) {
      const result = filteredResults[i];
      
      try {
        // Extract full job description
        // Tavily provides full content in the 'content' field, use it if available
        const resultWithContent = result as { title: string; url: string; snippet: string; content?: string };
        let jobDescription = resultWithContent.content || result.snippet;
        
        // Skip fetching full content if we already have good content (saves time)
        // Only fetch if content is very short (< 200 chars)
        if (jobDescription.length < 200) {
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
        
      } catch (err) {
        console.warn(`Failed to analyze job: ${err}`);
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

/**
 * Analyze resume strength without a job description
 * Provides overall resume quality assessment
 */
export async function analyzeResumeStrength(resumeText: string): Promise<ResumeStrengthAnalysis> {
  try {
    const zypherContext = await createZypherContext(Deno.cwd());
    const provider = getProviderFromEnv();
    if (!provider) {
      throw new Error("Failed to create model provider");
    }
    
    const agent = new ZypherAgent(zypherContext, provider);
    
    const prompt = `Analyze this resume and provide a comprehensive strength assessment:

Resume:
${resumeText}

Evaluate the resume on multiple dimensions:
1. Overall Quality (0-100): Structure, clarity, professionalism, impact
2. ATS Compatibility (0-100): Formatting, keywords, structure for Applicant Tracking Systems
3. Skill Diversity (0-100): Range and variety of technical skills
4. Experience Depth (0-100): Depth of experience, achievements, quantifiable results

Provide:
- Overall score (weighted average)
- ATS score
- Top 3-5 strengths
- Top 3-5 weaknesses
- 5-7 actionable improvement suggestions
- Brief summary (2-3 sentences)
- Skill diversity score
- Experience depth score

Output JSON only:
{
  "overall_score": <0-100 integer>,
  "ats_score": <0-100 integer>,
  "strengths": [<array of 3-5 key strengths>],
  "weaknesses": [<array of 3-5 key weaknesses>],
  "improvement_suggestions": [<array of 5-7 actionable suggestions>],
  "summary": "<2-3 sentence summary of resume quality>",
  "skill_diversity_score": <0-100 integer>,
  "experience_depth_score": <0-100 integer>
}`;

    let resultText = "";
    type ContentBlock = { type?: string; text?: string };
    type MessageLike = { content?: ContentBlock[] };
    type TaskEventLike = { type: string; content?: string; message?: MessageLike };
    
    const groqKey = Deno.env.get("GROQ_API_KEY");
    const modelName = groqKey 
      ? (Deno.env.get("GROQ_MODEL") || "llama-3.1-8b-instant")
      : (Deno.env.get("OPENAI_MODEL") || "gpt-4o-mini");
    
    const taskEvents = agent.runTask(prompt, modelName, undefined, { maxIterations: 3 });
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
    
    // Parse JSON response
    let analysis: ResumeStrengthAnalysis | null = null;
    if (resultText.length > 0) {
      try {
        const jsonMatch = resultText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          if (parsed.overall_score !== undefined) {
            analysis = {
              overall_score: Math.min(100, Math.max(0, parsed.overall_score || 0)),
              ats_score: Math.min(100, Math.max(0, parsed.ats_score || 0)),
              strengths: Array.isArray(parsed.strengths) ? parsed.strengths : [],
              weaknesses: Array.isArray(parsed.weaknesses) ? parsed.weaknesses : [],
              improvement_suggestions: Array.isArray(parsed.improvement_suggestions) ? parsed.improvement_suggestions : [],
              summary: parsed.summary || "Resume analysis completed.",
              skill_diversity_score: Math.min(100, Math.max(0, parsed.skill_diversity_score || 0)),
              experience_depth_score: Math.min(100, Math.max(0, parsed.experience_depth_score || 0)),
            };
          }
        }
      } catch (err) {
        // Fall through to default analysis
      }
    }
    
    // Fallback if AI analysis fails
    if (!analysis) {
      const skills = fallbackParseSkills(resumeText);
      const skillCount = skills.length;
      const overallScore = Math.min(100, Math.max(0, Math.round((skillCount / 20) * 100)));
      
      analysis = {
        overall_score: overallScore,
        ats_score: 70,
        strengths: skillCount > 0 ? [`${skillCount} technical skills identified`] : ["Resume structure present"],
        weaknesses: skillCount < 5 ? ["Limited technical skills listed"] : ["Consider adding more quantifiable achievements"],
        improvement_suggestions: [
          "Add more specific technical skills",
          "Include quantifiable achievements",
          "Ensure ATS-friendly formatting",
          "Highlight relevant experience",
          "Add industry keywords"
        ],
        summary: "Basic resume analysis completed. Consider using AI analysis for more detailed insights.",
        skill_diversity_score: Math.min(100, skillCount * 10),
        experience_depth_score: 60,
      };
    }
    
    return analysis;
  } catch (err) {
    console.error("Error in resume strength analysis:", err);
    throw err;
  }
}

/**
 * Generate a personalized cover letter based on resume and job description
 */
export async function generateCoverLetter(
  resumeText: string,
  jobDescription: string,
  companyName?: string
): Promise<string> {
  try {
    const zypherContext = await createZypherContext(Deno.cwd());
    const provider = getProviderFromEnv();
    if (!provider) {
      throw new Error("Failed to create model provider");
    }
    
    const agent = new ZypherAgent(zypherContext, provider);
    
    const companyContext = companyName ? `Company: ${companyName}\n\n` : "";
    const prompt = `Generate a professional, personalized cover letter.

${companyContext}Job Description:
${jobDescription}

Resume:
${resumeText}

Requirements:
- 3-4 paragraphs (approximately 250-350 words)
- Professional and enthusiastic tone
- First paragraph: Express interest and mention the specific role
- Second paragraph: Highlight 2-3 most relevant experiences/skills from resume that match the job
- Third paragraph: Show understanding of the company/role and what you can contribute
- Fourth paragraph (optional): Closing statement with call to action
- Use "I" and "my" (first person)
- Be specific and avoid generic phrases
- Match the tone of the job description
- Do NOT include placeholder text like [Your Name] or [Date]
- Start directly with the greeting (e.g., "Dear Hiring Manager,")

Output the cover letter text only, no JSON, no markdown formatting, just the letter text.`;

    let resultText = "";
    type ContentBlock = { type?: string; text?: string };
    type MessageLike = { content?: ContentBlock[] };
    type TaskEventLike = { type: string; content?: string; message?: MessageLike };
    
    const groqKey = Deno.env.get("GROQ_API_KEY");
    const modelName = groqKey 
      ? (Deno.env.get("GROQ_MODEL") || "llama-3.1-8b-instant")
      : (Deno.env.get("OPENAI_MODEL") || "gpt-4o-mini");
    
    const taskEvents = agent.runTask(prompt, modelName, undefined, { maxIterations: 3 });
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
    
    // Clean up the response - remove any JSON formatting or markdown
    let coverLetter = resultText.trim();
    
    // Remove markdown code blocks if present
    coverLetter = coverLetter.replace(/```[\s\S]*?```/g, '');
    coverLetter = coverLetter.replace(/^```\w*\n?/gm, '');
    coverLetter = coverLetter.replace(/\n?```$/gm, '');
    
    // Remove JSON structure if present
    if (coverLetter.includes('"cover_letter"') || coverLetter.includes('"text"')) {
      try {
        const parsed = JSON.parse(coverLetter);
        coverLetter = parsed.cover_letter || parsed.text || coverLetter;
      } catch {
        // If JSON parse fails, continue with original text
      }
    }
    
    // Fallback if empty
    if (!coverLetter || coverLetter.length < 100) {
      coverLetter = `Dear Hiring Manager,

I am writing to express my strong interest in the position. Based on the job description, I believe my background and skills align well with your requirements.

My experience includes relevant technical skills and professional achievements that would make me a valuable addition to your team. I am excited about the opportunity to contribute to your organization.

Thank you for considering my application. I look forward to discussing how my qualifications can benefit your team.

Sincerely,
[Your Name]`;
    }
    
    return coverLetter.trim();
  } catch (err) {
    console.error("Error generating cover letter:", err);
    throw err;
  }
}
