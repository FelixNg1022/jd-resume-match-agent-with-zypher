# 🔧 Troubleshooting Guide

## Issue: API Key Not Found

### Problem
You get an error: "Set OPENAI_API_KEY or GROQ_API_KEY in environment"

### Solution

**1. Reload Your Shell Profile**

After adding keys to `~/.zshrc` or `~/.bashrc`, you need to reload:

```bash
# For zsh (macOS default)
source ~/.zshrc

# For bash
source ~/.bashrc

# Or open a new terminal window
```

**2. Verify Key Is Loaded**

```bash
# Check if key is set
echo $GROQ_API_KEY
echo $OPENAI_API_KEY

# Should show your API key (not empty)
```

**3. Set Key in Current Session**

```bash
# Set it directly in current terminal
export GROQ_API_KEY="gsk-your-key-here"
# OR
export OPENAI_API_KEY="sk-your-key-here"

# Then run your command
deno task run:cli --resume sample/sample_resume.txt --jd sample/sample_jd.txt
```

## Issue: Job Search Using Mock Data

### Problem
Job search shows mock data with "#" URLs instead of real job postings.

### Solution

**1. Set TAVILY_API_KEY**

```bash
export TAVILY_API_KEY="your-tavily-key-here"
```

**2. Verify Key Is Loaded**

```bash
echo $TAVILY_API_KEY
```

**3. Get API Key**

Sign up at https://tavily.com to get your API key.

**4. Check Server Logs**

The server will log:
- `✅ Tavily search successful! Found X real job postings.` - if working
- `ℹ️  No TAVILY_API_KEY configured. Using mock job data for demo.` - if not set

## Issue: OpenAI/Groq API Errors

### Common Errors

**"You exceeded your current quota"**
- Your OpenAI account has no credits
- Add billing information at https://platform.openai.com/account/billing
- Or switch to Groq (free): `export GROQ_API_KEY="gsk-..."`

**"Rate limit exceeded"**
- Too many requests too quickly
- Wait a few seconds and try again
- Groq free tier: 30 requests/minute

**"Invalid API key"**
- Check your API key is correct
- OpenAI keys start with `sk-`
- Groq keys start with `gsk-`

**"Model decommissioned"**
- The model you're using is no longer available
- For Groq: Check https://console.groq.com/docs/models for current models
- Update `GROQ_MODEL` or `OPENAI_MODEL` environment variable

### Solution

```bash
# Verify API key
echo $GROQ_API_KEY  # Should start with "gsk-"
echo $OPENAI_API_KEY  # Should start with "sk-"

# If not set, get a new key:
# Groq: https://console.groq.com/keys
# OpenAI: https://platform.openai.com/api-keys
```

## Issue: Server Won't Start

### Problem
`deno task run:server` fails with port already in use.

### Solution

```bash
# Find process using port 8000
lsof -ti:8000

# Kill it
kill -9 $(lsof -ti:8000)

# Or use a different port
PORT=8080 deno task run:server
```

## Issue: CLI Not Finding Files

### Problem
CLI can't find resume or JD files.

### Solution

**1. Use Absolute Paths**

```bash
deno task run:cli --resume /full/path/to/resume.txt --jd /full/path/to/jd.txt
```

**2. Use Relative Paths from Project Root**

```bash
deno task run:cli --resume sample/sample_resume.txt --jd sample/sample_jd.txt
```

**3. Check File Exists**

```bash
ls -la sample/sample_resume.txt
ls -la sample/sample_jd.txt
```

## Issue: Scores Vary Between Runs

### Problem
Same inputs produce different scores (±3-5 points).

### Solution

**This is normal!** LLMs are probabilistic by nature. Some variance is expected:
- ✅ **Score variance**: ±3-5 points is normal
- ✅ **Similar skill lists**: Core skills should be consistent
- ✅ **Different suggestions**: Suggestions will vary (this is good for diverse advice)

**To reduce variance:**
1. Use `gpt-4o` instead of `gpt-4o-mini` (more consistent)
2. Use Groq's `llama-3.1-8b-instant` (fast and free, some variance)
3. The agent already uses `temperature: 0` to minimize randomness

## Issue: Non-Technical Skills in Results

### Problem
Missing skills include things like "competitive salaries", "benefits", etc.

### Solution

**This should be fixed!** The agent now:
- Filters out non-technical terms automatically
- Only shows technical skills/tools
- Auto-corrects skills incorrectly marked as missing

If you still see this, check server logs for filtering messages.

## Getting Help

If you're still having issues:

1. Check that all required keys are set: `echo $GROQ_API_KEY $OPENAI_API_KEY $TAVILY_API_KEY`
2. Verify keys are valid by checking provider dashboards
3. Check Deno version: `deno --version` (should be 1.40+)
4. Review error messages in terminal output
5. Check server logs for detailed error information
