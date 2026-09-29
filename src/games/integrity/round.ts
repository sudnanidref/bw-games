export type Category = 'aligned' | 'violation'
export type Random = () => number

export interface WordBank {
  aligned: readonly string[]
  violation: readonly string[]
}

export interface RoundTarget {
  id: string
  word: string
  category: Category
  lane: number
  spawnAtMs: number
}

export const ALIGNED_TARGET_COUNT = 20
export const VIOLATION_TARGET_COUNT = 12
export const LANE_COUNT = 3
export const SPAWN_INTERVAL_MS = 1_800
export const LANE_STAGGER_MS = 400

export function mulberry32(seed: number): Random {
  let state = seed >>> 0
  return () => {
    state = (state + 0x6d2b79f5) >>> 0
    let mixed = Math.imul(state ^ (state >>> 15), state | 1)
    mixed ^= mixed + Math.imul(mixed ^ (mixed >>> 7), mixed | 61)
    return ((mixed ^ (mixed >>> 14)) >>> 0) / 4_294_967_296
  }
}

export function shuffle<T>(items: readonly T[], random: Random): T[] {
  const shuffled = [...items]
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1))
    ;[shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]]
  }
  return shuffled
}

function pickWords(pool: readonly string[], count: number, category: Category, random: Random) {
  if (pool.length < count) {
    throw new Error(`Word bank needs at least ${count} ${category} words, found ${pool.length}`)
  }
  return shuffle(pool, random).slice(0, count)
}

export function createRound(words: WordBank, random: Random): RoundTarget[] {
  const picked = [
    ...pickWords(words.aligned, ALIGNED_TARGET_COUNT, 'aligned', random).map((word) => ({ word, category: 'aligned' as const })),
    ...pickWords(words.violation, VIOLATION_TARGET_COUNT, 'violation', random).map((word) => ({ word, category: 'violation' as const })),
  ]

  return shuffle(picked, random).map((entry, index) => {
    const lane = index % LANE_COUNT
    const slotInLane = Math.floor(index / LANE_COUNT)
    return {
      id: `${entry.category}:${entry.word}`,
      word: entry.word,
      category: entry.category,
      lane,
      spawnAtMs: slotInLane * SPAWN_INTERVAL_MS + lane * LANE_STAGGER_MS,
    }
  })
}
