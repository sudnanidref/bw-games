import { LANE_COUNT, type Category, type RoundTarget } from './round'
import { POINTS_PER_ALIGNED_HIT, POINTS_PER_VIOLATION_HIT, runningScore } from './scoring'

export const ROUND_DURATION_MS = 25_000
export const MAX_STEP_MS = 50
export const TARGET_CROSSING_MS = 6_000
export const TARGET_WIDTH = 0.2
export const LANE_CENTER_Y = [0.2, 0.4, 0.6] as const
export const PROJECTILE_START_Y = 0.85
export const PROJECTILE_FULL_HEIGHT_MS = 350
export const FIRE_COOLDOWN_MS = 250
export const LAUNCHER_SPEED_PER_SECOND = 0.9
export const REDUCED_MOTION_STEP_MS = 500
export const FEEDBACK_LIFETIME_MS = 900

export interface Projectile {
  id: number
  x: number
  y: number
}

export interface HitFeedback {
  id: number
  word: string
  category: Category
  points: number
  x: number
  y: number
  expiresAtMs: number
}

export interface EngineState {
  reducedMotion: boolean
  clockMs: number
  motionClockMs: number
  finished: boolean
  targets: readonly RoundTarget[]
  launcherX: number
  cooldownMs: number
  projectiles: readonly Projectile[]
  feedback: readonly HitFeedback[]
  alignedHits: number
  violationHits: number
  score: number
  nextId: number
}

export interface EngineInput {
  moveTo?: number
  moveDirection?: -1 | 0 | 1
  fire?: boolean
}

export function createState(targets: readonly RoundTarget[], options: { reducedMotion?: boolean } = {}): EngineState {
  return {
    reducedMotion: options.reducedMotion ?? false,
    clockMs: 0,
    motionClockMs: 0,
    finished: false,
    targets,
    launcherX: 0.5,
    cooldownMs: 0,
    projectiles: [],
    feedback: [],
    alignedHits: 0,
    violationHits: 0,
    score: 0,
    nextId: 1,
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

function laneDirection(lane: number): 1 | -1 {
  return lane % 2 === 0 ? 1 : -1
}

function crossingProgress(target: RoundTarget, motionClockMs: number): number {
  return (motionClockMs - target.spawnAtMs) / TARGET_CROSSING_MS
}

export function isTargetOnScreen(target: RoundTarget, motionClockMs: number): boolean {
  const progress = crossingProgress(target, motionClockMs)
  return progress >= 0 && progress <= 1
}

// Left edge of the target, as a fraction of the play width. It may be negative or exceed 1 while entering or leaving.
export function targetLeft(target: RoundTarget, motionClockMs: number): number {
  const distance = (1 + TARGET_WIDTH) * crossingProgress(target, motionClockMs)
  return laneDirection(target.lane) === 1 ? -TARGET_WIDTH + distance : 1 - distance
}

export function visibleTargets(state: EngineState): RoundTarget[] {
  return state.targets.filter((target) => isTargetOnScreen(target, state.motionClockMs))
}

function moveLauncher(state: EngineState, input: EngineInput, deltaMs: number): EngineState {
  let launcherX = state.launcherX
  if (input.moveTo !== undefined) launcherX = clamp(input.moveTo, 0, 1)
  if (input.moveDirection) {
    launcherX = clamp(launcherX + input.moveDirection * LAUNCHER_SPEED_PER_SECOND * (deltaMs / 1000), 0, 1)
  }
  return { ...state, launcherX }
}

function fireIfReady(state: EngineState, input: EngineInput, deltaMs: number): EngineState {
  const cooldownMs = Math.max(0, state.cooldownMs - deltaMs)
  if (!input.fire || cooldownMs > 0) return { ...state, cooldownMs }

  const projectile: Projectile = { id: state.nextId, x: state.launcherX, y: PROJECTILE_START_Y }
  return {
    ...state,
    cooldownMs: FIRE_COOLDOWN_MS,
    projectiles: [...state.projectiles, projectile],
    nextId: state.nextId + 1,
  }
}

function advanceClock(state: EngineState, deltaMs: number): EngineState {
  const clockMs = Math.min(ROUND_DURATION_MS, state.clockMs + deltaMs)
  const motionClockMs = state.reducedMotion
    ? Math.floor(clockMs / REDUCED_MOTION_STEP_MS) * REDUCED_MOTION_STEP_MS
    : clockMs
  return { ...state, clockMs, motionClockMs, finished: clockMs >= ROUND_DURATION_MS }
}

function findTargetHit(state: EngineState, projectile: Projectile, nextY: number): RoundTarget | null {
  for (let lane = LANE_COUNT - 1; lane >= 0; lane -= 1) {
    const laneY = LANE_CENTER_Y[lane]
    const crossedLane = laneY <= projectile.y && laneY >= nextY
    if (!crossedLane) continue

    const hit = state.targets.find((target) => {
      if (target.lane !== lane || !isTargetOnScreen(target, state.motionClockMs)) return false
      const left = targetLeft(target, state.motionClockMs)
      return projectile.x >= left && projectile.x <= left + TARGET_WIDTH
    })
    if (hit) return hit
  }
  return null
}

function registerHit(state: EngineState, target: RoundTarget, projectile: Projectile): EngineState {
  const alignedHits = state.alignedHits + (target.category === 'aligned' ? 1 : 0)
  const violationHits = state.violationHits + (target.category === 'violation' ? 1 : 0)
  const feedback: HitFeedback = {
    id: state.nextId,
    word: target.word,
    category: target.category,
    points: target.category === 'aligned' ? POINTS_PER_ALIGNED_HIT : POINTS_PER_VIOLATION_HIT,
    x: projectile.x,
    y: LANE_CENTER_Y[target.lane],
    expiresAtMs: state.clockMs + FEEDBACK_LIFETIME_MS,
  }
  return {
    ...state,
    targets: state.targets.filter((candidate) => candidate.id !== target.id),
    feedback: [...state.feedback, feedback],
    alignedHits,
    violationHits,
    score: runningScore(alignedHits, violationHits),
    nextId: state.nextId + 1,
  }
}

function advanceProjectiles(state: EngineState, deltaMs: number): EngineState {
  let next: EngineState = { ...state, projectiles: [] }
  const travel = deltaMs / PROJECTILE_FULL_HEIGHT_MS

  for (const projectile of state.projectiles) {
    const nextY = projectile.y - travel
    const hit = findTargetHit(next, projectile, nextY)
    if (hit) {
      next = registerHit(next, hit, projectile)
    } else if (nextY >= 0) {
      next = { ...next, projectiles: [...next.projectiles, { ...projectile, y: nextY }] }
    }
  }
  return next
}

function dropExpiredFeedback(state: EngineState): EngineState {
  return { ...state, feedback: state.feedback.filter((item) => item.expiresAtMs > state.clockMs) }
}

export function step(state: EngineState, deltaMs: number, input: EngineInput = {}): EngineState {
  if (state.finished) return state

  const cappedDeltaMs = clamp(deltaMs, 0, MAX_STEP_MS)
  let next = moveLauncher(state, input, cappedDeltaMs)
  next = fireIfReady(next, input, cappedDeltaMs)
  next = advanceClock(next, cappedDeltaMs)
  next = advanceProjectiles(next, cappedDeltaMs)
  return dropExpiredFeedback(next)
}
