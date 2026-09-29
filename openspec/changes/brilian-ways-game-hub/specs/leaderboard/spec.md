# Spec Delta

## Purpose

Defines a name-based leaderboard for completed five-value runs while keeping incomplete or invalid scores out of published rankings.

## ADDED Requirements

### Requirement: Completed-run leaderboard submission
The system SHALL accept a leaderboard entry only after one validated result exists for each value in order. An entry SHALL contain the player's display name, five scores, their total, and a completion time; it SHALL persist beyond a browser session and reject incomplete or inconsistent totals.

#### Scenario: Player finishes all five values
- **WHEN** a player completes the fifth value and submits the run
- **THEN** the system stores one entry with the validated total and makes it available on the leaderboard

#### Scenario: Incomplete or tampered submission
- **WHEN** a submission lacks a value result, includes an out-of-range score, or supplies a total different from the five-score sum
- **THEN** the system rejects the entry and does not display it in rankings

### Requirement: Safe name display and deterministic ranking
The system SHALL trim a player's name, require 1 to 24 display characters, safely display it as text, and rank entries by total descending with earlier completion time first for ties.

#### Scenario: Equal totals
- **WHEN** two completed entries have the same total
- **THEN** the earlier completed entry appears first

#### Scenario: Invalid display name
- **WHEN** a player submits a blank or overlength name
- **THEN** the system rejects the name and does not create an entry
