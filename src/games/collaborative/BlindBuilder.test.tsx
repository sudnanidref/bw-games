import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { BlindBuilder } from './BlindBuilder'
import { GUIDE_GROUPS } from './guide'
import { interpretInstruction } from './instructions'

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
    expect(within(screen.getByRole('grid', { name: 'Papan target kamu' })).getAllByRole('gridcell')).toHaveLength(25)
    expect(within(screen.getByRole('grid', { name: "Papan rekan" })).getAllByRole('gridcell')).toHaveLength(25)
    fireEvent.change(screen.getByRole('textbox', { name: 'INSTRUKSIMU' }), { target: { value: 'Put blue circle at top left' } })
    fireEvent.click(screen.getByRole('button', { name: 'Kirim' }))
    await screen.findByText('Menaruh lingkaran biru.')
    expect(JSON.parse(fetchMock.mock.calls[0]?.[1]?.body as string)).not.toHaveProperty('target')
    expect(within(screen.getByRole('grid', { name: "Papan rekan" })).getByRole('gridcell', { name: /Baris 1, kolom 1, lingkaran biru/ })).toBeTruthy()
    expect(onComplete).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: 'Selesaikan ronde' }))
    expect(screen.getByText('SKOR TIM')).toBeTruthy()
    expect(onComplete).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: 'Lanjutkan perjalanan' }))
    fireEvent.click(screen.getByRole('button', { name: 'Lanjutkan perjalanan' }))
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
    fireEvent.change(screen.getByRole('textbox', { name: 'INSTRUKSIMU' }), { target: { value: 'Put blue circle at top left' } })
    fireEvent.click(screen.getByRole('button', { name: 'Kirim' }))
    await act(async () => { vi.advanceTimersByTime(180_000) })
    expect(screen.getByText('SKOR TIM')).toBeTruthy()
    expect(screen.getByText('Sisa waktu').parentElement?.textContent).toContain('0%')
    await act(async () => { resolveResponse({ ok: true, json: async () => ({ roundId: 1, outcome: { type: 'action', action: { type: 'place', object: { shape: 'circle', color: 'blue', row: 0, column: 0 } } } }) }) })
    expect(within(screen.getByRole('grid', { name: 'Papan akhir rekan' })).getByRole('gridcell', { name: 'Baris 1, kolom 1, kosong' })).toBeTruthy()
    expect(onComplete).not.toHaveBeenCalled()
  })

  it('replays without scoring and cancels without awarding points', () => {
    const onComplete = vi.fn()
    const onCancel = vi.fn()
    render(<BlindBuilder context={context} onComplete={onComplete} onCancel={onCancel} onError={vi.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: 'Selesaikan ronde' }))
    fireEvent.click(screen.getByRole('button', { name: 'Main lagi' }))
    expect(screen.getByRole('grid', { name: "Papan rekan" })).toBeTruthy()
    expect(onComplete).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: 'Keluar permainan' }))
    expect(onCancel).toHaveBeenCalledTimes(1)
    expect(onComplete).not.toHaveBeenCalled()
  })

  it('keeps the board unchanged on a service failure and permits a retry', async () => {
    const fetchMock = vi.fn().mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce({ ok: true, json: async () => ({
      roundId: 1, outcome: { type: 'action', action: { type: 'place', object: { shape: 'circle', color: 'blue', row: 0, column: 0 } } },
    }) })
    vi.stubGlobal('fetch', fetchMock)
    render(<BlindBuilder context={context} onComplete={vi.fn()} onCancel={vi.fn()} onError={vi.fn()} />)
    fireEvent.change(screen.getByRole('textbox', { name: 'INSTRUKSIMU' }), { target: { value: 'Put blue circle at top left' } })
    fireEvent.click(screen.getByRole('button', { name: 'Kirim' }))
    await screen.findByText(/Coba ucapkan ulang; papan belum saya ubah/)
    expect(within(screen.getByRole('grid', { name: "Papan rekan" })).getByRole('gridcell', { name: 'Baris 1, kolom 1, kosong' })).toBeTruthy()
    fireEvent.change(screen.getByRole('textbox', { name: 'INSTRUKSIMU' }), { target: { value: 'Put blue circle at top left' } })
    fireEvent.click(screen.getByRole('button', { name: 'Kirim' }))
    await screen.findByText('Menaruh lingkaran biru.')
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('ignores an old response after replaying a submitted round', async () => {
    let resolveResponse: (value: unknown) => void = () => {}
    vi.stubGlobal('fetch', vi.fn(() => new Promise((resolve) => { resolveResponse = resolve })))
    const onComplete = vi.fn()
    render(<BlindBuilder context={context} onComplete={onComplete} onCancel={vi.fn()} onError={vi.fn()} />)
    fireEvent.change(screen.getByRole('textbox', { name: 'INSTRUKSIMU' }), { target: { value: 'Put blue circle at top left' } })
    fireEvent.click(screen.getByRole('button', { name: 'Kirim' }))
    fireEvent.click(screen.getByRole('button', { name: 'Selesaikan ronde' }))
    fireEvent.click(screen.getByRole('button', { name: 'Main lagi' }))
    await act(async () => { resolveResponse({ ok: true, json: async () => ({ roundId: 1, outcome: { type: 'action', action: { type: 'place', object: { shape: 'circle', color: 'blue', row: 0, column: 0 } } } }) }) })
    expect(within(screen.getByRole('grid', { name: "Papan rekan" })).getByRole('gridcell', { name: 'Baris 1, kolom 1, kosong' })).toBeTruthy()
    expect(onComplete).not.toHaveBeenCalled()
  })

  it('cancels an in-flight instruction without awarding points', async () => {
    let resolveResponse: (value: unknown) => void = () => {}
    vi.stubGlobal('fetch', vi.fn(() => new Promise((resolve) => { resolveResponse = resolve })))
    const onCancel = vi.fn()
    const onComplete = vi.fn()
    render(<BlindBuilder context={context} onComplete={onComplete} onCancel={onCancel} onError={vi.fn()} />)
    fireEvent.change(screen.getByRole('textbox', { name: 'INSTRUKSIMU' }), { target: { value: 'Put blue circle at top left' } })
    fireEvent.click(screen.getByRole('button', { name: 'Kirim' }))
    fireEvent.click(screen.getByRole('button', { name: 'Keluar permainan' }))
    await act(async () => { resolveResponse({ ok: true, json: async () => ({ roundId: 1, outcome: { type: 'action', action: { type: 'place', object: { shape: 'circle', color: 'blue', row: 0, column: 0 } } } }) }) })
    expect(onCancel).toHaveBeenCalledTimes(1)
    expect(onComplete).not.toHaveBeenCalled()
    expect(within(screen.getByRole('grid', { name: "Papan rekan" })).getByRole('gridcell', { name: 'Baris 1, kolom 1, kosong' })).toBeTruthy()
  })

  it('commits a real zero score only once', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-01-01T00:00:00Z'))
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, json: async () => ({ roundId: 1, outcome: { type: 'message', message: 'Please rephrase.' } }) })))
    const onComplete = vi.fn()
    render(<BlindBuilder context={context} onComplete={onComplete} onCancel={vi.fn()} onError={vi.fn()} />)
    for (let index = 0; index < 16; index += 1) {
      await act(async () => {
        fireEvent.change(screen.getByRole('textbox', { name: 'INSTRUKSIMU' }), { target: { value: 'Undo' } })
        fireEvent.click(screen.getByRole('button', { name: 'Kirim' }))
      })
      expect((screen.getByRole('textbox', { name: 'INSTRUKSIMU' }) as HTMLTextAreaElement).disabled).toBe(false)
    }
    await act(async () => { vi.advanceTimersByTime(180_000) })
    expect(screen.getByText('SKOR TIM').nextElementSibling?.textContent).toContain('0/100')
    expect(screen.getByText('FAIL', { selector: '.journey-status' })).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Lanjutkan perjalanan' }))
    fireEvent.click(screen.getByRole('button', { name: 'Lanjutkan perjalanan' }))
    expect(onComplete).toHaveBeenCalledTimes(1)
    expect(onComplete).toHaveBeenCalledWith({ valueId: 'collaborative', score: 0 })
  })

  it('says the server is unreachable (not "rephrase") when the API is down', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce({ ok: false, status: 500 }).mockRejectedValueOnce(new TypeError('Failed to fetch')))
    render(<BlindBuilder context={context} onComplete={vi.fn()} onCancel={vi.fn()} onError={vi.fn()} />)
    for (let attempt = 1; attempt <= 2; attempt += 1) {
      fireEvent.change(screen.getByRole('textbox', { name: 'INSTRUKSIMU' }), { target: { value: 'Taruh lingkaran biru di kiri atas' } })
      fireEvent.click(screen.getByRole('button', { name: 'Kirim' }))
      await waitFor(() => expect(screen.getAllByText(/tidak terhubung ke server instruksi/)).toHaveLength(attempt))
    }
    expect(screen.queryByText(/Coba ucapkan ulang/)).toBeNull()
  })

  it('explains the per-minute limit on HTTP 429', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce({ ok: false, status: 429 }))
    render(<BlindBuilder context={context} onComplete={vi.fn()} onCancel={vi.fn()} onError={vi.fn()} />)
    fireEvent.change(screen.getByRole('textbox', { name: 'INSTRUKSIMU' }), { target: { value: 'Taruh lingkaran biru di kiri atas' } })
    fireEvent.click(screen.getByRole('button', { name: 'Kirim' }))
    await screen.findByText(/Terlalu banyak instruksi dalam satu menit/)
  })

  it('finishes the round automatically once the teammate board matches the target', async () => {
    vi.stubGlobal('fetch', vi.fn(async (_url: string, options?: RequestInit) => {
      const request = JSON.parse(options?.body as string)
      return { ok: true, json: async () => ({ roundId: request.roundId, outcome: interpretInstruction(request.instruction, request.board) }) }
    }))
    const onComplete = vi.fn()
    render(<BlindBuilder context={context} onComplete={onComplete} onCancel={vi.fn()} onError={vi.fn()} />)
    // Read the target the player sees, e.g. "Baris 2, kolom 4, kotak merah" -> "Taruh kotak merah di B4".
    const pieces = within(screen.getByRole('grid', { name: 'Papan target kamu' })).getAllByRole('gridcell')
      .map((cell) => cell.getAttribute('aria-label')!.match(/^Baris (\d), kolom (\d), (.+)$/))
      .filter((match): match is RegExpMatchArray => Boolean(match) && match![3] !== 'kosong')
    expect(pieces.length).toBeGreaterThanOrEqual(3)
    for (const [index, [, row, column, piece]] of pieces.entries()) {
      expect(screen.queryByText('SKOR TIM')).toBeNull()
      fireEvent.change(screen.getByRole('textbox', { name: 'INSTRUKSIMU' }), { target: { value: `Taruh ${piece} di ${String.fromCharCode(64 + Number(row))}${column}` } })
      fireEvent.click(screen.getByRole('button', { name: 'Kirim' }))
      if (index === pieces.length - 1) break
      await waitFor(() => expect(document.querySelectorAll('.bb-message.bb-teammate')).toHaveLength(index + 2))
      expect([...document.querySelectorAll('.bb-message.bb-teammate p')].at(-1)?.textContent).toMatch(/^Menaruh /)
    }
    await screen.findByText('SKOR TIM')
    expect(screen.getByText(/RONDE SELESAI OTOMATIS/)).toBeTruthy()
    expect(screen.getByText('Akurasi').parentElement?.textContent).toContain('100%')
    expect(screen.getByText('Komunikasi').parentElement?.textContent).toContain('100%')
    expect(onComplete).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: 'Lanjutkan perjalanan' }))
    expect(onComplete.mock.calls[0][0].score).toBeGreaterThanOrEqual(99)
  })

  it('plays every guide example from the chatbox in order', async () => {
    // Route the instruction service to the real deterministic interpreter.
    vi.stubGlobal('fetch', vi.fn(async (_url: string, options?: RequestInit) => {
      const request = JSON.parse(options?.body as string)
      return { ok: true, json: async () => ({ roundId: request.roundId, outcome: interpretInstruction(request.instruction, request.board) }) }
    }))
    render(<BlindBuilder context={context} onComplete={vi.fn()} onCancel={vi.fn()} onError={vi.fn()} />)
    fireEvent.click(screen.getByText('Cara memberi instruksi'))
    const textbox = screen.getByRole('textbox', { name: 'INSTRUKSIMU' }) as HTMLTextAreaElement
    let replies = 1
    for (const example of GUIDE_GROUPS.flatMap((group) => group.examples)) {
      fireEvent.click(screen.getByRole('button', { name: example }))
      expect(textbox.value).toBe(example)
      fireEvent.click(screen.getByRole('button', { name: 'Kirim' }))
      replies += 1
      await waitFor(() => expect(document.querySelectorAll('.bb-message.bb-teammate')).toHaveLength(replies))
      const reply = [...document.querySelectorAll('.bb-message.bb-teammate p')].at(-1)?.textContent ?? ''
      expect(reply, example).toMatch(/^(Menaruh|Memindahkan|Menghapus) /)
    }
  })
})
