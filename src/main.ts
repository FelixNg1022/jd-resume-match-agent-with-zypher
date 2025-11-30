// src/main.ts
import { analyzeJDResume, searchAndRankJobs, type JobSearchResult } from "./agent.ts";
import type { JobListing } from "./tools/job_search.ts";

function formatScore(score: number): string {
  if (score >= 70) return `\x1b[32m${score}/100\x1b[0m`; // green
  if (score >= 50) return `\x1b[33m${score}/100\x1b[0m`; // yellow
  return `\x1b[31m${score}/100\x1b[0m`; // red
}

interface AnalysisResult {
  score: number;
  matched_skills?: string[];
  missing_skills?: string[];
  suggestions?: string[];
  short_summary?: string;
}

function displayResults(result: AnalysisResult) {
  console.log("\n" + "=".repeat(60));
  console.log("🎯 JD ↔ Resume Match Analysis Results");
  console.log("=".repeat(60) + "\n");
  
  console.log(`📊 Fit Score: ${formatScore(result.score)}\n`);
  
  if (result.short_summary) {
    console.log("📋 Summary:");
    console.log(`   ${result.short_summary}\n`);
  }
  
  if (result.matched_skills && result.matched_skills.length > 0) {
    console.log(`✅ Matched Skills (${result.matched_skills.length}):`);
    console.log(`   ${result.matched_skills.join(", ")}\n`);
  }
  
  if (result.missing_skills && result.missing_skills.length > 0) {
    console.log(`❌ Missing Skills (${result.missing_skills.length}):`);
    console.log(`   ${result.missing_skills.join(", ")}\n`);
  }
  
  if (result.suggestions && result.suggestions.length > 0) {
    console.log("💡 Suggestions for Improvement:");
    result.suggestions.forEach((s: string, i: number) => {
      console.log(`   ${i + 1}. ${s}`);
    });
    console.log();
  }
  
  console.log("=".repeat(60));
  console.log("\n📄 Raw JSON Output:\n");
  console.log(JSON.stringify(result, null, 2));
}

async function main() {
  const args = Deno.args;
  
  console.log("\n🎯 JD ↔ Resume Match Agent (CLI)");
  console.log("Powered by CoreSpeed's Zypher AI Agent Framework\n");
  
  // Show help if requested
  if (args.includes("--help") || args.includes("-h")) {
    console.log("Usage:");
    console.log("  Analyze Match (JD + Resume):");
    console.log("    deno task run:cli --resume <file> --jd <file>");
    console.log("");
    console.log("  Job Search Only (Resume only, no JD):");
    console.log("    deno task run:cli --resume <file> [--role <role>] [--location <loc>] [--keywords <words>]");
    console.log("");
    console.log("  Options:");
    console.log("    --resume, -R <file>     Path to resume file (required)");
    console.log("    --jd, -j <file>         Path to job description file (optional - if omitted, searches for jobs)");
    console.log("    --role, -r <role>       Job role/title for search (default: 'software engineer')");
    console.log("    --location, -l <loc>    Location for search (optional)");
    console.log("    --keywords, -k <words>  Additional keywords for search (optional)");
    console.log("    --search-after, -s      After analysis, also search for matching jobs");
    console.log("");
    console.log("  Examples:");
    console.log("    # Analyze match between JD and resume");
    console.log("    deno task run:cli --resume my_resume.txt --jd job.txt");
    console.log("");
    console.log("    # Search for jobs matching resume (no JD provided)");
    console.log("    deno task run:cli --resume my_resume.txt --role 'backend engineer' --location 'San Francisco'");
    console.log("");
    console.log("    # Analyze match, then search for jobs");
    console.log("    deno task run:cli --resume my_resume.txt --jd job.txt --search-after");
    console.log("");
    Deno.exit(0);
  }
  
  try {
    // Resume is always required
    const resume = await readResumeFromArgs();
    
    // Check if JD is provided
    const jdIndex = args.indexOf("--jd") !== -1 ? args.indexOf("--jd") : args.indexOf("-j");
    const hasJD = jdIndex >= 0 && args[jdIndex + 1] && args[jdIndex + 1] !== "-";
    
    if (hasJD) {
      // JD provided: Analyze match first
      const jd = await readJDFromArgs();
      console.log();
      const result = await analyzeJDResume(jd, resume);
      displayResults(result);
      
      // Check if user wants to search for jobs after analysis
      const searchAfter = args.includes("--search-after") || args.includes("-s");
      if (searchAfter) {
        console.log("\n" + "=".repeat(60));
        console.log("🔍 Searching for matching jobs...");
        console.log("=".repeat(60) + "\n");
        await runJobSearch(resume);
      } else {
        console.log("\n💡 Tip: Add --search-after to search for matching jobs after analysis");
      }
    } else {
      // No JD provided: Go directly to job search
      console.log("ℹ️  No job description provided. Searching for matching jobs instead...\n");
      await runJobSearch(resume);
    }
  } catch (err) {
    console.error("\n❌ Error:", err instanceof Error ? err.message : String(err));
    Deno.exit(1);
  }
}

async function readResumeFromArgs(): Promise<string> {
  const resumeIndex = Deno.args.indexOf("--resume") !== -1 
    ? Deno.args.indexOf("--resume")
    : Deno.args.indexOf("-R");
  
  if (resumeIndex >= 0 && Deno.args[resumeIndex + 1]) {
    const resumePath = Deno.args[resumeIndex + 1];
    if (resumePath === "-") {
      // Read from stdin
      console.log("📄 Reading resume from stdin...");
      const decoder = new TextDecoder();
      const buffer = new Uint8Array(1024);
      let resumeText = "";
      while (true) {
        const n = await Deno.stdin.read(buffer);
        if (n === null) break;
        resumeText += decoder.decode(buffer.subarray(0, n));
      }
      return resumeText.trim();
    } else {
      console.log(`📄 Reading resume from: ${resumePath}`);
      return await Deno.readTextFile(resumePath);
    }
  }
  
  // Default to sample resume
  console.log("📁 Using sample resume from sample/sample_resume.txt");
  return await Deno.readTextFile("sample/sample_resume.txt");
}

async function readJDFromArgs(): Promise<string> {
  const jdIndex = Deno.args.indexOf("--jd") !== -1 
    ? Deno.args.indexOf("--jd")
    : Deno.args.indexOf("-j");
  
  if (jdIndex >= 0 && Deno.args[jdIndex + 1]) {
    const jdPath = Deno.args[jdIndex + 1];
    if (jdPath === "-") {
      // Read from stdin
      console.log("📄 Reading job description from stdin...");
      const decoder = new TextDecoder();
      const buffer = new Uint8Array(1024);
      let jdText = "";
      while (true) {
        const n = await Deno.stdin.read(buffer);
        if (n === null) break;
        jdText += decoder.decode(buffer.subarray(0, n));
      }
      return jdText.trim();
    } else {
      console.log(`📄 Reading job description from: ${jdPath}`);
      return await Deno.readTextFile(jdPath);
    }
  }
  
  // Default to sample JD
  console.log("📁 Using sample job description from sample/sample_jd.txt");
  return await Deno.readTextFile("sample/sample_jd.txt");
}

async function runJobSearch(resume: string) {
  // Get preferences from args or use defaults
  const roleIndex = Deno.args.indexOf("--role") !== -1 
    ? Deno.args.indexOf("--role")
    : Deno.args.indexOf("-r");
  const locationIndex = Deno.args.indexOf("--location") !== -1
    ? Deno.args.indexOf("--location")
    : Deno.args.indexOf("-l");
  const keywordsIndex = Deno.args.indexOf("--keywords") !== -1
    ? Deno.args.indexOf("--keywords")
    : Deno.args.indexOf("-k");
  
  const role = roleIndex >= 0 && Deno.args[roleIndex + 1] 
    ? Deno.args[roleIndex + 1] 
    : "software engineer";
  const location = locationIndex >= 0 && Deno.args[locationIndex + 1]
    ? Deno.args[locationIndex + 1]
    : undefined;
  const keywords = keywordsIndex >= 0 && Deno.args[keywordsIndex + 1]
    ? Deno.args[keywordsIndex + 1]
    : undefined;
  
  console.log(`🔍 Job Search`);
  console.log(`   Role: ${role}`);
  if (location) console.log(`   Location: ${location}`);
  if (keywords) console.log(`   Keywords: ${keywords}`);
  console.log(`\n⏱️  This may take a minute...\n`);
  
  const result = await searchAndRankJobs(resume, { role, location, keywords });
  displayJobSearchResults(result);
}

function displayJobSearchResults(result: JobSearchResult) {
  console.log("=".repeat(60));
  console.log("🔍 Job Search Results");
  console.log("=".repeat(60) + "\n");
  
  console.log(`📊 Search Query: ${result.searchQuery}`);
  console.log(`📋 Total Jobs Found: ${result.totalFound}`);
  
  if (result.jobs.length === 0) {
    console.log("\n❌ No jobs found. Try adjusting your search criteria.");
    console.log("💡 Tip: Set TAVILY_API_KEY environment variable for real job search\n");
    return;
  }
  
  console.log(`⭐ Top ${result.jobs.length} Matches:\n`);
  
  result.jobs.forEach((job: JobListing, index: number) => {
    const score = job.score || 0;
    let scoreColor = "\x1b[31m"; // red
    if (score >= 70) scoreColor = "\x1b[32m"; // green
    else if (score >= 50) scoreColor = "\x1b[33m"; // yellow
    
    console.log(`${index + 1}. ${job.title}${job.company ? ` - ${job.company}` : ""}`);
    console.log(`   ${scoreColor}Score: ${score}/100\x1b[0m`);
    
    // Show URL only if it's valid (not "#" or "about:blank")
    if (job.url && job.url !== "#" && job.url !== "about:blank") {
      console.log(`   🔗 ${job.url}`);
    } else {
      console.log(`   🔗 Job URL not available`);
    }
    
    if (job.matchDetails) {
      if (job.matchDetails.matched_skills && job.matchDetails.matched_skills.length > 0) {
        console.log(`   ✅ Matched Skills: ${job.matchDetails.matched_skills.join(", ")}`);
      }
      if (job.matchDetails.missing_skills && job.matchDetails.missing_skills.length > 0) {
        const missingDisplay = job.matchDetails.missing_skills.slice(0, 5);
        const moreCount = job.matchDetails.missing_skills.length - 5;
        console.log(`   ❌ Missing Skills: ${missingDisplay.join(", ")}${moreCount > 0 ? ` (+${moreCount} more)` : ""}`);
      }
    }
    
    console.log(`   📄 ${job.description.substring(0, 200)}${job.description.length > 200 ? "..." : ""}\n`);
  });
  
  console.log("=".repeat(60) + "\n");
}

if (import.meta.main) await main();
