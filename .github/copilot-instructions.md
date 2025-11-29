## JD ↔ Resume Match Agent — Copilot (AI) Instructions

Quick context
- This is a small Deno app that compares a job description (JD) and a resume and returns a structured JSON fit analysis.
- Key logic lives in `src/agent.ts` (Zypher agent orchestration) and `src/tools/local_parser.ts` (fallback parsing).

How it runs
- CLI: `deno task run:cli` (uses `--config deno.json` so import maps apply)
- GUI: `deno task run:server`, then open http://localhost:8000
- You must set `OPENAI_API_KEY` in your environment before running tasks (the agent will throw if absent).

Project specifics and patterns for code changes
- Uses `@corespeed/zypher` (via jsr import in `deno.json`). Import names changed in the `zypher` 0.5.x API — prefer `createZypherContext` and `ZypherAgent` rather than older `createZypherAppContext`/`ZypherApp`.
- `ZypherAgent.runTask(taskDescription, model, fileAttachments?, options?)` returns an RxJS Observable<TaskEvent>; do not assume it returns a string. Use an async iterator (e.g. `eachValueFrom`) to collect `text` and `message` events and assemble final content.
- When reading model output expect streaming `TaskTextEvent` (`{ type: 'text', content: string }`) and `TaskMessageEvent` (`{ type: 'message', message: Message|FinalMessage }`). When parsing, look for `message.content` blocks with `type: 'text'`.
- `OpenAIModelProvider` construction accepts `apiKey` only; model selection is passed to `runTask` as a model-name string (default `OPENAI_MODEL` or fallback `gpt-4o`).
- Fallback parsing is implemented in `src/tools/local_parser.ts` — keep the list of candidate keywords maintained there to improve fallback accuracy.

Developer workflows & debugging
- Use `deno task run:cli` when testing CLI paths; `deno task run:server` for the HTTP GUI — tasks load `deno.json` mappings.
- If you see import errors for `@corespeed/zypher`, make sure you ran with `--config deno.json` or the `task` variant so the import map is used.
- If you see `AddrInUse` when starting the server, pick another port with `PORT=9001 deno task run:server`.
- For interactive debug, run a short `scripts/check_zypher_exports.ts` to list module exports (useful for detecting API changes in remote packages).

Common gotchas the agent should avoid
- Avoid assuming `runTask` resolves to a string. Instead, accumulate `text` events and extract from completed `message` events.
- Don’t pass `model` into `OpenAIModelProvider` options — pass it as the second argument to `runTask`.
- Be careful to guard JSON.parse on LLM output; the LLM will often include schema or commentary that requires a robust parser (we match the first JSON block currently).

Files to check when making changes
- `src/agent.ts` — agent orchestration and streaming handling
- `src/tools/local_parser.ts` — fallback parsing algorithm and candidate skills
- `src/main.ts` and `src/server.ts` — development and deployment entry points
- `deno.json` — import mappings & tasks. Use `deno task` or `--config` when running.

Examples (how to call endpoints)
- CLI: `deno task run:cli`
- Server analyze example (curl):
  ```bash
  curl -s -X POST http://localhost:8000/analyze \
    -H "Content-Type: application/json" \
    -d '{"jd":"text here", "resume":"text here"}'
  ```

If unsure, ask
- If the model provider API is changed or an Observable-based API is introduced, look for `ZypherAgent` exports and `TaskEvent` structure in `@corespeed/zypher` (see `jsr` package definition and repo docs). Use the helper scripts in `scripts/` to introspect module exports and agent runtime events.
