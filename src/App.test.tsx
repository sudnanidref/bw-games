import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Database from 'better-sqlite3'
import { createApp } from '../server/app'
import type { GameProps } from './games/contract'
import { App } from './App'

vi.mock('./games', async (importOriginal) => {
  const original = await importOriginal<typeof import('./games')>()
  return {
    ...original,
    games: original.games.map((game) => ({
      ...game, available: true, briefing: 'Selesaikan tantangan.',
      component: ({ context, onComplete }: GameProps) => <>
        <button onClick={() => onComplete({ valueId: context.valueId, score: 20 })}>Selesaikan {context.valueId}</button>
        {context.valueId === 'growth-mindset' && <>
          <button onClick={() => onComplete({ valueId: context.valueId, score: 64 })}>Growth Mindset 64</button>
          <button onClick={() => onComplete({ valueId: context.valueId, score: 65 })}>Growth Mindset 65</button>
        </>}
      </>,
    })),
  }
})

afterEach(() => { cleanup(); vi.unstubAllGlobals() })

const fakeFetch = vi.fn(async (url: string, options?: RequestInit) => {
  if (options?.method === 'POST') return { ok: false, status: 503 }
  if (url === '/api/leaderboard') return { ok: true, json: async () => [{ id: 1, playerName: '<img src=x onerror=alert(1)>', total: 100, results: [], completedAt: '' }] }
  return { ok: false }
})

describe('shell leaderboard flow', () => {
  it.each([[64, 'FAIL'], [65, 'PASS']] as const)(
    'records Growth Mindset score %i as %s and continues in order',
    async (growthScore, expectedStatus) => {
      vi.stubGlobal('crypto', { randomUUID: () => '44444444-4444-4444-4444-444444444444' })
      const user = userEvent.setup()
      const { container } = render(<App />)
      await user.type(screen.getByRole('textbox', { name: 'NAMA PEMAIN' }), 'Ayu')
      await user.click(screen.getByRole('button', { name: /mulai perjalanan/i }))

      for (const valueId of ['integrity', 'collaborative', 'accountability']) {
        await user.click(screen.getByRole('button', { name: /mulai game/i }))
        await user.click(screen.getByRole('button', { name: `Selesaikan ${valueId}` }))
      }

      await user.click(screen.getByRole('button', { name: /mulai game/i }))
      await user.click(screen.getByRole('button', { name: `Growth Mindset ${growthScore}` }))
      expect(screen.getByText(expectedStatus, { selector: '.journey-status' })).toBeTruthy()
      expect(screen.getByText(`${growthScore} / 100 poin`)).toBeTruthy()
      const routeStops = container.querySelectorAll('.route-stop')
      expect(routeStops[3]?.className).toContain('complete')
      expect(routeStops[4]?.className).toContain('current')

      await user.click(screen.getByRole('button', { name: /mulai game/i }))
      await user.click(screen.getByRole('button', { name: 'Selesaikan customer-focus' }))
      const resultRows = container.querySelectorAll('.result-list li')
      expect(resultRows[3]?.textContent).toContain(expectedStatus)
      expect(resultRows[3]?.textContent).toContain(String(growthScore))
      expect(resultRows[0]?.textContent).not.toMatch(/PASS|FAIL/)
    },
  )

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