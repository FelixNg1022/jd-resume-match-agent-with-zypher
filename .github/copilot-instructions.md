# Copilot Instructions — Job Search AI Agent (Zypher)

Purpose: Help AI coding agents be effective and productive when working on this repository.

High-level summary
- Runtime: Deno (TypeScript)
- Framework: CoreSpeed Zypher (imported as `jsr:@corespeed/zypher`)
- Entrypoints: `main.ts` (CLI), `server.ts` (minimal GUI server), `index.html` (client)
- Project layout is intentionally minimal; expand using `src/agents`, `src/tools`, and `prompts/` if adding features.

Quick tasks (for humans and agents)
- Run CLI: `deno run -A main.ts` or `deno run --allow-net --allow-env --allow-read main.ts`
- Run GUI: `deno run -A server.ts` and open `http://localhost:8000`
- Lint/format/test: `deno lint`, `deno fmt`, `deno test`, `deno check .`
- Use `deno.json` to manage import maps and tasks (we use `@corespeed/zypher` via JSR import).

Patterns and examples (do not change without tests)
- Agent creation pattern
```ts
import { Agent, ChatMessage } from "jsr:@corespeed/zypher";
const agent = new Agent({ name: "JobSearchAgent", systemPrompt: "Your prompt..." });
const response = await agent.run([new ChatMessage("user", userText)]);
console.log(response.outputText);
```
- Server pattern: `server.ts` uses `Deno.serve` and expects POST `{ message }` to return `{ reply }`.
- UI pattern: `index.html` posts JSON to `/` and appends `reply` to the DOM.

Conventions to follow
- Use the Agent + ChatMessage API consistently for all features; keep system prompts concise and test prompt changes manually.
- Store API keys or credentials as environment variables; never commit secrets to the repo.
- Add tests for new tools or behaviors under `tests/` (use `deno test` to run).
- Add new agent tools under `src/tools/` (create `src/tools/` if missing) and register them in your agent configuration.

Permission & Security notes
- Deno requires explicit permissions. For local development use `--allow-net --allow-read --allow-env` and avoid `--allow-all` unless necessary.
- Validate inputs (e.g., job posting text) at the server boundary and sanitize outputs where appropriate.

Integration & data flow cues
- `main.ts` demonstrates prompt-based CLI conversation. `server.ts` uses the same Agent API but routes POST requests through `Deno.serve`.
- If adding integrations (LinkedIn, Glassdoor, etc.), implement them as tools and call them from the Agent in the conversation flow.
- Any persistent storage should be behind a configurable interface (e.g., environment-based path or external DB), and access should be permissioned.

When to ask for human guidance
- If a change modifies the system prompt or fundamental agent behavior, request review before merging (prompt changes can change behavior dramatically).
- For external API integrations (authentication, rate limits), request credentials or API architecture confirmation from maintainers.

Files of high importance
- `main.ts` — CLI entrypoint; sample usage and prompt structure
- `server.ts` — GUI server; POST handler; frontend interaction
- `index.html` — Minimal client demonstrating how to talk to the server
- `deno.json` / `deno.lock` — Import map and pins
- `README.md` / `WARP.md` — Development commands and context (use for scripts and run commands)

Style guide
- TypeScript permissions and top-level awaits are acceptable for Deno; prefer explicit `--allow-*` flags in CI and local dev.
- Keep handlers minimal and implement additional business logic in `src/` not in the entrypoints.

If you're an agent: When making code changes, include a small manual test (CLI or GUI) and a short note in the PR describing how to run the feature locally.

End of instructions.
