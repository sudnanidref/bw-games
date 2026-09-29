# Accountability Game Asset Manifest

All game-specific visuals and effects are available locally at runtime; custom scene art is authored in this project. No BRI logo, Vantis reference art, remote image, CDN font, or downloaded sound is used.

| Asset | Author / source | License or permission | Attribution | Usage | Status |
| --- | --- | --- | --- | --- | --- |
| Warung, shelf, cashier, counter, and request bubble | Original CSS in `accountability-game.css` and markup in `AccountabilityGame.tsx` | Project-authored code; no third-party asset or redistribution permission required | None | Local play scene and active request presentation | Implemented |
| Six buyer character variations | Original data in `customers.ts` and SVG geometry in `CharacterPortrait.tsx` | Project-authored code; no third-party asset or redistribution permission required | None | Anonymous FIFO queue | Implemented |
| Payment method symbols | `Banknote`, `CreditCard`, and `QrCode` from existing `lucide-react` 1.48.0 | ISC; existing package dependency, no new runtime package | No icon-specific UI attribution; retain the package license notice | TUNAI, EDC, and QRIS controls/tokens | Implemented |
| Success “cring” sound | Oscillator/gain synthesis in `effects.ts` using browser Web Audio | Generated at runtime; no third-party recording or sound file | None | Accepted correct answers only | Implemented |
| AU Passata typeface | Official font file not present in either project; supplier/source and license not yet available | Requires verified license permitting local web embedding and any required distribution before adding a file | Follow the eventual license terms | Primary typeface when licensed file is supplied | **Blocked; do not source unofficially** |
| Arial/sans-serif fallback | System/browser font stack | System-provided; no bundled file | None | Preview fallback while AU Passata is unavailable | Available; not typographically identical |

Before registering the game, verify each implemented asset against its permission/license terms. Do not claim AU Passata is loaded or visually identical while its licensed file is absent.