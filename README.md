# 🎯 JD ↔ Resume Match Agent

A smart AI agent built with **CoreSpeed's Zypher framework** that analyzes job descriptions and resumes to provide:
- **Fit Score** (0-100) based on skill matching
- **Matched Skills** - skills found in both JD and resume
- **Missing Skills** - required skills not found in resume
- **Actionable Suggestions** - how to improve resume match

## 🚀 Features

- ✅ **AI-Powered Analysis** using Zypher agent framework with OpenAI
- ✅ **Fallback Parser** - works even when API quota is exceeded
- ✅ **Dual Interface** - both CLI and web GUI
- ✅ **Modern UI** - clean, responsive web interface
- ✅ **TypeScript + Deno** - modern, type-safe development

## 📋 Prerequisites

1. **Install Deno** (if not already installed):
   ```bash
   curl -fsSL https://deno.land/install.sh | sh
   ```

2. **Set OpenAI API Key**:
   ```bash
   export OPENAI_API_KEY="sk-your-api-key-here"
   ```
   
   Or add to your shell profile (`~/.zshrc` or `~/.bashrc`):
   ```bash
   echo 'export OPENAI_API_KEY="sk-your-api-key-here"' >> ~/.zshrc
   source ~/.zshrc
   ```

## 🏃 Quick Start

### Option 1: CLI Interface

Run the command-line interface with sample data:

```bash
deno task run:cli
```

Or explicitly:

```bash
deno run --config deno.json -A src/main.ts
```

The CLI will:
1. Load sample JD and resume from `sample/` directory
2. Run AI analysis using Zypher agent
3. Display formatted results with color-coded scores

**To use your own data:**
Replace the files in `sample/` directory:
- `sample/sample_jd.txt` - your job description
- `sample/sample_resume.txt` - your resume (plain text)

### Option 2: Web GUI

Start the web server:

```bash
deno task run:server
```

Or explicitly:

```bash
deno run --config deno.json -A src/server.ts
```

Then open your browser to:
```
http://localhost:8000
```

**Using the GUI:**
1. Paste the job description in the first textarea
2. Paste your resume (plain text) in the second textarea
3. Click "Analyze Match"
4. View results with visual score, matched/missing skills, and suggestions

## 📁 Project Structure

```
jd-resume-match-agent-with-zypher/
├── src/
│   ├── agent.ts          # Core Zypher agent logic
│   ├── main.ts           # CLI entry point
│   ├── server.ts         # Web server entry point
│   └── tools/
│       └── local_parser.ts  # Fallback skill parser
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
   - Initializes OpenAI model provider
   - Sets up ZypherAgent with streaming support

2. **Analysis Process**
   - Sends JD and resume to AI agent with structured prompt
   - Agent extracts skills, computes match score, and generates suggestions
   - Streams response events and accumulates result text

3. **Result Parsing**
   - Extracts JSON from agent response
   - Validates and parses structured output
   - Falls back to local parser if AI fails or quota exceeded

4. **Fallback Parser**
   - Keyword-based skill extraction
   - Simple matching algorithm
   - Provides basic analysis when AI unavailable

### Technologies Used

- **Zypher Framework** - CoreSpeed's agent framework (`@corespeed/zypher`)
- **OpenAI API** - GPT-4o model for intelligent analysis
- **Deno** - Modern JavaScript/TypeScript runtime
- **TypeScript** - Type-safe development
- **RxJS** - Reactive streams for event handling (`rxjs-for-await`)

## 🎬 Demo Instructions

### For Video Recording

1. **Start with CLI Demo:**
   ```bash
   deno task run:cli
   ```
   - Show the terminal output
   - Highlight the formatted results
   - Explain the fit score and suggestions

2. **Switch to GUI Demo:**
   ```bash
   deno task run:server
   ```
   - Open browser to `http://localhost:8000`
   - Paste sample JD and resume
   - Click "Analyze Match"
   - Show the visual results with color-coded scores
   - Demonstrate the interactive UI

3. **Show Code Structure:**
   - Briefly show `src/agent.ts` - Zypher integration
   - Show `src/server.ts` - simple HTTP server
   - Show `index.html` - modern web UI

### Key Points to Highlight

- ✅ Uses Zypher framework correctly with `ZypherAgent` and `OpenAIModelProvider`
- ✅ Handles streaming events from `runTask()`
- ✅ Graceful error handling with fallback parser
- ✅ Both CLI and GUI interfaces working
- ✅ Clean, modern code structure

## 🐛 Troubleshooting

### "Set OPENAI_API_KEY in environment"
- Make sure you've exported the API key: `export OPENAI_API_KEY="sk-..."`
- Verify with: `echo $OPENAI_API_KEY`

### "OpenAI API quota exceeded"
- The app will automatically use the fallback parser
- You'll still get results, just with keyword-based matching
- To use AI, add credits to your OpenAI account

### Port already in use
- Change port: `PORT=9001 deno task run:server`
- Or kill the process using port 8000

### Import errors
- Always use `deno task run:cli` or `deno task run:server`
- These commands include `--config deno.json` which loads import maps
- Or explicitly: `deno run --config deno.json -A src/main.ts`

## 📝 Notes

- The agent uses **GPT-4o** by default (configurable via `OPENAI_MODEL` env var)
- Results are cached in memory during the session
- The fallback parser uses a predefined list of common tech skills
- Both interfaces return the same structured JSON format

## 🎯 Assessment Deliverables

✅ **GitHub Repository**: [Your repo URL]
✅ **Run Instructions**: See "Quick Start" section above
✅ **Demo Video**: [Link to your screen recording]

## 📚 References

- [Zypher Documentation](https://zypher.corespeed.io)
- [Deno Documentation](https://deno.land/docs)
- [OpenAI API Docs](https://platform.openai.com/docs)

---

Built with ❤️ using CoreSpeed's Zypher framework
