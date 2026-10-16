import { useEffect, useRef, useState } from 'react'
import { ArrowRight, Clock3, Volume2, VolumeX, X } from 'lucide-react'
import type { GameProps } from '../contract'
import { useGameMusic } from '../useGameMusic'
import { customers, serviceScore, SHIFT_MS } from './service'
import { ActionHand } from './ActionHand'

const art = '/assets/customer-focus/'
// Kept as the existing entry point so the fifth journey slot and local preview share one game.
export function MatchTheSolution({ context, onComplete, onCancel, onError }: GameProps) {
  const { audio, muted, toggleMute } = useGameMusic()
  const [phase, setPhase] = useState<'ready' | 'playing' | 'result'>('ready')
  const [index, setIndex] = useState(0)
  const [step, setStep] = useState(0)
  const [mistakes, setMistakes] = useState(0)
  const [remaining, setRemaining] = useState(SHIFT_MS)
  const [feedback, setFeedback] = useState('')
  const [resolved, setResolved] = useState(false)
  const [wrong, setWrong] = useState<number[]>([])
  const [expression, setExpression] = useState<'angry' | 'happy' | null>(null)
  const [reaction, setReaction] = useState<{ id: number; kind: 'success' | 'error' } | null>(null)
  const reactionId = useRef(0)
  const deadline = useRef(0)
  const sent = useRef(false)
  const locked = useRef(false)
  const customer = customers[index]
  const current = customer.steps[step]
  const portrait = expression === 'happy' ? `${customer.art}-happy`
    : expression === 'angry' && customer.art !== 'angry' ? `${customer.art}-angry` : customer.art
  const mood = expression === 'angry' ? 'Kesal' : expression === 'happy' ? 'Senang' : customer.mood
  const count = index + (resolved ? 1 : 0)
  const score = serviceScore(count, mistakes)

  useEffect(() => {
    for (const name of ['angry-happy', 'confused-angry', 'confused-happy', 'worried-angry', 'worried-happy']) {
      const image = new Image()
      image.src = `${art}${name}.png`
    }
  }, [])

  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = previousOverflow }
  }, [])

  useEffect(() => {
    if (phase !== 'playing') return
    function tick() {
      const left = Math.max(0, deadline.current - performance.now())
      setRemaining(left)
      if (!left) { locked.current = true; setPhase('result'); audio.stop() }
    }
    const timer = window.setInterval(tick, 100)
    document.addEventListener('visibilitychange', tick)
    return () => { window.clearInterval(timer); document.removeEventListener('visibilitychange', tick) }
  }, [phase, audio])

  useEffect(() => {
    if (!reaction) return
    const timer = window.setTimeout(() => setReaction(null), 1100)
    return () => window.clearTimeout(timer)
  }, [reaction])

  function begin() {
    if (sent.current || deadline.current) return
    deadline.current = performance.now() + SHIFT_MS
    void audio.start()
    setPhase('playing')
  }
  function choose(choice: number) {
    if (sent.current || locked.current || phase !== 'playing' || wrong.includes(choice)) return
    if (performance.now() >= deadline.current) { locked.current = true; setRemaining(0); setPhase('result'); audio.stop(); return }
    try {
      setExpression(choice === current.correct ? 'happy' : 'angry')
      setReaction({ id: ++reactionId.current, kind: choice === current.correct ? 'success' : 'error' })
      if (choice !== current.correct) {
        setMistakes(value => value + 1)
        setWrong(value => [...value, choice])
        setFeedback(current.hint)
        return
      }
      setWrong([])
      if (step + 1 < customer.steps.length) { setStep(step + 1); setFeedback('Respons yang baik. Sekarang bantu temukan langkah berikutnya.') }
      else { locked.current = true; setResolved(true); setFeedback(customer.resolution) }
    } catch (error) {
      sent.current = true; audio.stop(); onError(error instanceof Error ? error : new Error(String(error)))
    }
  }
  function next() {
    if (sent.current || !resolved) return
    if (index === customers.length - 1 || performance.now() >= deadline.current) { setPhase('result'); audio.stop(); return }
    setExpression(null); setReaction(null); setIndex(index + 1); setStep(0); setResolved(false); setFeedback(''); setWrong([]); locked.current = false
  }
  function cancel() { if (sent.current) return; sent.current = true; locked.current = true; audio.stop(); onCancel() }
  function complete() { if (sent.current || phase !== 'result') return; sent.current = true; audio.stop(); onComplete({ valueId: context.valueId, score }) }

  return <section className="match-game cf-game" aria-label="Customer Focus: Meja Layanan">
    <header className="cf-toolbar"><div><span className="match-kicker">CUSTOMER FOCUS / GAME 05</span><h2>Meja Layanan<span>Setiap nasabah, berarti.</span></h2></div><div className="cf-tools">{phase === 'playing' && <span className={remaining < 20_000 ? 'cf-urgent' : ''}><Clock3 size={16} /><time aria-label="Sisa waktu">{Math.ceil(remaining / 1000)} dtk</time></span>}<button type="button" className="cf-icon" onClick={toggleMute} aria-pressed={muted} aria-label={muted ? 'Nyalakan suara' : 'Matikan suara'}>{muted ? <VolumeX size={18} /> : <Volume2 size={18} />}</button>{phase !== 'result' && <button type="button" className="cf-icon" onClick={cancel} aria-label="Batal"><X size={18} /></button>}</div></header>
    <div className={`cf-scene cf-${phase}`}>
      <img className="cf-background" src={`${art}lobby.png`} alt="" />
      {phase === 'playing' && <>
        <div className="cf-queue"><span>SHIFT LAYANAN</span><strong>{count} / {customers.length}</strong><small>nasabah terbantu</small></div>
        <img key={index} className={`cf-customer ${resolved ? 'cf-happy' : ''} ${reaction ? `cf-react-${reaction.kind}` : ''}`} src={`${art}${portrait}.png`} alt={`${customer.name}, ${mood.toLowerCase()}`} />
        <div className="cf-dialogue" key={`${index}-${step}-${resolved}`}><div><strong>{customer.name}</strong><span>{resolved ? 'Terbantu' : mood}</span></div><small>{customer.topic}</small><p>{resolved ? 'Terima kasih sudah mendengarkan dan membantu saya. Sekarang langkahnya jelas!' : current.speech}</p><p className={`cf-feedback ${wrong.length ? 'cf-warning' : ''}`} role="status" aria-live="polite">{feedback || 'Pilih satu kartu untuk merespons nasabah di depanmu.'}</p></div>
      </>}
      {phase === 'playing' && reaction && <div className={`cf-interaction cf-interaction-${reaction.kind}`} key={reaction.id} aria-hidden="true"><img className="cf-reaction-sprite" src={`${art}fx-${reaction.kind}.png`} alt="" /><div className="cf-played-card"><img src={`${art}card-back.png`} alt="" /></div><span className="cf-reaction-label">{reaction.kind === 'success' ? (resolved ? 'Nasabah terbantu!' : 'Respons tepat!') : 'Coba lagi · −5'}</span></div>}
      <img className="cf-counter" src={`${art}counter.png`} alt="Meja customer service" />
      {phase === 'ready' && <div className="cf-overlay"><span className="cf-eyebrow">SELAMAT DATANG DI MEJA LAYANAN</span><h3>Dengarkan dulu.<br />Bantu sampai jelas.</h3><p>Kamu adalah customer service. Hadapi nasabah yang kesal, bingung, atau cemas dengan empati dan solusi yang tepat.</p><div className="cf-instructions"><span><b>01</b> Baca keluhan nasabah</span><span><b>02</b> Pilih kartu tindakan</span><span><b>03</b> Bantu sampai tuntas</span></div><p className="cf-fine">6 nasabah · 2 menit · Salah memilih −5 poin</p><button type="button" className="cf-primary" onClick={begin}>Mulai ronde <ArrowRight size={18} /></button></div>}
      {phase === 'result' && <div className="cf-overlay cf-results"><span className="cf-eyebrow">SHIFT SELESAI</span><h3>{count === customers.length ? 'Layanan yang berarti.' : 'Terima kasih atas layananmu.'}</h3><div className="match-final-score">{score}<span> / 100</span></div><p>{count} dari {customers.length} nasabah terbantu · {mistakes} pilihan kurang tepat</p><p className="cf-fine">Dengarkan kebutuhan, jaga data pribadi, dan berikan tindak lanjut yang jelas.</p><button type="button" className="cf-primary" onClick={complete}>Lanjutkan perjalanan <ArrowRight size={18} /></button></div>}
    {phase === 'playing' && <div className="cf-desk"><div className="cf-hand-heading"><div><span className="cf-eyebrow">{resolved ? 'KASUS SELESAI' : `KARTU TINDAKAN / LANGKAH ${step + 1} DARI 2`}</span><h3>{resolved ? 'Satu langkah kecil, dampak berarti.' : step === 0 ? 'Bagaimana kamu merespons?' : 'Apa langkah berikutnya?'}</h3></div><span className="cf-score">{score}<small> / 100 poin</small></span></div>{resolved ? <div className="cf-resolved"><p>{customer.resolution}</p><button className="cf-primary" type="button" onClick={next}>{index === customers.length - 1 ? 'Selesaikan shift' : 'Nasabah berikutnya'} <ArrowRight size={18} /></button></div> : <ActionHand key={`${index}-${step}`} cards={current.cards} rejected={wrong} onChoose={choose} />}</div>}
    </div>
  </section>
}
