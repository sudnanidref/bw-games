import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { BlindBuilder } from './BlindBuilder'

const context = { valueId: 'collaborative' as const, playerName: 'Ayu', priorResults: [{ valueId: 'integrity' as const, score: 80 }] }
afterEach(() => { cleanup(); vi.unstubAllGlobals(); vi.useRealTimers() })

describe('Blind Builder stage', () => {
  it('shows boards, sends a bounded instruction, and commits only after confirmation', async () => {
    const onComplete = vi.fn()
    const fetchMock = vi.fn(async (_url: string, _options?: RequestInit) => ({ ok: true, json: async () => ({ roundId: 1, outcome: {
      type: 'action', action: { type: 'place', object: { shape: 'circle', color: 'blue', row: 0, column: 0 } },
    } }) }))
    vi.stubGlobal('fetch', fetchMock)
    render(<BlindBuilder context={context} onComplete={onComplete} onCancel={vi.fn()} onError={vi.fn()} />)
    expect(within(screen.getByRole('grid', { name: 'Your target board' })).getAllByRole('gridcell')).toHaveLength(25)
    expect(within(screen.getByRole('grid', { name: "Teammate's board" })).getAllByRole('gridcell')).toHaveLength(25)
    fireEvent.change(screen.getByRole('textbox', { name: 'YOUR INSTRUCTION' }), { target: { value: 'Put blue circle at top left' } })
    fireEvent.click(screen.getByRole('button', { name: 'Send' }))
    await screen.findByText('Placed the blue circle.')
    expect(JSON.parse(fetchMock.mock.calls[0]?.[1]?.body as string)).not.toHaveProperty('target')
    expect(within(screen.getByRole('grid', { name: "Teammate's board" })).getByRole('gridcell', { name: /Row 1, column 1, blue circle/ })).toBeTruthy()
    expect(onComplete).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: 'Submit round' }))
    expect(screen.getByText('TEAM SCORE')).toBeTruthy()
    expect(onComplete).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: 'Continue journey' }))
    fireEvent.click(screen.getByRole('button', { name: 'Continue journey' }))
    expect(onComplete).toHaveBeenCalledTimes(1)
    expect(onComplete).toHaveBeenCalledWith({ valueId: 'collaborative', score: expect.any(Number) })
  })

  it('times out once with zero speed and ignores an in-flight response', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-01-01T00:00:00Z'))
    let resolveResponse: (value: unknown) => void = () => {}
    vi.stubGlobal('fetch', vi.fn(() => new Promise((resolve) => { resolveResponse = resolve })))
    const onComplete = vi.fn()
    render(<BlindBuilder context={context} onComplete={onComplete} onCancel={vi.fn()} onError={vi.fn()} />)
    fireEvent.change(screen.getByRole('textbox', { name: 'YOUR INSTRUCTION' }), { target: { value: 'Put blue circle at top left' } })
    fireEvent.click(screen.getByRole('button', { name: 'Send' }))
    await act(async () => { vi.advanceTimersByTime(180_000) })
    expect(screen.getByText('TEAM SCORE')).toBeTruthy()
    expect(screen.getByText('Time left').parentElement?.textContent).toContain('0%')
    await act(async () => { resolveResponse({ ok: true, json: async () => ({ roundId: 1, outcome: { type: 'action', action: { type: 'place', object: { shape: 'circle', color: 'blue', row: 0, column: 0 } } } }) }) })
    expect(within(screen.getByRole('grid', { name: 'Final teammate board' })).getByRole('gridcell', { name: 'Row 1, column 1, empty' })).toBeTruthy()
    expect(onComplete).not.toHaveBeenCalled()
  })

  it('replays without scoring and cancels without awarding points', () => {
    const onComplete = vi.fn()
    const onCancel = vi.fn()
    render(<BlindBuilder context={context} onComplete={onComplete} onCancel={onCancel} onError={vi.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: 'Submit round' }))
    fireEvent.click(screen.getByRole('button', { name: 'Play again' }))
    expect(screen.getByRole('grid', { name: "Teammate's board" })).toBeTruthy()
    expect(onComplete).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: 'Exit game' }))
    expect(onCancel).toHaveBeenCalledTimes(1)
    expect(onComplete).not.toHaveBeenCalled()
  })

  it('keeps the board unchanged on a service failure and permits a retry', async () => {
    const fetchMock = vi.fn().mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce({ ok: true, json: async () => ({
      roundId: 1, outcome: { type: 'action', action: { type: 'place', object: { shape: 'circle', color: 'blue', row: 0, column: 0 } } },
    }) })
    vi.stubGlobal('fetch', fetchMock)
    render(<BlindBuilder context={context} onComplete={vi.fn()} onCancel={vi.fn()} onError={vi.fn()} />)
    fireEvent.change(screen.getByRole('textbox', { name: 'YOUR INSTRUCTION' }), { target: { value: 'Put blue circle at top left' } })
    fireEvent.click(screen.getByRole('button', { name: 'Send' }))
    await screen.findByText(/Please rephrase; I haven't changed the board/)
    expect(within(screen.getByRole('grid', { name: "Teammate's board" })).getByRole('gridcell', { name: 'Row 1, column 1, empty' })).toBeTruthy()
    fireEvent.change(screen.getByRole('textbox', { name: 'YOUR INSTRUCTION' }), { target: { value: 'Put blue circle at top left' } })
    fireEvent.click(screen.getByRole('button', { name: 'Send' }))
    await screen.findByText('Placed the blue circle.')
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('ignores an old response after replaying a submitted round', async () => {
    let resolveResponse: (value: unknown) => void = () => {}
    vi.stubGlobal('fetch', vi.fn(() => new Promise((resolve) => { resolveResponse = resolve })))
    const onComplete = vi.fn()
    render(<BlindBuilder context={context} onComplete={onComplete} onCancel={vi.fn()} onError={vi.fn()} />)
    fireEvent.change(screen.getByRole('textbox', { name: 'YOUR INSTRUCTION' }), { target: { value: 'Put blue circle at top left' } })
    fireEvent.click(screen.getByRole('button', { name: 'Send' }))
    fireEvent.click(screen.getByRole('button', { name: 'Submit round' }))
    fireEvent.click(screen.getByRole('button', { name: 'Play again' }))
    await act(async () => { resolveResponse({ ok: true, json: async () => ({ roundId: 1, outcome: { type: 'action', action: { type: 'place', object: { shape: 'circle', color: 'blue', row: 0, column: 0 } } } }) }) })
    expect(within(screen.getByRole('grid', { name: "Teammate's board" })).getByRole('gridcell', { name: 'Row 1, column 1, empty' })).toBeTruthy()
    expect(onComplete).not.toHaveBeenCalled()
  })

  it('commits a real zero score only once', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-01-01T00:00:00Z'))
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, json: async () => ({ roundId: 1, outcome: { type: 'message', message: 'Please rephrase.' } }) })))
    const onComplete = vi.fn()
    render(<BlindBuilder context={context} onComplete={onComplete} onCancel={vi.fn()} onError={vi.fn()} />)
    for (let index = 0; index < 16; index += 1) {
      await act(async () => {
        fireEvent.change(screen.getByRole('textbox', { name: 'YOUR INSTRUCTION' }), { target: { value: 'Undo' } })
        fireEvent.click(screen.getByRole('button', { name: 'Send' }))
      })
      expect((screen.getByRole('textbox', { name: 'YOUR INSTRUCTION' }) as HTMLTextAreaElement).disabled).toBe(false)
    }
    await act(async () => { vi.advanceTimersByTime(180_000) })
    expect(screen.getByText('TEAM SCORE').nextElementSibling?.textContent).toContain('0/100')
    fireEvent.click(screen.getByRole('button', { name: 'Continue journey' }))
    fireEvent.click(screen.getByRole('button', { name: 'Continue journey' }))
    expect(onComplete).toHaveBeenCalledTimes(1)
    expect(onComplete).toHaveBeenCalledWith({ valueId: 'collaborative', score: 0 })
  })
})