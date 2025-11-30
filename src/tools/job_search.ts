// src/tools/job_search.ts
// Job search using Tavily API (AI-optimized search + content extraction)

export interface JobListing {
  title: string;
  company?: string;
  url: string;
  description: string;
  score?: number;
  matchDetails?: {
    matched_skills: string[];
    missing_skills: string[];
  };
}

/**
 * Search for jobs using Tavily API (AI-optimized search + content extraction)
 * Falls back to mock data if Tavily API key is not configured
 */
export async function searchJobs(
  query: string,
  location?: string,
  limit: number = 10
): Promise<{ title: string; url: string; snippet: string; content?: string }[]> {
  // Uses Tavily API for AI-optimized job search with full content extraction
  // Falls back to mock data for demo purposes if no API key is set
  
  // Build a more specific query to find actual job postings, not articles
  // Include terms that indicate job postings: "hiring", "apply", "position", "opening"
  let searchQuery = `${query} hiring apply position opening`;
  if (location) {
    searchQuery = `${query} hiring ${location} apply position opening`;
  }
  
  console.log(`🔍 Searching for job postings: "${searchQuery}"`);
  
  // Check if Tavily API key is configured
  const hasTavilyKey = Deno.env.get("TAVILY_API_KEY");
  
  // Try to use real search APIs first
  try {
    const results = await performWebSearch(searchQuery, limit);
    
    // If we got results, return them
    if (results.length > 0) {
      console.log(`✅ Tavily search successful! Found ${results.length} real job postings.`);
      return results;
    }
    
    // If no results, check if Tavily API key is configured
    if (!hasTavilyKey) {
      console.log("ℹ️  No TAVILY_API_KEY configured. Using mock job data for demo.");
      console.log("💡 Tip: Set TAVILY_API_KEY environment variable for real job search");
      console.log("   Example: export TAVILY_API_KEY='your-api-key-here'");
      return getMockJobResults(query, limit, location);
    }
    
    // If API keys are set but no results, return empty (real search returned nothing)
    console.log("⚠️  Tavily API key is set but search returned no results. This might mean:");
    console.log("   - No jobs found matching your criteria");
    console.log("   - API rate limit exceeded");
    console.log("   - API error occurred");
    return results;
  } catch (err) {
    console.warn("❌ Web search failed:", err instanceof Error ? err.message : String(err));
    if (!hasTavilyKey) {
      console.log("ℹ️  No TAVILY_API_KEY configured. Using mock job data for demo.");
      console.log("💡 Tip: Set TAVILY_API_KEY environment variable for real job search");
      return getMockJobResults(query, limit, location);
    }
    // If API key is set but search failed, return empty (don't use mock data)
    console.log("⚠️  Tavily API key is set but search failed. Check your API key and try again.");
    return [];
  }
}

/**
 * Perform web search using Tavily API (AI-optimized search with full content extraction)
 */
async function performWebSearch(
  query: string,
  limit: number
): Promise<{ title: string; url: string; snippet: string; content?: string }[]> {
  const tavilyApiKey = Deno.env.get("TAVILY_API_KEY");
  if (!tavilyApiKey) {
    console.log("⚠️  TAVILY_API_KEY not found in environment variables");
    return [];
  }
  
  try {
    console.log("🔍 Using Tavily API for AI-optimized job search...");
    console.log(`   API Key: ${tavilyApiKey.substring(0, 8)}...${tavilyApiKey.substring(tavilyApiKey.length - 4)}`);
    const response = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        api_key: tavilyApiKey,
        query: query,
        search_depth: "advanced", // Get full content
        max_results: Math.min(limit * 3, 30), // Get more results to filter from
        include_raw_content: true, // Request full page content
        // Don't restrict domains - search broadly but filter results
        // This allows finding jobs on company websites too
      }),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.warn(`Tavily API returned ${response.status}: ${errorText.substring(0, 200)}`);
      if (response.status === 401) {
        console.error("❌ Tavily API authentication failed. Check your API key.");
      } else if (response.status === 429) {
        console.warn("⚠️  Tavily API rate limit exceeded.");
      }
      return [];
    }
    
    const data = await response.json() as {
      results?: Array<{
        title: string;
        url: string;
        content?: string;
        raw_content?: string;
      }>;
    };
    
    const results = data.results || [];
    
    if (results.length > 0) {
      console.log(`✅ Tavily returned ${results.length} results, filtering for actual job postings...`);
      
      // Filter to get actual job postings, not articles/guides
      const jobPostings = results
        .filter((r) => {
          const title = (r.title || "").toLowerCase();
          const url = (r.url || "").toLowerCase();
          const content = ((r.content || r.raw_content || "").toLowerCase()).substring(0, 1000);
          
          // Additional check: exclude URLs that are clearly search/listing pages
          const isSearchPage = url.match(/\/jobs\?|jobsearch|job-listing|jobs\/search|jobs\/collection|q-|\/jobs$|\/jobs\/$/i);
          
          // Exclude articles, guides, and job board search pages
          const excludeKeywords = [
            "complete guide",
            "guide to",
            "how to",
            "everything you need",
            "what is",
            "article",
            "blog post",
            "/post/",
            "/blog/",
            // Job board search pages (exclude these)
            "indeed.com/q-", // Indeed search results pages
            "indeed.com/jobs?", // Indeed search results
            "indeed.com/jobsearch", // Indeed search
            "glassdoor.com/Job/", // Glassdoor search results
            "glassdoor.com/job-listing", // Sometimes search results
            "linkedin.com/jobs/search", // LinkedIn search results
            "linkedin.com/jobs/collection", // LinkedIn job collections
            "monster.com/jobs/search", // Monster search
            "monster.com/jobsearch", // Monster search
            "ziprecruiter.com/jobs-search", // ZipRecruiter search
            "ziprecruiter.com/jobs?", // ZipRecruiter search results
            "ziprecruiter.com/jobsearch", // ZipRecruiter search
            "dice.com/jobsearch", // Dice search
            "wellfound.com/jobs", // Wellfound (AngelList) job listings/search
            "wellfound.com/startups/", // Wellfound startup pages (not individual jobs)
            "angel.co/jobs", // AngelList job listings (old domain)
            "talent.intulsa.com/post/", // Article/blog posts
          ];
          
          // Exclude ALL job board domains completely (user wants direct company job postings only)
          // This list is also used in agent.ts for pre-filtering, keep in sync
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
            "builtinvancouver.org", // BuiltIn Vancouver
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
          
          // Check if URL is from a job board domain - exclude ALL job board links
          const isJobBoardDomain = jobBoardDomains.some(domain => url.includes(domain));
          
          // Completely exclude job board domains - user wants direct company job postings only
          if (isJobBoardDomain) {
            return false; // Exclude all job board links, even individual job postings
          }
          
          // Check if it's an article/guide or search page
          const isArticle = excludeKeywords.some(keyword => 
            title.includes(keyword) || url.includes(keyword) || content.includes(keyword)
          );
          
          // Exclude if it's an article OR a search page
          if (isArticle || isSearchPage) {
            return false;
          }
          
          // Additional check: exclude if title suggests it's a search/listing page
          const searchPageTitles = [
            "jobs, employment",
            "job search",
            "find jobs",
            "browse jobs",
            "job listings",
            "all jobs",
            "search results",
          ];
          const isSearchPageTitle = searchPageTitles.some(pattern => 
            title.toLowerCase().includes(pattern)
          );
          
          if (isSearchPageTitle) {
            return false;
          }
          
          // Must look like a job posting - check for job-related indicators
          const jobIndicators = [
            "apply now",
            "apply today",
            "apply for this",
            "hiring",
            "we're hiring",
            "we are hiring",
            "position available",
            "job opening",
            "open position",
            "role:",
            "responsibilities:",
            "requirements:",
            "qualifications:",
            "salary range",
            "compensation",
            "benefits package",
            "full-time",
            "part-time",
            "remote",
            "job description",
            "we are looking for",
            "join our team",
            "submit your application",
            "send your resume",
            "years of experience",
            "required skills",
          ];
          
          const hasJobIndicators = jobIndicators.some(indicator =>
            title.includes(indicator) || content.includes(indicator)
          );
          
          // Also check URL patterns for job postings (but exclude search pages)
          const jobUrlPatterns = [
            "/jobs/view/", // Individual job view pages
            "/job/", // Individual job pages
            "/careers/", // Company career pages
            "/career/", // Company career pages
            "/position/", // Position pages
            "/opening/", // Job opening pages
            "/apply", // Apply pages
            "job-id=", // Job ID in URL
            "jobId=", // Job ID parameter
            "/jobs/", // But only if not a search page
          ];
          
          const hasJobUrl = jobUrlPatterns.some(pattern => {
            if (pattern === "/jobs/") {
              // Only allow /jobs/ if it's followed by a job ID or view, not search
              return url.includes("/jobs/view/") || url.includes("/jobs/") && 
                     !url.includes("/jobs?") && !url.includes("/jobs/search");
            }
            return url.includes(pattern);
          });
          
          // Include if it has job indicators OR job URL pattern
          // But must NOT be a search/listing page
          return (hasJobIndicators || hasJobUrl) && !isSearchPage;
        })
        .map((r) => ({
          title: r.title,
          url: r.url,
          snippet: r.content?.substring(0, 500) || r.raw_content?.substring(0, 500) || "", // Preview snippet
          content: r.content || r.raw_content || "", // Full content for analysis
        }));
      
      if (jobPostings.length > 0) {
        console.log(`✅ Filtered to ${jobPostings.length} actual job postings`);
        return jobPostings.slice(0, limit);
      } else {
        console.log(`⚠️  No actual job postings found after filtering. Returning top results...`);
        // If filtering removed everything, return original results but warn
        return results.slice(0, limit).map((r) => ({
          title: r.title,
          url: r.url,
          snippet: r.content?.substring(0, 500) || r.raw_content?.substring(0, 500) || "",
          content: r.content || r.raw_content || "",
        }));
      }
    }
    
    return [];
  } catch (err) {
    console.warn("Tavily API error:", err instanceof Error ? err.message : String(err));
    return [];
  }
}

/**
 * Extract job content from URL (fallback when Tavily content is insufficient)
 * Uses simple HTML text extraction - Tavily should provide full content in most cases
 */
export async function extractJobContent(url: string): Promise<string> {
  try {
    console.log(`📄 Extracting content from: ${url}`);
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; JobSearchBot/1.0)",
      },
    });
    
    if (response.ok) {
      const html = await response.text();
      // Simple text extraction (remove HTML tags)
      const text = html
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
        .replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " ")
        .trim();
      
      return text.substring(0, 5000); // Limit to 5000 chars
    }
  } catch (err) {
    console.warn(`Failed to fetch ${url}:`, err);
  }
  
  return "";
}

/**
 * Mock job results for demo when no API keys are configured
 */
function getMockJobResults(
  query: string,
  limit: number,
  location?: string
): { title: string; url: string; snippet: string }[] {
  // Generate location-specific jobs if location is provided
  const locationSuffix = location ? ` in ${location}` : "";
  
  // Note: These are mock/demo jobs. Set TAVILY_API_KEY for real job search.
  const baseJobs = [
    {
      title: "Senior Software Engineer - Backend",
      url: "#", // Mock data - no real URL available
      snippet: `We're looking for a Senior Software Engineer${locationSuffix} with 5+ years of experience in Go, TypeScript, and distributed systems. Experience with Kubernetes, AWS, and microservices architecture required.`,
    },
    {
      title: "Full Stack Developer (TypeScript/React)",
      url: "#", // Mock data - no real URL available
      snippet: `Join our team as a Full Stack Developer${locationSuffix}. You'll work with TypeScript, React, Node.js, and modern cloud technologies. Experience with Docker and CI/CD pipelines preferred.`,
    },
    {
      title: "DevOps Engineer - Cloud Infrastructure",
      url: "#", // Mock data - no real URL available
      snippet: `Seeking a DevOps Engineer${locationSuffix} to manage our cloud infrastructure. Must have experience with AWS, Kubernetes, Docker, and CI/CD. Knowledge of monitoring and automation tools essential.`,
    },
    {
      title: "Backend Engineer - Go/TypeScript",
      url: "#", // Mock data - no real URL available
      snippet: `Backend Engineer position${locationSuffix} requiring strong skills in Go and TypeScript. Experience with PostgreSQL, REST APIs, and microservices. Familiarity with Docker and Kubernetes is a plus.`,
    },
    {
      title: "Software Engineer - Distributed Systems",
      url: "#", // Mock data - no real URL available
      snippet: `We need a Software Engineer${locationSuffix} with expertise in distributed systems, Go, and cloud technologies. Experience with message queues, databases, and container orchestration required.`,
    },
    {
      title: "Senior Backend Engineer - Microservices",
      url: "#", // Mock data - no real URL available
      snippet: `Senior Backend Engineer role${locationSuffix} focusing on microservices architecture. Required: Go, TypeScript, Kubernetes, Docker, PostgreSQL. Experience with message brokers and event-driven systems preferred.`,
    },
    {
      title: "Full Stack Engineer - TypeScript/Node.js",
      url: "#", // Mock data - no real URL available
      snippet: `Full Stack Engineer position${locationSuffix}. Build scalable web applications with TypeScript, Node.js, React. Experience with cloud platforms (AWS/GCP), Docker, and CI/CD required.`,
    },
    {
      title: "Backend Developer - Go & Cloud",
      url: "#", // Mock data - no real URL available
      snippet: `Backend Developer${locationSuffix} specializing in Go and cloud infrastructure. Work with Kubernetes, Docker, PostgreSQL, and REST APIs. Strong understanding of distributed systems and microservices.`,
    },
  ];
  
  // Filter jobs based on query keywords if provided
  const lowerQuery = query.toLowerCase();
  let filteredJobs = baseJobs;
  
  // If query contains specific tech, try to match
  if (lowerQuery.includes("backend") || lowerQuery.includes("go")) {
    filteredJobs = baseJobs.filter(job => 
      job.title.toLowerCase().includes("backend") || 
      job.title.toLowerCase().includes("go")
    );
  } else if (lowerQuery.includes("full stack") || lowerQuery.includes("frontend")) {
    filteredJobs = baseJobs.filter(job => 
      job.title.toLowerCase().includes("full stack") || 
      job.title.toLowerCase().includes("frontend")
    );
  } else if (lowerQuery.includes("devops")) {
    filteredJobs = baseJobs.filter(job => 
      job.title.toLowerCase().includes("devops")
    );
  }
  
  // If filtering resulted in empty, use all jobs
  if (filteredJobs.length === 0) {
    filteredJobs = baseJobs;
  }
  
  return filteredJobs.slice(0, limit);
}
