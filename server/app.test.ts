import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import Database from 'better-sqlite3'
import { afterEach, describe, expect, it } from 'vitest'
import { gameSlots } from '../src/games/slots'
import { createApp } from './app'

const folders: string[] = []
afterEach(() => { for (const folder of folders.splice(0)) rmSync(folder, { recursive: true, force: true }) })

const results = gameSlots.map((game, index) => ({ valueId: game.id, score: index * 20 }))
const submission = (runId: string) => ({ runId, playerName: '  Ayu  ', results, total: 200, completedAt: '2020-01-01T00:00:00.000Z' })
const firstId = '11111111-1111-1111-1111-111111111111'
const secondId = '22222222-2222-2222-2222-222222222222'

describe('leaderboard API', () => {
  it('stores completed runs, deduplicates retries, and persists ordered rankings', async () => {
    const folder = mkdtempSync(join(tmpdir(), 'bw-games-'))
    folders.push(folder)
    const path = join(folder, 'leaderboard.db')
    const database = new Database(path)
    const app = await createApp(database, () => new Date('2026-01-01T00:00:00Z'))
    const first = await app.inject({ method: 'POST', url: '/api/leaderboard', payload: submission(firstId) })
    expect(first.statusCode).toBe(201)
    expect(first.json()).toMatchObject({ playerName: 'Ayu', total: 200, completedAt: '2026-01-01T00:00:00.000Z' })
    expect((await app.inject({ method: 'POST', url: '/api/leaderboard', payload: submission(firstId) })).statusCode).toBe(200)
    await app.close()
    database.close()

    const reopened = new Database(path)
    const nextApp = await createApp(reopened, () => new Date('2026-01-02T00:00:00Z'))
    await nextApp.inject({ method: 'POST', url: '/api/leaderboard', payload: { ...submission(secondId), playerName: 'Bima' } })
    const list = (await nextApp.inject('/api/leaderboard')).json()
    expect(list.map((entry: LeaderboardRow) => entry.playerName)).toEqual(['Ayu', 'Bima'])
    expect(list).toHaveLength(2)
    await nextApp.close()
    reopened.close()
  })

  it('rejects incomplete, wrong-order, invalid, tampered and reused-ID entries', async () => {
    const database = new Database(':memory:')
    const app = await createApp(database)
    const invalid = [
      { ...submission(firstId), results: results.slice(0, 4) },
      { ...submission(firstId), results: [...results].reverse() },
      { ...submission(firstId), results: results.map((result, index) => index === 0 ? { ...result, score: 101 } : result) },
      { ...submission(firstId), total: 199 },
      { ...submission(firstId), playerName: ' ' },
      { ...submission(firstId), playerName: '<script>'.repeat(4) },
    ]
    for (const payload of invalid) {
      expect((await app.inject({ method: 'POST', url: '/api/leaderboard', payload })).statusCode).toBe(400)
    }
    expect((await app.inject('/api/leaderboard')).json()).toEqual([])
    expect((await app.inject({ method: 'POST', url: '/api/leaderboard', payload: submission(firstId) })).statusCode).toBe(201)
    expect((await app.inject({ method: 'POST', url: '/api/leaderboard', payload: { ...submission(firstId), playerName: 'Other' } })).statusCode).toBe(409)
    await app.close()
    database.close()
  })
})

interface LeaderboardRow { playerName: string }