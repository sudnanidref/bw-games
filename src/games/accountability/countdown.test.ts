import { describe, expect, it } from 'vitest'
import { createCountdown } from './countdown'

function createFakeScheduler() {
  let now = 0
  let nextId = 0
  const pending = new Map<number, { at: number; callback: () => void }>()

  function schedule(callback: () => void, delayMs: number) {
    const id = ++nextId
    pending.set(id, { at: now + delayMs, callback })
    return id
  }

  function cancel(handle: unknown) {
    pending.delete(handle as number)
  }

  function advanceTo(target: number) {
    while (true) {
      const next = [...pending.entries()]
        .filter(([, timer]) => timer.at <= target)
        .sort((left, right) => left[1].at - right[1].at)[0]
      if (!next) break
      const [id, timer] = next
      pending.delete(id)
      now = timer.at
      timer.callback()
    }
    now = target
  }

  return { clock: () => now, schedule, cancel, advanceTo, pending }
}

describe('Accountability start countdown', () => {
  it('L22 displays 5 through 1 then starts once at zero', () => {
    const scheduler = createFakeScheduler()
    const ticks: number[] = []
    let starts = 0
    const countdown = createCountdown({
      clock: scheduler.clock,
      schedule: scheduler.schedule,
      cancel: scheduler.cancel,
      onTick: (seconds) => ticks.push(seconds),
      onComplete: () => { starts += 1 },
    })

    expect(countdown.start()).toBe(true)
    expect(countdown.start()).toBe(false)
    scheduler.advanceTo(5_000)

    expect(ticks).toEqual([5, 4, 3, 2, 1, 0])
    expect(starts).toBe(1)
    expect(scheduler.pending.size).toBe(0)
  })

  it('L23 manual cancellation prevents the old deadline from starting a round', () => {
    const scheduler = createFakeScheduler()
    const ticks: number[] = []
    let starts = 0
    const countdown = createCountdown({
      clock: scheduler.clock,
      schedule: scheduler.schedule,
      cancel: scheduler.cancel,
      onTick: (seconds) => ticks.push(seconds),
      onComplete: () => { starts += 1 },
    })

    countdown.start()
    countdown.cancel()
    scheduler.advanceTo(5_000)
    countdown.cancel()

    expect(ticks).toEqual([5])
    expect(starts).toBe(0)
    expect(scheduler.pending.size).toBe(0)
  })

  it('ignores a callback already queued when cancellation happens', () => {
    const callbacks: Array<() => void> = []
    let starts = 0
    const countdown = createCountdown({
      clock: () => 0,
      schedule: (callback) => { callbacks.push(callback); return callbacks.length - 1 },
      cancel: () => undefined,
      onTick: () => undefined,
      onComplete: () => { starts += 1 },
    })

    countdown.start()
    countdown.cancel()
    callbacks[0]()

    expect(starts).toBe(0)
  })
})