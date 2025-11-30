# CLI Branch Setup Guide

This guide explains how to move the CLI version to a separate `cli` branch on GitHub.

## Overview

- **Main branch** (master/main): Contains only the GUI/web interface
- **CLI branch**: Contains the CLI version with all features

## Step-by-Step Instructions

### 1. First, Commit Current Changes

```bash
# Make sure all current changes are committed
git add .
git commit -m "Update main branch: remove CLI references, keep GUI only"
```

### 2. Create and Switch to CLI Branch

```bash
# Create and switch to new cli branch from current state
git checkout -b cli

# Push the cli branch to GitHub
git push -u origin cli
```

### 3. Switch Back to Main/Master Branch

```bash
# Switch back to main branch (or master if that's your default)
git checkout master  # or 'main' if your default branch is named 'main'
```

### 4. Remove CLI Files from Main Branch

```bash
# Remove CLI entry point
git rm src/main.ts

# Commit the removal
git commit -m "Remove CLI from main branch - moved to cli branch"
```

### 4. Update deno.json (Already Done)

The `run:cli` task has already been removed from `deno.json` in the main branch.

### 5. Update README (Already Done)

The README has already been updated to remove CLI references from the main branch.

### 6. Commit and Push Main Branch

```bash
# Commit any remaining changes
git add .
git commit -m "Update documentation to remove CLI references"

# Push to GitHub
git push origin main
```

### 7. Verify CLI Branch Still Has CLI

```bash
# Switch to cli branch
git checkout cli

# Verify main.ts exists
ls src/main.ts

# Verify deno.json has run:cli task
grep "run:cli" deno.json

# Switch back to main
git checkout main
```

## Result

After completing these steps:

- **Main branch** (`master` or `main`):
  - ✅ Only GUI/web interface
  - ✅ No `src/main.ts`
  - ✅ No `run:cli` task in `deno.json`
  - ✅ README only mentions GUI

- **CLI branch** (`cli`):
  - ✅ Full CLI implementation
  - ✅ `src/main.ts` exists
  - ✅ `run:cli` task in `deno.json`
  - ✅ README includes CLI documentation

## Switching Between Branches

```bash
# Work on GUI (main branch)
git checkout master  # or 'main' if that's your default branch
deno task run:server

# Work on CLI (cli branch)
git checkout cli
deno task run:cli --resume sample/sample_resume.txt --jd sample/sample_jd.txt
```

## Notes

- Both branches share the same core files (`src/agent.ts`, `src/tools/`, etc.)
- Changes to shared files should be made in both branches or merged
- The CLI branch is a complete, working version with all features
- The main branch focuses on the web GUI experience
