// src/server.ts
import { analyzeJDResume, searchAndRankJobs, analyzeResumeStrength, generateCoverLetter } from "./agent.ts";
import { extractTextFromPDF } from "./tools/pdf_parser.ts";

// Helper function to extract company name from job description
function extractCompanyNameFromJD(jd: string): string | undefined {
  // Try to find company name patterns in JD
  const patterns = [
    /(?:at|@|with|for)\s+([A-Z][a-zA-Z\s&]+?)(?:\s+(?:is|seeks|looking|hiring|offers|provides|develops|creates|builds|designs|delivers|specializes|focuses|operates|serves|works|collaborates|partners|strives|aims|committed|dedicated|mission|vision|values|culture|team|company|organization|firm|corporation|inc\.|llc\.|ltd\.|co\.))/i,
    /(?:company|organization|firm|corporation):\s*([A-Z][a-zA-Z\s&]+?)(?:\s|$)/i,
    /^([A-Z][a-zA-Z\s&]+?)\s+(?:is|seeks|looking|hiring)/i,
  ];
  
  for (const pattern of patterns) {
    const match = jd.match(pattern);
    if (match && match[1]) {
      const companyName = match[1].trim();
      // Filter out common false positives
      if (companyName.length > 2 && companyName.length < 50 && 
          !companyName.toLowerCase().includes('position') &&
          !companyName.toLowerCase().includes('role') &&
          !companyName.toLowerCase().includes('job')) {
        return companyName;
      }
    }
  }
  
  return undefined;
}

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
          const analysis = await analyzeJDResume(jd, resume);
          return new Response(JSON.stringify({ analysis }), { headers: { "Content-Type": "application/json" } });
        }
        
        if (req.method === "POST" && url.pathname === "/upload-pdf") {
          try {
            const formData = await req.formData();
            const pdfFile = formData.get("pdf");
            
            if (!pdfFile || !(pdfFile instanceof File)) {
              return new Response(JSON.stringify({ error: "No PDF file provided" }), {
                status: 400,
                headers: { "Content-Type": "application/json" },
              });
            }
            
            // Check file type
            if (pdfFile.type !== "application/pdf") {
              return new Response(JSON.stringify({ error: "File must be a PDF" }), {
                status: 400,
                headers: { "Content-Type": "application/json" },
              });
            }
            
            // Read PDF file as Uint8Array
            const arrayBuffer = await pdfFile.arrayBuffer();
            const pdfBuffer = new Uint8Array(arrayBuffer);
            
            // Extract text from PDF
            const extractedText = await extractTextFromPDF(pdfBuffer);
            
            return new Response(JSON.stringify({ text: extractedText }), {
              headers: { "Content-Type": "application/json" },
            });
          } catch (err) {
            console.error("Error processing PDF upload:", err);
            return new Response(JSON.stringify({ error: `Failed to parse PDF: ${err instanceof Error ? err.message : String(err)}` }), {
              status: 500,
              headers: { "Content-Type": "application/json" },
            });
          }
        }
        
        if (req.method === "POST" && url.pathname === "/search-jobs") {
          const body = await req.json();
          const resume = body.resume || "";
          const preferences = {
            role: body.role,
            location: body.location,
            keywords: body.keywords,
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
        
        if (req.method === "POST" && url.pathname === "/analyze-resume") {
          const body = await req.json();
          const resume = body.resume || "";
          
          if (!resume) {
            return new Response(JSON.stringify({ error: "Provide resume text" }), {
              status: 400,
              headers: { "Content-Type": "application/json" },
            });
          }
          
          try {
            const analysis = await analyzeResumeStrength(resume);
            return new Response(JSON.stringify({ analysis }), { headers: { "Content-Type": "application/json" } });
          } catch (err) {
            return new Response(JSON.stringify({ error: `Failed to analyze resume: ${err instanceof Error ? err.message : String(err)}` }), {
              status: 500,
              headers: { "Content-Type": "application/json" },
            });
          }
        }
        
        if (req.method === "POST" && url.pathname === "/generate-cover-letter") {
          const body = await req.json();
          const resume = body.resume || "";
          const jd = body.jd || "";
          
          if (!resume || !jd) {
            return new Response(JSON.stringify({ error: "Provide both resume and job description" }), {
              status: 400,
              headers: { "Content-Type": "application/json" },
            });
          }
          
          try {
            // Extract company name from JD if possible, otherwise use undefined
            const companyName = extractCompanyNameFromJD(jd);
            const coverLetter = await generateCoverLetter(resume, jd, companyName);
            return new Response(JSON.stringify({ coverLetter }), { headers: { "Content-Type": "application/json" } });
          } catch (err) {
            return new Response(JSON.stringify({ error: `Failed to generate cover letter: ${err instanceof Error ? err.message : String(err)}` }), {
              status: 500,
              headers: { "Content-Type": "application/json" },
            });
          }
        }
        
        // Serve logo files for favicon
        if (url.pathname === "/logo-icon-only.svg") {
          try {
            const logo = await Deno.readTextFile("logo-icon-only.svg");
            return new Response(logo, { headers: { "Content-Type": "image/svg+xml" } });
          } catch {
            return new Response("Not found", { status: 404 });
          }
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
