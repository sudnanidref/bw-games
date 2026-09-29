# Collaborative

Owner boundary: `src/games/collaborative/`. Do not edit another value's code, the shared journey, or leaderboard to award points.

- **OpenSpec:** create a value-specific change such as `collaborative-mini-game` with proposal, spec, design, and tasks before implementation.
- **Entry point:** export the playable game from this directory and register it in `src/games/index.ts` only after it passes integration checks. Currently unavailable.
- **Controls:** specify pointer and keyboard actions, visible focus, and pre-game instructions in your OpenSpec change; mechanics are not chosen yet.
- **Completion:** use the shared game contract to report one completed result for `collaborative`, or cancel/error without points.
- **Score rubric:** document how actual play earns an integer 0-100; no placeholder score may enter a run.
- **Assets:** record author/source, license or permission, required attribution, and where each asset is used; never copy from the Vantis reference.
- **Verification:** run `npm run typecheck`, `npm test`, and `npm run build` locally.
- **Checklist:** [ ] OpenSpec change approved; [ ] original/licensed assets documented; [ ] controls and scoring documented; [ ] contract and journey tests pass; [ ] only this value is changed.

## Instruction service

Blind Builder uses this hub's `POST /api/instruction` endpoint. The server receives the teammate board, latest instruction, transcript, and round ID, never the target board. Instructions have a 35 non-whitespace-character limit. Use Node 22.22.2 or newer for the hub's native SQLite and DOM test dependencies.

- `INSTRUCTION_MODE=auto` (default): use a configured model, otherwise interpret instructions locally without credentials.
- `INSTRUCTION_MODE=deterministic`: always use the local interpreter.
- `INSTRUCTION_MODE=llm`: require a configured model; missing configuration is an error.

For Azure AI Foundry, configure `AZURE_FOUNDRY_ENDPOINT` (HTTPS OpenAI-compatible v1 base URL), `AZURE_FOUNDRY_API_KEY`, and `AZURE_FOUNDRY_DEPLOYMENT` together on the API host. Foundry takes precedence over optional `OPENAI_API_KEY` and `OPENAI_MODEL` (default `gpt-4o-mini`). Never expose keys through Vite client variables or commit a local environment file. Provider output is schema-checked and retried once on failure; a second failure returns a recoverable response without altering the board. Without a provider, the game remains playable in deterministic mode.