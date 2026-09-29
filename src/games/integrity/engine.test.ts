import { describe, expect, it } from 'vitest'
import {
  FIRE_COOLDOWN_MS, LANE_CENTER_Y, MAX_STEP_MS, ROUND_DURATION_MS, TARGET_CROSSING_MS, TARGET_WIDTH,
  createState, isTargetOnScreen, step, targetLeft, type EngineInput, type EngineState,
} from './engine'
import type { RoundTarget } from './round'

function makeTarget(overrides: Partial<RoundTarget> = {}): RoundTarget {
  return { id: 'aligned:jujur', word: 'jujur', category: 'aligned', lane: 2, spawnAtMs: 0, ...overrides }
}

function run(state: EngineState, totalMs: number, input: EngineInput = {}, stepMs = 10): EngineState {
  let next = state
  for (let elapsed = 0; elapsed < totalMs; elapsed += stepMs) next = step(next, stepMs, input)
  return next
}

function advanceTo(state: EngineState, clockMs: number): EngineState {
  return run(state, clockMs - state.clockMs, {}, 10)
}

// Advances until the target's center is at the launcher column, then fires and lets the card fly.
function fireAtTargetCenter(state: EngineState, target: RoundTarget): EngineState {
  const centerAt = (clockMs: number) => targetLeft(target, clockMs) + TARGET_WIDTH / 2
  let next = advanceTo(state, target.spawnAtMs + TARGET_CROSSING_MS / 2)
  next = step(next, 0, { moveTo: centerAt(next.motionClockMs), fire: true })
  return run(next, 500)
}

describe('clock', () => {
  it('ends the round at exactly 25 000 ms', () => {
    let state = createState([])
    state = advanceTo(state, ROUND_DURATION_MS - 10)
    expect(state.finished).toBe(false)
    state = step(state, 10)
    expect(state.clockMs).toBe(ROUND_DURATION_MS)
    expect(state.finished).toBe(true)
  })

  it('caps a single step at 50 ms', () => {
    expect(step(createState([]), 5_000).clockMs).toBe(MAX_STEP_MS)
  })

  it('accepts no input or movement after time-out', () => {
    const finished = advanceTo(createState([makeTarget()]), ROUND_DURATION_MS)
    const after = step(finished, 16, { moveTo: 0.1, fire: true })
    expect(after).toBe(finished)
    expect(after.projectiles).toHaveLength(0)
  })
})

describe('targets', () => {
  it('moves adjacent lanes in opposite directions', () => {
    const lane0 = makeTarget({ lane: 0 })
    const lane1 = makeTarget({ id: 'x', lane: 1 })
    const lane2 = makeTarget({ id: 'y', lane: 2 })
    expect(targetLeft(lane0, 1_000)).toBeGreaterThan(targetLeft(lane0, 0))
    expect(targetLeft(lane1, 1_000)).toBeLessThan(targetLeft(lane1, 0))
    expect(targetLeft(lane2, 1_000)).toBeGreaterThan(targetLeft(lane2, 0))
  })

  it('crosses the whole play area in about 6 s', () => {
    const target = makeTarget({ lane: 0 })
    expect(targetLeft(target, 0)).toBeCloseTo(-TARGET_WIDTH)
    expect(targetLeft(target, TARGET_CROSSING_MS)).toBeCloseTo(1)
    expect(isTargetOnScreen(target, TARGET_CROSSING_MS + 1)).toBe(false)
    expect(isTargetOnScreen(makeTarget({ spawnAtMs: 2_000 }), 1_000)).toBe(false)
  })
})

describe('launcher', () => {
  it('moves to a position and clamps to 0..1', () => {
    let state = step(createState([]), 10, { moveTo: 0.3 })
    expect(state.launcherX).toBe(0.3)
    state = step(state, 10, { moveTo: 7 })
    expect(state.launcherX).toBe(1)
    state = step(state, 10, { moveTo: -3 })
    expect(state.launcherX).toBe(0)
  })

  it('moves by held direction and stays within bounds', () => {
    let state = step(createState([]), 50, { moveDirection: -1 })
    expect(state.launcherX).toBeLessThan(0.5)
    state = run(state, 5_000, { moveDirection: -1 })
    expect(state.launcherX).toBe(0)
    state = run(step(state, 1, { moveTo: 1 }), 100, { moveDirection: 1 })
    expect(state.launcherX).toBe(1)
  })
})

describe('reduced motion', () => {
  it('changes positions only on 500 ms boundaries', () => {
    const target = makeTarget({ lane: 0 })
    let state = createState([target], { reducedMotion: true })
    const positions: number[] = []
    for (let elapsed = 0; elapsed < 2_000; elapsed += 10) {
      state = step(state, 10)
      positions.push(targetLeft(target, state.motionClockMs))
    }
    expect(new Set(positions).size).toBe(5)
    expect(state.clockMs).toBe(2_000)
  })

  it('detects hits against the displayed positions', () => {
    const target = makeTarget({ lane: 2 })
    let state = createState([target], { reducedMotion: true })
    state = advanceTo(state, 3_100)
    const displayedCenter = targetLeft(target, state.motionClockMs) + TARGET_WIDTH / 2
    state = step(state, 0, { moveTo: displayedCenter, fire: true })
    state = run(state, 500)
    expect(state.alignedHits).toBe(1)
  })
})

describe('shooting', () => {
  it('scores +5 for an aligned hit and removes the target and card', () => {
    const target = makeTarget()
    const state = fireAtTargetCenter(createState([target]), target)
    expect(state.alignedHits).toBe(1)
    expect(state.score).toBe(5)
    expect(state.targets).toHaveLength(0)
    expect(state.projectiles).toHaveLength(0)
    expect(state.feedback[0]).toMatchObject({ word: 'jujur', category: 'aligned', points: 5 })
  })

  it('scores -5 for a violation hit', () => {
    const target = makeTarget({ id: 'violation:suap', word: 'suap', category: 'violation' })
    const state = fireAtTargetCenter(createState([target]), target)
    expect(state.violationHits).toBe(1)
    expect(state.score).toBe(-5)
    expect(state.feedback[0]).toMatchObject({ word: 'suap', category: 'violation', points: -5 })
  })

  it('hits only the lower of two overlapping targets', () => {
    const lower = makeTarget({ id: 'aligned:lower', word: 'lower', lane: 2 })
    const upper = makeTarget({ id: 'violation:upper', word: 'upper', category: 'violation', lane: 0 })
    const state = fireAtTargetCenter(createState([upper, lower]), lower)
    expect(state.targets.map((target) => target.id)).toEqual(['violation:upper'])
    expect(state.alignedHits).toBe(1)
    expect(state.violationHits).toBe(0)
  })

  it('launches one card for two fire inputs within 250 ms', () => {
    let state = step(createState([]), 16, { fire: true })
    state = step(state, 16, { fire: true })
    state = step(state, 16, { fire: true })
    expect(state.projectiles).toHaveLength(1)
    state = run(state, FIRE_COOLDOWN_MS)
    state = step(state, 16, { fire: true })
    expect(state.projectiles.length).toBeGreaterThanOrEqual(1)
  })

  it('does not change the score for a missed card or escaped targets', () => {
    const target = makeTarget()
    let state = step(createState([target]), 16, { moveTo: 0.99, fire: true })
    state = run(state, 30_000)
    expect(state.score).toBe(0)
    expect(state.alignedHits).toBe(0)
    expect(state.violationHits).toBe(0)
    expect(state.projectiles).toHaveLength(0)
    expect(state.finished).toBe(true)
  })

  it('takes about 350 ms for a card to cross the play height', () => {
    let state = step(createState([]), 0, { fire: true })
    expect(state.projectiles).toHaveLength(1)
    state = run(state, 250)
    expect(state.projectiles).toHaveLength(1)
    state = run(state, 150)
    expect(state.projectiles).toHaveLength(0)
  })

  it('expires feedback after its lifetime', () => {
    const target = makeTarget()
    const state = run(fireAtTargetCenter(createState([target]), target), 1_000)
    expect(state.feedback).toHaveLength(0)
    expect(LANE_CENTER_Y).toHaveLength(3)
  })
})
