import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { games } from './index'

describe('developer slots', () => {
  it('reserves five ordered games with only Collaborative available', () => {
    expect(games.map((game) => game.id)).toEqual([
      'integrity', 'collaborative', 'accountability', 'growth-mindset', 'customer-focus',
    ])
    expect(games.find((game) => game.id === 'collaborative')).toMatchObject({ available: true, component: expect.any(Function) })
    expect(games.filter((game) => game.available).map((game) => game.id)).toEqual(['collaborative'])
  })

  it.each(games)('documents $title guardrails', ({ id }) => {
    const guide = readFileSync(new URL(`./${id}/README.md`, import.meta.url), 'utf8')
    for (const section of ['OpenSpec', 'Entry point', 'Controls', 'Completion', 'Score rubric', 'Assets', 'Verification', 'Checklist']) {
      expect(guide).toContain(section)
    }
    expect(guide).toContain(id)
  })
})