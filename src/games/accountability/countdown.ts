import { gameConfig } from './config'

interface CountdownOptions {
  onTick: (seconds: number) => void
  onComplete: () => void
  clock?: () => number
  schedule?: (callback: () => void, delayMs: number) => unknown
  cancel?: (handle: unknown) => void
  durationMs?: number
}

export function createCountdown(options: CountdownOptions) {
  const clock = options.clock ?? (() => performance.now())
  const schedule = options.schedule ?? ((callback, delayMs) => setTimeout(callback, delayMs))
  const cancel = options.cancel ?? ((handle) => clearTimeout(handle as ReturnType<typeof setTimeout>))
  const durationMs = options.durationMs ?? gameConfig.autoStartMs
  let deadline = 0
  let handle: unknown = null
  let active = false
  let started = false

  function tick() {
    handle = null
    if (!active) return

    const remainingMs = deadline - clock()
    if (remainingMs <= 0) {
      active = false
      options.onTick(0)
      options.onComplete()
      return
    }

    options.onTick(Math.ceil(remainingMs / 1_000))
    handle = schedule(tick, Math.min(1_000, remainingMs))
  }

  function start() {
    if (started) return false
    started = true
    active = true
    deadline = clock() + durationMs
    options.onTick(Math.ceil(durationMs / 1_000))
    handle = schedule(tick, Math.min(1_000, durationMs))
    return true
  }

  function cancelCountdown() {
    if (!active) return
    active = false
    if (handle !== null) cancel(handle)
    handle = null
  }

  return { start, cancel: cancelCountdown }
}