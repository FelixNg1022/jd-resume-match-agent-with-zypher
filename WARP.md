# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

This is a job search AI agent built using the Zypher Agent Framework from CoreSpeed. <cite index="1-1,21-1">Zypher is an open-source agent framework for building production-ready agentic AI agents</cite> designed to work with Deno.

**Key Technologies:**
- **Runtime:** Deno (TypeScript/JavaScript runtime)
- **Framework:** @corespeed/zypher (~0.5.2) - AI agent framework with MCP support
- **Language:** TypeScript

## Development Commands

### Running the Agent
```bash
# Start the agent (typical Zypher pattern)
deno task start

# If no task is defined, run the main file directly
deno run --allow-all main.ts
```

### Development Tasks
```bash
# Install/update dependencies
deno install

# Type checking
deno check .

# Run tests
deno task test
# Or directly
deno test

# Linting
deno lint

# Format code
deno fmt

# Check for outdated dependencies
deno outdated
```

### Running Specific Files
```bash
# Run a TypeScript file with all permissions
deno run --allow-all <file>.ts

# Run with specific permissions (recommended)
deno run --allow-read --allow-write --allow-net --allow-env <file>.ts
```

## Architecture

### Zypher Agent Framework
<cite index="21-6">The framework features tool calling, Model Context Protocol (MCP) support, and a git-based checkpoint system for tracking and reverting changes</cite>.

**Core Capabilities:**
- **Tool Invocation:** Autonomous calling of external tools and APIs
- **MCP Support:** Model Context Protocol for agent communication
- **Checkpoint Management:** Git-based system for tracking agent state
- **Memory & State:** Built-in memory storage and retrieval

**Typical Project Structure (Zypher conventions):**
```
src/
├── tools/           # Custom tool implementations
│   ├── JobSearchTool.ts
│   └── ApplicationTool.ts
├── agents/          # Agent definitions and configurations
├── prompts/         # System and user prompts
└── main.ts          # Entry point
```

### Agent Development Patterns

**1. Tool Definition:**
Tools are the primary way agents interact with external systems. For a job search agent:
- Job board API integration tools
- Resume parsing and generation tools
- Application tracking tools
- Interview scheduling tools

**2. Prompt Engineering:**
System prompts define the agent's personality, capabilities, and constraints. Keep prompts:
- Clear and specific
- Task-oriented
- With explicit boundaries

**3. State Management:**
Use Zypher's checkpoint system to:
- Track conversation history
- Manage application state
- Enable rollback capabilities

### Deno-Specific Patterns

**Imports:**
- Use JSR imports: `jsr:@corespeed/zypher@^0.5.2`
- Standard library: `jsr:@std/*`
- NPM packages: `npm:<package>@<version>`

**Permissions:**
Deno requires explicit permissions. Common flags:
- `--allow-read` - File system reads
- `--allow-write` - File system writes
- `--allow-net` - Network access
- `--allow-env` - Environment variables
- `--allow-run` - Subprocess execution
- `--allow-all` - All permissions (use cautiously)

**Configuration:**
All configuration is in `deno.json`:
- Import maps
- Task definitions
- Compiler options
- Lint/format settings

## Environment Variables

Store sensitive data in environment variables, not in code:
```bash
# API keys for job boards
LINKEDIN_API_KEY=
INDEED_API_KEY=
GLASSDOOR_API_KEY=

# AI model credentials
ANTHROPIC_API_KEY=
OPENAI_API_KEY=

# Application settings
LOG_LEVEL=info
CHECKPOINT_DIR=.checkpoints
```

Load via Deno's built-in support or use a `.env` file with appropriate tooling.

## MCP (Model Context Protocol)

<cite index="21-6">The framework includes Model Context Protocol (MCP) support</cite> for agent-to-agent communication. This enables:
- Multi-agent workflows
- Tool sharing between agents
- Distributed agent systems

## Testing

Follow Deno testing conventions:
```typescript
// job_search_test.ts
import { assertEquals } from "jsr:@std/assert";

Deno.test("job search returns results", async () => {
  const results = await searchJobs("software engineer");
  assertEquals(results.length > 0, true);
});
```

Run with: `deno test`

## Common Workflows

### Creating a New Tool
1. Create tool file in `src/tools/`
2. Implement tool interface (params, execute, description)
3. Register tool with agent
4. Test tool independently before integration

### Debugging Agent Behavior
1. Check checkpoint history for state issues
2. Review conversation logs
3. Validate tool outputs
4. Test prompts in isolation

### Adding New Job Board Integration
1. Create new tool for the job board API
2. Handle authentication/API keys via environment variables
3. Implement search, filter, and application methods
4. Add error handling for rate limits and API failures

## Performance Considerations

- **Streaming:** Use Zypher's streaming capabilities for long-running operations
- **Caching:** Cache job board results to reduce API calls
- **Checkpoints:** Regular checkpointing prevents data loss but increases storage
- **Concurrency:** Deno supports concurrent operations; use for parallel job searches

## Security

- Never commit API keys or credentials
- Use Deno's permission system to limit agent capabilities
- Validate all external data before processing
- Implement rate limiting for API calls
- Use secure credential storage for user data

## Deployment

<cite index="23-3,23-4">Zypher enables developers to build powerful agents locally and deploy them to thousands of users in a stable, efficient manner</cite>. Consider using CoreSpeed's PaaS for production deployment.

## Additional Resources

- Zypher Framework: https://jsr.io/@corespeed/zypher
- Deno Manual: https://deno.land/manual
- CoreSpeed Platform: https://corespeed.io
