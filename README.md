# 🎯 JD ↔ Resume Match Agent

An AI-powered job matching agent built with **CoreSpeed's Zypher framework** that intelligently analyzes job descriptions and resumes to provide actionable insights and find matching opportunities.

## ✨ Key Features

### Core Capabilities

- **AI-Powered Skill Matching** - Leverages Groq/OpenAI via Zypher framework for intelligent analysis
- **Fit Score Calculation** - Quantified match score (0-100) based on technical skill alignment
- **Smart Job Discovery** - Web search powered by Tavily API to find relevant opportunities
- **Intelligent Filtering** - Automatically excludes job boards, surfaces direct company postings only

### User Experience

- **Unified Web Interface** - Single-page application with seamless analysis-to-search workflow
- **Real-time Analysis** - Streaming responses with live progress indicators
- **Robust Fallback System** - Local parser ensures functionality even when API quotas are exceeded

### Technical Excellence

- **Type-Safe Development** - Built with TypeScript on Deno runtime
- **Production-Ready** - Error handling, validation, and graceful degradation built-in

## 🚀 Quick Start

### Prerequisites

1. **Install Deno**:

   ```bash
   curl -fsSL https://deno.land/install.sh | sh
   ```

2. **Configure API Keys**:

   **Groq (Recommended - Free & Fast)**

   ```bash
   export GROQ_API_KEY="gsk-your-groq-api-key-here"
   export GROQ_MODEL="llama-3.1-8b-instant"  # Optional
   ```

   Get your key: <https://console.groq.com/keys>

   **Tavily (For Job Search)**

   ```bash
   export TAVILY_API_KEY="your-tavily-key"
   ```

   Get your key: <https://tavily.com>

   **OpenAI (Alternative)**

   ```bash
   export OPENAI_API_KEY="sk-your-api-key-here"
   export OPENAI_MODEL="gpt-4o-mini"  # Optional
   ```

   > **Note:** Groq is recommended for development (free tier available). Tavily is optional—without it, the app uses mock data for demonstration.

### Running the Application

```bash
deno task run:server
```

Open <http://localhost:8000> in your browser.

### Usage Flow

1. **Paste your resume** (required) in the first textarea
2. **Option A - Analysis Mode:** Paste a job description and click "Analyze Match" to get:
   - Fit score with matched/missing skills breakdown
   - Personalized improvement suggestions
   - Job search section appears automatically after analysis
3. **Option B - Search Mode:** Leave JD empty and click "🔍 Search Jobs" to:
   - Enter role, location, and keywords
   - Get top 3 matching jobs ranked by fit score
   - View detailed match analysis for each position

## 🏗️ Architecture

### Project Structure

```text
jd-resume-match-agent-with-zypher/
├── src/
│   ├── agent.ts              # Core Zypher agent logic
│   ├── server.ts             # HTTP server & routing
│   └── tools/
│       ├── job_search.ts     # Tavily integration
│       └── local_parser.ts     # Fallback skill parser
├── sample/                   # Sample data files
├── index.html                # Web interface
├── deno.json                 # Configuration
└── README.md
```

### Technology Stack

**Core Framework**

- **Zypher** (`@corespeed/zypher`) - CoreSpeed's AI agent framework
- **Groq API** - Primary LLM provider (fast, free tier)
- **Tavily API** - AI-optimized web search with content extraction

**Runtime & Language**

- **Deno** - Modern TypeScript runtime
- **TypeScript** - Type-safe development
- **RxJS** (`rxjs-for-await`) - Reactive event streams

### How It Works

1. **Agent Initialization**
   - Creates Zypher context and initializes model provider (Groq preferred, OpenAI fallback)
   - Configures streaming support for real-time responses

2. **Analysis Pipeline**
   - Structured prompt engineering for consistent JSON output
   - Streaming response processing with event accumulation
   - Post-processing: filters non-technical terms, validates skill matches, auto-corrects errors

3. **Job Discovery**
   - Tavily API searches web for relevant positions
   - Domain filtering removes job board noise (LinkedIn, Indeed, etc.)
   - AI analysis ranks top 3 matches by resume fit
   - Returns structured results with match breakdowns

4. **Resilience**
   - Automatic fallback to local keyword-based parser on API failures
   - Graceful degradation maintains core functionality

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| **API key not found** | Verify environment variable: `echo $GROQ_API_KEY` |
| **API quota exceeded** | App automatically uses fallback parser; check limits at <https://console.groq.com> |
| **Mock job data shown** | Set `TAVILY_API_KEY` for real job search results |
| **Port 8000 in use** | Use `PORT=9001 deno task run:server` or kill existing process |
| **Import errors** | Always use `deno task run:server` (includes proper config) |

## 📋 Important Notes

- **Default Behavior:** Groq is used if `GROQ_API_KEY` is set; otherwise falls back to OpenAI
- **Skill Filtering:** Only technical skills are analyzed (benefits, salary, etc. are excluded)
- **Job Board Filtering:** All job aggregator sites are filtered out automatically
- **Score Variance:** LLM probabilistic nature may cause ±3-5 point variations (expected behavior)

## 🎯 Assessment Deliverables

✅ **Repository:** <https://github.com/FelixNg1022/jd-resume-match-agent-with-zypher.git>  
✅ **Run Instructions:** See Quick Start section above  
✅ **Demo Video:** [Link to your screen recording]

## 📚 Documentation

- [Zypher Framework](https://zypher.corespeed.io)
- [Deno Documentation](https://deno.land/docs)
- [Groq API Reference](https://console.groq.com/docs)
- [Tavily API Docs](https://docs.tavily.com)

---

Built with ❤️ using CoreSpeed's Zypher framework
