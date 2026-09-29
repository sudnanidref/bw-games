import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { games } from './index'
import { valueIds } from './slots'

describe('developer slots', () => {
  it('reserves exactly five ordered slots, registering only real games', () => {
    expect(games.map((game) => game.id)).toEqual([
      'integrity', 'collaborative', 'accountability', 'growth-mindset', 'customer-focus',
    ])
    expect(games.map((game) => game.id)).toEqual([...valueIds])
  })

  it('enables all implemented games', () => {
    expect(games[0]).toMatchObject({ available: true, component: expect.any(Function) })
    expect(games[1]).toMatchObject({ available: true, component: expect.any(Function), briefing: expect.stringMatching(/papan 5x5/i) })
    expect(games[2]).toMatchObject({ available: true, component: expect.any(Function), briefing: expect.stringMatching(/20 detik/i) })
    expect(games[3]).toMatchObject({ available: true, component: expect.any(Function), briefing: expect.stringMatching(/minimal 65 poin/i) })
    expect(games[4]).toMatchObject({ available: true, component: expect.any(Function), briefing: expect.stringMatching(/tiga kebutuhan.*45 detik/i) })
    for (const game of games) {
      expect(Boolean(game.component)).toBe(game.available)
      expect(Boolean(game.briefing)).toBe(game.available)
    }
  })

  it.each(games.slice(0, 4))('documents $title guardrails', ({ id }) => {
    const guide = readFileSync(new URL(`./${id}/README.md`, import.meta.url), 'utf8')
    for (const section of ['OpenSpec', 'Entry point', 'Controls', 'Completion', 'Score rubric', 'Assets', 'Verification', 'Checklist']) {
      expect(guide).toContain(section)
    }
    expect(guide).toContain(id)
  })

  it('documents the Customer Focus controls, score, approved copy, and assets', () => {
    const guide = readFileSync(new URL('./customer-focus/README.md', import.meta.url), 'utf8')
    for (const section of ['customer-focus-match-the-solution', 'Play and score', 'Content review', 'Approved 2026-09-29', 'Asset manifest', 'Verification']) {
      expect(guide).toContain(section)
    }
  })
})
