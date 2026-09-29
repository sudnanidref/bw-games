# Graph Report - bw-games  (2026-09-29)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 182 nodes · 332 edges · 13 communities (10 shown, 3 thin omitted)
- Extraction: 88% EXTRACTED · 11% INFERRED · 0% AMBIGUOUS · INFERRED: 38 edges (avg confidence: 0.84)
- Token cost: 743 input · 1,460 output

## Graph Freshness
- Built from commit: `283b9a4f`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Leaderboard API
- Game Session Flow
- Project Package Config
- OpenSpec Workflow Skills
- Game Hub Documentation
- Game Hub Design Decisions
- Dev Dependency Config
- App TypeScript Config
- Server TypeScript Config
- Package Scripts
- Runtime Dependencies

## God Nodes (most connected - your core abstractions)
1. `OpenSpec CLI` - 22 edges
2. `App()` - 12 edges
3. `compilerOptions` - 10 edges
4. `compilerOptions` - 9 edges
5. `GameResult` - 8 edges
6. `games` - 8 edges
7. `scripts` - 8 edges
8. `completeStage()` - 7 edges
9. `vitest` - 7 edges
10. `createApp()` - 6 edges

## Surprising Connections (you probably didn't know these)
- `createApp()` --calls--> `parseSubmission()`  [EXTRACTED]
  server/app.ts → src/leaderboard.ts
- `GameContext` --references--> `ValueId`  [EXTRACTED]
  src/games/contract.ts → src/games/index.ts
- `parseSubmission()` --calls--> `isGameResult()`  [EXTRACTED]
  src/leaderboard.ts → src/games/contract.ts
- `finish()` --calls--> `completeStage()`  [EXTRACTED]
  src/App.tsx → src/journey.ts
- `start()` --calls--> `createJourney()`  [EXTRACTED]
  src/App.tsx → src/journey.ts

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **brilian-ways-game-hub OpenSpec change artifacts** — openspec_changes_brilian_ways_game_hub_openspec, openspec_changes_brilian_ways_game_hub_proposal, openspec_changes_brilian_ways_game_hub_design, openspec_changes_brilian_ways_game_hub_tasks, openspec_changes_brilian_ways_game_hub_specs_game_integration_spec, openspec_changes_brilian_ways_game_hub_specs_game_journey_spec, openspec_changes_brilian_ways_game_hub_specs_leaderboard_spec [EXTRACTED 1.00]
- **Five BRILiaN Way game slots** — src_games_integrity_readme, src_games_collaborative_readme, src_games_accountability_readme, src_games_growth_mindset_readme, src_games_customer_focus_readme [EXTRACTED 1.00]
- **OpenSpec workflow prompts and skills** — github_prompts_opsx_apply, github_prompts_opsx_archive, github_prompts_opsx_explore, github_prompts_opsx_propose, github_prompts_opsx_sync, github_prompts_opsx_update, github_skills_openspec_apply_change, github_skills_openspec_archive_change, github_skills_openspec_explore, github_skills_openspec_propose, github_skills_openspec_sync_specs, github_skills_openspec_update_change [INFERRED 0.90]

## Communities (13 total, 3 thin omitted)

### Community 0 - "Leaderboard API"
Cohesion: 0.10
Nodes (23): data/leaderboard.db, Leaderboard API, SQLite leaderboard storage, better-sqlite3, fastify, @fastify/rate-limit, ref_node_fs, ref_node_os (+15 more)

### Community 1 - "Game Session Flow"
Cohesion: 0.22
Nodes (20): react, App(), finish(), start(), submitRun(), GameContext, GameResult, isGameResult() (+12 more)

### Community 2 - "Project Package Config"
Cohesion: 0.10
Nodes (18): name, private, type, version, concurrently, jsdom, lucide-react, react-dom (+10 more)

### Community 4 - "Game Hub Documentation"
Cohesion: 0.30
Nodes (5): PlayableGame, Arcade design tokens, Kampung Bash reference, PlayableGame, GameSlot

### Community 5 - "Game Hub Design Decisions"
Cohesion: 0.19
Nodes (12): Developer guardrails and checks decision, Game contract and score lifecycle decision, Shell and directory ownership decision, Ranking and trust boundary decision, Visual direction and asset policy decision, BRILiaN Way, game-integration capability, game-journey capability (+4 more)

### Community 6 - "Dev Dependency Config"
Cohesion: 0.13
Nodes (15): devDependencies, concurrently, jsdom, @testing-library/react, @testing-library/user-event, tsup, tsx, @types/better-sqlite3 (+7 more)

### Community 7 - "App TypeScript Config"
Cohesion: 0.17
Nodes (11): compilerOptions, jsx, lib, module, moduleResolution, noEmit, skipLibCheck, strict (+3 more)

### Community 8 - "Server TypeScript Config"
Cohesion: 0.18
Nodes (10): compilerOptions, lib, module, moduleResolution, noEmit, skipLibCheck, strict, target (+2 more)

### Community 9 - "Package Scripts"
Cohesion: 0.25
Nodes (8): scripts, build, dev, dev:api, dev:web, start, test, typecheck

### Community 10 - "Runtime Dependencies"
Cohesion: 0.29
Nodes (7): dependencies, better-sqlite3, fastify, @fastify/rate-limit, lucide-react, react, react-dom

## Ambiguous Edges - Review These
- `Arcade design tokens` → `public/journey-map.svg`  [AMBIGUOUS]
  public/journey-map.svg · relation: conceptually_related_to

## Knowledge Gaps
- **72 isolated node(s):** `EntryRow`, `LeaderboardRow`, `folders`, `results`, `database` (+67 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 79 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **3 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What is the exact relationship between `Arcade design tokens` and `public/journey-map.svg`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **Why does `OpenSpec CLI` connect `OpenSpec Workflow Skills` to `Leaderboard API`, `Game Hub Documentation`?**
  _High betweenness centrality (0.136) - this node is a cross-community bridge._
- **Why does `devDependencies` connect `Dev Dependency Config` to `Project Package Config`?**
  _High betweenness centrality (0.128) - this node is a cross-community bridge._
- **Why does `vitest` connect `Leaderboard API` to `Game Session Flow`, `Project Package Config`?**
  _High betweenness centrality (0.106) - this node is a cross-community bridge._
- **What connects `EntryRow`, `LeaderboardRow`, `folders` to the rest of the system?**
  _72 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Leaderboard API` be split into smaller, more focused modules?**
  _Cohesion score 0.0967741935483871 - nodes in this community are weakly interconnected._
- **Should `Project Package Config` be split into smaller, more focused modules?**
  _Cohesion score 0.09523809523809523 - nodes in this community are weakly interconnected._