import { describe, expect, it } from 'vitest'
import words from './words.json'

const MIN_ALIGNED = 40
const MIN_VIOLATION = 30
const MAX_LENGTH = 18
const MAX_WORDS = 2

function normalize(entry: string): string {
  return entry.trim().toLowerCase()
}

describe('word bank', () => {
  it('has enough aligned and violation entries', () => {
    expect(words.aligned.length).toBeGreaterThanOrEqual(MIN_ALIGNED)
    expect(words.violation.length).toBeGreaterThanOrEqual(MIN_VIOLATION)
  })

  it.each(['aligned', 'violation'] as const)('keeps every %s entry short', (category) => {
    for (const entry of words[category]) {
      const trimmed = entry.trim()
      expect(trimmed.length, entry).toBeGreaterThan(0)
      expect(trimmed.length, entry).toBeLessThanOrEqual(MAX_LENGTH)
      expect(trimmed.split(/\s+/).length, entry).toBeLessThanOrEqual(MAX_WORDS)
    }
  })

  it('has no duplicates within or across categories', () => {
    const all = [...words.aligned, ...words.violation].map(normalize)
    const duplicates = all.filter((entry, index) => all.indexOf(entry) !== index)
    expect(duplicates).toEqual([])
  })
})
