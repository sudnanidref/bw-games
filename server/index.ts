import { mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import Database from 'better-sqlite3'
import { createApp } from './app'

// The SQLite driver segfaults on older Node releases, which silently kills the
// API (every /api call then returns 500). Stop early with an actionable message.
const [major, minor] = process.versions.node.split('.').map(Number)
if (major < 22 || (major === 22 && minor < 22)) {
  console.error(`\n[api] Node ${process.versions.node} is not supported. Use Node 22.22.2 or newer (e.g. "nvm use"), then restart "npm run dev".\n`)
  process.exit(1)
}

const dataFile = resolve(process.env.DATA_FILE ?? 'data/leaderboard.db')
mkdirSync(dirname(dataFile), { recursive: true })
const database = new Database(dataFile)
const app = await createApp(database)

await app.listen({ host: process.env.HOST ?? '127.0.0.1', port: Number(process.env.PORT ?? 3001) })
