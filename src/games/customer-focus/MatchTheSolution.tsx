import { useEffect, useRef, useState, type CSSProperties, type PointerEvent } from 'react'
import { ArrowRight, Check, Clock3, GripVertical, X } from 'lucide-react'
import type { GameProps } from '../contract'
import { cases, type CaseId } from './cases'
import { draftDistractors } from './draft-distractors'
import { circuitMs, finishRound, matchPair, ROUND_MS, startRound, type ResponseId, type Round } from './rules'

const responses: Record<ResponseId, string> = {
  ...Object.fromEntries(cases.map(({ id, solution }) => [id, solution])),
  ...Object.fromEntries(draftDistractors.map(({ id, text }) => [id, text])),
} as Record<ResponseId, string>

export function MatchTheSolution({ context, onComplete, onCancel, onError }: GameProps) {
  const [round, setRound] = useState<Round | null>(null)
  const [selected, setSelected] = useState<ResponseId | null>(null)
  const [dragPosition, setDragPosition] = useState<{ x: number; y: number; responseId: ResponseId } | null>(null)
  const [remainingMs, setRemainingMs] = useState(ROUND_MS)
  const deadlineRef = useRef(0)
  const roundRef = useRef<Round | null>(null)
  const sentRef = useRef(false)
  const dragRef = useRef<{ responseId: ResponseId; x: number; y: number } | null>(null)
  const suppressClickRef = useRef(false)

  function begin() {
    if (roundRef.current || sentRef.current) return
    deadlineRef.current = performance.now() + ROUND_MS
    roundRef.current = startRound()
    setRound(roundRef.current)
  }

  function tick() {
    if (roundRef.current?.phase !== 'playing') return
    const remaining = Math.max(0, deadlineRef.current - performance.now())
    setRemainingMs(remaining)
    if (remaining > 0) return
    roundRef.current = finishRound(roundRef.current)
    setRound(roundRef.current)
    setSelected(null)
  }

  useEffect(() => {
    if (round?.phase !== 'playing') return
    const timer = window.setInterval(tick, 100)
    return () => window.clearInterval(timer)
  }, [round?.phase])

  function attempt(responseId: ResponseId, customerId: CaseId | null) {
    if (!roundRef.current || sentRef.current) return
    try {
      const remaining = deadlineRef.current - performance.now()
      const next = matchPair(roundRef.current, responseId, customerId, remaining)
      roundRef.current = next
      setRound(next)
      setRemainingMs(Math.max(0, remaining))
      if (customerId) setSelected(null)
    } catch (error) {
      if (sentRef.current) return
      sentRef.current = true
      onError(error instanceof Error ? error : new Error(String(error)))
    }
  }

  function release(event: PointerEvent<HTMLButtonElement>) {
    const drag = dragRef.current
    dragRef.current = null
    setDragPosition(null)
    if (!drag || roundRef.current?.phase !== 'playing') return
    const moved = Math.hypot(event.clientX - drag.x, event.clientY - drag.y) > 5
    if (!moved) return
    suppressClickRef.current = true
    event.currentTarget.blur()
    const target = document.elementFromPoint(event.clientX, event.clientY)?.closest<HTMLElement>('[data-customer-id]')
    const customerId = cases.find(({ id }) => id === target?.dataset.customerId)?.id ?? null
    attempt(drag.responseId, customerId)
  }

  function cancel() {
    if (sentRef.current || roundRef.current?.phase === 'finished') return
    sentRef.current = true
    onCancel()
  }

  function continueJourney() {
    if (sentRef.current || roundRef.current?.phase !== 'finished' || roundRef.current.score === null) return
    sentRef.current = true
    onComplete({ valueId: context.valueId, score: roundRef.current.score })
  }

  if (!round) return (
    <section className="match-game match-ready" aria-label="Match the Solution">
      <span className="match-kicker">CUSTOMER FOCUS / 03 PASANGAN</span>
      <h2>Match the Solution</h2>
      <p>Cocokkan tiga kebutuhan nasabah dengan langkah layanan yang tepat sebelum waktu habis.</p>
      <p>Tarik solusi yang bergerak ke situasi di kiri, atau pilih solusi lalu situasi dengan Tab dan Enter. Kartu yang lewat akan kembali; jawaban salah dapat dicoba lagi.</p>
      <div className="match-actions"><button type="button" className="primary-action" onClick={begin}>Mulai ronde <ArrowRight size={18} /></button><button type="button" className="secondary-action" onClick={cancel}>Batal <X size={17} /></button></div>
    </section>
  )

  if (round.phase === 'finished') return (
    <section className="match-game match-result" aria-label="Hasil Match the Solution">
      <span className="match-kicker">RONDE SELESAI</span>
      <h2>{round.matched.length === 3 ? 'Semua terpasang.' : 'Waktu habis.'}</h2>
      <div className="match-final-score">{round.score}<span> / 100</span></div>
      <p>{round.matched.length} dari 3 pasangan tepat &middot; {round.incorrectAttempts} percobaan keliru</p>
      <button type="button" className="primary-action" onClick={continueJourney}>Lanjutkan perjalanan <ArrowRight size={18} /></button>
    </section>
  )

  return (
    <section className="match-game" aria-label="Match the Solution">
      <div className="match-toolbar"><span className="match-kicker">MATCH THE SOLUTION</span><div className="match-stats"><span><Check size={17} /> {round.matched.length}/3 tepat</span><span className="match-streak">Runtun {round.streak}</span><span className="match-clock"><Clock3 size={17} /> <time aria-label="Sisa waktu">{Math.ceil(remainingMs / 1000)} dtk</time></span></div></div>
      <p className="match-feedback" role="status" aria-live="polite">{round.feedback === 'correct' ? `Tepat! Pasangan terkunci. Runtun ${round.streak}.` : round.feedback === 'incorrect' ? 'Belum tepat. Kartu kembali; runtun 0.' : selected ? 'Solusi dipilih. Pilih situasi di kiri.' : 'Tarik solusi atau pilih solusi lalu situasi.'}</p>
      <div className="match-columns">
        <div className="match-column"><h3>Situasi pelanggan</h3><div className="match-options">{cases.map(({ id, customer }, index) => {
          const matched = round.matched.includes(id)
          return <button key={id} type="button" className={`match-option match-customer${matched ? ' is-matched' : ''}`} data-customer-id={id} disabled={matched} onClick={() => { if (selected) attempt(selected, id) }} aria-label={`Situasi ${index + 1}: ${customer}${matched ? ` (terpasang: ${cases[index].solution})` : ''}`}><span className="match-index">0{index + 1}</span><span className="match-customer-copy">{customer}{matched && <small>{cases[index].solution}</small>}</span>{matched && <Check size={18} aria-hidden="true" />}</button>
        })}</div></div>
        <div className="match-column"><h3>Solusi layanan</h3><div className={`match-lane${selected || dragPosition ? ' is-paused' : ''}`} style={{ '--circuit': `${circuitMs(round.matched.length)}ms`, '--count': round.order.length - round.matched.length } as CSSProperties} aria-label="Kartu solusi berputar">{round.order.filter((id) => !round.matched.includes(id as CaseId)).map((id, index) => {
          const solution = responses[id]
          return <button key={id} type="button" className={`match-option match-solution${selected === id ? ' is-selected' : ''}`} style={{ '--index': index } as CSSProperties} aria-pressed={selected === id} onClick={() => { if (suppressClickRef.current) { suppressClickRef.current = false; return } setSelected(id) }} onKeyDown={() => { suppressClickRef.current = false }} onPointerDown={(event) => { suppressClickRef.current = false; dragRef.current = { responseId: id, x: event.clientX, y: event.clientY }; event.currentTarget.setPointerCapture?.(event.pointerId) }} onPointerMove={(event) => { if (dragRef.current?.responseId === id && Math.hypot(event.clientX - dragRef.current.x, event.clientY - dragRef.current.y) > 5) setDragPosition({ x: event.clientX, y: event.clientY, responseId: id }) }} onPointerUp={release} onPointerCancel={() => { dragRef.current = null; setDragPosition(null) }} aria-label={`Solusi ${index + 1}: ${solution}`}><GripVertical size={17} aria-hidden="true" /><span>{solution}</span></button>
        })}</div></div>
      </div>
      {dragPosition && <div className="match-drag-ghost" style={{ left: dragPosition.x, top: dragPosition.y }} aria-hidden="true">{responses[dragPosition.responseId]}</div>}
      <div className="match-footer"><span>+20 tiap pasangan &middot; bonus waktu saat lengkap &middot; -5 tiap percobaan keliru</span><button type="button" className="secondary-action" onClick={cancel}>Batal <X size={17} /></button></div>
    </section>
  )
}