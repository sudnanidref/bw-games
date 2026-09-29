# BRILiaN Way Arcade Journey

A desktop-first shell for five independent mini-games in the fixed order Integrity, Collaborative, Accountability, Growth Mindset, and Customer Focus. The game slots are intentionally unavailable until their owners implement them through separate OpenSpec changes. No placeholder results are submitted to the leaderboard.

## Local development

Requires Node.js 22+ and npm. Run `npm ci`, then `npm run dev`. Open http://127.0.0.1:5173/; the API runs on http://127.0.0.1:3001/ and Vite proxies `/api` requests. Check `curl http://127.0.0.1:3001/api/health` for `{"status":"ok"}`. Run `npm run typecheck`, `npm test`, and `npm run build` before integration.

For production, `npm run build` creates `dist/` for a static web host and `dist-server/` for the Node API (`npm start`). Proxy `/api` to the API service on `PORT` (default 3001); configure `HOST` if binding beyond localhost is required. Keep the SQLite data directory writable and persistent. Do not publish a leaderboard as an authenticated or prize-grade ranking.

Game contribution details: [docs/contributing-games.md](docs/contributing-games.md). Visual direction and asset policy: [docs/design-system.md](docs/design-system.md). Leaderboard operations: [docs/leaderboard.md](docs/leaderboard.md).