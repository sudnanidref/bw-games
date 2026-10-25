import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { GameProps } from '../contract'
import { MatchTheSolution } from './MatchTheSolution'
import { CustomerFocusPreview } from './Preview'
import { customers, serviceScore } from './service'
import { ATTACK_MS, CUSTOMER_MS } from './shift'

afterEach(() => { cleanup(); vi.useRealTimers(); vi.restoreAllMocks() })
function setup() {
  const props: GameProps = { context: { valueId: 'customer-focus', playerName: 'Ayu', priorResults: [] }, onComplete: vi.fn(), onCancel: vi.fn(), onError: vi.fn() }
  render(<MatchTheSolution {...props} />)
  return props
}
function start() { fireEvent.click(screen.getByRole('button', { name: /mulai ronde/i })) }
function solve(index: number) {
  for (const step of customers[index].steps) fireEvent.click(screen.getByRole('button', { name: new RegExp(step.cards[step.correct].title) }))
}

describe('Customer Focus service shift', () => {
  it('supports all six encounters and submits the final score only once', () => {
    vi.spyOn(performance, 'now').mockReturnValue(0)
    const props = setup()
    start()
    expect(screen.getByLabelText('Sisa waktu nasabah').textContent).toBe('10.0 dtk')
    for (let i = 0; i < customers.length; i++) {
      expect(screen.getByText(customers[i].steps[0].speech)).toBeTruthy()
      solve(i)
      fireEvent.click(screen.getByRole('button', { name: i === customers.length - 1 ? /selesaikan shift/i : /nasabah berikutnya/i }))
    }
    expect(props.onComplete).not.toHaveBeenCalled()
    const continueButton = screen.getByRole('button', { name: /lanjutkan perjalanan/i })
    fireEvent.click(continueButton); fireEvent.click(continueButton)
    expect(props.onComplete).toHaveBeenCalledExactlyOnceWith({ valueId: 'customer-focus', score: 100 })
  })
  it('explains a wrong choice, prevents repeat penalties, and allows a keyboard retry', async () => {
    vi.spyOn(performance, 'now').mockReturnValue(0)
    setup(); start()
    const wrong = screen.getByRole('button', { name: /janjikan langsung/i })
    fireEvent.click(wrong); fireEvent.click(wrong)
    expect(screen.getByRole('status').textContent).toBe(customers[0].steps[0].hint)
    expect(wrong.hasAttribute('disabled')).toBe(true)
    const user = userEvent.setup()
    screen.getByRole('button', { name: /dengarkan & pahami/i }).focus()
    await user.keyboard('{Enter}')
    expect(screen.getByText(customers[0].steps[1].speech)).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: /periksa & tindak lanjuti/i }))
    expect(screen.getByText('12', { selector: '.cf-score' })).toBeTruthy()
  })
  it('warns at three seconds, attacks once at timeout, and automatically advances with a point penalty', () => {
    vi.useFakeTimers()
    let now = 0
    vi.spyOn(performance, 'now').mockImplementation(() => now)
    const props = setup(); start(); solve(0)
    fireEvent.click(screen.getByRole('button', { name: /nasabah berikutnya/i }))
    now = 7000
    act(() => vi.advanceTimersByTime(50))
    expect(screen.getByRole('alert').textContent).toContain('3 DETIK')
    expect(screen.queryByRole('img', { name: /menyerang/i })).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: /panduan perlahan/i }))
    expect(screen.getByLabelText('Sisa waktu nasabah').textContent).toBe('3.0 dtk')
    now = CUSTOMER_MS
    act(() => vi.advanceTimersByTime(50))
    expect(screen.getByRole('img', { name: 'Pak Budi, menyerang' }).getAttribute('src')).toContain('confused-attack.png')
    expect(screen.queryByRole('group', { name: 'Kartu tindakan di tangan' })).toBeNull()
    expect(screen.getByText('7', { selector: '.cf-score' })).toBeTruthy()
    now += ATTACK_MS
    act(() => vi.advanceTimersByTime(50))
    expect(screen.getByRole('img', { name: 'Mbak Sari, cemas' })).toBeTruthy()
    expect(screen.getByLabelText('Sisa waktu nasabah').textContent).toBe('10.0 dtk')
    expect(props.onComplete).not.toHaveBeenCalled()
  })
  it('rejects a late click before the next tick, finishes six timeouts, and submits only once', () => {
    vi.useFakeTimers()
    let now = 0
    vi.spyOn(performance, 'now').mockImplementation(() => now)
    const props = setup(); start()
    now = CUSTOMER_MS
    fireEvent.click(screen.getByRole('button', { name: /dengarkan & pahami/i }))
    expect(screen.getByRole('img', { name: 'Bu Rina, menyerang' })).toBeTruthy()
    for (let i = 0; i < customers.length; i++) {
      if (i > 0) { now += CUSTOMER_MS; act(() => vi.advanceTimersByTime(50)) }
      now += ATTACK_MS
      act(() => vi.advanceTimersByTime(50))
    }
    expect(screen.getByText(/6 serangan/)).toBeTruthy()
    expect(props.onComplete).not.toHaveBeenCalled()
    const button = screen.getByRole('button', { name: /lanjutkan perjalanan/i })
    fireEvent.click(button); fireEvent.click(button)
    expect(props.onComplete).toHaveBeenCalledExactlyOnceWith({ valueId: 'customer-focus', score: 0 })
  })
  it('stops a timeout transition after cancellation', () => {
    vi.useFakeTimers()
    let now = 0
    vi.spyOn(performance, 'now').mockImplementation(() => now)
    const props = setup(); start()
    now = CUSTOMER_MS
    act(() => vi.advanceTimersByTime(50))
    fireEvent.click(screen.getByRole('button', { name: 'Batal' }))
    now += ATTACK_MS
    act(() => vi.advanceTimersByTime(1000))
    expect(screen.queryByRole('img', { name: 'Pak Budi, bingung' })).toBeNull()
    expect(props.onCancel).toHaveBeenCalledOnce()
    expect(props.onComplete).not.toHaveBeenCalled()
  })
  it('cancels once without a score and the preview can restart', () => {
    const props = setup(); start()
    const cancel = screen.getByRole('button', { name: 'Batal' })
    fireEvent.click(cancel); fireEvent.click(cancel)
    expect(props.onCancel).toHaveBeenCalledOnce()
    expect(props.onComplete).not.toHaveBeenCalled()
    cleanup(); render(<CustomerFocusPreview />)
    fireEvent.click(screen.getByRole('button', { name: 'Batal' }))
    expect(screen.getByText('Ronde dibatalkan.')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: /main lagi/i }))
    expect(screen.getByRole('button', { name: /mulai ronde/i })).toBeTruthy()
  })
  it('plays generated feedback effects without changing card choices or losing the hint', () => {
    vi.useFakeTimers()
    vi.spyOn(performance, 'now').mockReturnValue(0)
    const props = setup(); start()
    const hand = screen.getByRole('group', { name: 'Kartu tindakan di tangan' })
    expect(hand.querySelectorAll('button')).toHaveLength(3)
    expect(hand.querySelector('img')?.getAttribute('src')).toContain('card-face.png')
    fireEvent.click(screen.getByRole('button', { name: /janjikan langsung/i }))
    expect(document.querySelector('.cf-interaction-error img')?.getAttribute('src')).toContain('fx-error.png')
    act(() => vi.advanceTimersByTime(1100))
    expect(document.querySelector('.cf-interaction')).toBeNull()
    expect(screen.getByRole('status').textContent).toBe(customers[0].steps[0].hint)
    fireEvent.click(screen.getByRole('button', { name: /dengarkan & pahami/i }))
    expect(document.querySelector('.cf-interaction-success img')?.getAttribute('src')).toContain('fx-success.png')
    expect(screen.getByText(customers[0].steps[1].speech)).toBeTruthy()
    expect(props.onComplete).not.toHaveBeenCalled()
    cleanup()
    act(() => vi.advanceTimersByTime(2000))
    expect(props.onComplete).not.toHaveBeenCalled()
  })
  it('keeps each customer angry after a wrong card and happy after a correct card, then resets for the next arrival', () => {
    vi.useFakeTimers()
    vi.spyOn(performance, 'now').mockReturnValue(0)
    setup(); start()
    for (let index = 0; index < customers.length; index++) {
      const customer = customers[index]
      expect(screen.getByRole('img', { name: `${customer.name}, ${customer.mood.toLowerCase()}` }).getAttribute('src')).toBe(`/assets/customer-focus/${customer.art}.png`)
      for (const step of customer.steps) {
        const incorrect = (step.correct + 1) % step.cards.length
        fireEvent.click(screen.getByRole('button', { name: new RegExp(step.cards[incorrect].title) }))
        const angryPortrait = customer.art === 'angry' ? 'angry' : `${customer.art}-angry`
        expect(screen.getByRole('img', { name: `${customer.name}, kesal` }).getAttribute('src')).toBe(`/assets/customer-focus/${angryPortrait}.png`)
        act(() => vi.advanceTimersByTime(1200))
        expect(screen.getByRole('img', { name: `${customer.name}, kesal` })).toBeTruthy()
        fireEvent.click(screen.getByRole('button', { name: new RegExp(step.cards[step.correct].title) }))
        expect(screen.getByRole('img', { name: `${customer.name}, senang` }).getAttribute('src')).toBe(`/assets/customer-focus/${customer.art}-happy.png`)
        act(() => vi.advanceTimersByTime(1200))
        expect(screen.getByRole('img', { name: `${customer.name}, senang` })).toBeTruthy()
      }
      fireEvent.click(screen.getByRole('button', { name: index === customers.length - 1 ? /selesaikan shift/i : /nasabah berikutnya/i }))
    }
  })
  it('keeps scoring bounded and every customer has one correct action per step', () => {
    expect(serviceScore(6, 0)).toBe(100)
    expect(serviceScore(6, 1)).toBe(95)
    expect(serviceScore(0, 30)).toBe(0)
    for (const customer of customers) {
      expect(customer.steps).toHaveLength(2)
      for (const step of customer.steps) expect(step.cards[step.correct]).toBeDefined()
    }
  })
})
