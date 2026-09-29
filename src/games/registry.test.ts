import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { games } from './index'

describe('developer slots', () => {
  it('reserves exactly five ordered games', () => {
    expect(games.map((game) => game.id)).toEqual([
      'integrity', 'collaborative', 'accountability', 'growth-mindset', 'customer-focus',
    ])
  })

  it('enables Integrity and Customer Focus while leaving the middle three unavailable', () => {
    expect(games[0]).toMatchObject({ available: true, component: expect.any(Function) })
    expect(games.slice(1, 4).every((game) => game.available === false && !game.component)).toBe(true)
    expect(games[4]).toMatchObject({ available: true, component: expect.any(Function), briefing: expect.stringMatching(/tiga kebutuhan.*45 detik/i) })
    for (const game of games) {
      if (game.available) expect(game.component, game.id).toBeDefined()
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