# Accountability Game Asset Manifest

All game-specific visuals and effects are available locally at runtime; custom scene art is authored in this project. The background music reuses the project's locally bundled CC0 track. No BRI logo, Vantis reference art, remote image, or CDN font is used.

| Asset | Author / source | License or permission | Attribution | Usage | Status |
| --- | --- | --- | --- | --- | --- |
| Warung, shelf, cashier, counter, and request bubble | Original CSS in `accountability-game.css` and markup in `AccountabilityGame.tsx` | Project-authored code; no third-party asset or redistribution permission required | None | Local play scene and active request presentation | Implemented |
| Six buyer character variations | Original data in `customers.ts` and SVG geometry in `CharacterPortrait.tsx` | Project-authored code; no third-party asset or redistribution permission required | None | Anonymous FIFO queue | Implemented |
| Payment object illustrations | Original local SVGs: `payment-qris.svg`, `payment-cash.svg`, `payment-edc.svg` | Project-authored vector artwork; no third-party asset dependency | None | Transparent acrylic QR stand, cash register with drawer, and card terminal; imported by Vite for production bundling | Implemented |
| Payment method symbols | `Banknote`, `CreditCard`, and `QrCode` from existing `lucide-react` 1.48.0 | ISC; existing package dependency, no new runtime package | No icon-specific UI attribution; retain the package license notice | Start-screen method guide and buyer tokens | Implemented |
| Success “cring” sound | Oscillator/gain synthesis in `effects.ts` using browser Web Audio | Generated at runtime; no third-party recording or sound file | None | Accepted correct answers only | Implemented |
| Shared background music | `../integrity/assets/integrity-bgm.m4a`, "Level 1" from "5 Chiptunes (Action)" by Juhani Junkala (SubspaceAudio), https://opengameart.org/content/5-chiptunes-action | CC0 | None required | Looping music during the round, with the shared mute preference | Implemented |
| AU Passata typeface | Official font file not present in either project; supplier/source and license not yet available | Requires verified license permitting local web embedding and any required distribution before adding a file | Follow the eventual license terms | Primary typeface when licensed file is supplied | **Blocked; do not source unofficially** |
| Arial/sans-serif fallback | System/browser font stack | System-provided; no bundled file | None | Preview fallback while AU Passata is unavailable | Available; not typographically identical |

Before registering the game, verify each implemented asset against its permission/license terms. Do not claim AU Passata is loaded or visually identical while its licensed file is absent.

The QR motif is decorative artwork and contains no payment destination. Payment illustrations have transparent backgrounds, dark blue outlines, and their own ground shadows; their button names are supplied by the component for assistive technology.
