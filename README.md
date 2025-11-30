# 🎯 JobMatch AI

An AI-powered job matching agent built with **CoreSpeed's Zypher framework** that intelligently analyzes job descriptions and resumes to provide actionable insights and find matching opportunities.

## ✨ Key Features

### Core Capabilities

- **AI-Powered Skill Matching** - Leverages LLaMA (Meta's open-source LLM) via Groq inference API for intelligent analysis
- **Fit Score Calculation** - Quantified match score (0-100) based on technical skill alignment
- **Smart Job Discovery** - Web search powered by Tavily API to find relevant opportunities
- **Intelligent Filtering** - Automatically excludes job boards, surfaces direct company postings only

### User Experience

- **Unified Web Interface** - Single-page application with seamless analysis-to-search workflow
- **PDF Resume Upload** - Upload your resume as a PDF file for automatic text extraction
- **Dual Result Display** - View analysis results and job search results simultaneously
- **Smart Validation** - Visual feedback and clear error messages for better UX
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
   
   Uses LLaMA (Meta's open-source LLM) with Groq's high-performance inference API.

   ```bash
   export GROQ_API_KEY="gsk-your-groq-api-key-here"
   export GROQ_MODEL="llama-3.1-8b-instant"  # Optional - defaults to LLaMA 3.1 8B Instant
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

1. **Add your resume** (required) - You can either:
   - **Paste your resume text** directly into the textarea, or
   - **Upload a PDF file** using the "📄 Upload PDF" button (text will be automatically extracted)
2. **Option A - Analysis Mode:** Paste a job description and click "Analyze Match" to get:
   - Fit score with matched/missing skills breakdown
   - Personalized improvement suggestions
   - Results displayed in "📊 Analysis Results" section
   - Job search section appears automatically after analysis
3. **Option B - Search Mode:** Leave JD empty and click "🔍 Search Jobs" to:
   - Enter role, location, and keywords (all optional)
   - Get top 3 matching jobs ranked by fit score
   - View detailed match analysis for each position
   - Results displayed in "🔍 Job Search Results" section

**Note:** Both analysis and job search results can be displayed simultaneously, allowing you to compare and reference both sets of results at the same time.

## 🏗️ Architecture

### Project Structure

```text
jobmatch-ai/
├── src/
│   ├── agent.ts              # Core Zypher agent logic
│   ├── server.ts             # HTTP server & routing
│   └── tools/
│       ├── job_search.ts     # Tavily integration
│       ├── local_parser.ts   # Fallback skill parser
│       └── pdf_parser.ts     # PDF text extraction
├── sample/                   # Sample data files
├── index.html                # Web interface
├── deno.json                 # Configuration
└── README.md
```

### Technology Stack

**Core Framework**

- **Zypher** (`@corespeed/zypher`) - CoreSpeed's AI agent framework
- **LLaMA** (Meta's open-source LLM) - Large language model for intelligent analysis
- **Groq API** - High-performance inference provider for LLaMA (fast, free tier available)
- **Tavily API** - AI-optimized web search with content extraction

**Runtime & Language**

- **Deno** - Modern TypeScript runtime
- **TypeScript** - Type-safe development
- **RxJS** (`rxjs-for-await`) - Reactive event streams

**Additional Libraries**

- **pdf-parse** - PDF text extraction for resume uploads

### How It Works

1. **Resume Input**
   - Users can paste resume text or upload a PDF file
   - PDF files are automatically parsed to extract text content
   - Extracted text is populated into the resume textarea

2. **Agent Initialization**
   - Creates Zypher context and initializes model provider
   - Uses LLaMA (Meta's open-source LLM) via Groq inference API for fast, cost-effective analysis
   - Falls back to OpenAI if Groq API key is not configured
   - Configures streaming support for real-time responses

3. **Analysis Pipeline**
   - Structured prompt engineering for consistent JSON output
   - Streaming response processing with event accumulation
   - Post-processing: filters non-technical terms, validates skill matches, auto-corrects errors

4. **Job Discovery**
   - Tavily API searches web for relevant positions
   - Intelligent filtering by job board name (catches all domain variations: .com, .ca, .co.uk, etc.)
   - Automatically filters out 35+ job boards including LinkedIn, Indeed, Glassdoor, Eluta, Levels.fyi, and more
   - AI analysis ranks top 3 matches by resume fit
   - Returns structured results with match breakdowns

5. **Resilience**
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
| **Empty resume warning** | Resume field will highlight in red if empty; paste text or upload PDF |
| **PDF upload fails** | Ensure file is a valid PDF; check browser console for detailed errors |

## 📋 Important Notes

- **Default Behavior:** LLaMA (Meta's open-source LLM) via Groq inference API is used if `GROQ_API_KEY` is set; otherwise falls back to OpenAI
- **Skill Filtering:** Only technical skills are analyzed (benefits, salary, etc. are excluded)
- **Job Board Filtering:** Filters by job board name (e.g., "glassdoor") to catch all domain variations (.com, .ca, .co.uk, etc.)
- **Score Variance:** LLM probabilistic nature may cause ±3-5 point variations (expected behavior)
- **PDF Parsing:** PDF uploads extract all text content. Some formatting (tables, columns) may be simplified, but all text is preserved for analysis
- **Multiple Operations:** You can run multiple analyses or job searches - each new operation updates its respective results section
- **Simultaneous Results:** Analysis and job search results are displayed in separate sections and can be viewed simultaneously

## 🎯 Assessment Deliverables

✅ **Repository:** <https://github.com/FelixNg1022/JobMatch-AI.git>  
✅ **Run Instructions:** See Quick Start section above  
✅ **Demo Video:** [Link to your screen recording]

## 📚 Documentation

- [Zypher Framework](https://zypher.corespeed.io)
- [Deno Documentation](https://deno.land/docs)
- [LLaMA (Meta AI)](https://ai.meta.com/llama/)
- [Groq API Reference](https://console.groq.com/docs)
- [Tavily API Docs](https://docs.tavily.com)

---

Built with ❤️ using CoreSpeed's Zypher framework
