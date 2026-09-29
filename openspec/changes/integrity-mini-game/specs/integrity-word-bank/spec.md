# Spec Delta

## Purpose

Defines the curated word bank that supplies Integrity game targets: how candidate words are generated offline with an LLM, reviewed by a human, stored, validated, and sampled per round.

## ADDED Requirements

### Requirement: Curated word-bank file
The Integrity slot SHALL contain a committed word bank with two categories: `aligned` (behaviors consistent with integrity: honest, rule-abiding, risk-aware) and `violation` (behaviors that break integrity). Each entry SHALL be an Indonesian word or phrase of 1-2 words and at most 18 characters. There SHALL be at least 40 aligned and 30 violation entries, with no duplicates within or across categories (compared case-insensitively after trimming).

#### Scenario: Word bank passes validation
- **WHEN** the word-bank validation test runs
- **THEN** it passes only if both categories meet the minimum counts, every entry meets the length and word-count limits, and no entry is duplicated

#### Scenario: Ambiguous entry rejected in review
- **WHEN** a reviewer cannot place an entry clearly in one category (for example "fleksibel" or "loyal")
- **THEN** the entry is excluded from the committed word bank

### Requirement: Offline LLM generation
Candidate words SHALL be produced by a developer-run script that calls GPT-5 mini with a key read from a local, gitignored environment variable. The script SHALL write candidates to a separate review file and SHALL NOT overwrite the committed word bank. The game SHALL NOT call any LLM or external API at runtime, and no API key SHALL appear in committed files or the client bundle.

#### Scenario: Generator run without a key
- **WHEN** the generator runs without the API key variable set
- **THEN** it exits with a non-zero status and a message naming the missing variable, and writes no files

#### Scenario: Built client contains no key or LLM call
- **WHEN** the production client bundle is built
- **THEN** it contains no API key and no request to an LLM provider

### Requirement: Human review before commit
Every committed entry SHALL have been reviewed by a person. The Integrity README SHALL record the generator model, the generation date, the reviewer, and the review rules used, so the word bank's provenance is auditable.

#### Scenario: Provenance documented
- **WHEN** the word bank is committed or updated
- **THEN** the README states the model, generation date, reviewer, and review rules

### Requirement: Fixed-count random sampling per round
Each round SHALL draw exactly 20 distinct aligned and 12 distinct violation entries from the word bank and shuffle their order and row placement. The random source SHALL be injectable so tests can reproduce a round deterministically.

#### Scenario: Every round has the same maximum
- **WHEN** any round is generated
- **THEN** it contains exactly 20 aligned and 12 violation targets with no repeated word

#### Scenario: Seeded round is reproducible
- **WHEN** two rounds are generated with the same seeded random source
- **THEN** they contain the same words in the same order and rows
