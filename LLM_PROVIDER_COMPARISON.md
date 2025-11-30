# 💰 LLM Provider Comparison for JD-Resume Match Agent

## 🎯 Best Options (Ranked by Cost)

### 🥇 **1. Groq (FREE - Best Choice!)**
- **Cost:** **FREE** (no credit card required)
- **Compatibility:** ✅ OpenAI-compatible API
- **Speed:** ⚡ Very fast (inference optimized)
- **Limits:** 
  - 30 requests/minute (free tier)
  - 14,400 requests/day
- **Models Available:**
  - `llama-3.1-8b-instant` (fastest, default) ✅
  - `gemma2-9b-it` ✅
  - ⚠️ Check https://console.groq.com/docs/models for current list
  - ⚠️ Decommissioned: `llama-3.1-70b-versatile`, `mixtral-8x7b-32768`
- **Setup:** 
  ```bash
  export GROQ_API_KEY="gsk-your-key"
  export GROQ_MODEL="llama-3.1-8b-instant"  # Default - fastest and free
  ```
- **Get API Key:** https://console.groq.com/keys
- **Status:** ✅ **FULLY WORKING** via OpenAI-compatible endpoint!

---

### 🥈 **2. OpenAI gpt-4o-mini (Very Cheap)**
- **Cost:** 
  - Input: **$0.15 per million tokens**
  - Output: **$0.60 per million tokens**
- **Compatibility:** ✅ Native OpenAI support
- **Speed:** Fast
- **Quality:** Good for structured tasks
- **Setup:**
  ```bash
  export OPENAI_API_KEY="sk-your-key"
  export OPENAI_MODEL="gpt-4o-mini"
  ```
- **Estimated Cost for This Project:**
  - ~500 tokens per analysis (JD + Resume + Response)
  - **$0.000075 per analysis** (less than 1 cent per 1000 analyses!)
- **Status:** ✅ Fully working

---

### 🥉 **3. OpenAI gpt-4o (Best Quality)**
- **Cost:** 
  - Input: **$2.50 per million tokens**
  - Output: **$10.00 per million tokens**
- **Compatibility:** ✅ Native OpenAI support
- **Speed:** Medium
- **Quality:** Best quality and reasoning
- **Setup:**
  ```bash
  export OPENAI_API_KEY="sk-your-key"
  export OPENAI_MODEL="gpt-4o"
  ```
- **Estimated Cost:** ~$0.00125 per analysis
- **Status:** ✅ Fully working

---

## 📊 Cost Comparison Table

| Provider | Input (per 1M tokens) | Output (per 1M tokens) | Free Tier | Best For |
|----------|----------------------|----------------------|-----------|----------|
| **Groq** | **FREE** | **FREE** | ✅ Yes | **Best choice - FREE!** |
| **gpt-4o-mini** | $0.15 | $0.60 | ❌ No | Very cheap, reliable |
| **gpt-4o** | $2.50 | $10.00 | ❌ No | Best quality (expensive) |

---

## 💡 Recommendation

### **For Development/Demo (FREE):**
**Use Groq** - It's completely free, fast, and OpenAI-compatible. Perfect for development and demos.

### **For Production (Very Low Cost):**
**Use OpenAI gpt-4o-mini** - At $0.15/$0.60 per million tokens, it's extremely cheap:
- **1,000 analyses = $0.075** (less than 8 cents!)
- **10,000 analyses = $0.75** (less than a dollar!)
- **100,000 analyses = $7.50**

### **For Best Quality (Still Affordable):**
**Use OpenAI gpt-4o** - More expensive but provides the best quality and consistency.

---

## 🔧 Current Implementation Status

1. ✅ **Groq** - Fully working via OpenAI-compatible endpoint
2. ✅ **OpenAI** - Fully working (gpt-4o-mini default, gpt-4o available)

---

## 🚀 Quick Setup Guide

### Option 1: Groq (FREE - Recommended)
```bash
export GROQ_API_KEY="gsk-your-key-here"
export GROQ_MODEL="llama-3.1-8b-instant"  # Optional: default
deno task run:server
```
**Status:** ✅ Fully working

### Option 2: OpenAI gpt-4o-mini (Very Cheap)
```bash
export OPENAI_API_KEY="sk-your-key-here"
export OPENAI_MODEL="gpt-4o-mini"  # Optional: default
deno task run:server
```
**Status:** ✅ Fully working

### Option 3: OpenAI gpt-4o (Best Quality)
```bash
export OPENAI_API_KEY="sk-your-key-here"
export OPENAI_MODEL="gpt-4o"
deno task run:server
```
**Status:** ✅ Fully working

---

## 📝 Notes

- **Groq** is the best free option and works perfectly via OpenAI-compatible endpoint
- **gpt-4o-mini** is extremely cheap and works perfectly
- For this project's use case (JD-Resume matching), both Groq and gpt-4o-mini provide excellent results
- The cost difference between providers is negligible for typical usage (< $1 for thousands of analyses)
- Groq uses Zypher's built-in `OpenAIModelProvider` with `OPENAI_BASE_URL` set to Groq's endpoint - no custom provider needed
