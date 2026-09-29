// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mountGrowthGame, type GrowthGameHandle } from './engine'
import { LEVELS, ROUND_MS } from './scoring'

const LEVEL_PAUSE_MS = 250
const LESSON_MS = 700

let root: HTMLDivElement
let handle: GrowthGameHandle
let onComplete: ReturnType<typeof vi.fn>
let onCancel: ReturnType<typeof vi.fn>
let onError: ReturnType<typeof vi.fn>

// random() = 0.3 always picks index 1, so every pattern is all "up".
function mount(random: () => number = () => 0.3) {
  onComplete = vi.fn()
  onCancel = vi.fn()
  onError = vi.fn()
  handle = mountGrowthGame(root, { onComplete, onCancel, onError, random })
}

const game = () => root.querySelector<HTMLElement>('.gm-game')!
const text = (selector: string) => root.querySelector(selector)?.textContent ?? ''
const findButton = (label: string) => Array.from(root.querySelectorAll('button')).find((node) => node.textContent === label)
const clickButton = (label: string) => {
  const node = findButton(label)
  if (!node) throw new Error(`Missing button ${label}`)
  node.click()
}
const press = (key: string) => game().dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }))
const showLevel = (index: number) => vi.advanceTimersByTime(LEVELS[index].length * LEVELS[index].stepMs)

function clearLevel(index: number) {
  showLevel(index)
  for (let step = 0; step < LEVELS[index].length; step += 1) press('ArrowUp')
}

beforeEach(() => {
  vi.useFakeTimers()
  root = document.createElement('div')
  document.body.append(root)
})

afterEach(() => {
  handle.destroy()
  root.remove()
  vi.useRealTimers()
})

describe('Pola Tumbuh engine', () => {
  it('keeps the timer idle before the player starts', () => {
    mount()
    expect(text('.gm-time')).toBe('20,0 d')
    vi.advanceTimersByTime(5000)
    expect(text('.gm-time')).toBe('20,0 d')
    expect(findButton('Mulai')).toBeTruthy()
  })

  it('starts with Enter and counts down', () => {
    mount()
    press('Enter')
    vi.advanceTimersByTime(1000)
    expect(text('.gm-time')).toBe('19,0 d')
    expect(text('.gm-level')).toBe('TAHAP 1 / 5 · PELAN')
  })

  it('shows level 1 slowly: 3 arrows at 550 ms, hidden only after 1650 ms', () => {
    mount()
    clickButton('Mulai')
    vi.advanceTimersByTime(549)
    expect(root.querySelector('.gm-slot:nth-child(1)')?.classList.contains('is-lit')).toBe(true)
    vi.advanceTimersByTime(1)
    expect(root.querySelector('.gm-slot:nth-child(2)')?.classList.contains('is-lit')).toBe(true)
    vi.advanceTimersByTime(1099)
    expect(text('.gm-message')).toContain('Perhatikan')
    press('ArrowUp')
    expect(root.querySelectorAll('.is-ok')).toHaveLength(0)
    vi.advanceTimersByTime(1)
    expect(text('.gm-message')).toContain('Giliranmu')
    expect(root.querySelectorAll('.gm-slot')).toHaveLength(3)
  })

  it('makes every later level faster and labels the hardest level', () => {
    mount()
    clickButton('Mulai')
    LEVELS.forEach((level, index) => {
      expect(text('.gm-level')).toBe(`TAHAP ${index + 1} / 5 · ${level.hint}`)
      vi.advanceTimersByTime(level.length * level.stepMs - 1)
      expect(text('.gm-message')).not.toContain('Giliranmu')
      vi.advanceTimersByTime(1)
      expect(root.querySelectorAll('.gm-slot')).toHaveLength(level.length)
      if (index === LEVELS.length - 1) return
      for (let step = 0; step < level.length; step += 1) press('ArrowUp')
      vi.advanceTimersByTime(LEVEL_PAUSE_MS)
    })
    expect(text('.gm-level')).toBe('TAHAP 5 / 5 · TERCEPAT')
  })

  it('replays a lesson at the same level speed', () => {
    mount()
    clickButton('Mulai')
    showLevel(0)
    press('ArrowDown')
    vi.advanceTimersByTime(LESSON_MS)
    vi.advanceTimersByTime(LEVELS[0].length * LEVELS[0].stepMs - 1)
    expect(text('.gm-message')).not.toContain('Giliranmu')
    vi.advanceTimersByTime(1)
    expect(text('.gm-message')).toContain('Giliranmu')
    expect(text('.gm-level')).toBe('TAHAP 1 / 5 · PELAN')
  })

  it('ignores input while the pattern is displaying', () => {
    mount()
    clickButton('Mulai')
    press('ArrowDown')
    press('ArrowUp')
    expect(root.querySelectorAll('.is-wrong, .is-ok')).toHaveLength(0)
    showLevel(0)
    expect(text('.gm-message')).toContain('Giliranmu')
    expect(Array.from(root.querySelectorAll('.gm-slot')).map((slot) => slot.textContent)).toEqual(['?', '?', '?'])
  })

  it('treats keyboard, WASD and on-screen buttons as the same input', () => {
    mount()
    clickButton('Mulai')
    showLevel(0)
    press('ArrowUp')
    root.querySelector<HTMLButtonElement>('.gm-key-up')!.click()
    press('w')
    expect(text('.gm-sprout-caption')).toBe('Tumbuh 1 / 5')
  })

  it('turns a wrong input into a lesson, replays the pattern and keeps earned points', () => {
    mount()
    clickButton('Mulai')
    clearLevel(0)
    vi.advanceTimersByTime(LEVEL_PAUSE_MS)
    showLevel(1)
    press('ArrowUp')
    press('ArrowDown')
    expect(root.querySelector('.is-wrong')?.textContent).toBe('↓ ✗')
    expect(text('.gm-message')).toContain('Pelajaran: panah ke-2 seharusnya ↑')
    vi.advanceTimersByTime(LESSON_MS)
    press('ArrowUp')
    expect(root.querySelectorAll('.is-ok')).toHaveLength(0)
    showLevel(1)
    expect(text('.gm-message')).toContain('Giliranmu')
    vi.advanceTimersByTime(ROUND_MS)
    // Level 1 cleared (15) + best 1/4 on level 2 = floor(18 / 4) = 4.
    expect(text('.gm-panel-title')).toBe('Skor 19 / 100')
    expect(onComplete).not.toHaveBeenCalled()
  })

  it('reports 100 once via "Lanjut" after a perfect run', () => {
    mount()
    clickButton('Mulai')
    LEVELS.forEach((_, index) => {
      clearLevel(index)
      if (index < LEVELS.length - 1) vi.advanceTimersByTime(LEVEL_PAUSE_MS)
    })
    expect(text('.gm-panel-title')).toBe('Lulus! 100 / 100')
    expect(onComplete).not.toHaveBeenCalled()
    const next = findButton('Lanjut')!
    next.click()
    next.click()
    press('Enter')
    press('Escape')
    expect(onComplete).toHaveBeenCalledTimes(1)
    expect(onComplete).toHaveBeenCalledWith(100)
    expect(onCancel).not.toHaveBeenCalled()
  })

  it('does not report a score under 65 and offers retry or menu', () => {
    mount()
    clickButton('Mulai')
    clearLevel(0)
    vi.advanceTimersByTime(ROUND_MS)
    expect(text('.gm-panel-title')).toBe('Skor 15 / 100')
    expect(text('.gm-panel')).toContain('Target 65')
    expect(findButton('Coba lagi')).toBeTruthy()
    expect(findButton('Kembali ke menu')).toBeTruthy()
    expect(onComplete).not.toHaveBeenCalled()
    expect(onCancel).not.toHaveBeenCalled()
  })

  it('restarts a fresh round at level 1 with 20 seconds on "Coba lagi"', () => {
    mount()
    clickButton('Mulai')
    clearLevel(0)
    vi.advanceTimersByTime(ROUND_MS)
    clickButton('Coba lagi')
    expect(root.querySelector<HTMLElement>('.gm-panel')!.hidden).toBe(true)
    expect(text('.gm-time')).toBe('20,0 d')
    expect(text('.gm-level')).toBe('TAHAP 1 / 5 · PELAN')
    expect(text('.gm-sprout-caption')).toBe('Tumbuh 0 / 5')
    vi.advanceTimersByTime(ROUND_MS)
    expect(text('.gm-panel-title')).toBe('Skor 0 / 100')
  })

  it('cancels without points from "Kembali ke menu"', () => {
    mount()
    clickButton('Mulai')
    vi.advanceTimersByTime(ROUND_MS)
    clickButton('Kembali ke menu')
    expect(onCancel).toHaveBeenCalledTimes(1)
    expect(onComplete).not.toHaveBeenCalled()
  })

  it('cancels with Esc during play and reports nothing further', () => {
    mount()
    clickButton('Mulai')
    showLevel(0)
    press('Escape')
    press('Escape')
    clickButton('Keluar')
    vi.advanceTimersByTime(ROUND_MS)
    expect(onCancel).toHaveBeenCalledTimes(1)
    expect(onComplete).not.toHaveBeenCalled()
    expect(vi.getTimerCount()).toBe(0)
  })

  it('reports an internal failure as an error without a score', () => {
    mount(() => { throw new Error('boom') })
    clickButton('Mulai')
    expect(onError).toHaveBeenCalledTimes(1)
    expect(onError.mock.calls[0][0]).toBeInstanceOf(Error)
    expect(onComplete).not.toHaveBeenCalled()
    vi.advanceTimersByTime(ROUND_MS)
    expect(vi.getTimerCount()).toBe(0)
  })

  it('clears timers and DOM on destroy', () => {
    mount()
    clickButton('Mulai')
    expect(vi.getTimerCount()).toBeGreaterThan(0)
    handle.destroy()
    // Advancing flushes jsdom's own focus timers; a leaked interval would remain.
    vi.advanceTimersByTime(ROUND_MS)
    expect(vi.getTimerCount()).toBe(0)
    expect(onCancel).not.toHaveBeenCalled()
    expect(onComplete).not.toHaveBeenCalled()
    expect(root.childElementCount).toBe(0)
  })
})
