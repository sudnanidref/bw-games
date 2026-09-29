// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, createEvent, fireEvent, render, screen } from '@testing-library/react'
import type { GameProps } from '../contract'
import { AccountabilityGame } from './AccountabilityGame'
import { playCring } from './effects'

vi.mock('./effects', () => ({ playCring: vi.fn(() => true) }))

afterEach(() => {
  cleanup()
  vi.useRealTimers()
  vi.restoreAllMocks()
  vi.mocked(playCring).mockClear()
})

function props(): GameProps {
  return {
    context: { valueId: 'accountability', playerName: 'Ayu', priorResults: [] },
    onComplete: vi.fn(),
    onCancel: vi.fn(),
    onError: vi.fn(),
  }
}

describe('Accountability game start screen', () => {
  it('U01/U14 renders only the title, score values, three methods, and timed Mulai', () => {
    vi.useFakeTimers()
    const { container } = render(<AccountabilityGame {...props()} />)

    expect(screen.getByRole('heading', { name: 'Kasir Sat Set' })).toBeTruthy()
    expect(screen.getByText('Benar +10')).toBeTruthy()
    expect(screen.getByText('Salah −5')).toBeTruthy()
    expect(screen.getByText('Minimum 0')).toBeTruthy()
    expect(screen.getByText('TUNAI')).toBeTruthy()
    expect(screen.getByText('EDC')).toBeTruthy()
    expect(screen.getByText('QRIS')).toBeTruthy()
    expect(screen.getByRole('button', { name: /Mulai.*5/ })).toBeTruthy()
    expect(container.querySelector('.kasir-start')?.textContent).not.toContain('instruksi')
  })

  it('L23 manual Mulai cancels auto-start and starts one round immediately', () => {
    vi.useFakeTimers()
    const { container } = render(<AccountabilityGame {...props()} />)
    fireEvent.click(screen.getByRole('button', { name: /Mulai.*5/ }))
    act(() => { vi.advanceTimersByTime(5_000) })

    expect(container.querySelector('.accountability-game')?.getAttribute('data-phase')).toBe('playing')
  })

  it('L22 starts a round once when the untouched countdown reaches zero', () => {
    vi.useFakeTimers()
    const { container } = render(<AccountabilityGame {...props()} />)
    act(() => { vi.advanceTimersByTime(4_999) })
    expect(container.querySelector('.accountability-game')?.getAttribute('data-phase')).toBe('ready')
    act(() => { vi.advanceTimersByTime(1) })
    expect(container.querySelector('.accountability-game')?.getAttribute('data-phase')).toBe('playing')
  })

  it('U13 shows three anonymous buyers, a lead request, and waiting method tokens', () => {
    vi.useFakeTimers()
    const { container } = render(<AccountabilityGame {...props()} />)
    fireEvent.click(screen.getByRole('button', { name: /Mulai.*5/ }))

    expect(container.querySelectorAll('[data-testid="kasir-customer"]')).toHaveLength(3)
    expect(container.querySelector('[data-role="KASIR"]')).toBeTruthy()
    expect(container.querySelectorAll('[data-role="ANTRE"]')).toHaveLength(2)
    expect(container.querySelector('.kasir-request')?.textContent).toMatch(/Saya bayar/)
    expect(container.querySelectorAll('.kasir-customer-token')).toHaveLength(3)
    expect(container.querySelector('.kasir-queue')?.textContent).not.toMatch(/buyer-\d|customer-\d/i)
  })

  it('U03/U05 accepts a keyboard activation once and keeps focus through its lock', () => {
    vi.useFakeTimers()
    const { container } = render(<AccountabilityGame {...props()} />)
    fireEvent.click(screen.getByRole('button', { name: /Mulai.*5/ }))
    const requestedMethod = container.querySelector('.kasir-request strong')?.textContent
    const paymentButton = screen.getByRole('button', { name: requestedMethod! })
    paymentButton.focus()
    fireEvent.keyDown(paymentButton, { key: 'Enter', repeat: false })
    fireEvent.click(paymentButton)

    expect(container.querySelector('.kasir-score strong')?.textContent).toBe('10')
    expect(document.activeElement).toBe(paymentButton)
    expect(paymentButton.getAttribute('aria-disabled')).toBe('true')

    const repeat = createEvent.keyDown(paymentButton, { key: 'Enter', repeat: true })
    fireEvent(paymentButton, repeat)
    expect(repeat.defaultPrevented).toBe(true)
    expect(container.querySelector('.kasir-score strong')?.textContent).toBe('10')

    act(() => { vi.advanceTimersByTime(150) })
    const nextMethod = container.querySelector('.kasir-request strong')?.textContent
    const nextButton = screen.getByRole('button', { name: nextMethod! })
    nextButton.focus()
    fireEvent.keyDown(nextButton, { key: ' ', code: 'Space', repeat: false })
    fireEvent.click(nextButton)
    expect(container.querySelector('.kasir-score strong')?.textContent).toBe('20')
  })

  it('U04 drops locked clicks and accepts a fresh click after the correct transition', () => {
    vi.useFakeTimers()
    const { container } = render(<AccountabilityGame {...props()} />)
    fireEvent.click(screen.getByRole('button', { name: /Mulai.*5/ }))
    let method = container.querySelector('.kasir-request strong')?.textContent
    let paymentButton = screen.getByRole('button', { name: method! })
    fireEvent.pointerDown(paymentButton, { pointerId: 1 })
    fireEvent.click(paymentButton)
    expect(container.querySelectorAll('.kasir-money-effects span')).toHaveLength(3)
    expect(playCring).toHaveBeenCalledTimes(1)
    fireEvent.click(paymentButton)
    expect(container.querySelector('.kasir-score strong')?.textContent).toBe('10')
    expect(playCring).toHaveBeenCalledTimes(1)

    act(() => { vi.advanceTimersByTime(150) })
    method = container.querySelector('.kasir-request strong')?.textContent
    paymentButton = screen.getByRole('button', { name: method! })
    fireEvent.pointerDown(paymentButton, { pointerId: 2 })
    fireEvent.click(paymentButton)

    expect(container.querySelector('.kasir-score strong')?.textContent).toBe('20')
    expect(playCring).toHaveBeenCalledTimes(2)
  })

  it('U15 does not play the success sound or float dollars after a wrong answer', () => {
    vi.useFakeTimers()
    const { container } = render(<AccountabilityGame {...props()} />)
    fireEvent.click(screen.getByRole('button', { name: /Mulai.*5/ }))
    const requestedMethod = container.querySelector('.kasir-request strong')?.textContent
    const wrongMethod = ['TUNAI', 'EDC', 'QRIS'].find((label) => label !== requestedMethod)!
    fireEvent.click(screen.getByRole('button', { name: wrongMethod }))

    expect(container.querySelector('.kasir-feedback')?.textContent).toContain('Belum sesuai! Penalti 5 poin')
    expect(container.querySelectorAll('.kasir-money-effects span')).toHaveLength(0)
    expect(playCring).not.toHaveBeenCalled()
  })

  it('U07 finalizes an expired round immediately on visibility return', () => {
    vi.useFakeTimers()
    let now = 0
    vi.spyOn(performance, 'now').mockImplementation(() => now)
    const { container } = render(<AccountabilityGame {...props()} />)
    fireEvent.click(screen.getByRole('button', { name: /Mulai.*5/ }))
    now = 20_001
    fireEvent(document, new Event('visibilitychange'))

    expect(container.querySelector('.accountability-game')?.getAttribute('data-phase')).toBe('result')
  })

  it('U12 shows a frozen zero-score result and hands off exactly once on Lanjut', () => {
    vi.useFakeTimers()
    let now = 0
    vi.spyOn(performance, 'now').mockImplementation(() => now)
    const gameProps = props()
    const { container } = render(<AccountabilityGame {...gameProps} />)
    fireEvent.click(screen.getByRole('button', { name: /Mulai.*5/ }))
    now = 20_000
    fireEvent(document, new Event('visibilitychange'))

    expect(screen.getByRole('heading', { name: 'Waktu Habis!' })).toBeTruthy()
    expect(container.querySelector('.kasir-result-score strong')?.textContent).toBe('0')
    expect([...container.querySelectorAll('.kasir-result-statistics dd')].map((value) => value.textContent)).toEqual(['0', '0'])
    expect(container.querySelectorAll('.kasir-payment-button')).toHaveLength(0)
    expect(screen.getByText('Cepat itu penting. Tepat melayani adalah tanggung jawab kita.')).toBeTruthy()
    expect(screen.queryByRole('button', { name: /Main Lagi/i })).toBeNull()
    expect(document.activeElement).toBe(screen.getByRole('heading', { name: 'Waktu Habis!' }))

    fireEvent.click(screen.getByRole('button', { name: 'Lanjut' }))
    fireEvent.click(screen.getByRole('button', { name: 'Lanjut' }))
    expect(gameProps.onComplete).toHaveBeenCalledTimes(1)
    expect(gameProps.onComplete).toHaveBeenCalledWith({ valueId: 'accountability', score: 0 })
  })

  it('keeps accepted raw points and buyer statistics in the frozen result', () => {
    vi.useFakeTimers()
    let now = 0
    vi.spyOn(performance, 'now').mockImplementation(() => now)
    const { container } = render(<AccountabilityGame {...props()} />)
    fireEvent.click(screen.getByRole('button', { name: /Mulai.*5/ }))
    const requestedMethod = container.querySelector('.kasir-request strong')?.textContent
    fireEvent.click(screen.getByRole('button', { name: requestedMethod! }))
    now = 20_000
    fireEvent(document, new Event('visibilitychange'))

    expect(container.querySelector('.kasir-result-score strong')?.textContent).toBe('10')
    expect([...container.querySelectorAll('.kasir-result-statistics dd')].map((value) => value.textContent)).toEqual(['1', '0'])
  })

  it('4.2 clears countdown and update timers when unmounted', () => {
    vi.useFakeTimers()
    const gameProps = props()
    const { unmount } = render(<AccountabilityGame {...gameProps} />)
    expect(vi.getTimerCount()).toBeGreaterThan(0)
    unmount()

    expect(vi.getTimerCount()).toBe(0)
    expect(gameProps.onCancel).toHaveBeenCalledTimes(1)
    expect(gameProps.onComplete).not.toHaveBeenCalled()
    act(() => { vi.advanceTimersByTime(5_000) })
  })

  it('calls onError without a score when buyer creation fails', () => {
    vi.useFakeTimers()
    vi.spyOn(Math, 'random').mockReturnValue(1)
    const gameProps = props()
    render(<AccountabilityGame {...gameProps} />)
    fireEvent.click(screen.getByRole('button', { name: /Mulai.*5/ }))

    expect(gameProps.onError).toHaveBeenCalledTimes(1)
    expect(gameProps.onError).toHaveBeenCalledWith(expect.any(Error))
    expect(gameProps.onComplete).not.toHaveBeenCalled()
  })

  it('does not mutate frozen prior journey results', () => {
    vi.useFakeTimers()
    let now = 0
    vi.spyOn(performance, 'now').mockImplementation(() => now)
    const baseProps = props()
    const priorResults = Object.freeze([Object.freeze({ valueId: 'integrity' as const, score: 45 })])
    const gameProps = {
      ...baseProps,
      context: Object.freeze({ ...baseProps.context, priorResults }),
    }
    render(<AccountabilityGame {...gameProps} />)
    fireEvent.click(screen.getByRole('button', { name: /Mulai.*5/ }))
    now = 20_000
    fireEvent(document, new Event('visibilitychange'))
    fireEvent.click(screen.getByRole('button', { name: 'Lanjut' }))

    expect(gameProps.context.priorResults).toBe(priorResults)
    expect(priorResults).toEqual([{ valueId: 'integrity', score: 45 }])
    expect(gameProps.onComplete).toHaveBeenCalledWith({ valueId: 'accountability', score: 0 })
  })
})