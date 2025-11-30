# 🎯 JD ↔ Resume Match Agent

A smart AI agent built with **CoreSpeed's Zypher framework** that analyzes job descriptions and resumes to provide:
- **Fit Score** (0-100) based on skill matching
- **Matched Skills** - technical skills found in both JD and resume
- **Missing Skills** - required technical skills not found in resume
- **Actionable Suggestions** - how to better position yourself as a candidate
- **Job Search & Ranking** - find and rank jobs by resume match

## 🚀 Features

- ✅ **AI-Powered Analysis** using Zypher agent framework with OpenAI/Groq
- ✅ **Job Search & Ranking** - search web for jobs and rank by resume match using Tavily API
- ✅ **Smart Filtering** - automatically filters out job boards, only shows direct company postings
- ✅ **Fallback Parser** - works even when API quota is exceeded
- ✅ **Web GUI** - clean, responsive web interface with unified flow
- ✅ **Modern UI** - clean, responsive web interface
- ✅ **TypeScript + Deno** - modern, type-safe development

## 📋 Prerequisites

1. **Install Deno** (if not already installed):
   ```bash
   curl -fsSL https://deno.land/install.sh | sh
   ```

2. **Set API Keys**:

   **Option A: Use Groq (FREE - recommended for development!)**
   ```bash
   export GROQ_API_KEY="gsk-your-groq-api-key-here"
   export GROQ_MODEL="llama-3.1-8b-instant"  # Optional: default is llama-3.1-8b-instant
   # Available models: llama-3.1-8b-instant (fastest), gemma2-9b-it
   # Check https://console.groq.com/docs/models for current available models
   ```
   Get API key: https://console.groq.com/keys (free tier available)

   **Option B: Use OpenAI (default)**
   ```bash
   export OPENAI_API_KEY="sk-your-api-key-here"
   export OPENAI_MODEL="gpt-4o-mini"  # Optional: default is gpt-4o-mini
   ```
   Get API key: https://platform.openai.com/api-keys

   **Optional: For job search (recommended for demo)**
   ```bash
   export TAVILY_API_KEY="your-tavily-key"  # AI-optimized search with full content extraction
   ```
   Get API key: https://tavily.com (without it, uses mock job data for demo)

   Or add to your shell profile (`~/.zshrc` or `~/.bashrc`):
   ```bash
   echo 'export GROQ_API_KEY="gsk-your-key"' >> ~/.zshrc
   source ~/.zshrc
   ```

   **Note:** 
   - You need either `OPENAI_API_KEY` OR `GROQ_API_KEY` (not both). Groq is free and faster!
   - `TAVILY_API_KEY` is optional - without it, the app uses mock job data for demo purposes.

## 🏃 Quick Start

### Web GUI

Start the web server:
```bash
deno task run:server
```

Then open your browser to:
```
http://localhost:8000
```

**Using the GUI:**
1. **Resume is always required** - paste your resume in the first textarea
2. **JD is optional:**
   - **If JD is provided:** Click "Analyze Match" to see fit score, matched/missing skills, and suggestions. After analysis, job search section appears below.
   - **If JD is empty:** Click "🔍 Search Jobs" to directly search for matching jobs.
3. **Job Search:** Enter role, location (optional), and keywords (optional), then click "🔍 Search & Rank Jobs" to see top 3 matching jobs ranked by fit score.

## 📁 Project Structure

```
jd-resume-match-agent-with-zypher/
├── src/
│   ├── agent.ts          # Core Zypher agent logic + job search
│   ├── server.ts         # Web server entry point
│   └── tools/
│       ├── local_parser.ts  # Fallback skill parser
│       └── job_search.ts    # Job search using Tavily API
├── sample/
│   ├── sample_jd.txt     # Sample job description
│   └── sample_resume.txt # Sample resume
├── index.html            # Web GUI interface
├── deno.json             # Deno configuration & import maps
└── README.md             # This file
```

## 🔧 How It Works

### AI Agent Flow

1. **Zypher Agent Initialization**
   - Creates Zypher context from current directory
   - Initializes model provider (OpenAI or Groq via OpenAI-compatible endpoint)
   - Sets up ZypherAgent with streaming support

2. **Analysis Process**
   - Sends JD and resume to AI agent with structured prompt
   - Agent extracts technical skills, computes match score, and generates suggestions
   - Streams response events and accumulates result text
   - Post-processes results to filter non-technical terms and validate skill matching

3. **Result Parsing**
   - Extracts JSON from agent response
   - Validates and parses structured output
   - Filters out non-technical terms (benefits, salary, etc.)
   - Auto-corrects skills incorrectly marked as missing
   - Falls back to local parser if AI fails or quota exceeded

4. **Job Search & Ranking**
   - Searches web for jobs using Tavily API
   - Filters out job board domains (LinkedIn, Indeed, etc.) - only shows direct company postings
   - Analyzes top 3 jobs against resume
   - Ranks by fit score

### Technologies Used

- **Zypher Framework** - CoreSpeed's agent framework (`@corespeed/zypher`)
- **OpenAI/Groq API** - LLM models for intelligent analysis
- **Tavily API** - AI-optimized web search with full content extraction (optional)
- **Deno** - Modern JavaScript/TypeScript runtime
- **TypeScript** - Type-safe development
- **RxJS** - Reactive streams for event handling (`rxjs-for-await`)

## 🐛 Troubleshooting

### "Set OPENAI_API_KEY or GROQ_API_KEY in environment"
- Make sure you've exported the API key: `export GROQ_API_KEY="gsk-..."` or `export OPENAI_API_KEY="sk-..."`
- Verify with: `echo $GROQ_API_KEY` or `echo $OPENAI_API_KEY`

### "API quota exceeded" or "Rate limit exceeded"
- The app will automatically use the fallback parser
- You'll still get results, just with keyword-based matching
- For Groq: Check your rate limits at https://console.groq.com
- For OpenAI: Add credits to your OpenAI account at https://platform.openai.com/account/billing

### Job search showing mock data
- Set `TAVILY_API_KEY` environment variable for real job search
- Without it, the app uses mock job data for demo purposes
- Get API key: https://tavily.com

### Port already in use
- Change port: `PORT=9001 deno task run:server`
- Or kill the process using port 8000: `kill -9 $(lsof -ti:8000)`

### Import errors
- Always use `deno task run:cli` or `deno task run:server`
- These commands include `--config deno.json` which loads import maps

## 📚 Additional Documentation

- **[LLM Provider Comparison](./LLM_PROVIDER_COMPARISON.md)** - Detailed comparison of Groq, OpenAI, and other providers
- **[Troubleshooting Guide](./TROUBLESHOOTING.md)** - Common issues and solutions

## 📝 Notes

- The agent uses **Groq** by default if `GROQ_API_KEY` is set, otherwise falls back to **OpenAI gpt-4o-mini**
- Results are filtered to only show technical skills (excludes benefits, salary, etc.)
- Job search filters out all job board domains - only shows direct company job postings
- Both interfaces return the same structured JSON format
- Scores may vary slightly (±3-5 points) due to LLM probabilistic nature - this is normal

## 🎯 Assessment Deliverables

✅ **GitHub Repository**: [Your repo URL]
✅ **Run Instructions**: See "Quick Start" section above
✅ **Demo Video**: [Link to your screen recording]

## 📚 References

- [Zypher Documentation](https://zypher.corespeed.io)
- [Deno Documentation](https://deno.land/docs)
- [OpenAI API Docs](https://platform.openai.com/docs)
- [Groq API Docs](https://console.groq.com/docs)
- [Tavily API Docs](https://docs.tavily.com)

---

Built with ❤️ using CoreSpeed's Zypher framework
