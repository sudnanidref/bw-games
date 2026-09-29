# Customer Focus

Owner boundary: `src/games/customer-focus/`. Do not edit another value's code, the shared journey, or leaderboard to award points.

**Change:** `customer-focus-match-the-solution` (proposal, spec, design, and tasks). The Customer Focus slot is enabled after content approval and focused integration checks.

## Play and score

For a standalone local trial, run `npm run dev:web` and open `http://127.0.0.1:<Vite port>/?preview=customer-focus` (the currently running server uses port 5174). This development-only view runs the same game without waiting for the first four stages. It supports replay and cancellation, and keeps the result locally; it does not submit scores to the journey or leaderboard. Use **Kembali ke hub** to leave the preview.

Three stationary customer situations appear on the left; three approved responses and three reviewed distractors cycle through a clipped right-side lane in a new shuffled order on each play. The local Begin button starts a 45-second round. With a pointer, catch a moving card and drag it onto a situation. With a keyboard, Tab to any solution (including one offscreen) and press Enter or Space, then select a situation the same way. Hover, focus, selection and drag pause the lane, not the clock; cards missed without a drop return on the next cycle without a penalty. The circuit takes 12, then 10, then 8 seconds as pairs lock. A correct pair locks beside its customer and raises the visible streak; a wrong pairing returns to the lane, resets the streak and counts one wrong attempt. Releasing a drag elsewhere does not count. Reduced-motion preference presents all six cards stationary. Cancel while ready or playing leaves without points.

The round ends after three correct pairs or at the deadline. The frozen result displays the number matched and score; Continue sends the score once through `onComplete({ valueId: context.valueId, score })`. The rubric is `max(0, min(100, 20 * correctPairs + (correctPairs === 3 ? floor(40 * remainingMs / 45000) : 0) - 5 * incorrectAttempts))`, where remaining milliseconds are clamped to 0..45000. Timeout has no speed bonus; incomplete rounds, including a score of 0, are completed results. `onCancel` and `onError` award no points. This component never alters previous stage results or leaderboard data.

## Content review

**Approved 2026-09-29.** Reviewer: the project user who explicitly replied "setuju" to the approval request in this conversation; no personal name or job title was provided. Approved wording (as in `cases.ts`):

- Nasabah lansia bingung saat masuk ke layanan digital. -> Dampingi nasabah memahami langkah masuk melalui panduan resmi.
- Merchant mengalami kendala saat menerima pembayaran QRIS. -> Bantu periksa kendala QRIS dan arahkan ke dukungan atau opsi pembayaran yang tersedia.
- Nasabah melihat status transfer masih pending. -> Bantu periksa status transaksi melalui kanal resmi sebelum menentukan langkah berikutnya.

These are first-contact directions, not a transaction resolution guarantee or a request for credentials. No operational instructions beyond this approved wording are shipped.

**Arcade distractors approved 2026-09-29.** Reviewer: the project user, who replied "ya" when asked to approve all three exact sentences in this conversation; no personal name or job title was provided. Approved wording (in `draft-distractors.ts`, used by the arcade round):

- Bagikan petunjuk login, lalu persilakan nasabah melanjutkan tanpa pendampingan.
- Catat laporan QRIS untuk tindak lanjut nanti tanpa memeriksa kendala saat itu.
- Jelaskan alur transfer secara umum tanpa memeriksa status transaksi.

These are intentionally inadequate first responses for all three situations; they are not instructions to collect credentials or promises of a banking outcome.

## Asset manifest

No new imported images, audio, logos, or fonts. The interface uses existing project fonts and CSS tokens; icons come from the existing `lucide-react` dependency (Lucide contributors, ISC license, no attribution required, used for timer, grip, check, navigation and cancel). Do not reuse Vantis assets or official BRI logos without permission.

## Verification

- [x] Arcade controls, scoring, and OpenSpec change documented.
- [x] Case, scoring, and component tests pass; integrated shell checked at 1280x720 and 1440x900 with pointer dragging, keyboard focus, reduced motion, and a real fifth-stage score.
- [x] Project user has approved the exact case/response wording (record above).
- [x] Registry enabled only after approval and integration checks.
- [x] `npm run typecheck`, `npm test`, and `npm run build` pass with the five-stage journey.