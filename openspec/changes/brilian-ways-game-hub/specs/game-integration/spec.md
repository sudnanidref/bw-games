# Spec Delta

## Purpose

Defines independent developer slots and shared integration and visual contracts so five separately built games form one coherent BRILiaN Way experience.

## ADDED Requirements

### Requirement: One isolated slot per value
The project SHALL provide separate developer-owned directories for Integrity, Collaborative, Accountability, Growth Mindset, and Customer Focus. Each slot SHALL identify its value and document its entry point, controls, completion conditions, scoring rules, and local verification procedure; unspecified mechanics SHALL remain for its developer to design.

#### Scenario: Developer takes ownership of a value
- **WHEN** a developer opens a value's directory
- **THEN** they can find that slot's integration contract and contribution checklist without editing another game's implementation

### Requirement: Stable game-to-shell contract
Each playable game SHALL receive its value identifier and run context from the shell and SHALL emit either one valid completion result for that value or a non-scoring cancellation/error. Games SHALL NOT directly change another game's score, unlock state, or leaderboard record.

#### Scenario: A game completes
- **WHEN** a game sends its completion result to the shell
- **THEN** the shell validates the value and score before applying the result to the journey

#### Scenario: A game exits without completion
- **WHEN** a game is cancelled or fails
- **THEN** the current stage remains incomplete and no points are awarded

### Requirement: Cohesive original arcade presentation
The shell SHALL provide consistent desktop stage transitions, legible controls, value identity, goal and score feedback, and final results. Each game SHALL follow the shared visual guidance while using original or appropriately licensed assets; the Vantis reference SHALL be treated as style inspiration, not as an asset or screen source.

#### Scenario: Independent games appear as one journey
- **WHEN** a player moves from one implemented value to the next
- **THEN** the shell keeps consistent navigation, value order, stage status, and scoring presentation around the distinct game mechanics

### Requirement: Per-game development guardrails
The project SHALL provide a per-slot checklist that requires each game contribution to begin with an OpenSpec change, implement only its assigned value through the shared contract, document asset provenance, and pass contract and journey checks before integration. RTK and graphifyy SHALL NOT be mandatory tools for this phase.

#### Scenario: Developer submits a game
- **WHEN** a developer prepares a game for integration
- **THEN** its checklist identifies its OpenSpec change, asset provenance, local checks, and the shared integration checks to run
