import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { GameProps } from '../contract'
import { games } from '..'
import { completeStage, createJourney, totalScore } from '../../journey'
import { cases, type CaseId } from './cases'
import { draftDistractors } from './draft-distractors'
import { MatchTheSolution } from './MatchTheSolution'
import { CustomerFocusPreview } from './Preview'
import * as rules from './rules'

afterEach(() => { cleanup(); vi.useRealTimers(); vi.restoreAllMocks() })

function setup() {
  const onComplete = vi.fn()
  const onCancel = vi.fn()
  const onError = vi.fn()
  const context: GameProps['context'] = { valueId: 'customer-focus', playerName: 'Ayu', priorResults: [] }
  render(<MatchTheSolution context={context} onComplete={onComplete} onCancel={onCancel} onError={onError} />)
  return { onComplete, onCancel, onError }
}

function start() {
  fireEvent.click(screen.getByRole('button', { name: /mulai ronde/i }))
}

function solution(caseId: CaseId) {
  return screen.getByText(cases.find(({ id }) => id === caseId)!.solution).closest('button')!
}

describe('Match the Solution', () => {
  it('plays directly in the dev preview and can restart after completion or cancellation', () => {
    vi.spyOn(performance, 'now').mockReturnValue(0)
    render(<CustomerFocusPreview />)
    start()
    for (const [caseId, situation] of [['login', 1], ['qris', 2], ['transfer', 3]] as const) {
      fireEvent.click(solution(caseId))
      fireEvent.click(screen.getByRole('button', { name: new RegExp(`^Situasi ${situation}:`) }))
    }
    fireEvent.click(screen.getByRole('button', { name: /lanjutkan perjalanan/i }))
    expect(screen.getByRole('region', { name: 'Hasil preview' }).textContent).toContain('100 / 100')
    fireEvent.click(screen.getByRole('button', { name: /main lagi/i }))
    expect(screen.getByRole('button', { name: /mulai ronde/i })).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: /^batal/i }))
    expect(screen.getByText('Ronde dibatalkan.')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: /main lagi/i }))
    expect(screen.getByRole('button', { name: /mulai ronde/i })).toBeTruthy()
  })

  it('hands the real fifth-stage result to the journey only once and rejects premature completion', () => {
    vi.spyOn(performance, 'now').mockReturnValue(0)
    expect(games[4].component).toBe(MatchTheSolution)
    let journey = createJourney('Ayu', 'run')!
    expect(completeStage(journey, { valueId: 'customer-focus', score: 100 }, true)).toBe(journey)
    for (const game of games.slice(0, 4)) {
      journey = completeStage(journey, { valueId: game.id, score: 20 }, true)
    }
    const priorResults = journey.results
    const onCancel = vi.fn()
    const onError = vi.fn()
    render(<MatchTheSolution context={{ valueId: 'customer-focus', playerName: 'Ayu', priorResults }} onComplete={(result) => { journey = completeStage(journey, result, games[4].available) }} onCancel={onCancel} onError={onError} />)
    start()
    for (const [caseId, situation] of [['login', 1], ['qris', 2], ['transfer', 3]] as const) {
      fireEvent.click(solution(caseId))
      fireEvent.click(screen.getByRole('button', { name: new RegExp(`^Situasi ${situation}:`) }))
    }
    expect(totalScore(journey)).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: /lanjutkan perjalanan/i }))
    expect(journey.results.map(({ score }) => score)).toEqual([20, 20, 20, 20, 100])
    expect(totalScore(journey)).toBe(180)
    expect(completeStage(journey, { valueId: 'customer-focus', score: 100 }, true)).toBe(journey)
    expect(priorResults).toHaveLength(4)
    expect(onCancel).not.toHaveBeenCalled()
    expect(onError).not.toHaveBeenCalled()
  })

  it('starts from a briefing and lets keyboard players complete the round exactly once', async () => {
    const clock = vi.spyOn(performance, 'now').mockReturnValue(0)
    const { onComplete } = setup()
    expect(screen.getByText(/Tarik solusi yang bergerak ke situasi/i)).toBeTruthy()
    expect(screen.queryByRole('time')).toBeNull()
    start()
    expect(screen.getByLabelText('Sisa waktu').textContent).toBe('45 dtk')
    const user = userEvent.setup()
    const pairs = [['login', 1], ['qris', 2], ['transfer', 3]] as const
    for (const [caseId, situation] of pairs) {
      solution(caseId).focus()
      await user.keyboard('{Enter}')
      screen.getByRole('button', { name: new RegExp(`^Situasi ${situation}:`) }).focus()
      await user.keyboard('{Enter}')
    }
    expect(screen.getByText('Semua terpasang.')).toBeTruthy()
    expect(screen.getByText('100', { selector: '.match-final-score' })).toBeTruthy()
    expect(onComplete).not.toHaveBeenCalled()
    clock.mockReturnValue(90_000)
    fireEvent.click(screen.getByRole('button', { name: /lanjutkan perjalanan/i }))
    fireEvent.click(screen.getByRole('button', { name: /lanjutkan perjalanan/i }))
    expect(onComplete).toHaveBeenCalledExactlyOnceWith({ valueId: 'customer-focus', score: 100 })
  })

  it('uses the same matching rule for pointer drops and ignores abandoned drops', () => {
    vi.spyOn(performance, 'now').mockReturnValue(0)
    setup()
    start()
    const response = solution('login')
    const situation = screen.getByRole('button', { name: /^Situasi 1:/ })
    Object.defineProperty(document, 'elementFromPoint', { configurable: true, value: vi.fn(() => null) })
    fireEvent.pointerDown(response, { clientX: 10, clientY: 10, pointerId: 1 })
    fireEvent.pointerUp(response, { clientX: 90, clientY: 90, pointerId: 1 })
    expect(screen.getByText(/Tarik solusi atau pilih solusi/i)).toBeTruthy()
    Object.defineProperty(document, 'elementFromPoint', { configurable: true, value: vi.fn(() => situation) })
    fireEvent.pointerDown(response, { clientX: 10, clientY: 10, pointerId: 1 })
    fireEvent.pointerUp(response, { clientX: 90, clientY: 90, pointerId: 1 })
    expect(screen.getByText(/Tepat! Pasangan terkunci. Runtun 1/)).toBeTruthy()
    expect(screen.getByText('1/3 tepat')).toBeTruthy()
    expect(response.isConnected).toBe(false)
  })

  it('announces wrong matches, applies a penalty, and allows another try', () => {
    vi.spyOn(performance, 'now').mockReturnValue(0)
    setup()
    start()
    fireEvent.click(solution('qris'))
    fireEvent.click(screen.getByRole('button', { name: /^Situasi 1:/ }))
    expect(screen.getByRole('status').textContent).toContain('Belum tepat')
    expect(screen.getByRole('button', { name: /^Situasi 1:/ }).hasAttribute('disabled')).toBe(false)
    fireEvent.click(solution('login'))
    fireEvent.click(screen.getByRole('button', { name: /^Situasi 1:/ }))
    expect(screen.getByText(/Tepat! Pasangan terkunci. Runtun 1/)).toBeTruthy()
  })

  it('returns a dropped distractor, resets the streak, and still accepts keyboard input after dragging', async () => {
    vi.spyOn(performance, 'now').mockReturnValue(0)
    setup()
    start()
    fireEvent.click(solution('login'))
    fireEvent.click(screen.getByRole('button', { name: /^Situasi 1:/ }))
    const distractor = screen.getByText(draftDistractors[0].text).closest('button')!
    const customer = screen.getByRole('button', { name: /^Situasi 2:/ })
    Object.defineProperty(document, 'elementFromPoint', { configurable: true, value: vi.fn(() => customer) })
    fireEvent.pointerDown(distractor, { clientX: 10, clientY: 10, pointerId: 1 })
    fireEvent.pointerMove(distractor, { clientX: 90, clientY: 90, pointerId: 1 })
    fireEvent.pointerUp(distractor, { clientX: 90, clientY: 90, pointerId: 1 })
    expect(screen.getByRole('status').textContent).toContain('runtun 0')
    expect(distractor.isConnected).toBe(true)
    expect(customer.hasAttribute('disabled')).toBe(false)
    solution('qris').focus()
    await userEvent.setup().keyboard('{Enter}')
    fireEvent.click(customer)
    expect(screen.getByRole('status').textContent).toContain('Runtun 1')
  })

  it('freezes a partial score at timeout and submits only on Continue', () => {
    vi.useFakeTimers()
    let time = 0
    vi.spyOn(performance, 'now').mockImplementation(() => time)
    const { onComplete } = setup()
    start()
    fireEvent.click(solution('login'))
    fireEvent.click(screen.getByRole('button', { name: /^Situasi 1:/ }))
    time = 45_000
    act(() => vi.advanceTimersByTime(45_000))
    expect(screen.getByText('Waktu habis.')).toBeTruthy()
    expect(screen.getByText('20', { selector: '.match-final-score' })).toBeTruthy()
    expect(screen.getByText('FAIL', { selector: '.journey-status' })).toBeTruthy()
    expect(onComplete).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: /lanjutkan perjalanan/i }))
    expect(onComplete).toHaveBeenCalledExactlyOnceWith({ valueId: 'customer-focus', score: 20 })
  })

  it('cancels without points and routes unexpected rule failures to onError', () => {
    vi.spyOn(performance, 'now').mockReturnValue(0)
    const { onCancel, onComplete, onError } = setup()
    start()
    fireEvent.click(screen.getByRole('button', { name: /^batal/i }))
    fireEvent.click(screen.getByRole('button', { name: /^batal/i }))
    expect(onCancel).toHaveBeenCalledTimes(1)
    expect(onComplete).not.toHaveBeenCalled()
    cleanup()
    const next = setup()
    start()
    vi.spyOn(rules, 'matchPair').mockImplementation(() => { throw new Error('round failed') })
    fireEvent.click(solution('login'))
    fireEvent.click(screen.getByRole('button', { name: /^Situasi 1:/ }))
    expect(next.onError).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({ message: 'round failed' }))
    expect(next.onComplete).not.toHaveBeenCalled()
    expect(onError).not.toHaveBeenCalled()
  })
})
