<div align="center">
  <img src="logo-horizontal.svg" alt="JobMatch AI Logo" width="400">
</div>

# 🎯 JobMatch AI

An AI-powered job matching agent built with **CoreSpeed's Zypher framework** that intelligently analyzes job descriptions and resumes to provide actionable insights and find matching opportunities.

## ✨ Key Features

### Core Capabilities

- **AI-Powered Skill Matching** - Leverages LLaMA (Meta's open-source LLM) via Groq inference API for intelligent analysis
- **Fit Score Calculation** - Quantified match score (0-100) based on technical skill alignment
- **Smart Job Discovery** - Web search powered by Tavily API to find relevant opportunities
- **Intelligent Filtering** - Automatically excludes 36+ job boards, surfaces direct company postings only
- **Resume Strength Analysis** - Comprehensive resume quality assessment with ATS compatibility scoring
- **AI Cover Letter Generator** - Personalized cover letters tailored to specific job descriptions (body text only, no greeting/closing)

### User Experience

- **Futuristic Dark Mode Design** - Modern AI-themed interface with prominent animated gradients, glowing effects, and futuristic aesthetics
- **Animated Visual Effects** - Dynamic gradient animations, shimmer effects on logo and text, glowing borders, and scanline overlays for a cutting-edge look
- **Glassmorphism & Depth** - Multi-layer shadows, backdrop blur effects, and gradient borders create a sophisticated 3D appearance
- **One-Page Progressive Disclosure** - Seamless single-page experience with smooth transitions between states
- **Desktop-Optimized Layout** - Full-width design optimized for desktop screens with drag-to-resize panels
- **AI Assistant-Like Interface** - Conversational buttons and friendly, passionate tone throughout
- **Multi-Format Resume Upload** - Upload your resume as PDF, Word (DOCX/DOC), or TXT file for automatic text extraction
- **Auto-Running Features** - Resume strength analysis and job search run automatically after starting
- **Side-by-Side Results** - View analysis results and job search results simultaneously with resizable panels
- **Smart Validation** - Visual feedback and clear error messages for better UX
- **Real-time Analysis** - Streaming responses with live progress indicators
- **Copy to Clipboard** - One-click copy for generated cover letters
- **Robust Fallback System** - Local parser ensures functionality even when API quotas are exceeded

### Technical Excellence

- **Type-Safe Development** - Built with TypeScript on Deno runtime
- **Production-Ready** - Error handling, validation, and graceful degradation built-in
- **Comprehensive Logging** - Detailed diagnostic logging for troubleshooting API issues

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
   export OPENAI_MODEL="gpt-4o-mini"  # Optional - defaults to gpt-4o-mini
   ```

   Get your key: <https://platform.openai.com/api-keys>

   > **Note:** Groq is recommended for development (free tier available). OpenAI is used as a fallback if Groq API key is not configured. Tavily is optional—without it, the app uses mock data for demonstration.

### Running the Application

```bash
deno task run:server
```

Open <http://localhost:8000> in your browser.

> **Note:** The interface features a futuristic dark mode design with prominent animated gradients, glowing effects, and modern AI aesthetics. The design includes dynamic gradient animations (8-10s cycles), shimmer effects on the logo and "JobMatch AI" text (2s cycles), glowing borders, scanline overlays, and sophisticated glassmorphism effects for a cutting-edge user experience. The layout is optimized for desktop screens with drag-to-resize panels for side-by-side content.

### Usage Flow

1. **Add your resume** (required for all features) - You can either:
   - **Paste your resume text** directly into the textarea, or
   - **Upload a file** using the "📄 Upload Your Resume - I'll Take It From Here!" button:
     - **PDF files** (`.pdf`) - Full support
     - **Word documents** (`.docx`, `.doc`) - DOCX fully supported, DOC with limited support
     - **Text files** (`.txt`) - Full support
   - Text will be automatically extracted and populated into the textarea
   - Button shows "✅ Upload Successful! Your Resume is Ready" after successful upload

2. **Start JobMatch AI:**
   - Click "🚀 Let's Get Started! I'm Ready to Help You Find Your Dream Job"
   - The resume input disappears with a smooth fade-out transition
   - **Resume Strength Analysis** appears on the left (runs automatically)
   - **Job Search** appears on the right (runs automatically without keywords)
   - Both features run simultaneously and display results side-by-side

3. **Refine Job Search** (optional):
   - Scroll down to see the "🎯 Refine Your Job Search" section
   - Enter optional keywords: Job Type/Role, Location, Additional Keywords
   - Click "🔍 Perfect! Let me find amazing opportunities that match exactly what you're looking for"
   - New job results appear in the scrollable wrapper above the refine section
   - Input fields clear automatically after search

4. **Analyze Match & Generate Cover Letter:**
   - Click "💼 Excited about a specific role? Share the job description with me and I'll dive deep into analyzing your perfect match, then craft a compelling cover letter that showcases your strengths!"
   - This button appears immediately but is disabled until the initial job search completes
   - Once enabled, click it to reveal a full-page job description input
   - Paste the job description and click "✨ Let's Do This! Analyze My Match & Create My Perfect Cover Letter"
   - **Analyze Match** results appear on the left
   - **Cover Letter** appears on the right with a copy-to-clipboard button
   - Both results are displayed side-by-side with resizable panels

5. **Navigation:**
   - Use "🔄 Found Another Great Opportunity? I'm Ready to Analyze It for You!" to analyze a different job
   - Use "🔁 Want to review your resume strengths or search more jobs? Let's jump back." to return to the main results view

**Note:** The interface uses progressive disclosure - features appear and disappear smoothly as you progress through the workflow. All content fits within one page with internal scrolling for job results and long content areas.

## 🏗️ Architecture

### Project Structure

```text
jobmatch-ai/
├── src/
│   ├── agent.ts              # Core Zypher agent logic (analysis, job search, resume strength, cover letter)
│   ├── server.ts             # HTTP server & routing
│   └── tools/
│       ├── file_parser.ts    # Multi-format file text extraction (PDF, Word, TXT)
│       ├── job_search.ts     # Tavily integration
│       └── local_parser.ts   # Fallback skill parser
├── sample/                   # Sample data files
├── index.html                # Modern responsive web interface
├── deno.json                 # Configuration
└── README.md
```

### Technology Stack

**Core Framework**

- **Zypher** (`@corespeed/zypher`) - CoreSpeed's AI agent framework
- **LLaMA** (Meta's open-source LLM) - Large language model for intelligent analysis (via Groq)
- **Groq API** - High-performance inference provider for LLaMA (fast, free tier available, recommended)
- **OpenAI API** - Alternative LLM provider (fallback if Groq is not configured)
- **Tavily API** - AI-optimized web search with content extraction

**Runtime & Language**

- **Deno** - Modern TypeScript runtime
- **TypeScript** - Type-safe development
- **RxJS** (`rxjs-for-await`) - Reactive event streams

**Additional Libraries**

- **pdf-parse** - PDF text extraction for resume uploads
- **mammoth** - Word document (DOCX) text extraction

### How It Works

1. **Resume Input**
   - Users can paste resume text or upload a file (PDF, Word, or TXT)
   - Files are automatically parsed to extract text content:
     - **PDF**: Uses `pdf-parse` library
     - **Word (DOCX)**: Uses `mammoth` library
     - **Word (DOC)**: Limited support, may require conversion to DOCX
     - **TXT**: Direct text extraction
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
   - Comprehensive error handling with detailed logging

4. **Job Discovery**
   - Tavily API searches web for relevant positions
   - Intelligent filtering by job board name (catches all domain variations: .com, .ca, .co.uk, etc.)
   - Automatically filters out 36+ job boards including LinkedIn, Indeed, Glassdoor, Eluta, Levels.fyi, Workopolis, and more
   - AI analysis ranks top 3 matches by resume fit
   - Returns structured results with match breakdowns

5. **Resume Strength Analysis**
   - Comprehensive resume quality assessment
   - ATS compatibility scoring
   - Identifies strengths, weaknesses, and improvement areas
   - Provides actionable suggestions for enhancement
   - Falls back to local parser if AI analysis fails

6. **Cover Letter Generation**
   - AI-generated personalized cover letters
   - Automatically extracts company name from job description
   - Tailored to match resume and job requirements
   - Outputs clean body text only (greeting and closing removed for simplicity)
   - Advanced cleanup to remove any prompt text or instructions
   - One-click copy to clipboard functionality

7. **Resilience**
   - Automatic fallback to local keyword-based parser on API failures
   - Graceful degradation maintains core functionality
   - Detailed diagnostic logging for troubleshooting

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| **API key not found** | Verify environment variable: `echo $GROQ_API_KEY` |
| **API quota exceeded** | App automatically uses fallback parser; check limits at <https://console.groq.com> |
| **Mock job data shown** | Set `TAVILY_API_KEY` for real job search results |
| **Port 8000 in use** | Use `PORT=9001 deno task run:server` or kill existing process |
| **Import errors** | Always use `deno task run:server` (includes proper config) |
| **Empty resume warning** | Resume field will highlight in red if empty; paste text or upload file |
| **File upload fails** | Ensure file is PDF, DOCX, DOC, or TXT; check browser console for detailed errors |
| **Cover letter includes prompt text** | This is a known issue with some LLM responses; cleanup logic should remove it automatically |
| **Resume analysis shows fallback message** | Check server console logs for specific error (quota, rate limit, auth, etc.) |

## 📋 Important Notes

- **Default Behavior:** LLaMA (Meta's open-source LLM) via Groq inference API is used if `GROQ_API_KEY` is set; otherwise falls back to OpenAI
- **Skill Filtering:** Only technical skills are analyzed (benefits, salary, etc. are excluded)
- **Job Board Filtering:** Filters by job board name (e.g., "glassdoor") to catch all domain variations (.com, .ca, .co.uk, etc.)
- **Score Variance:** LLM probabilistic nature may cause ±3-5 point variations (expected behavior)
- **File Parsing:** 
  - PDF uploads extract all text content. Some formatting (tables, columns) may be simplified, but all text is preserved for analysis
  - Word DOCX files are fully supported
  - Word DOC files (older format) have limited support - conversion to DOCX or PDF is recommended
  - TXT files are directly extracted
- **Multiple Operations:** You can run multiple analyses or job searches - each new operation updates its respective results section
- **Simultaneous Results:** Analysis and job search results are displayed in separate sections and can be viewed simultaneously
- **Cover Letter Format:** Generated cover letters include only the body text (no greeting or closing) for maximum flexibility
- **Diagnostic Logging:** Server console includes detailed logging for API calls, errors, and response processing to aid in troubleshooting

## 🎯 Assessment Deliverables

✅ **Repository:** <https://github.com/FelixNg1022/JobMatch-AI.git>  
✅ **Run Instructions:** See Quick Start section above  
✅ **Demo Video:** [Link to your screen recording]

## 📚 Documentation

- [Zypher Framework](https://zypher.corespeed.io)
- [Deno Documentation](https://deno.land/docs)
- [LLaMA (Meta AI)](https://ai.meta.com/llama/)
- [Groq API Reference](https://console.groq.com/docs)
- [OpenAI API Documentation](https://platform.openai.com/docs)
- [OpenAI API Reference](https://platform.openai.com/docs/api-reference)
- [Tavily API Docs](https://docs.tavily.com)

---

Built with ❤️ using CoreSpeed's Zypher framework
