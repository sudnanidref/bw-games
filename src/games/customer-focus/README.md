# Customer Focus — Meja Layanan

Revamps the earlier `customer-focus-match-the-solution` game into a customer service shift. `MatchTheSolution` remains the exported entry point for compatibility with the existing fifth-stage registry and development preview.

## Play and score

Run `npm run dev` and open `http://127.0.0.1:5173/?preview=customer-focus` to play directly. The preview can restart and holds results locally. The game fills the browser viewport: the lobby is the full-screen backdrop, with the customer, speech bubble, counter, deck, and card hand layered inside the same scene. The journey behind it is restored when the game exits.

Start a six-customer shift. Each customer has exactly 10 seconds for both card choices; there is no overall shift timer. Six encounters feature angry, confused, and anxious customers. Read each speech bubble and choose one of three portrait playing cards using pointer, touch, or Tab and Enter/Space. The desktop hand is fanned: hovering or focusing a card raises, straightens, and enlarges it above its neighbours with a generated selection halo. Click or press Enter/Space to play it. Small screens use a horizontally scrollable hand with full readable cards. A generated card back is used for the visible deck and played-card animation. Each customer needs two correct decisions: understand the concern, then offer an appropriate next step. A wrong card is disabled for that step, gives explanatory feedback, deducts five points, and permits a retry. Correct responses advance the dialogue. Each wrong card changes the customer to a generated angry expression; each correct card changes them to a generated happy expression. Expressions persist after the short VFX animation ends, and each new arrival starts in their original mood. The mood badge and image description follow the visible expression. A resolved customer remains visible until the player chooses the next customer.

At 3 seconds remaining, the clock and patience bar turn orange/red and a warning appears. At zero, cards lock and the angry customer performs a 1.4-second generated punch/kick animation with a screen impact and a 10-point penalty, then leaves automatically. The next customer starts with a fresh 10-second deadline. Successfully resolved cases stop their timer while the player reads the resolution and chooses the next customer. The shift ends after all six customers have either been served or timed out. Score is `clamp(round(resolvedCustomers / 6 * 100) - 5 * mistakes - 10 * timeouts, 0, 100)`. There are no hearts, injuries, or health mechanics. Partial conversations do not earn completion credit. The deadline is checked both by the timer and before accepting input. Continue submits exactly one result via the existing game contract. Cancel and unmount stop music; cancellation awards no points. Prior game results and leaderboard logic are unchanged.

## Content review

The scenarios in `service.ts` are newly authored for this revamp, requested by the user on 2026-10-16. The previous game's copy approval does not represent approval of these new scenarios. Topics: pending transfers, digital payments, QRIS reconciliation, fees, account recovery, and complaint tracking. Correct answers emphasize empathy, official verification, confidential credentials, and realistic follow-up. Incorrect cards are explicitly inadequate choices and receive corrective feedback. No specific bank turnaround times are promised.

## Asset manifest

The initial ten raster assets were generated with the built-in image generation tool on 2026-10-16, replacing the initial painterly set at the user's request. All are saved under `public/assets/customer-focus/`. The supplied mascot image is a style reference for cute toy-like low-poly proportions, simple faces, matte materials, and blue/white/orange accents. No mascot or logo is reproduced.

- `lobby.png`: bright miniature bank lobby, rounded blue/cream architecture, windows, waiting bench, and chunky plants.
- `counter.png`: separate chunky blue-and-white counter, orange stripe, plant, and receipt tray; generated transparency.
- `angry.png`: annoyed chibi woman in an orange cardigan with a phone; generated transparency.
- `confused.png`: puzzled chibi elderly man with gray hair, blue glasses, mint shirt and phone; generated transparency.
- `worried.png`: anxious chibi merchant wearing a cream hijab and blue blouse, holding a receipt and phone; generated transparency.
- `angry-happy.png`, `confused-happy.png`, `worried-happy.png`: happy expressions edited from the original character sprites, preserving identity, pose, framing, and transparent backgrounds.
- `confused-angry.png`, `worried-angry.png`: angry expressions edited from the original sprites; Bu Rina reuses her already-angry original.
- `card-face.png`: portrait playing-card front with a blue/orange frame, headset motif and blank cream center for readable HTML action text.
- `card-back.png`: coordinating blue playing-card back with a centered headset/heart emblem.
- `angry-attack.png`, `confused-attack.png`, `worried-attack.png`: generated slapstick punch/kick poses preserving each customer identity and cute low-poly style.
- `fx-impact.png`: generated orange/gold impact burst, blue shockwave and white motion streaks, on transparency.
- `fx-select.png`: blue swoosh and gold sparkle halo for hover/focus selection; generated transparency.
- `fx-success.png`: puffy orange hearts, gold stars and blue confetti for a correct response; generated transparency.
- `fx-error.png`: gentle coral comic burst and droplets for a wrong choice; generated transparency.

The five expression variants were created with the built-in image generator. The complete generation prompts are preserved in `public/assets/customer-focus/PROMPTS.md`. Scene objects, characters, card backgrounds, and interaction effect art are generated images. CSS controls their arrangement and animation. Success/error effects expire after 1.1 seconds, do not intercept input, and do not change scoring. Persistent text feedback remains after effects disappear. Reduced motion disables dealing, flying cards, shaking, bouncing, attack lunges, camera shake, and moving VFX; the timeout penalty and queue transition still occur on time, with a static attack pose and impact; cards retain their focus indication and static generated art.

Music reuses the shared CC0 `../integrity/assets/integrity-bgm.m4a` ("Level 1", Juhani Junkala/SubspaceAudio, https://opengameart.org/content/5-chiptunes-action). `useGameMusic` preserves shared mute preference. Controls use existing ISC-licensed Lucide icons.

## Verification

Component tests cover the full queue, keyboard retry, wrong-answer penalties, timeout and late-input handling, score bounds, one-time completion, cancellation, and preview restart. Run `npm run typecheck`, `npm test`, and `npm run build` from the project root. Original matching rule tests remain as regression coverage for the retired standalone rules; the new game uses `service.ts`.

Latest verification: TypeScript checks and production build passed; 210 tests passed across 30 files. Browser checks at 1280×720 and 390×844 covered the full-screen composition, portrait cards, hover lift and selection halo, scrolling mobile hand, generated wrong-choice feedback, and reduced-motion settings. A real browser run completed all 12 decisions and submitted a 100/100 preview result; every action card fit its frame, all scene/card images loaded, and background scrolling was restored after exit. The browser console only reported the pre-existing missing favicon.

Expression update verification: component coverage checks angry and happy portraits for all six encounters, persistent expressions after the VFX timeout, and initial mood restoration on the next customer. Browser verification uses an isolated headless Playwright process, leaving desktop windows untouched.

Expression update result: all 211 tests passed and the production build passed. Isolated headless Playwright verified both decision steps for Bu Rina, Pak Budi, and Mbak Sari: generated angry and happy images loaded, expressions remained after VFX disappeared, and new arrivals reset to their original mood. The scene also remains fixed when cards receive focus (artwork clips without creating a scrollable inner scene). No browser page errors occurred. All five generated variants retain the original 1212×1298 RGBA canvas.

Timeout update verification: all 216 tests across 31 files passed, TypeScript checks and the production build passed. Isolated headless Playwright checked the shared 10-second deadline, warning at 3 seconds, stopped timer on successful resolution, the generated attack pose and impact, a single 10-point timeout penalty, locked cards during attack, automatic next arrival with a fresh clock, reduced-motion behavior on a 390×844 viewport, and final score submission after six customers. No browser page errors occurred. Generated attack sprites and VFX retain RGBA transparency and are included in the production output.

Success layout fix: scene phases use `cf-phase-*` classes, separate from the `cf-resolved` confirmation panel, so completing a case cannot apply the panel's 630px width limit to the full-screen scene. Headless Playwright completed all six customers at 1280×720, 390×844, and 320×568, verifying unchanged scene dimensions, usable Next/Finish controls, and a final 100/100 result. All 22 focused tests and the production build passed.
