// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { GrowthMindsetGame } from './GrowthMindsetGame'
import { LEVELS, ROUND_MS } from './scoring'

const context = Object.freeze({ valueId: 'growth-mindset' as const, playerName: 'Ayu', priorResults: [] })

function setup() {
  const props = { onComplete: vi.fn(), onCancel: vi.fn(), onError: vi.fn() }
  const view = render(<GrowthMindsetGame context={context} {...props} />)
  return { ...props, ...view }
}

afterEach(() => {
  cleanup()
  vi.useRealTimers()
})

describe('GrowthMindsetGame adapter', () => {
  it('mounts the engine briefing', () => {
    setup()
    expect(screen.getByRole('button', { name: 'Mulai' })).toBeTruthy()
    expect(screen.getByText('20,0 d')).toBeTruthy()
  })

  it('does not complete a failing round and cancels from the menu action', () => {
    vi.useFakeTimers()
    const { onComplete, onCancel } = setup()
    fireEvent.click(screen.getByRole('button', { name: 'Mulai' }))
    act(() => { vi.advanceTimersByTime(ROUND_MS) })
    expect(screen.getByText('Skor 0 / 100')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Kembali ke menu' }))
    expect(onComplete).not.toHaveBeenCalled()
    expect(onCancel).toHaveBeenCalledTimes(1)
  })

  it('reports the passing result for the context value', () => {
    vi.useFakeTimers()
    vi.spyOn(Math, 'random').mockReturnValue(0.3)
    const { onComplete } = setup()
    fireEvent.click(screen.getByRole('button', { name: 'Mulai' }))
    for (const level of LEVELS) {
      act(() => { vi.advanceTimersByTime(level.length * level.stepMs) })
      for (let step = 0; step < level.length; step += 1) fireEvent.click(screen.getByRole('button', { name: 'Panah atas' }))
      act(() => { vi.advanceTimersByTime(250) })
    }
    fireEvent.click(screen.getByRole('button', { name: 'Lanjut' }))
    expect(onComplete).toHaveBeenCalledTimes(1)
    expect(onComplete).toHaveBeenCalledWith({ valueId: 'growth-mindset', score: 100 })
    vi.restoreAllMocks()
  })

  it('removes the game and its timers on unmount', () => {
    vi.useFakeTimers()
    const { onCancel, onComplete, container, unmount } = setup()
    fireEvent.click(screen.getByRole('button', { name: 'Mulai' }))
    unmount()
    act(() => { vi.advanceTimersByTime(ROUND_MS) })
    expect(vi.getTimerCount()).toBe(0)
    expect(container.querySelector('.gm-game')).toBeNull()
    expect(onCancel).not.toHaveBeenCalled()
    expect(onComplete).not.toHaveBeenCalled()
  })
})
