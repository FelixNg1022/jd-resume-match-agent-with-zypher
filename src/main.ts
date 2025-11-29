// src/main.ts
import { analyzeJDResume } from "./agent.ts";

function formatScore(score: number): string {
  if (score >= 70) return `\x1b[32m${score}/100\x1b[0m`; // green
  if (score >= 50) return `\x1b[33m${score}/100\x1b[0m`; // yellow
  return `\x1b[31m${score}/100\x1b[0m`; // red
}

function displayResults(result: any) {
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
  console.log("\n🎯 JD ↔ Resume Match Agent (CLI)");
  console.log("Powered by CoreSpeed's Zypher AI Agent Framework\n");
  
  try {
    const sampleJD = await Deno.readTextFile("sample/sample_jd.txt");
    const sampleResume = await Deno.readTextFile("sample/sample_resume.txt");

    console.log("📁 Using sample files from sample/ directory");
    console.log("   (To use custom files, replace sample_jd.txt and sample_resume.txt)\n");
    
    const result = await analyzeJDResume(sampleJD, sampleResume);
    displayResults(result);
  } catch (err) {
    console.error("\n❌ Error:", err instanceof Error ? err.message : String(err));
    Deno.exit(1);
  }
}

if (import.meta.main) await main();
