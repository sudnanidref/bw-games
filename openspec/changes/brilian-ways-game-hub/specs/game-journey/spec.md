# Spec Delta

## Purpose

Defines the named player's ordered journey through the five BRILiaN Way values and the truthful aggregation of completed mini-game results.

## ADDED Requirements

### Requirement: Named desktop journey
The system SHALL ask for a nonempty player name before starting a desktop journey and SHALL present the five values in this order: Integrity, Collaborative, Accountability, Growth Mindset, Customer Focus.

#### Scenario: Player starts a journey
- **WHEN** a player enters a valid name and starts
- **THEN** the system shows the journey at Integrity and marks the other four stages as upcoming in the specified order

#### Scenario: Empty player name
- **WHEN** a player submits a name containing only whitespace
- **THEN** the system rejects it and does not start a run

### Requirement: Sequential stage progression
The system SHALL only launch an available game for the current value and SHALL advance to the next value only after a valid result from the current game. It SHALL show the current value, the previously earned results, and the next value at each transition; unavailable game slots SHALL be shown as unavailable rather than completed.

#### Scenario: Complete an available stage
- **WHEN** the current game reports a valid completed result
- **THEN** the system records it once, displays its score in the journey, and makes the next value current

#### Scenario: Attempt to skip a stage
- **WHEN** a player tries to open a later value before completing the current one
- **THEN** the system does not launch the later game or award its points

#### Scenario: A game is not implemented yet
- **WHEN** the current stage has no playable implementation
- **THEN** the system identifies that stage as unavailable and does not fabricate a result or advance the run

### Requirement: Final score from five real results
Each game SHALL report a single integer score between 0 and 100 inclusive for its completed stage. The system SHALL total exactly one validated result for each of the five values, display each contribution and the sum out of 500 at the end, and SHALL NOT show a completed-run total before all five results exist.

#### Scenario: Five completed values
- **WHEN** all five games have reported valid results, including a valid score of zero where applicable
- **THEN** the system displays the five scores and their arithmetic sum out of 500

#### Scenario: Duplicate or invalid result
- **WHEN** a game reports a duplicate result, a score outside 0 to 100, or a result for a non-current value
- **THEN** the system rejects the result without changing the recorded scores or advancing the journey
