# Spec Delta

## Purpose

Provide a complete, locally playable Kasir Sat Set experience for the Accountability stop in the BRILiaN Way journey, with deterministic handoff of one earned score to the existing game contract.

## ADDED Requirements

### Requirement: Payment choices are limited to the three defined methods
The game MUST provide exactly three payment choices, in the fixed order TUNAI, EDC, QRIS, mapped to `cash`, `edc`, and `qris`. It MUST compare the selected method ID with the active buyer's requested method; names, colors, icons, and copy MUST NOT affect correctness. Payment is simulated and MUST NOT initiate a real transaction.

#### Scenario: L02 and U03 - each payment method can be answered correctly
- **WHEN** the active buyer requests cash, EDC, or QRIS and the matching choice is activated during an unlocked live round
- **THEN** that choice is accepted as correct, adds 10 raw points, and increments served buyers once

#### Scenario: U01 - the start screen previews all payment methods
- **WHEN** the game opens
- **THEN** its start screen shows TUNAI, EDC, and QRIS in the fixed order with the configured points and a Mulai control

#### Scenario: Invalid payment identifier is ignored
- **WHEN** an action contains an identifier outside `cash`, `edc`, and `qris`
- **THEN** it is rejected without changing score, counters, queue, or feedback effects

### Requirement: Buyers form a stable anonymous FIFO queue
Each live round MUST show a FIFO queue of exactly three anonymous buyers, including the active buyer at the cashier. Every buyer MUST have a unique round-local identity, a character variation, and one uniformly selected payment method assigned when created. Character selection MUST be uniform from at least six distinguishable variations and independent from method selection. Repeats MUST be allowed. Waiting buyers MUST retain their assigned method and show only its token; only the lead buyer's request is shown as a speech bubble. Rendering, timer updates, and wrong answers MUST NOT reroll buyers. A correct transition MUST remove only the lead buyer and append exactly one newly identified buyer if the round has not finished. Buyers MUST NOT display names or identifying numbers.

#### Scenario: L01 and U13 - a round starts with three anonymous buyers
- **WHEN** a new round becomes ready for input
- **THEN** it has three buyers, zero score and counters, a lead buyer at the cashier, two waiting buyers with fixed method tokens, and no displayed names or buyer numbers

#### Scenario: L07 and L21 - correct answer advances exactly one FIFO position
- **WHEN** the 120 ms correct transition completes before the deadline
- **THEN** the former lead buyer leaves, the next buyer becomes active, and one new buyer with a new ID joins at the back while the queue remains three

#### Scenario: L03 and L21 - wrong answer preserves the lead and queue
- **WHEN** the lead buyer receives a wrong choice
- **THEN** the queue order, active buyer ID, and that buyer's payment method remain unchanged through and after the wrong-answer lock

#### Scenario: L15 and L16 - random selection uses independent uniform indexes
- **WHEN** deterministic RNG values cover 0, 1/3, 2/3, and values approaching 1 for payment selection, and separate values select characters
- **THEN** each index maps to one valid entry, character and method draws remain independent, and a repeated character may have a different method

#### Scenario: L17 - non-creation updates do not consume buyer randomness
- **WHEN** the game renders, advances its timer, or accepts a wrong answer
- **THEN** it creates no buyer and consumes no character or method draw

### Requirement: Round timing uses a strict 20-second deadline
Each round MUST last 20,000 ms from the moment the game is ready for input. Its logical deadline MUST NOT depend on render cadence, tab visibility, animation, or browser scheduling. The start-screen countdown MUST NOT consume round time. An action MUST be accepted only when processed before the deadline and while unlocked. At or after the deadline, timeout MUST take precedence over lock completion and buyer transition. Returning from a hidden tab MUST finalize an expired round before another input is accepted. No opening countdown, pause, bonus time, or extension is allowed.

#### Scenario: L09 and L10 - action acceptance is strict at the deadline
- **WHEN** an unlocked action is processed at 19,999 ms, then separately at exactly 20,000 ms or later
- **THEN** the first action is eligible for normal scoring and each action at or after 20,000 ms is rejected as the round finalizes

#### Scenario: L11 and L12 - timeout wins during a lock but retains accepted score
- **WHEN** a correct or wrong decision is accepted before the deadline and its lock crosses the deadline
- **THEN** the accepted decision's score and counters remain, the result finalizes at the deadline, and no buyer transition or further decision occurs

#### Scenario: L14 - a delayed clock update cannot extend the round
- **WHEN** the game clock advances from before the deadline to after it without intermediate updates
- **THEN** the next update finalizes immediately using the original deadline and grants no extra time

#### Scenario: L18 - stale round, buyer, or payment identities cannot score
- **WHEN** an action carries an old round ID, an old buyer ID, or an invalid payment ID
- **THEN** it is rejected without a score or counter change; a valid clock advance may still update time or finalize an expired round

#### Scenario: U02 and U07 - idle and backgrounded rounds expire
- **WHEN** a round receives no choice for 20 seconds, or its tab remains hidden past the deadline and becomes visible
- **THEN** the game shows the result with the last valid statistics before accepting any further input

### Requirement: Score, counters, lock durations, and feedback follow the product rules
At round start, raw score, served count, and wrong count MUST be zero. A correct choice MUST add 10 raw points, increment served count once, show `Benar! +10`, a checkmark, three floating `$` glyphs, and play a short local “cring” sound; it MUST lock every payment choice for 120 ms and then advance the queue if time remains. A wrong choice MUST subtract 5 raw points with a per-decision minimum of zero, increment wrong count once, show `Belum sesuai! Penalti 5 poin` and a cross, play no success sound or dollar effect, and lock every choice for 500 ms while retaining the same buyer. Input during either lock MUST be ignored and MUST NOT be queued. Rejected actions MUST NOT change score or counters. Timeout MUST freeze the last valid score and counters; an unfinished buyer has no extra value.

#### Scenario: L03, L04, and L05 - penalties clamp after each decision
- **WHEN** a wrong choice is made at 0, then a correct choice follows; and separately the sequence correct ×3, wrong ×1, correct ×2 is completed
- **THEN** the first sequence ends at 10 points with one served and one wrong, and the second ends at 45 points with five served and one wrong

#### Scenario: L06 - activations during either lock are discarded
- **WHEN** a payment choice is activated during the correct 120 ms lock or wrong 500 ms lock
- **THEN** it is ignored without deferred processing or changes to score, counters, feedback, or queue

#### Scenario: L07 - correct lock boundary is 120 ms
- **WHEN** the clock is at 119 ms after a correct decision, then at 120 ms
- **THEN** the same buyer remains active at 119 ms and exactly one FIFO transition may occur at 120 ms if the deadline has not won

#### Scenario: L08 - wrong lock boundary is 500 ms
- **WHEN** the clock is at 499 ms after a wrong decision, then at 500 ms
- **THEN** input remains locked and the same buyer remains active at 499 ms; at 500 ms input reopens with that buyer unchanged

#### Scenario: L13 - finalization is idempotent
- **WHEN** timeout finalization is requested more than once
- **THEN** the frozen result, counters, and effects remain unchanged and no second completion is emitted

#### Scenario: U04, U12, and U15 - feedback and end-of-round controls match the accepted action
- **WHEN** the player makes correct and wrong choices and then reaches the result
- **THEN** only correct choices produce the checkmark, three dollar effects, and local sound; wrong choices show their penalty without those effects; the final statistics match accepted decisions and payment controls are inactive

### Requirement: Start, round, result, and journey handoff are single-use
The game MUST provide its own start, play, and result states. The start screen MUST contain only the title Kasir Sat Set, correct/wrong/minimum-score values, the three payment methods, and a Mulai button showing a 5-to-1 countdown. The countdown MUST start exactly one round automatically at zero if untouched; activating Mulai MUST cancel auto-start and start one round immediately. Repeated starts while playing MUST NOT reset or duplicate loops. Starting a new round after a result MUST use new identities and reset its deadline, score, counters, queue, feedback, and locks. The result screen MUST show `Waktu Habis!`, raw score, served count, wrong count, and `Cepat itu penting. Tepat melayani adalah tanggung jawab kita.` Per the latest product-owner decision, it MUST NOT show “Main Lagi”; it MUST show a Lanjut action. Activating Lanjut MUST emit exactly one `accountability` result with an integer score from 0 to 100 and MUST complete the stage through the existing game contract. The game MUST NOT mutate prior results or other stages. Replaying the complete experience starts from the journey's first mini-game.

#### Scenario: L22 and U14 - untouched countdown starts one round
- **WHEN** the start screen countdown displays 5, 4, 3, 2, 1 and receives no activation until zero
- **THEN** exactly one round starts and the start countdown is not included in its 20-second duration

#### Scenario: L23 - manual start cancels auto-start
- **WHEN** Mulai is activated before the countdown reaches zero and the old countdown deadline later passes
- **THEN** the countdown is cancelled and no second round starts

#### Scenario: L20 - repeated start during play is harmless
- **WHEN** start is requested again while the round is playing
- **THEN** the round identity, deadline, score, buyer, and active update loop remain unchanged

#### Scenario: L19 - a new round cannot receive stale callbacks
- **WHEN** a result is followed by a newly started round and an action or callback from the old round arrives
- **THEN** the new round remains unchanged by the stale action or callback

#### Scenario: U08 - a player may replay only from the first mini-game
- **WHEN** the Accountability result is continued and the player later chooses to replay the experience
- **THEN** the hub advances from Accountability and any full-run replay begins at the first mini-game; Kasir Sat Set presents no in-game replay action

#### Scenario: U12 - Lanjut completes the Accountability stage once
- **WHEN** the result is displayed and the player activates Lanjut
- **THEN** one normalized integer score in 0–100 is emitted for `accountability`, the hub advances once, and the completed result cannot be emitted again

### Requirement: Raw game performance maps deterministically to the hub score
The game MUST preserve and display its raw round score and MUST provide the shared journey only one integer score in the contract range 0–100. The mapping MUST be `clamp(round(rawScore * 100 / 1670), 0, 100)`, where 1,670 is the theoretical maximum of 167 correct answers at the 120 ms correct lock during a 20-second round. The mapping MUST NOT alter the game's scoring, feedback, or displayed raw result.

#### Scenario: Hub score mapping preserves boundaries and integer output
- **WHEN** a player continues from results with raw scores at the minimum, an intermediate value, and the theoretical maximum or higher
- **THEN** the game displays the respective raw score and emits only integer contract scores 0, an in-range proportional value, and 100

### Requirement: Visual presentation follows the Kasir Sat Set product direction
The interface MUST be in Indonesian, depict an original 2D Indonesian warung and at least six distinguishable anonymous character variations, and keep the active request, queue, time, score, and three controls visible during play at target viewports. The active request MUST show both its sentence and payment label. The interface MUST use the blue, white, and yellow palette `#00549A`, `#003E73`, `#F8FAFC`, and `#FFC629` (adjustable for contrast), without a BRI logo or claim of official affiliation. It MUST use AU Passata from a locally available, licensed, web-embeddable font file when provided. If unavailable, it MUST use Arial/sans-serif and MUST NOT claim identical typography. No font or asset may be fetched from a CDN or unofficial source.

#### Scenario: U06 and U13 - target viewports retain the full playable layout
- **WHEN** play is rendered at the desktop targets 1280×720 and 1440×900
- **THEN** time, score, active request, three buyers, and ordered payment controls remain visible without clipping, overlap, or scrolling; narrower viewports retain all controls without horizontal clipping and may scroll vertically

#### Scenario: U15 - buyers remain anonymous in every state
- **WHEN** the game shows active, waiting, transitioned, or completed buyers
- **THEN** no buyer name or identifying number is shown

#### Scenario: U16 - licensed font and palette are reported honestly
- **WHEN** a licensed local AU Passata font is available, or is absent
- **THEN** the local licensed face is used in the first case; otherwise the declared Arial/sans-serif fallback is used and identical typography is not claimed; the palette remains within the blue/white/yellow direction without official logos

### Requirement: Input, accessibility, and motion work across supported devices
The game MUST support pointer, touch, Tab, Enter, and Space on native payment buttons in fixed order. One activation MUST be evaluated once; keyboard auto-repeat MUST NOT repeat a held-key activation; separate physical clicks remain separate attempts subject to lock and deadline. Each payment control MUST have an accessible method name, at least 48×48 CSS px target, visible focus, and at least 4.5:1 contrast for normal text. The page language MUST be Indonesian. Buyer requests and action feedback MUST be announced without announcing the timer every frame or second. Focus MUST remain or be restored appropriately after locks, move to the results area when results appear, and make Lanjut reachable. The layout MUST honor `prefers-reduced-motion` without changing logical timer or locks, and MUST NOT disable browser zoom. Outside target viewports, vertical scrolling MAY be used but horizontal clipping MUST NOT prevent control access.

#### Scenario: U03 and U05 - pointer and keyboard produce one valid choice
- **WHEN** the player clicks, taps, tabs to, and activates each payment control with Enter or Space
- **THEN** each single activation is handled once, the visible focus remains usable, and holding a key does not create repeated choices

#### Scenario: U04 - old or locked gestures cannot score a new buyer
- **WHEN** a gesture starts during a lock or for the previous buyer and is released after a lock or queue transition
- **THEN** that gesture is discarded rather than applied to a newly active buyer

#### Scenario: U05 - keyboard focus survives the lock and reaches results
- **WHEN** a focused payment choice is accepted and then a lock or timeout occurs
- **THEN** focus is not lost during the lock and moves to the result heading/area on timeout, with Lanjut available by keyboard

#### Scenario: U06 - targets, contrast, and zoom remain accessible
- **WHEN** the desktop target viewports and payment controls are inspected
- **THEN** payment targets are at least 48×48 CSS px, normal text contrast is at least 4.5:1, labels fit, and browser zoom remains available

#### Scenario: U11 - reduced motion affects visuals only
- **WHEN** the operating system requests reduced motion
- **THEN** decorative motion is reduced while the 20-second deadline and 120/500 ms locks remain unchanged

### Requirement: Correct-answer effects are local, bounded, and exclusive
An accepted correct choice MUST show a checkmark, exactly three `$` glyphs floating from the specified 43%, 56%, and 69% horizontal positions for 850 ms, and synthesize the short 370 ms “cring” with local Web Audio. Wrong, rejected, locked, or stale input MUST NOT trigger these effects. Effects MUST NOT change the 120 ms input lock. All artwork and audio behavior MUST work without network requests or external services.

#### Scenario: U15 - only an accepted correct answer triggers success effects
- **WHEN** correct, wrong, locked, invalid, and stale actions are processed
- **THEN** only the accepted correct action produces the checkmark, three `$` effects, and one local sound, without extending its lock

#### Scenario: U10 - runtime assets do not depend on external origins
- **WHEN** the game is played and its runtime requests are inspected
- **THEN** all game assets and effects are local and no CDN or external asset/service request is required

### Requirement: The game is self-contained, testable, and documented
The Accountability game MUST run without a backend, database, account, leaderboard write, real payment, analytics, tracking, device permission, music, or runtime download. It MUST retain game state only in memory, export one component compatible with the existing game contract, call `onComplete` only after an actual completed round is continued, call `onCancel` for an early exit, and call `onError` on failure without awarding a score. The change MUST update only the Accountability game area and the single Accountability registry entry needed to expose it. Its README MUST document controls, scoring, provenance and license/permission/attribution/usage for every added asset, commands, and the AU Passata prerequisite. Focused deterministic unit and integration tests MUST cover the scenarios in this specification and the implementation MUST be verifiable with the repository's typecheck, test, and build commands.

#### Scenario: U09 and U10 - the registered production game plays without service dependencies
- **WHEN** the Accountability slot is enabled and the production build is served locally
- **THEN** the playable component loads, completes, hands off a validated score, and requires no game backend or external runtime asset

#### Scenario: Cancellation or failure awards no score
- **WHEN** the player exits before completing a round or the game encounters a handled failure
- **THEN** the game calls the corresponding non-scoring contract callback and does not complete the Accountability stage

#### Scenario: U16 - asset provenance and font prerequisite are documented
- **WHEN** the Accountability README and asset manifest are reviewed
- **THEN** every added asset has an author/source, license or permission, attribution requirement, and usage, and AU Passata is explicitly marked as a licensed local asset prerequisite if unavailable

## Validation Scenario Coverage

The L01–L23 scenarios above are the deterministic logic-test plan: L01 queue/session initialization; L02 each correct method; L03 wrong choice; L04 per-decision floor; L05 mixed scoring sequence; L06 lock rejection; L07 120 ms transition boundary; L08 500 ms wrong-lock boundary; L09/L10 strict deadline; L11/L12 timeout during lock and accepted-score preservation; L13 idempotent finalization; L14 clock jump; L15 RNG index boundaries; L16 independent selection; L17 no hidden rerolls; L18 stale session/customer and invalid method; L19 replay/reset stale callbacks; L20 repeated start; L21 FIFO after wrong then correct; L22 auto-start; and L23 manual cancellation of auto-start.

The U01–U16 scenarios above are the browser/integration plan: U01 start screen; U02 idle timeout; U03 pointer/touch/payment choices; U04 double/locked/quick and stale gesture handling; U05 keyboard/focus/auto-repeat; U06 desktop target viewports, contrast, text fit, and controls; U07 hidden-tab deadline; U08 full journey replay from its first game; U09 local production build; U10 console/assets/network independence; U11 reduced motion; U12 frozen result and single handoff; U13 visible FIFO anonymous queue; U14 start-only content and countdown; U15 exclusive effects and anonymity; U16 local font, palette, and asset provenance. These are planned checks and MUST NOT be reported as run until actually executed.