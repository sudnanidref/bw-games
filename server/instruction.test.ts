import Database from 'better-sqlite3'
import { describe, expect, it, vi } from 'vitest'
import { createApp } from './app'

const body = { roundId: 7, instruction: 'Put blue circle at top left', board: [], transcript: [{ speaker: 'teammate', text: 'Ready.' }] }

describe('POST /api/instruction', () => {
  it('uses the deterministic interpreter and echoes the round ID', async () => {
    const database = new Database(':memory:')
    const app = await createApp(database, undefined, () => null)
    try {
      const response = await app.inject({ method: 'POST', url: '/api/instruction', payload: body })
      expect(response.statusCode).toBe(200)
      expect(response.json()).toMatchObject({ roundId: 7, outcome: { type: 'action', action: { type: 'place', object: { row: 0, column: 0 } } } })
    } finally { await app.close(); database.close() }
  })

  it('rejects target data, invalid board, transcript and malformed JSON before calling the provider', async () => {
    const database = new Database(':memory:')
    const getProvider = vi.fn()
    const app = await createApp(database, undefined, getProvider)
    try {
      for (const payload of [
        { ...body, target: [] }, { ...body, board: [{ shape: 'circle', color: 'blue', row: 5, column: 0 }] },
        { ...body, transcript: [{ speaker: 'system', text: 'wrong' }] },
      ]) expect((await app.inject({ method: 'POST', url: '/api/instruction', payload })).statusCode).toBe(400)
      expect((await app.inject({ method: 'POST', url: '/api/instruction', headers: { 'content-type': 'application/json' }, payload: '{bad' })).statusCode).toBe(400)
      expect(getProvider).not.toHaveBeenCalled()
    } finally { await app.close(); database.close() }
  })

  it('returns a recoverable failure for provider errors or unsafe outcomes', async () => {
    const database = new Database(':memory:')
    const provider = { requestOutcome: vi.fn().mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce({ type: 'action', action: { type: 'clear' } }) }
    const app = await createApp(database, undefined, () => provider)
    try {
      for (let index = 0; index < 2; index += 1) {
        const response = await app.inject({ method: 'POST', url: '/api/instruction', payload: body })
        expect(response.statusCode).toBe(503)
        expect(response.json().error).toMatch(/board was not changed/)
      }
    } finally { await app.close(); database.close() }
  })
})