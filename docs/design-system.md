# BRILiaN Way arcade direction

The five values form one journey with five distinct stops, not five unrelated sites. The shell owns the route, stage labels, short pre-game goal, persistent score/status HUD, result handoff, and leaderboard. Each developer can invent a different mechanic inside the shared play area.

## Visual language

- Use the CSS variables in `src/styles.css`: cool mint canvas `--canvas`, paper `--paper`, deep green ink `--ink`, restrained dividers `--line`, and a separate accent for each value. Use accents for value identity and interactive highlights, not as full-page backgrounds.
- Use Barlow Condensed bold for large value names and numerical score, DM Sans for instructions and controls. Provide local sans-serif fallbacks if web fonts cannot load. Keep letter spacing at zero.
- Favor blocky silhouette, clear strokes, tight HUD labels, and concise action verbs. Draw original route markers and game art; do not recreate Kampung Bash's screens, logos, characters, or sprites.
- The desktop play stage should remain legible at 1280x720 and 1440x900 with an unframed play area. At narrower widths, preserve reading order and avoid horizontal clipping; mobile gameplay is not a target for this phase.
- Use shared 4/8/12/16/24/32px spacing increments. Repeated HUD indicators and controls need stable dimensions so scores cannot shift their layout.
- A 180-260ms entrance or stage handoff can make progression visible. Avoid constant motion in status UI; honor `prefers-reduced-motion` and provide mute controls before adding audio.
- Keyboard and pointer controls need the same documented action, visible focus, and readable pre-game instructions. Do not rely on color alone for completed/current/locked stage status.

## Asset provenance

The Kampung Bash reference at https://game.vantis.sh/game-07 informs only the rhythm observed in its title, short rules, goal, play, and feedback. Never download, hotlink, trace, or package its art, fonts, sound, UI, code, or branding. Each game README records the author/source, license or permission, attribution requirement, and usage of every imported asset. Use original artwork or explicitly licensed assets only; do not include official BRI logos without brand approval.

## Game handoff

Keep the shell HUD and ordered route visible around each game. A game may change its own accent-led scenery and controls, but it must present its goal before play and return one validated score (0-100) or a non-scoring exit. The shell presents the next value and accumulated real results after each completion.