import { useEffect, useRef, useState } from 'react'
import { ArrowRight, Clock3, Volume2, VolumeX, X } from 'lucide-react'
import type { GameProps } from '../contract'
import { useGameMusic } from '../useGameMusic'
import { customers } from './service'
import { ActionHand } from './ActionHand'
import { advanceService, createServiceRound, roundScore, TIMEOUT_PENALTY, WARNING_MS, type ServiceAction } from './shift'
import './timeout.css'

const art = '/assets/customer-focus/'
// The original entry point is shared by the fifth journey slot and local preview.
export function MatchTheSolution({ context, onComplete, onCancel, onError }: GameProps) {
  const { audio, muted, toggleMute } = useGameMusic()
  const [round, setRound] = useState(createServiceRound)
  const roundRef = useRef(round)
  const [reaction, setReaction] = useState<{ id: number; kind: 'success' | 'error' } | null>(null)
  const reactionId = useRef(0)
  const sent = useRef(false)
  const customer = customers[round.index]
  const current = customer.steps[round.step]
  const resolved = round.phase === 'resolved'
  const attacking = round.phase === 'attacking'
  const serving = round.phase === 'playing'
  const inScene = serving || resolved || attacking
  const urgent = serving && round.remaining <= WARNING_MS
  const portrait = attacking ? `${customer.art}-attack` : round.expression === 'happy' ? `${customer.art}-happy`
    : round.expression === 'angry' && customer.art !== 'angry' ? `${customer.art}-angry` : customer.art
  const mood = round.expression === 'angry' ? 'Kesal' : round.expression === 'happy' ? 'Senang' : customer.mood
  const score = roundScore(round)

  function commit(action: ServiceAction) {
    if (sent.current) return
    try {
      const before = roundRef.current
      const next = advanceService(before, action)
      if (next === before) return
      roundRef.current = next
      setRound(next)
      if (before.index !== next.index || next.phase === 'attacking' || next.phase === 'result') setReaction(null)
      if (next.phase === 'result') audio.stop()
    } catch (error) {
      sent.current = true
      audio.stop()
      onError(error instanceof Error ? error : new Error(String(error)))
    }
  }

  useEffect(() => {
    for (const name of ['angry-happy', 'confused-angry', 'confused-happy', 'worried-angry', 'worried-happy',
      'angry-attack', 'confused-attack', 'worried-attack', 'fx-impact']) {
      const image = new Image()
      image.src = `${art}${name}.png`
    }
  }, [])

  useEffect(() => {
    if (round.phase !== 'playing' && round.phase !== 'attacking') return
    const tick = () => commit({ type: 'tick', now: performance.now() })
    const timer = window.setInterval(tick, 50)
    document.addEventListener('visibilitychange', tick)
    return () => { window.clearInterval(timer); document.removeEventListener('visibilitychange', tick) }
  }, [round.phase])

  useEffect(() => {
    if (!reaction) return
    const timer = window.setTimeout(() => setReaction(null), 1100)
    return () => window.clearTimeout(timer)
  }, [reaction])

  function begin() {
    if (sent.current || roundRef.current.phase !== 'ready') return
    void audio.start()
    commit({ type: 'begin', now: performance.now() })
  }
  function choose(choice: number) {
    const before = roundRef.current
    commit({ type: 'choose', choice, now: performance.now() })
    const next = roundRef.current
    if (next !== before && next.phase !== 'attacking' && !sent.current) {
      setReaction({ id: ++reactionId.current, kind: choice === current.correct ? 'success' : 'error' })
    }
  }
  function cancel() {
    if (sent.current) return
    sent.current = true
    audio.stop()
    onCancel()
  }
  function complete() {
    if (sent.current || roundRef.current.phase !== 'result') return
    sent.current = true
    audio.stop()
    onComplete({ valueId: context.valueId, score: roundScore(roundRef.current) })
  }

  return (
    <section className={`match-game cf-game${urgent ? ' cf-danger' : ''}${attacking ? ' cf-under-attack' : ''}`} aria-label="Customer Focus: Meja Layanan">
      <header className="cf-toolbar">
        <div><span className="match-kicker">CUSTOMER FOCUS / GAME 05</span><h2>Meja Layanan<span>Setiap nasabah, berarti.</span></h2></div>
        <div className="cf-tools">
          {inScene && <span className={`cf-customer-clock${urgent ? ' cf-urgent' : ''}`}><Clock3 size={16} /><time aria-label="Sisa waktu nasabah">{(round.remaining / 1000).toFixed(1)} dtk</time></span>}
          <button type="button" className="cf-icon" onClick={toggleMute} aria-pressed={muted} aria-label={muted ? 'Nyalakan suara' : 'Matikan suara'}>{muted ? <VolumeX size={18} /> : <Volume2 size={18} />}</button>
          {round.phase !== 'result' && <button type="button" className="cf-icon" onClick={cancel} aria-label="Batal"><X size={18} /></button>}
        </div>
      </header>
      <div className={`cf-scene cf-phase-${round.phase}`}>
        <img className="cf-background" src={`${art}lobby.png`} alt="" />
        {inScene && <>
          <div className="cf-queue"><span>NASABAH {round.index + 1} / {customers.length}</span><strong>{round.resolved} / {customers.length}</strong><small>nasabah terbantu</small></div>
          <img key={round.index} className={`cf-customer${attacking ? ' cf-attacking-customer' : ''}${resolved ? ' cf-happy' : ''} ${reaction ? `cf-react-${reaction.kind}` : ''}`} src={`${art}${portrait}.png`} alt={`${customer.name}, ${attacking ? 'menyerang' : mood.toLowerCase()}`} />
          <div className="cf-dialogue" key={`${round.index}-${round.step}-${resolved}`}>
            <div><strong>{customer.name}</strong><span>{attacking ? 'Waktu habis!' : resolved ? 'Terbantu' : mood}</span></div>
            <small>{customer.topic}</small>
            <p>{attacking ? 'Terlalu lama! Saya sudah tidak sabar!' : resolved ? 'Terima kasih sudah mendengarkan dan membantu saya. Sekarang langkahnya jelas!' : current.speech}</p>
            <p className={`cf-feedback${round.wrong.length || attacking ? ' cf-warning' : ''}`} role="status" aria-live="polite">{round.feedback || 'Selesaikan kedua langkah sebelum 10 detik habis.'}</p>
          </div>
          {serving && <div className="cf-patience" aria-label="Kesabaran nasabah" role="progressbar" aria-valuemin={0} aria-valuemax={10} aria-valuenow={Math.ceil(round.remaining / 1000)}><span style={{ width: `${round.remaining / 100}%` }} /></div>}
          {urgent && <div className="cf-time-warning" role="alert">AWAS! {Math.ceil(round.remaining / 1000)} DETIK — SELESAIKAN LAYANAN!</div>}
        </>}
        {inScene && reaction && <div className={`cf-interaction cf-interaction-${reaction.kind}`} key={reaction.id} aria-hidden="true"><img className="cf-reaction-sprite" src={`${art}fx-${reaction.kind}.png`} alt="" /><div className="cf-played-card"><img src={`${art}card-back.png`} alt="" /></div><span className="cf-reaction-label">{reaction.kind === 'success' ? (resolved ? 'Nasabah terbantu!' : 'Respons tepat!') : 'Coba lagi · −5'}</span></div>}
        <img className="cf-counter" src={`${art}counter.png`} alt="Meja customer service" />
        {attacking && <div className="cf-attack-overlay" aria-hidden="true"><img className="cf-impact" src={`${art}fx-impact.png`} alt="" /><strong className="cf-damage-label">HANTAMAN!<span>−{TIMEOUT_PENALTY} POIN</span></strong></div>}
        {round.phase === 'ready' && <div className="cf-overlay">
          <span className="cf-eyebrow">10 DETIK PER NASABAH</span><h3>Cepat tanggap.<br />Jangan bikin meledak!</h3>
          <p>Kamu adalah customer service. Selesaikan dua pilihan kartu untuk setiap nasabah dalam 10 detik.</p>
          <div className="cf-instructions"><span><b>01</b> Baca keluhan, pilih dua tindakan</span><span><b>02</b> Peringatan saat tersisa 3 detik</span><span><b>03</b> Waktu habis? Nasabah menyerang lalu pergi!</span></div>
          <p className="cf-fine">6 nasabah · Salah kartu −5 · Kena serangan −{TIMEOUT_PENALTY} poin</p>
          <button type="button" className="cf-primary" onClick={begin}>Mulai ronde <ArrowRight size={18} /></button>
        </div>}
        {round.phase === 'result' && <div className="cf-overlay cf-results">
          <span className="cf-eyebrow">SHIFT SELESAI</span><h3>{round.resolved === customers.length ? 'Layanan yang berarti.' : 'Shift penuh tantangan!'}</h3>
          <div className="match-final-score">{score}<span> / 100</span></div>
          <p>{round.resolved} dari {customers.length} nasabah terbantu · {round.mistakes} pilihan keliru · {round.timeouts} serangan</p>
          <p className="cf-fine">Dengarkan kebutuhan, jaga data pribadi, dan berikan tindak lanjut yang jelas.</p>
          <button type="button" className="cf-primary" onClick={complete}>Lanjutkan perjalanan <ArrowRight size={18} /></button>
        </div>}
        {inScene && <div className="cf-hand-heading"><div><span className="cf-eyebrow">{attacking ? 'WAKTU HABIS' : resolved ? 'KASUS SELESAI' : `LANGKAH ${round.step + 1} DARI 2`}</span><h3>{attacking ? 'Aduh! Nasabah pergi.' : resolved ? 'Nasabah terbantu!' : round.step === 0 ? 'Bagaimana kamu merespons?' : 'Apa langkah berikutnya?'}</h3></div><span className="cf-score">{score}<small> / 100 poin</small></span></div>}
        {inScene && <div className="cf-desk">

          {resolved ? <div className="cf-resolved"><p>{customer.resolution}</p><button className="cf-primary" type="button" onClick={() => commit({ type: 'next', now: performance.now() })}>{round.index === customers.length - 1 ? 'Selesaikan shift' : 'Nasabah berikutnya'} <ArrowRight size={18} /></button></div>
            : attacking ? <div className="cf-attack-notice">Nasabah pergi. Menyiapkan antrean berikutnya…</div>
              : <ActionHand key={`${round.index}-${round.step}`} cards={current.cards} rejected={round.wrong} onChoose={choose} />}
        </div>}
      </div>
    </section>
  )
}
