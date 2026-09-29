import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Database from 'better-sqlite3'
import { createApp } from '../server/app'
import type { GameProps } from './games/contract'
import { App } from './App'

const gameMode = vi.hoisted(() => ({ useRealCollaborative: false }))

vi.mock('./games', async (importOriginal) => {
  const original = await importOriginal<typeof import('./games')>()
  return {
    ...original,
    games: original.games.map((game) => ({
      ...game, available: true, briefing: 'Selesaikan tantangan.',
      component: (props: GameProps) => {
        const RealGame = game.component
        return game.id === 'collaborative' && gameMode.useRealCollaborative && RealGame
          ? <RealGame {...props} />
          : <button onClick={() => props.onComplete({ valueId: props.context.valueId, score: 20 })}>Selesaikan {props.context.valueId}</button>
      },
    })),
  }
})

afterEach(() => { cleanup(); vi.unstubAllGlobals(); gameMode.useRealCollaborative = false })

const fakeFetch = vi.fn(async (url: string, options?: RequestInit) => {
  if (options?.method === 'POST') return { ok: false, status: 503 }
  if (url === '/api/leaderboard') return { ok: true, json: async () => [{ id: 1, playerName: '<img src=x onerror=alert(1)>', total: 100, results: [], completedAt: '' }] }
  return { ok: false }
})

describe('shell leaderboard flow', () => {
  it('unlocks the real Collaborative game only after Integrity and preserves a non-scoring cancel', async () => {
    gameMode.useRealCollaborative = true
    vi.stubGlobal('crypto', { randomUUID: () => '11111111-1111-1111-1111-111111111111' })
    const user = userEvent.setup()
    render(<App />)
    expect(screen.getByText('Collaborative', { selector: '.stop-copy strong' }).closest('li')?.textContent).toContain('Belum terbuka')
    await user.type(screen.getByRole('textbox', { name: 'NAMA PEMAIN' }), 'Ayu')
    await user.click(screen.getByRole('button', { name: /mulai perjalanan/i }))
    expect(screen.getByRole('heading', { name: 'Integrity' })).toBeTruthy()
    await user.click(screen.getByRole('button', { name: /mulai game/i }))
    await user.click(screen.getByRole('button', { name: 'Selesaikan integrity' }))
    expect(screen.getByRole('heading', { name: 'Collaborative' })).toBeTruthy()
    await user.click(screen.getByRole('button', { name: /mulai game/i }))
    expect(screen.getByRole('grid', { name: 'Your target board' })).toBeTruthy()
    await user.click(screen.getByRole('button', { name: 'Exit game' }))
    expect(screen.getByText('Collaborative', { selector: '.stop-copy strong' }).closest('li')?.textContent).toContain('Tahap saat ini')
    await user.click(screen.getByRole('button', { name: /mulai game/i }))
    await user.click(screen.getByRole('button', { name: 'Submit round' }))
    await user.click(screen.getByRole('button', { name: 'Continue journey' }))
    expect(screen.getByRole('heading', { name: 'Accountability' })).toBeTruthy()
    expect(screen.getByText('Collaborative', { selector: '.stop-copy strong' }).closest('li')?.textContent).toContain('30 / 100 poin')
  })

  it('renders remote names as text and gates submission until five completions', async () => {
    vi.stubGlobal('crypto', { randomUUID: () => '11111111-1111-1111-1111-111111111111' })
    vi.stubGlobal('fetch', fakeFetch)
    const user = userEvent.setup()
    const { container } = render(<App />)
    expect(screen.queryByRole('button', { name: /kirim ke peringkat/i })).toBeNull()
    await user.click(screen.getByRole('button', { name: /peringkat/i }))
    await screen.findByText('<img src=x onerror=alert(1)>')
    expect(container.querySelector('img[src="x"]')).toBeNull()
    await user.click(screen.getByRole('button', { name: /perjalanan/i }))
    await user.type(screen.getByRole('textbox', { name: 'NAMA PEMAIN' }), 'Ayu')
    await user.click(screen.getByRole('button', { name: /mulai perjalanan/i }))
    for (const valueId of ['integrity', 'collaborative', 'accountability', 'growth-mindset', 'customer-focus']) {
      await user.click(screen.getByRole('button', { name: /mulai game/i }))
      await user.click(screen.getByRole('button', { name: `Selesaikan ${valueId}` }))
    }
    expect(screen.getByText('100', { selector: '.final-score' })).toBeTruthy()
    expect(screen.getByRole('button', { name: /kirim ke peringkat/i })).toBeTruthy()
  })

  it('retains the final score when submission fails so the player can retry', async () => {
    vi.stubGlobal('crypto', { randomUUID: () => '11111111-1111-1111-1111-111111111111' })
    vi.stubGlobal('fetch', fakeFetch)
    const user = userEvent.setup()
    render(<App />)
    await user.type(screen.getByRole('textbox', { name: 'NAMA PEMAIN' }), 'Ayu')
    await user.click(screen.getByRole('button', { name: /mulai perjalanan/i }))
    for (const valueId of ['integrity', 'collaborative', 'accountability', 'growth-mindset', 'customer-focus']) {
      await user.click(screen.getByRole('button', { name: /mulai game/i }))
      await user.click(screen.getByRole('button', { name: `Selesaikan ${valueId}` }))
    }
    await user.click(screen.getByRole('button', { name: /kirim ke peringkat/i }))
    await waitFor(() => expect(screen.getByRole('alert').textContent).toContain('Hasil belum terkirim'))
    expect(screen.getByText('100', { selector: '.final-score' })).toBeTruthy()
    expect(screen.getByRole('button', { name: /kirim ke peringkat/i })).toBeTruthy()
  })

  it('submits five validated scores and opens the leaderboard on success', async () => {
    vi.stubGlobal('crypto', { randomUUID: () => '11111111-1111-1111-1111-111111111111' })
    const fetchMock = vi.fn(async (_url: string, options?: RequestInit) => options?.method === 'POST'
      ? { ok: true, status: 201, json: async () => ({}) }
      : { ok: true, json: async () => [{ id: 2, playerName: 'Ayu', total: 100, results: [], completedAt: '' }] })
    vi.stubGlobal('fetch', fetchMock)
    const user = userEvent.setup()
    render(<App />)
    await user.type(screen.getByRole('textbox', { name: 'NAMA PEMAIN' }), 'Ayu')
    await user.click(screen.getByRole('button', { name: /mulai perjalanan/i }))
    for (const valueId of ['integrity', 'collaborative', 'accountability', 'growth-mindset', 'customer-focus']) {
      await user.click(screen.getByRole('button', { name: /mulai game/i }))
      await user.click(screen.getByRole('button', { name: `Selesaikan ${valueId}` }))
    }
    await user.click(screen.getByRole('button', { name: /kirim ke peringkat/i }))
    await screen.findByText('Ayu', { selector: '.leaderboard-list strong' })
    const request = fetchMock.mock.calls.find(([, options]) => options?.method === 'POST')
    expect(request?.[0]).toBe('/api/leaderboard')
    expect(JSON.parse(request?.[1]?.body as string)).toMatchObject({ playerName: 'Ayu', total: 100, results: [
      { valueId: 'integrity', score: 20 }, { valueId: 'collaborative', score: 20 },
      { valueId: 'accountability', score: 20 }, { valueId: 'growth-mindset', score: 20 },
      { valueId: 'customer-focus', score: 20 },
    ] })
  })

  it('completes a desktop fixture journey through the real leaderboard API', async () => {
    vi.stubGlobal('crypto', { randomUUID: () => '33333333-3333-3333-3333-333333333333' })
    const database = new Database(':memory:')
    const app = await createApp(database)
    vi.stubGlobal('fetch', async (url: string, options?: RequestInit) => {
      const response = await app.inject({
        method: (options?.method ?? 'GET') as 'GET' | 'POST',
        url,
        payload: options?.body as string | undefined,
        headers: options?.headers as Record<string, string> | undefined,
      })
      return { ok: response.statusCode < 400, status: response.statusCode, json: async () => response.json() }
    })
    const user = userEvent.setup()
    try {
      render(<App />)
      await user.type(screen.getByRole('textbox', { name: 'NAMA PEMAIN' }), 'Ayu')
      await user.click(screen.getByRole('button', { name: /mulai perjalanan/i }))
      for (const valueId of ['integrity', 'collaborative', 'accountability', 'growth-mindset', 'customer-focus']) {
        await user.click(screen.getByRole('button', { name: /mulai game/i }))
        await user.click(screen.getByRole('button', { name: `Selesaikan ${valueId}` }))
      }
      await user.click(screen.getByRole('button', { name: /kirim ke peringkat/i }))
      await screen.findByText('Ayu', { selector: '.leaderboard-list strong' })
      expect((await app.inject('/api/leaderboard')).json()).toMatchObject([{ playerName: 'Ayu', total: 100 }])
    } finally {
      await app.close()
      database.close()
    }
  })
})