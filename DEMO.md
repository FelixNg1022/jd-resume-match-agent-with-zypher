# 🎬 Demo Checklist

Use this checklist when recording your demo video for the CoreSpeed assessment.

## Pre-Demo Setup

- [ ] Ensure Deno is installed (`deno --version`)
- [ ] Set `OPENAI_API_KEY` environment variable
- [ ] Verify sample files exist in `sample/` directory
- [ ] Test CLI runs successfully: `deno task run:cli`
- [ ] Test server starts: `deno task run:server`
- [ ] Open browser to `http://localhost:8000` and verify GUI loads

## Demo Script

### 1. Introduction (30 seconds)
- [ ] Introduce the project: "JD ↔ Resume Match Agent"
- [ ] Mention it's built with CoreSpeed's Zypher framework
- [ ] Explain what it does: analyzes job descriptions and resumes

### 2. CLI Demo (1-2 minutes)
- [ ] Show terminal
- [ ] Run: `deno task run:cli`
- [ ] Explain what's happening:
  - "It's loading sample files"
  - "Initializing Zypher agent with OpenAI"
  - "Running AI analysis"
- [ ] Show the formatted output:
  - Fit score (color-coded)
  - Matched skills
  - Missing skills
  - Suggestions
- [ ] Mention fallback parser if API quota exceeded

### 3. GUI Demo (1-2 minutes)
- [ ] Start server: `deno task run:server`
- [ ] Open browser to `http://localhost:8000`
- [ ] Show the clean, modern UI
- [ ] Paste sample JD and resume (or use the sample data)
- [ ] Click "Analyze Match"
- [ ] Show loading state
- [ ] Show results:
  - Visual score display
  - Color-coded skill tags
  - Suggestions section
  - Raw JSON view (optional)

### 4. Code Walkthrough (1-2 minutes)
- [ ] Show `src/agent.ts`:
  - Zypher imports
  - `createZypherContext` usage
  - `ZypherAgent` initialization
  - `runTask()` with streaming events
  - Error handling
- [ ] Show `src/server.ts`:
  - Simple HTTP server
  - `/analyze` endpoint
- [ ] Show `index.html`:
  - Modern UI design
  - API integration

### 5. Key Highlights (30 seconds)
- [ ] ✅ Uses Zypher framework correctly
- [ ] ✅ Handles streaming events properly
- [ ] ✅ Graceful error handling
- [ ] ✅ Both CLI and GUI working
- [ ] ✅ Clean, maintainable code

## Total Time: ~5-7 minutes

## Tips

- **Speak clearly** and explain what you're doing
- **Show the code** - they want to see you understand Zypher
- **Highlight error handling** - shows production-ready thinking
- **Keep it concise** - focus on the key features
- **Test beforehand** - make sure everything works

## What to Emphasize

1. **Zypher Integration**: Show you understand the framework
2. **Streaming Events**: Mention how you handle `runTask()` events
3. **Error Handling**: Show fallback parser when API fails
4. **Dual Interface**: Both CLI and GUI working
5. **Code Quality**: Clean, well-structured TypeScript

Good luck! 🚀
