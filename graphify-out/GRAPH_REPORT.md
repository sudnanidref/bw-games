# Graph Report - bw-games  (2026-09-29)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 670 nodes · 1413 edges · 34 communities (23 shown, 11 thin omitted)
- Extraction: 95% EXTRACTED · 5% INFERRED · 0% AMBIGUOUS · INFERRED: 69 edges (avg confidence: 0.82)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `2468e997`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- BlindBuilder.tsx
- vitest
- games/index.ts
- mountGrowthGame
- Kasir Sat Set Game
- OpenSpec CLI
- MatchTheSolution.tsx
- integrity/engine.ts
- audio.ts
- IntegrityGame.tsx
- IntegrityGame
- Growth Mindset Game Capability
- package.json
- IntegrityGame.test.tsx
- devDependencies
- Accountability Mini Game Tasks
- round.ts
- compilerOptions
- compilerOptions
- dependencies
- scripts
- integrity/scoring.ts
- generate-words.mjs
- @vitejs/plugin-react
- Graphify Codebase Context
- Accountability Mini Game OpenSpec Config
- Growth Mindset Failure Can Continue OpenSpec Config
- Growth Mindset Mini Game OpenSpec Config
- Growth Mindset Progressive Difficulty OpenSpec Config
- Customer Focus Match The Solution OpenSpec Config
- Integrate Collaborative Blind Builder OpenSpec Config
- Integrity Mini Game OpenSpec Config

## God Nodes (most connected - your core abstractions)
1. `vitest` - 32 edges
2. `IntegrityGame()` - 29 edges
3. `mountGrowthGame()` - 29 edges
4. `BlindBuilder()` - 18 edges
5. `MatchTheSolution()` - 18 edges
6. `OpenSpec CLI` - 17 edges
7. `AccountabilityGame()` - 16 edges
8. `step()` - 15 edges
9. `createGame()` - 14 edges
10. `Accountability Mini Game Tasks` - 13 edges

## Surprising Connections (you probably didn't know these)
- `createApp()` --calls--> `outcomeMatchesSource()`  [EXTRACTED]
  server/app.ts → src/games/collaborative/ai-contract.ts
- `createApp()` --calls--> `interpretInstruction()`  [EXTRACTED]
  server/app.ts → src/games/collaborative/instructions.ts
- `AccountabilityGame Component` --references--> `Accountability Game Engine`  [EXTRACTED]
  src/games/accountability/README.md → openspec/changes/accountability-mini-game/design.md
- `Copilot Workshop Guidelines` --conceptually_related_to--> `Kasir Sat Set Game`  [INFERRED]
  .github/copilot-instructions.md → openspec/changes/accountability-mini-game/design.md
- `Kasir Sat Set Source PRD` --cites--> `Kasir Sat Set Game`  [EXTRACTED]
  src/games/accountability/docs/reference/01-product-requirements.md → openspec/changes/accountability-mini-game/design.md

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Collaborative Instruction Flow** — openspec_changes_integrate_collaborative_blind_builder_design_blind_builder_game, openspec_changes_integrate_collaborative_blind_builder_design_fastify_instruction_route, openspec_changes_integrate_collaborative_blind_builder_design_instruction_provider, openspec_changes_integrate_collaborative_blind_builder_design_board_rules, src_games_collaborative_readme_blindbuilder_component [EXTRACTED 0.90]
- **Integrity Mini-game Flow** — openspec_changes_integrity_mini_game_design_integrity_game, openspec_changes_integrity_mini_game_design_pure_engine, openspec_changes_integrity_mini_game_design_audio, src_games_integrity_readme_word_bank, src_games_integrity_readme_integritygame_component [EXTRACTED 0.90]
- **BRILiaN Way Five-Value Journey** — openspec_changes_accountability_mini_game_design_playablegame_contract, journey_five_value_order, openspec_changes_accountability_mini_game_design_accountability_game, openspec_changes_customer_focus_match_the_solution_design_customer_focus_game, openspec_changes_integrate_collaborative_blind_builder_design_blind_builder_game, openspec_changes_integrity_mini_game_design_integrity_game, score_normalization_boundary [EXTRACTED 0.95]
- **Kasir Sat Set Source Reference Documentation Bundle** — src_games_accountability_docs_reference_00_start_here_doc, src_games_accountability_docs_reference_01_product_requirements_doc, src_games_accountability_docs_reference_02_ux_ui_spec_doc, src_games_accountability_docs_reference_03_technical_design_doc, src_games_accountability_docs_reference_04_implementation_plan_doc, src_games_accountability_docs_reference_05_test_plan_doc, src_games_accountability_docs_reference_readme_doc, src_games_accountability_docs_reference_docs_verification_doc, src_games_accountability_docs_reference_index_doc, concept_kasir_sat_set [EXTRACTED 1.00]
- **brilian-ways-game-hub OpenSpec change artifacts** — openspec_changes_brilian_ways_game_hub_openspec, openspec_changes_brilian_ways_game_hub_proposal, openspec_changes_brilian_ways_game_hub_design, openspec_changes_brilian_ways_game_hub_tasks, openspec_changes_brilian_ways_game_hub_specs_game_integration_spec, openspec_changes_brilian_ways_game_hub_specs_game_journey_spec, openspec_changes_brilian_ways_game_hub_specs_leaderboard_spec [EXTRACTED 1.00]
- **Growth Mindset Capability Evolution Across Three Changes** — openspec_changes_archive_2026_09_29_growth_mindset_mini_game_proposal_doc, openspec_changes_archive_2026_09_29_growth_mindset_mini_game_spec_doc, openspec_changes_archive_2026_09_29_growth_mindset_progressive_difficulty_spec_doc, openspec_changes_archive_2026_09_29_growth_mindset_failure_can_continue_spec_doc, openspec_specs_growth_mindset_game_spec_doc, concept_growth_mindset_game [EXTRACTED 1.00]
- **BRILiaN Way Stage Mini-Game Changes** — openspec_changes_integrity_mini_game_tasks_doc, openspec_changes_archive_2026_09_29_growth_mindset_mini_game_tasks_doc, openspec_changes_customer_focus_match_the_solution_tasks_doc, openspec_changes_integrate_collaborative_blind_builder_tasks_doc, openspec_changes_accountability_mini_game_tasks_doc, concept_brilian_way_journey [INFERRED 0.75]
- **OpenSpec workflow prompts and skills** — github_prompts_opsx_apply, github_prompts_opsx_archive, github_prompts_opsx_explore, github_prompts_opsx_propose, github_prompts_opsx_sync, github_prompts_opsx_update, github_skills_openspec_apply_change, github_skills_openspec_archive_change, github_skills_openspec_explore, github_skills_openspec_propose, github_skills_openspec_sync_specs, github_skills_openspec_update_change [INFERRED 0.90]

## Communities (34 total, 11 thin omitted)

### Community 0 - "BlindBuilder.tsx"
Cohesion: 0.05
Nodes (70): openai, buildInstructionPayload(), CompletionRequest, CompletionTransport, FoundryConfig, getConfiguredInstructionProvider(), InstructionMode, InstructionProvider (+62 more)

### Community 1 - "vitest"
Cohesion: 0.06
Nodes (49): vitest, src_games_accountability_accountability_game, AccountabilityGame(), choosePayment(), continueJourney(), publishSnapshot(), reportError(), startManually() (+41 more)

### Community 2 - "games/index.ts"
Cohesion: 0.08
Nodes (46): data/leaderboard.db, Leaderboard API, SQLite leaderboard storage, better-sqlite3, fastify, @fastify/rate-limit, ref_node_fs, ref_node_os (+38 more)

### Community 3 - "mountGrowthGame"
Cohesion: 0.09
Nodes (47): Arrow, ARROWS, button(), el(), formatTime(), GLYPH, GrowthGameHandle, GrowthGameOptions (+39 more)

### Community 4 - "Kasir Sat Set Game"
Cohesion: 0.06
Nodes (50): BRILiaN Way Journey, Customer Focus Game Capability, Copilot Workshop Guidelines, Five-Value Journey Order, Accountability Game Engine, Kasir Sat Set Game, Start Countdown Scheduler, Journey Score Handoff (+42 more)

### Community 5 - "OpenSpec CLI"
Cohesion: 0.08
Nodes (20): PlayableGame, Arcade design tokens, Kampung Bash reference, OpenSpec CLI, Developer guardrails and checks decision, Game contract and score lifecycle decision, Shell and directory ownership decision, Ranking and trust boundary decision (+12 more)

### Community 6 - "MatchTheSolution.tsx"
Cohesion: 0.10
Nodes (26): lucide-react, @testing-library/react, GameProps, CaseId, cases, solutionOrder, draftDistractors, MatchTheSolution() (+18 more)

### Community 7 - "integrity/engine.ts"
Cohesion: 0.11
Nodes (34): advanceClock(), advanceProjectiles(), clamp(), crossingProgress(), dropExpiredFeedback(), EngineInput, EngineState, FEEDBACK_LIFETIME_MS (+26 more)

### Community 8 - "audio.ts"
Cohesion: 0.12
Nodes (18): src_games_integrity_assets_integrity_bgm, AudioDeps, createGameAudio(), playEffect(), playTone(), defaultDeps, END_JINGLE_MS, GameAudio (+10 more)

### Community 9 - "IntegrityGame.tsx"
Cohesion: 0.17
Nodes (16): react, ArtProps, CardProjectile(), CheckIcon(), CrossIcon(), EdcLauncher(), SpeakerIcon(), SpeakerOffIcon() (+8 more)

### Community 10 - "IntegrityGame"
Cohesion: 0.16
Nodes (15): createState(), heldDirection(), IntegrityGame(), cancel(), handleGlobalKey(), movePointer(), onFrame(), pressPointer() (+7 more)

### Community 11 - "Growth Mindset Game Capability"
Cohesion: 0.29
Nodes (17): Growth Mindset Game Capability, 65-Point Pass Gate, Pola Tumbuh Game, Growth Mindset Failure Can Continue Design, Growth Mindset Failure Can Continue Proposal, Growth Mindset Failure Can Continue Spec Delta, Growth Mindset Failure Can Continue Tasks, Growth Mindset Mini Game Design (+9 more)

### Community 12 - "package.json"
Cohesion: 0.12
Nodes (15): name, private, type, version, concurrently, jsdom, @testing-library/user-event, tsup (+7 more)

### Community 13 - "IntegrityGame.test.tsx"
Cohesion: 0.14
Nodes (6): advance(), playWithKeyboard(), renderGame(), storedPreferences, StubAudioContext, mulberry32()

### Community 14 - "devDependencies"
Cohesion: 0.13
Nodes (15): devDependencies, concurrently, jsdom, @testing-library/react, @testing-library/user-event, tsup, tsx, @types/better-sqlite3 (+7 more)

### Community 15 - "Accountability Mini Game Tasks"
Cohesion: 0.52
Nodes (14): Accountability Game Capability, AU Passata Licensed Font, Kasir Sat Set Game, Accountability Mini Game Tasks, Kasir Sat Set Start Here, Kasir Sat Set Product Requirements (referenced), Kasir Sat Set UX/UI Specification, Kasir Sat Set Technical Design (+6 more)

### Community 16 - "round.ts"
Cohesion: 0.24
Nodes (9): ALIGNED_TARGET_COUNT, createRound(), LANE_COUNT, LANE_STAGGER_MS, pickWords(), shuffle(), SPAWN_INTERVAL_MS, VIOLATION_TARGET_COUNT (+1 more)

### Community 17 - "compilerOptions"
Cohesion: 0.17
Nodes (11): compilerOptions, jsx, lib, module, moduleResolution, noEmit, skipLibCheck, strict (+3 more)

### Community 18 - "compilerOptions"
Cohesion: 0.17
Nodes (11): compilerOptions, jsx, lib, module, moduleResolution, noEmit, skipLibCheck, strict (+3 more)

### Community 19 - "dependencies"
Cohesion: 0.22
Nodes (9): dependencies, better-sqlite3, fastify, @fastify/rate-limit, lucide-react, openai, react, react-dom (+1 more)

### Community 20 - "scripts"
Cohesion: 0.25
Nodes (8): scripts, build, dev, dev:api, dev:web, start, test, typecheck

### Community 21 - "integrity/scoring.ts"
Cohesion: 0.43
Nodes (5): finish(), finalScore(), POINTS_PER_ALIGNED_HIT, POINTS_PER_VIOLATION_HIT, runningScore()

### Community 22 - "generate-words.mjs"
Cohesion: 0.53
Nodes (5): cleanCategory(), isValidEntry(), main(), requestCandidates(), RESPONSE_SCHEMA

## Ambiguous Edges - Review These
- `Arcade design tokens` → `public/journey-map.svg`  [AMBIGUOUS]
  public/journey-map.svg · relation: conceptually_related_to

## Knowledge Gaps
- **162 isolated node(s):** `CompletionRequest`, `CompletionTransport`, `FoundryConfig`, `InstructionMode`, `ProviderEnvironment` (+157 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 213 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **11 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What is the exact relationship between `Arcade design tokens` and `public/journey-map.svg`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **Why does `vitest` connect `vitest` to `BlindBuilder.tsx`, `games/index.ts`, `mountGrowthGame`, `MatchTheSolution.tsx`, `integrity/engine.ts`, `audio.ts`, `package.json`, `IntegrityGame.test.tsx`, `round.ts`, `integrity/scoring.ts`, `@vitejs/plugin-react`?**
  _High betweenness centrality (0.230) - this node is a cross-community bridge._
- **Why does `react` connect `IntegrityGame.tsx` to `BlindBuilder.tsx`, `vitest`, `games/index.ts`, `mountGrowthGame`, `MatchTheSolution.tsx`, `audio.ts`, `package.json`?**
  _High betweenness centrality (0.053) - this node is a cross-community bridge._
- **Are the 3 inferred relationships involving `IntegrityGame()` (e.g. with `games/index.ts` and `handleGlobalKey()`) actually correct?**
  _`IntegrityGame()` has 3 INFERRED edges - model-reasoned connections that need verification._
- **Are the 3 inferred relationships involving `mountGrowthGame()` (e.g. with `briefing()` and `cancel()`) actually correct?**
  _`mountGrowthGame()` has 3 INFERRED edges - model-reasoned connections that need verification._
- **Are the 3 inferred relationships involving `MatchTheSolution()` (e.g. with `tick()` and `MatchTheSolution.test.tsx`) actually correct?**
  _`MatchTheSolution()` has 3 INFERRED edges - model-reasoned connections that need verification._
- **What connects `CompletionRequest`, `CompletionTransport`, `FoundryConfig` to the rest of the system?**
  _162 weakly-connected nodes found - possible documentation gaps or missing edges._