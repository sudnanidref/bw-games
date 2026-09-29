# Spec Delta

## Purpose

Makes the Blind Builder collaboration challenge playable as the hub's Collaborative stage, with a verifiable score and safe instruction handling that preserves the five-value journey.

## ADDED Requirements

### Requirement: Collaborative stage plays inside the ordered journey
The system SHALL offer Blind Builder as the Collaborative game only when Collaborative is the current unlocked value. It SHALL retain the existing order and SHALL NOT issue a Collaborative result for a locked stage or a non-scoring exit.

#### Scenario: Collaborative becomes current
- **WHEN** a named player's Integrity stage has one valid completion and the player starts the Collaborative stage
- **THEN** the system presents the game's goal and starts Blind Builder within the shared game experience

#### Scenario: Integrity is unavailable or incomplete
- **WHEN** the player has not completed Integrity
- **THEN** the system does not launch a scored Collaborative round or advance the journey to Collaborative

#### Scenario: Player cancels
- **WHEN** the player exits Blind Builder before committing a completed round
- **THEN** the Collaborative stage remains current and receives no score

### Requirement: Timed target-and-teammate challenge
The game SHALL present a 5 by 5 target board containing 3 to 6 shapes in distinct cells and a separate teammate board that starts empty. The player SHALL have 180 seconds to guide the teammate using text instructions, with a visible countdown and a way to submit early. A timeout SHALL finish the round with its actual board and zero speed credit, not fabricate a perfect result.

#### Scenario: Round begins
- **WHEN** the player starts a new round
- **THEN** the target is visible to the player, the teammate board is empty, and the countdown begins at 180 seconds

#### Scenario: Player submits or time expires
- **WHEN** the player submits an active round or the timer reaches zero
- **THEN** the round stops accepting instructions and shows the target, final teammate board, and score breakdown

### Requirement: Safe and bounded teammate instructions
The system SHALL accept nonempty text instructions of at most 35 non-whitespace characters for placing, moving, and removing supported shapes and colors. The instruction service SHALL validate the request and its response, SHALL NOT receive the hidden target board or expose provider credentials to the browser, and SHALL leave the board unchanged on invalid, stale, or failed responses. A recoverable service failure SHALL allow the player to retry while time remains.

#### Scenario: Teammate follows a valid instruction
- **WHEN** an active player sends a valid instruction and receives a current, valid action
- **THEN** only the requested legal board change is applied and the reply is shown to the player

#### Scenario: Invalid or unavailable instruction service
- **WHEN** a request is malformed, the provider fails, or the response belongs to an earlier round
- **THEN** no board change is applied and the player is told that the instruction could not be processed

#### Scenario: Hidden target isolation
- **WHEN** the browser requests an instruction outcome
- **THEN** the service receives only the current teammate board, the instruction, the conversation history, and round identification, never the target board

### Requirement: Unambiguous one-cell board actions
The game SHALL reject occupied or out-of-bounds actions and SHALL require an explicit source cell when multiple objects have the same shape and color. For moves, numeric row/column or case-insensitive A1-E5 coordinates SHALL identify the source, where the letter is the row and the number the column; a direction SHALL move exactly one cell left, right, up, or down. Unsupported moves and wrong source cells SHALL ask for clarification or report an invalid action without changing the board.

#### Scenario: Duplicate object selected by displayed coordinate
- **WHEN** two blue squares exist and the player requests "Move C3 blue square to left" with one at C3
- **THEN** only the square in row C, column 3 moves one cell left

#### Scenario: Ambiguous or unsupported move
- **WHEN** the player gives no source for duplicate objects or requests a diagonal, multi-cell, or arbitrary-destination move
- **THEN** the board remains unchanged and the teammate requests a supported clarification

#### Scenario: Illegal action from an instruction provider
- **WHEN** a structurally valid response asks to move a piece more than one cell or into an occupied cell
- **THEN** the board remains unchanged and the player receives an explanation

### Requirement: Real score and single journey completion
The game SHALL calculate an integer score from 0 to 100 from the finished board using 70% exact-match accuracy, 20% instruction efficiency, and 10% remaining-time credit. Accuracy SHALL divide exact matches by the larger of target count, final board count, and one; communication SHALL start at 100 and lose 10 for each counted instruction beyond the target count and 10 for each rejected instruction, bounded at zero; speed SHALL be the percentage of 180 seconds remaining, or zero on timeout. Each component SHALL be bounded to 0-100 and the weighted result rounded to the nearest integer. After showing results, the player SHALL be able to commit that result exactly once to Collaborative or exit without awarding points.

#### Scenario: Player continues after finishing
- **WHEN** a completed round's result is confirmed
- **THEN** the hub receives one Collaborative result with the calculated integer score and makes Accountability current

#### Scenario: Zero score or repeated completion attempt
- **WHEN** a legitimate round scores zero or its completion is attempted again
- **THEN** zero is accepted as a valid completed result once, and no duplicate score is awarded

#### Scenario: Replay or cancellation
- **WHEN** the player replays or leaves before confirming a finished score
- **THEN** no result from the abandoned round is sent to the hub