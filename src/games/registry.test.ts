import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { games } from './index'

describe('developer slots', () => {
  it('reserves exactly five ordered games', () => {
    expect(games.map((game) => game.id)).toEqual([
      'integrity', 'collaborative', 'accountability', 'growth-mindset', 'customer-focus',
    ])
  })

  it('only marks a game available when it has a component', () => {
    for (const game of games) {
      if (game.available) expect(game.component, game.id).toBeDefined()
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