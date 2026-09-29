// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { IntegrityGame } from './IntegrityGame'
import { step } from './engine'
import { mulberry32 } from './round'

vi.mock('./engine', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./engine')>()
  return { ...actual, step: vi.fn(actual.step) }
})

const FRAME_MS = 16
const HIT_LABEL = /^[+−]5 (benar|salah) \S/
const storedPreferences = new Map<string, string>()

let frameCallbacks: Map<number, FrameRequestCallback>
let nextFrameId: number
let clockMs: number

function advance(totalMs: number) {
  act(() => {
    for (let elapsed = 0; elapsed < totalMs; elapsed += FRAME_MS) {
      clockMs += FRAME_MS
      const pending = [...frameCallbacks.values()]
      frameCallbacks.clear()
      pending.forEach((callback) => callback(clockMs))
    }
  })
}

function renderGame() {
  const callbacks = { onComplete: vi.fn(), onCancel: vi.fn(), onError: vi.fn() }
  const view = render(
    <IntegrityGame
      context={{ valueId: 'integrity', playerName: 'Rani', priorResults: [] }}
      random={mulberry32(7)}
      {...callbacks}
    />,
  )
  return { ...callbacks, ...view }
}

function startRound() {
  fireEvent.click(screen.getByRole('button', { name: 'Mulai ronde' }))
  return screen.getByRole('group', { name: 'Area tembak' })
}

// Parks the launcher at the far left, where every lane keeps passing, then fires at a steady pace.
function playWithKeyboard(playArea: HTMLElement, durationMs: number): boolean {
  fireEvent.keyDown(playArea, { key: 'ArrowLeft' })
  advance(2_000)
  fireEvent.keyUp(playArea, { key: 'ArrowLeft' })

  let sawHitFeedback = false
  for (let elapsed = 0; elapsed < durationMs; elapsed += 300) {
    fireEvent.keyDown(playArea, { key: ' ' })
    advance(300)
    sawHitFeedback ||= [...document.querySelectorAll('.integrity-feedback')].some((item) => HIT_LABEL.test(item.textContent ?? ''))
  }
  return sawHitFeedback
}

class StubAudioContext {
  static instances: StubAudioContext[] = []
  currentTime = 0
  destination = {}
  closed = false
  sourceStops = 0

  constructor() { StubAudioContext.instances.push(this) }

  createGain() { return { gain: { value: 1, setValueAtTime() {}, exponentialRampToValueAtTime() {} }, connect() {} } }
  createOscillator() { return { type: '', frequency: { setValueAtTime() {}, exponentialRampToValueAtTime() {} }, connect() {}, start() {}, stop() {} } }
  createBufferSource() { return { buffer: null, loop: false, connect() {}, start() {}, stop: () => { this.sourceStops += 1 } } }
  async decodeAudioData() { return {} }
  async close() { this.closed = true }
}

async function flushPromises() {
  await act(async () => { await Promise.resolve(); await Promise.resolve(); await Promise.resolve() })
}

beforeEach(() => {
  StubAudioContext.instances = []
  vi.stubGlobal('localStorage', {
    clear: () => storedPreferences.clear(),
    getItem: (key: string) => storedPreferences.get(key) ?? null,
    setItem: (key: string, value: string) => { storedPreferences.set(key, value) },
  })
  localStorage.clear()
  vi.stubGlobal('AudioContext', StubAudioContext)
  vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, arrayBuffer: async () => new ArrayBuffer(8) })))
  frameCallbacks = new Map()
  nextFrameId = 1
  clockMs = 0
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
    frameCallbacks.set(nextFrameId, callback)
    return nextFrameId++
  })
  vi.stubGlobal('cancelAnimationFrame', (id: number) => { frameCallbacks.delete(id) })
})

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

describe('briefing', () => {
  it('shows rules and controls, focuses start, and lets no time elapse', () => {
    const { onComplete, onCancel, onError } = renderGame()
    expect(screen.getByText(/25 detik/)).toBeTruthy()
    expect(screen.getByText(/\+5 poin/)).toBeTruthy()
    expect(screen.getByText(/−5 poin/)).toBeTruthy()
    expect(screen.getByText(/Spasi untuk menembak/)).toBeTruthy()
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Mulai ronde' }))

    advance(5_000)
    expect(frameCallbacks.size).toBe(0)
    expect(document.querySelector('.integrity-target')).toBeNull()
    expect(step).not.toHaveBeenCalled()
    expect([onComplete, onCancel, onError].every((callback) => callback.mock.calls.length === 0)).toBe(true)
  })
})

describe('playing', () => {
  it('moves focus to the play area and shows identical-looking targets', () => {
    renderGame()
    const playArea = startRound()
    advance(3_000)
    expect(document.activeElement).toBe(playArea)
    const targets = [...document.querySelectorAll<HTMLElement>('.integrity-target')]
    expect(targets.length).toBeGreaterThan(0)
    expect(new Set(targets.map((target) => target.className)).size).toBe(1)
    expect(targets.every((target) => target.getAttributeNames().sort().join() === 'class,style')).toBe(true)
  })

  it('lets keyboard-only play hit a target with non-color feedback', () => {
    renderGame()
    const playArea = startRound()
    expect(playWithKeyboard(playArea, 20_000)).toBe(true)
  })

  it('reports Escape as a single cancel and stops the loop', () => {
    const { onComplete, onCancel, onError } = renderGame()
    startRound()
    advance(1_000)
    fireEvent.keyDown(document.body, { key: 'Escape' })
    fireEvent.keyDown(document.body, { key: 'Escape' })
    advance(30_000)
    expect(onCancel).toHaveBeenCalledTimes(1)
    expect(onComplete).not.toHaveBeenCalled()
    expect(onError).not.toHaveBeenCalled()
    expect(frameCallbacks.size).toBe(0)
  })

  it('cancels from the briefing with Escape', () => {
    const { onCancel } = renderGame()
    fireEvent.keyDown(document.body, { key: 'Escape' })
    expect(onCancel).toHaveBeenCalledTimes(1)
  })

  it('reports nothing when unmounted mid-round', () => {
    const { onComplete, onCancel, onError, unmount } = renderGame()
    startRound()
    advance(3_000)
    unmount()
    advance(30_000)
    expect(frameCallbacks.size).toBe(0)
    expect([onComplete, onCancel, onError].every((callback) => callback.mock.calls.length === 0)).toBe(true)
  })

  it('reports an engine failure through onError and stops', () => {
    const { onComplete, onError } = renderGame()
    startRound()
    vi.mocked(step).mockImplementationOnce(() => { throw new Error('engine broke') })
    advance(100)
    expect(onError).toHaveBeenCalledTimes(1)
    expect(onError.mock.calls[0][0]).toEqual(new Error('engine broke'))
    expect(onComplete).not.toHaveBeenCalled()
    expect(frameCallbacks.size).toBe(0)
  })
})

describe('result', () => {
  it('shows a summary and completes exactly once with an in-range integer score', () => {
    const { onComplete, onCancel } = renderGame()
    const playArea = startRound()
    playWithKeyboard(playArea, 26_000)

    expect(screen.getByText('Ronde selesai')).toBeTruthy()
    expect(frameCallbacks.size).toBe(0)
    expect(onComplete).not.toHaveBeenCalled()

    const next = screen.getByRole('button', { name: 'Lanjut' })
    fireEvent.click(next)
    fireEvent.click(next)
    expect(onComplete).toHaveBeenCalledTimes(1)
    const result = onComplete.mock.calls[0][0]
    expect(result.valueId).toBe('integrity')
    expect(Number.isInteger(result.score)).toBe(true)
    expect(result.score).toBeGreaterThanOrEqual(0)
    expect(result.score).toBeLessThanOrEqual(100)
    expect(onCancel).not.toHaveBeenCalled()
  })
})

describe('reduced motion', () => {
  it('moves targets in steps of at most one per 500 ms', () => {
    vi.stubGlobal('matchMedia', (query: string) => ({ matches: query.includes('reduce') }))
    renderGame()
    startRound()
    const snapshots = new Set<string>()
    for (let elapsed = 0; elapsed < 900; elapsed += FRAME_MS) {
      advance(FRAME_MS)
      snapshots.add([...document.querySelectorAll<HTMLElement>('.integrity-target')].map((target) => target.style.transform).join('|'))
    }
    expect(snapshots.size).toBeLessThanOrEqual(2)
  })
})

describe('audio', () => {
  it('creates no audio before the round starts', () => {
    renderGame()
    expect(StubAudioContext.instances).toHaveLength(0)
    startRound()
    expect(StubAudioContext.instances).toHaveLength(1)
  })

  it('toggles mute with the M key and the button, and remembers it', () => {
    renderGame()
    expect(screen.getByRole('button', { name: 'Matikan suara' }).getAttribute('aria-pressed')).toBe('false')

    fireEvent.keyDown(document.body, { key: 'm' })
    expect(screen.getByRole('button', { name: 'Nyalakan suara' }).getAttribute('aria-pressed')).toBe('true')
    expect(localStorage.getItem('integrity-game:muted')).toBe('1')

    startRound()
    fireEvent.click(screen.getByRole('button', { name: 'Nyalakan suara' }))
    expect(screen.getByRole('button', { name: 'Matikan suara' })).toBeTruthy()
    fireEvent.keyDown(document.body, { key: 'M' })
    expect(screen.getByRole('button', { name: 'Nyalakan suara' })).toBeTruthy()
  })

  it('starts muted when the preference was saved', () => {
    localStorage.setItem('integrity-game:muted', '1')
    renderGame()
    expect(screen.getByRole('button', { name: 'Nyalakan suara' })).toBeTruthy()
  })

  it('still completes with a valid score when audio is unavailable', async () => {
    vi.stubGlobal('AudioContext', class { constructor() { throw new Error('no audio') } })
    vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('offline') }))
    const { onComplete, onError } = renderGame()
    const playArea = startRound()
    await flushPromises()
    playWithKeyboard(playArea, 26_000)
    fireEvent.click(screen.getByRole('button', { name: 'Lanjut' }))
    expect(onError).not.toHaveBeenCalled()
    expect(onComplete).toHaveBeenCalledTimes(1)
    const { score } = onComplete.mock.calls[0][0]
    expect(Number.isInteger(score) && score >= 0 && score <= 100).toBe(true)
  })

  it('stops audio on unmount and on cancel', async () => {
    const first = renderGame()
    startRound()
    await flushPromises()
    first.unmount()
    expect(StubAudioContext.instances[0].sourceStops).toBe(1)
    expect(StubAudioContext.instances[0].closed).toBe(true)

    renderGame()
    startRound()
    await flushPromises()
    fireEvent.keyDown(document.body, { key: 'Escape' })
    expect(StubAudioContext.instances[1].closed).toBe(true)
  })
})
