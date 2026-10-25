// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, createEvent, fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { GameProps } from '../contract'
import { AccountabilityGame } from './AccountabilityGame'
import { playCring } from './effects'
import qrisIllustration from './assets/payment-qris.svg'
import cashIllustration from './assets/payment-cash.svg'
import edcIllustration from './assets/payment-edc.svg'

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

function paymentButtonFor(label: string) {
  const names: Record<string, string> = { TUNAI: 'Bayar tunai', EDC: 'Bayar dengan EDC', QRIS: 'Bayar dengan QRIS' }
  return screen.getByRole('button', { name: names[label] })
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
    const paymentButton = paymentButtonFor(requestedMethod!)
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
    const nextButton = paymentButtonFor(nextMethod!)
    nextButton.focus()
    fireEvent.keyDown(nextButton, { key: ' ', code: 'Space', repeat: false })
    fireEvent.click(nextButton)
    expect(container.querySelector('.kasir-score strong')?.textContent).toBe('20')
  })

  it('presents only the three illustrations in QRIS–cash–EDC order with accessible names', () => {
    vi.useFakeTimers()
    render(<AccountabilityGame {...props()} />)
    fireEvent.click(screen.getByRole('button', { name: /Mulai.*5/ }))
    const controls = screen.getByLabelText('Pilih metode pembayaran')
    const buttons = within(controls).getAllByRole('button')

    expect(buttons.map((button) => button.getAttribute('aria-label'))).toEqual([
      'Bayar dengan QRIS', 'Bayar tunai', 'Bayar dengan EDC',
    ])
    expect(buttons.map((button) => button.getAttribute('data-payment'))).toEqual(['qris', 'cash', 'edc'])
    expect(controls.textContent?.trim()).toBe('')
    expect(buttons.map((button) => button.querySelector('img')?.getAttribute('src'))).toEqual([
      qrisIllustration, cashIllustration, edcIllustration,
    ])
    for (const button of buttons) {
      const illustration = button.querySelector('img')!
      expect(illustration.alt).toBe('')
      expect(illustration.draggable).toBe(false)
      expect(button.getAttribute('type')).toBe('button')
    }
  })

  it.each([
    ['QRIS', .9], ['TUNAI', .1], ['EDC', .5],
  ] as const)('maps the %s object to its own payment method after reordering', (label, randomValue) => {
    vi.useFakeTimers()
    vi.spyOn(Math, 'random').mockReturnValue(randomValue)
    const { container } = render(<AccountabilityGame {...props()} />)
    fireEvent.click(screen.getByRole('button', { name: /Mulai.*5/ }))
    expect(container.querySelector('.kasir-request strong')?.textContent).toBe(label)

    const button = paymentButtonFor(label)
    fireEvent.pointerDown(button)
    fireEvent.click(button.querySelector('img')!)
    expect(container.querySelector('.kasir-score strong')?.textContent).toBe('10')
    expect(container.querySelector('.kasir-feedback')?.textContent).toContain('Benar!')
    expect(button.getAttribute('aria-disabled')).toBe('true')
    fireEvent.click(button)
    expect(container.querySelector('.kasir-score strong')?.textContent).toBe('10')
  })

  it('tabs through QRIS–cash–EDC and uses native Enter/Space activation without losing focus', async () => {
    let now = 0
    vi.spyOn(performance, 'now').mockImplementation(() => now)
    vi.spyOn(Math, 'random').mockReturnValue(.9)
    const user = userEvent.setup()
    const { container } = render(<AccountabilityGame {...props()} />)
    fireEvent.click(screen.getByRole('button', { name: /Mulai.*5/ }))
    screen.getByRole('button', { name: 'Matikan suara' }).focus()
    await user.tab()
    expect(document.activeElement).toBe(paymentButtonFor('QRIS'))
    await user.keyboard('{Enter}')
    expect(container.querySelector('.kasir-score strong')?.textContent).toBe('10')
    expect(document.activeElement).toBe(paymentButtonFor('QRIS'))
    await user.keyboard(' ')
    expect(container.querySelector('.kasir-score strong')?.textContent).toBe('10')
    now = 150
    fireEvent(document, new Event('visibilitychange'))
    await user.keyboard(' ')
    expect(container.querySelector('.kasir-score strong')?.textContent).toBe('20')
    await user.tab()
    expect(document.activeElement).toBe(paymentButtonFor('TUNAI'))
    await user.tab()
    expect(document.activeElement).toBe(paymentButtonFor('EDC'))
  })

  it('U04 drops locked clicks and accepts a fresh click after the correct transition', () => {
    vi.useFakeTimers()
    const { container } = render(<AccountabilityGame {...props()} />)
    fireEvent.click(screen.getByRole('button', { name: /Mulai.*5/ }))
    let method = container.querySelector('.kasir-request strong')?.textContent
    let paymentButton = paymentButtonFor(method!)
    fireEvent.pointerDown(paymentButton, { pointerId: 1 })
    fireEvent.click(paymentButton)
    expect(container.querySelectorAll('.kasir-money-effects span')).toHaveLength(3)
    expect(playCring).toHaveBeenCalledTimes(1)
    fireEvent.click(paymentButton)
    expect(container.querySelector('.kasir-score strong')?.textContent).toBe('10')
    expect(playCring).toHaveBeenCalledTimes(1)

    act(() => { vi.advanceTimersByTime(150) })
    method = container.querySelector('.kasir-request strong')?.textContent
    paymentButton = paymentButtonFor(method!)
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
    fireEvent.click(paymentButtonFor(wrongMethod))

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
    expect(screen.getByText('Poin permainan 0')).toBeTruthy()
    expect(screen.getByLabelText('Skor akhir 0 dari 100')).toBeTruthy()
    expect(screen.getByText('FAIL', { selector: '.journey-status' })).toBeTruthy()
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

  it.each([
    { correct: 1, wrong: 0, raw: 10, score: 10, status: 'FAIL' },
    { correct: 6, wrong: 0, raw: 60, score: 60, status: 'FAIL' },
    { correct: 7, wrong: 1, raw: 65, score: 65, status: 'PASS' },
    { correct: 7, wrong: 0, raw: 70, score: 70, status: 'PASS' },
    { correct: 10, wrong: 0, raw: 100, score: 100, status: 'PASS' },
    { correct: 12, wrong: 1, raw: 115, score: 100, status: 'PASS' },
    { correct: 0, wrong: 1, raw: 0, score: 0, status: 'FAIL' },
  ])('displays and hands off $score/$status for $correct correct and $wrong wrong answers', ({ correct, wrong, raw, score, status }) => {
    vi.useFakeTimers()
    let now = 0
    vi.spyOn(performance, 'now').mockImplementation(() => now)
    vi.spyOn(Math, 'random').mockReturnValue(.1)
    const gameProps = props()
    const { container } = render(<AccountabilityGame {...gameProps} />)
    fireEvent.click(screen.getByRole('button', { name: /Mulai.*5/ }))
    for (let index = 0; index < correct; index++) {
      fireEvent.click(paymentButtonFor('TUNAI'))
      now += 150
      fireEvent(document, new Event('visibilitychange'))
    }
    for (let index = 0; index < wrong; index++) {
      fireEvent.click(paymentButtonFor('EDC'))
      now += 500
      fireEvent(document, new Event('visibilitychange'))
    }
    expect(container.querySelector('.kasir-score strong')?.textContent).toBe(String(raw))
    now = 20_000
    fireEvent(document, new Event('visibilitychange'))

    expect(container.querySelector('.kasir-result-score strong')?.textContent).toBe(String(score))
    expect(screen.getByLabelText(`Skor akhir ${score} dari 100`)).toBeTruthy()
    expect(screen.getByText(`Poin permainan ${raw}`)).toBeTruthy()
    expect(screen.getByText(status, { selector: '.journey-status' })).toBeTruthy()
    expect([...container.querySelectorAll('.kasir-result-statistics dd')].map((value) => value.textContent)).toEqual([String(correct), String(wrong)])
    expect(gameProps.onComplete).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: 'Lanjut' }))
    fireEvent.click(screen.getByRole('button', { name: 'Lanjut' }))
    expect(gameProps.onComplete).toHaveBeenCalledTimes(1)
    expect(gameProps.onComplete).toHaveBeenCalledWith({ valueId: 'accountability', score })
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
