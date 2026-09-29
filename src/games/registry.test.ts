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
    for (const game of games) {
      expect(Boolean(game.component)).toBe(game.available)
      expect(Boolean(game.briefing)).toBe(game.available)
    }
  })

  it.each(games)('documents $title guardrails', ({ id }) => {
    const guide = readFileSync(new URL(`./${id}/README.md`, import.meta.url), 'utf8')
    for (const section of ['OpenSpec', 'Entry point', 'Controls', 'Completion', 'Score rubric', 'Assets', 'Verification', 'Checklist']) {
      expect(guide).toContain(section)
    }
    expect(guide).toContain(id)
  })
})