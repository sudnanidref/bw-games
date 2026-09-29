import Fastify from 'fastify'
import rateLimit from '@fastify/rate-limit'
import type Database from 'better-sqlite3'
import { parseSubmission, type LeaderboardEntry, type Submission } from '../src/leaderboard'

interface EntryRow {
  id: number
  run_id: string
  player_name: string
  results_json: string
  total: number
  completed_at: string
}

function toEntry(row: EntryRow): LeaderboardEntry {
  return {
    id: row.id,
    playerName: row.player_name,
    results: JSON.parse(row.results_json) as LeaderboardEntry['results'],
    total: row.total,
    completedAt: row.completed_at,
  }
}

export async function createApp(database: Database.Database, now = () => new Date()) {
  database.exec(`CREATE TABLE IF NOT EXISTS leaderboard (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    run_id TEXT NOT NULL UNIQUE,
    player_name TEXT NOT NULL,
    results_json TEXT NOT NULL,
    total INTEGER NOT NULL,
    completed_at TEXT NOT NULL
  )`)
  const app = Fastify({ bodyLimit: 16_384 })
  await app.register(rateLimit, { global: false })

  app.get('/api/health', async () => ({ status: 'ok' }))
  app.get('/api/leaderboard', async () => {
    const rows = database.prepare('SELECT * FROM leaderboard ORDER BY total DESC, completed_at ASC, id ASC LIMIT 50').all() as EntryRow[]
    return rows.map(toEntry)
  })

  app.post('/api/leaderboard', { config: { rateLimit: { max: 10, timeWindow: '1 minute' } } }, async (request, reply) => {
    const submission = parseSubmission(request.body)
    if (!submission) return reply.code(400).send({ error: 'Invalid completed run' })

    const find = database.prepare('SELECT * FROM leaderboard WHERE run_id = ?')
    const existing = find.get(submission.runId) as EntryRow | undefined
    if (existing) {
      if (existing.player_name !== submission.playerName || existing.results_json !== JSON.stringify(submission.results)) {
        return reply.code(409).send({ error: 'Run ID already used' })
      }
      return toEntry(existing)
    }

    database.prepare('INSERT INTO leaderboard (run_id, player_name, results_json, total, completed_at) VALUES (?, ?, ?, ?, ?)')
      .run(submission.runId, submission.playerName, JSON.stringify(submission.results), submission.total, now().toISOString())
    return reply.code(201).send(toEntry(find.get(submission.runId) as EntryRow))
  })

  return app
}

export type { Submission }