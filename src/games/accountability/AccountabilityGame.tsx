import { useEffect, useRef, useState, type CSSProperties, type KeyboardEvent } from 'react'
import { Banknote, CreditCard, QrCode, Volume2, VolumeX, type LucideIcon } from 'lucide-react'
import type { GameProps } from '../contract'
import { useGameMusic } from '../useGameMusic'
import { createCountdown } from './countdown'
import { gameConfig, paymentMethods, type PaymentId } from './config'
import { createGame, type GameSnapshot } from './engine'
import { CharacterPortrait } from './CharacterPortrait'
import { playCring } from './effects'
import { normalizeAccountabilityScore } from './score'
import './accountability-game.css'

const paymentIcons = {
  cash: Banknote,
  edc: CreditCard,
  qris: QrCode,
} satisfies Record<PaymentId, LucideIcon>

export function AccountabilityGame({ context, onComplete, onCancel, onError }: GameProps) {
  const { audio, muted, toggleMute } = useGameMusic()
  const engineRef = useRef<ReturnType<typeof createGame> | null>(null)
  if (!engineRef.current) engineRef.current = createGame()
  const engine = engineRef.current
  const [snapshot, setSnapshot] = useState<GameSnapshot>(() => engine.getSnapshot())
  const [countdown, setCountdown] = useState(Math.ceil(gameConfig.autoStartMs / 1_000))
  const countdownRef = useRef<ReturnType<typeof createCountdown> | null>(null)
  const gestureRef = useRef<{ roundId: string; customerId: string } | null>(null)
  const terminalRef = useRef(false)
  const resultHeadingRef = useRef<HTMLHeadingElement | null>(null)
  const [moneyBursts, setMoneyBursts] = useState<number[]>([])
  const burstSequenceRef = useRef(0)
  const burstTimersRef = useRef(new Set<number>())
  const callbacksRef = useRef({ onCancel, onError })
  callbacksRef.current = { onCancel, onError }

  function publishSnapshot(next: GameSnapshot) {
    setSnapshot((current) => {
      const sameQueue = current.queue.length === next.queue.length
        && current.queue.every((buyer, index) => buyer.id === next.queue[index]?.id)
      return current.phase === next.phase
        && current.roundId === next.roundId
        && current.score === next.score
        && current.servedCount === next.servedCount
        && current.wrongCount === next.wrongCount
        && current.displaySeconds === next.displaySeconds
        && current.lockReason === next.lockReason
        && current.feedback === next.feedback
        && sameQueue
        ? current
        : next
    })
  }

  useEffect(() => {
    const startAutomatically = () => startRoundSafely()
    const timer = createCountdown({ onTick: setCountdown, onComplete: startAutomatically })
    countdownRef.current = timer
    timer.start()
    const update = () => {
      try {
        publishSnapshot(engine.advance())
      } catch (error) {
        reportError(error)
      }
    }
    const interval = window.setInterval(update, 50)
    document.addEventListener('visibilitychange', update)

    return () => {
      timer.cancel()
      window.clearInterval(interval)
      document.removeEventListener('visibilitychange', update)
      burstTimersRef.current.forEach((handle) => window.clearTimeout(handle))
      burstTimersRef.current.clear()
      countdownRef.current = null
      audio.stop()
      if (!terminalRef.current) callbacksRef.current.onCancel()
    }
  }, [audio, engine])

  useEffect(() => {
    if (snapshot.phase === 'result') {
      audio.stop()
      resultHeadingRef.current?.focus()
    }
  }, [audio, snapshot.phase])

  function startManually() {
    countdownRef.current?.cancel()
    startRoundSafely()
  }

  function reportError(error: unknown) {
    if (terminalRef.current) return
    terminalRef.current = true
    audio.stop()
    callbacksRef.current.onError(error instanceof Error ? error : new Error(String(error)))
  }

  function startRoundSafely() {
    try {
      const next = engine.startRound()
      if (next.phase === 'playing') void audio.start()
      publishSnapshot(next)
    } catch (error) {
      reportError(error)
    }
  }

  function choosePayment(paymentId: PaymentId) {
    if (snapshot.phase !== 'playing') return
    void audio.start()
    const visibleBuyer = snapshot.queue[0]
    const gesture = gestureRef.current ?? (snapshot.roundId && visibleBuyer
      ? { roundId: snapshot.roundId, customerId: visibleBuyer.id }
      : null)
    gestureRef.current = null
    if (!gesture) return
    try {
      const next = engine.selectPayment({ paymentId, ...gesture })
      if (next.feedback === 'correct' && next.score === snapshot.score + gameConfig.correctPoints) {
        const burstId = ++burstSequenceRef.current
        setMoneyBursts((current) => [...current, burstId])
        const timer = window.setTimeout(() => {
          setMoneyBursts((current) => current.filter((id) => id !== burstId))
          burstTimersRef.current.delete(timer)
        }, 850)
        burstTimersRef.current.add(timer)
        if (!audio.isMuted()) playCring()
      }
      publishSnapshot(next)
    } catch (error) {
      reportError(error)
    }
  }

  function handlePaymentKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.repeat) event.preventDefault()
  }

  function continueJourney() {
    if (terminalRef.current || snapshot.phase !== 'result') return
    terminalRef.current = true
    audio.stop()
    onComplete({ valueId: context.valueId, score: normalizeAccountabilityScore(snapshot.score) })
  }

  const feedbackText = snapshot.feedback === 'correct'
    ? `✓ Benar! +${gameConfig.correctPoints}`
    : snapshot.feedback === 'wrong'
      ? `× Belum sesuai! Penalti ${gameConfig.wrongPenalty} poin`
      : ''

  return (
    <section className="accountability-game" data-phase={snapshot.phase}>
      {snapshot.phase !== 'result' && (
        <button className="kasir-audio-toggle" type="button" onClick={toggleMute} aria-label={muted ? 'Nyalakan suara' : 'Matikan suara'} aria-pressed={muted}>
          {muted ? <VolumeX aria-hidden="true" size={18} /> : <Volume2 aria-hidden="true" size={18} />}
          <span>{muted ? 'Suara mati' : 'Suara hidup'}</span>
        </button>
      )}
      {snapshot.phase === 'ready' ? (
        <main className="kasir-start">
          <h1>Kasir Sat Set</h1>
          <p className="kasir-start-scores" aria-label="Aturan skor">
            <span>Benar +{gameConfig.correctPoints}</span>
            <span>Salah −{gameConfig.wrongPenalty}</span>
            <span>Minimum {gameConfig.minimumScore}</span>
          </p>
          <div className="kasir-method-preview" aria-label="Metode pembayaran">
            {paymentMethods.map((method) => {
              const Icon = paymentIcons[method.id]
              return (
                <div className="kasir-method-preview-item" key={method.id}>
                  <Icon aria-hidden="true" size={22} strokeWidth={2.2} />
                  <span>{method.label}</span>
                </div>
              )
            })}
          </div>
          <button className="kasir-start-button" type="button" onClick={startManually}>
            <span>Mulai</span>
            <span className="kasir-countdown" aria-label={`Mulai otomatis dalam ${countdown} detik`}>{countdown}</span>
          </button>
        </main>
      ) : snapshot.phase === 'playing' ? (
        <main className="kasir-play" aria-label="Permainan Kasir Sat Set">
          <header className="kasir-hud">
            <div className={`kasir-time${snapshot.remainingMs <= gameConfig.urgentTimeMs ? ' urgent' : ''}`}>
              <span>WAKTU</span>
              <strong>{`00:${String(snapshot.displaySeconds).padStart(2, '0')}`}</strong>
            </div>
            <div className="kasir-score"><span>SKOR</span><strong>{snapshot.score}</strong></div>
          </header>
          <section className="kasir-scene" aria-label="Antrean warung">
            <div className="kasir-shelf" aria-hidden="true"><i /><i /><i /><i /></div>
            <div className="kasir-shop-sign" aria-hidden="true">WARUNG</div>
            <div className="kasir-request" aria-live="polite" aria-atomic="true">
              <span>{paymentMethods.find(({ id }) => id === snapshot.queue[0]?.paymentId)?.request}</span>
              <strong>{paymentMethods.find(({ id }) => id === snapshot.queue[0]?.paymentId)?.label}</strong>
            </div>
            <div className="kasir-queue">
              {snapshot.queue.map((buyer, index) => {
                const method = paymentMethods.find(({ id }) => id === buyer.paymentId)!
                const Icon = paymentIcons[method.id]
                const position = [78, 59, 40][index] ?? 40
                const characterStyle = { '--buyer-x': `${position}%` } as CSSProperties
                return (
                  <div className={`kasir-customer${index === 0 ? ' active' : ''}`} data-testid="kasir-customer" data-role={index === 0 ? 'KASIR' : 'ANTRE'} key={buyer.id} style={characterStyle}>
                    <span className="kasir-role">{index === 0 ? 'KASIR' : 'ANTRE'}</span>
                    <CharacterPortrait characterId={buyer.characterId} />
                    <span className="kasir-customer-token" aria-label={`Metode ${method.label}`}>
                      <Icon aria-hidden="true" size={17} />
                    </span>
                  </div>
                )
              })}
            </div>
            <div className="kasir-counter" aria-hidden="true"><span /></div>
            <div className="kasir-money-effects" aria-hidden="true">
              {moneyBursts.flatMap((burstId) => [43, 56, 69].map((position) => (
                <span key={`${burstId}-${position}`} style={{ left: `${position}%` }}>$</span>
              )))}
            </div>
          </section>
          <div className={`kasir-feedback ${snapshot.feedback}`} role="status" aria-live="polite" aria-atomic="true">
            {feedbackText}
          </div>
          <footer className="kasir-payment-controls" aria-label="Pilih metode pembayaran">
            {paymentMethods.map((method) => {
              const Icon = paymentIcons[method.id]
              return (
                <button
                  className="kasir-payment-button"
                  type="button"
                  key={method.id}
                  aria-label={method.label}
                  aria-disabled={snapshot.lockReason !== 'none'}
                  onPointerDown={() => {
                    const buyer = snapshot.queue[0]
                    if (snapshot.roundId && buyer) gestureRef.current = { roundId: snapshot.roundId, customerId: buyer.id }
                  }}
                  onPointerCancel={() => { gestureRef.current = null }}
                  onKeyDown={handlePaymentKeyDown}
                  onClick={() => choosePayment(method.id)}
                >
                  <Icon aria-hidden="true" size={23} strokeWidth={2.2} />
                  <span>{method.label}</span>
                </button>
              )
            })}
          </footer>
        </main>
      ) : (
        <main className="kasir-result" aria-labelledby="kasir-result-title">
          <h2 id="kasir-result-title" ref={resultHeadingRef} tabIndex={-1}>Waktu Habis!</h2>
          <div className="kasir-result-score"><span>SKOR AKHIR</span><strong>{snapshot.score}</strong></div>
          <dl className="kasir-result-statistics">
            <div><dt>Pembeli terlayani</dt><dd>{snapshot.servedCount}</dd></div>
            <div><dt>Pilihan salah</dt><dd>{snapshot.wrongCount}</dd></div>
          </dl>
          <p className="kasir-result-message">Cepat itu penting. Tepat melayani adalah tanggung jawab kita.</p>
          <button className="kasir-continue-button" type="button" onClick={continueJourney}>Lanjut</button>
        </main>
      )}
    </section>
  )
}
