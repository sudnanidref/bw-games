import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react'
import type { GameProps } from '../contract'
import { scoreStatus } from '../score-status'
import { CardProjectile, CheckIcon, CrossIcon, EdcLauncher, SpeakerIcon, SpeakerOffIcon } from './art'
import { END_JINGLE_MS, createGameAudio, soundsFor } from './audio'
import {
  LANE_CENTER_Y, ROUND_DURATION_MS, TARGET_WIDTH, createState, step, targetLeft, visibleTargets,
  type EngineInput, type EngineState, type HitFeedback,
} from './engine'
import './integrity.css'
import { createRound, type Random } from './round'
import { finalScore } from './scoring'
import words from './words.json'

type Phase = 'briefing' | 'playing' | 'result'
type Direction = -1 | 0 | 1

export interface IntegrityGameProps extends GameProps {
  random?: Random
}

interface PendingInput {
  moveTo?: number
  fire: boolean
  leftHeld: boolean
  rightHeld: boolean
}

const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)'

function prefersReducedMotion(): boolean {
  return typeof window.matchMedia === 'function' && window.matchMedia(REDUCED_MOTION_QUERY).matches
}

function toError(thrown: unknown): Error {
  return thrown instanceof Error ? thrown : new Error(String(thrown))
}

function capitalize(word: string): string {
  return word.charAt(0).toUpperCase() + word.slice(1)
}

function FeedbackContent({ item }: { item: HitFeedback }) {
  const sign = item.points > 0 ? '+' : '−'
  const Icon = item.category === 'aligned' ? CheckIcon : CrossIcon
  const verdict = item.category === 'aligned' ? 'benar' : 'salah'
  return (
    <>
      <span>{sign}{Math.abs(item.points)}</span>{' '}
      <Icon className="integrity-feedback-icon" />
      <span className="integrity-sr-only">{verdict}</span>{' '}
      <span>{capitalize(item.word)}</span>
    </>
  )
}

function MuteButton({ muted, onToggle }: { muted: boolean, onToggle: () => void }) {
  const Icon = muted ? SpeakerOffIcon : SpeakerIcon
  return (
    <button className="secondary-action integrity-mute" type="button" aria-pressed={muted} aria-label={muted ? 'Nyalakan suara' : 'Matikan suara'} onClick={onToggle}>
      <Icon className="integrity-mute-icon" />
      <span>{muted ? 'Senyap' : 'Suara'}</span>
    </button>
  )
}

function heldDirection(input: PendingInput): Direction {
  return (Number(input.rightHeld) - Number(input.leftHeld)) as Direction
}

export function IntegrityGame({ context, onComplete, onCancel, onError, random = Math.random }: IntegrityGameProps) {
  const [phase, setPhase] = useState<Phase>('briefing')
  const [state, setState] = useState<EngineState | null>(null)
  const [audio] = useState(() => createGameAudio())
  const [muted, setMuted] = useState(() => audio.isMuted())
  const stateRef = useRef<EngineState | null>(null)
  const inputRef = useRef<PendingInput>({ fire: false, leftHeld: false, rightHeld: false })
  const playAreaRef = useRef<HTMLDivElement>(null)
  const settledRef = useRef(false)
  const callbacksRef = useRef({ onComplete, onCancel, onError })
  callbacksRef.current = { onComplete, onCancel, onError }

  function reportError(thrown: unknown) {
    if (settledRef.current) return
    settledRef.current = true
    audio.stop()
    callbacksRef.current.onError(toError(thrown))
  }

  function cancel() {
    if (settledRef.current) return
    settledRef.current = true
    audio.stop()
    callbacksRef.current.onCancel()
  }

  function toggleMute() {
    const nextMuted = !audio.isMuted()
    audio.setMuted(nextMuted)
    setMuted(nextMuted)
  }

  function startRound() {
    void audio.start()
    try {
      const initial = createState(createRound(words, random), { reducedMotion: prefersReducedMotion() })
      stateRef.current = initial
      setState(initial)
      setPhase('playing')
    } catch (thrown) {
      reportError(thrown)
    }
  }

  function finish() {
    if (settledRef.current || !state) return
    settledRef.current = true
    callbacksRef.current.onComplete({ valueId: context.valueId, score: finalScore(state.alignedHits, state.violationHits) })
  }

  useEffect(() => {
    if (phase === 'result') return
    function handleGlobalKey(event: globalThis.KeyboardEvent) {
      if (event.key === 'Escape') cancel()
      const isPlainM = event.key.toLowerCase() === 'm' && !event.repeat && !event.ctrlKey && !event.metaKey && !event.altKey
      if (isPlainM) toggleMute()
    }
    document.addEventListener('keydown', handleGlobalKey)
    return () => document.removeEventListener('keydown', handleGlobalKey)
  }, [phase])

  useEffect(() => () => audio.stop(), [audio])

  useEffect(() => {
    if (phase !== 'playing') return
    playAreaRef.current?.focus()

    let frameId = 0
    let lastTimestamp: number | null = null

    function takeInput(): EngineInput {
      const pending = inputRef.current
      const input: EngineInput = { moveTo: pending.moveTo, moveDirection: heldDirection(pending), fire: pending.fire }
      pending.moveTo = undefined
      pending.fire = false
      return input
    }

    function onFrame(timestamp: number) {
      if (settledRef.current) return
      const deltaMs = lastTimestamp === null ? 0 : timestamp - lastTimestamp
      lastTimestamp = timestamp
      try {
        const previous = stateRef.current as EngineState
        const next = step(previous, deltaMs, takeInput())
        stateRef.current = next
        setState(next)
        soundsFor(previous, next).forEach((effect) => audio.play(effect))
        if (next.finished) {
          audio.stop(END_JINGLE_MS)
          setPhase('result')
          return
        }
      } catch (thrown) {
        reportError(thrown)
        return
      }
      frameId = requestAnimationFrame(onFrame)
    }

    frameId = requestAnimationFrame(onFrame)
    return () => cancelAnimationFrame(frameId)
  }, [phase])

  function movePointer(event: PointerEvent<HTMLDivElement>) {
    const rect = event.currentTarget.getBoundingClientRect()
    if (rect.width > 0) inputRef.current.moveTo = (event.clientX - rect.left) / rect.width
  }

  function pressPointer(event: PointerEvent<HTMLDivElement>) {
    if (event.button !== 0) return
    movePointer(event)
    inputRef.current.fire = true
  }

  function pressKey(event: KeyboardEvent<HTMLDivElement>) {
    const input = inputRef.current
    const key = event.key.toLowerCase()
    if (key === 'arrowleft' || key === 'a') input.leftHeld = true
    else if (key === 'arrowright' || key === 'd') input.rightHeld = true
    else if (key === ' ') input.fire = true
    else return
    event.preventDefault()
  }

  function releaseKey(event: KeyboardEvent<HTMLDivElement>) {
    const key = event.key.toLowerCase()
    if (key === 'arrowleft' || key === 'a') inputRef.current.leftHeld = false
    else if (key === 'arrowright' || key === 'd') inputRef.current.rightHeld = false
  }

  function releaseAllKeys() {
    inputRef.current.leftHeld = false
    inputRef.current.rightHeld = false
  }

  if (phase === 'briefing') {
    return (
      <div className="integrity-game">
        <section className="integrity-panel" aria-labelledby="integrity-briefing-title">
          <h2 id="integrity-briefing-title">Tembak yang selaras, hindari pelanggaran</h2>
          <p>Kamu punya {ROUND_DURATION_MS / 1000} detik. Tembak kata yang mencerminkan integritas dan biarkan kata pelanggaran lewat.</p>
          <ul>
            <li>Kata selaras integritas: +5 poin.</li>
            <li>Kata pelanggaran: −5 poin.</li>
            <li>Kata yang lolos tidak mengubah skor. Skor akhir 0-100.</li>
            <li>Mouse: gerakkan untuk mengarahkan, klik untuk menembak.</li>
            <li>Keyboard: panah kiri/kanan atau A/D untuk bergerak, Spasi untuk menembak, M untuk suara, Esc untuk batal.</li>
          </ul>
          <div className="integrity-actions">
            <button className="primary-action" type="button" autoFocus onClick={startRound}>Mulai ronde</button>
            <MuteButton muted={muted} onToggle={toggleMute} />
            <button className="secondary-action" type="button" onClick={cancel}>Batal</button>
          </div>
        </section>
      </div>
    )
  }

  if (!state) return null

  if (phase === 'result') {
    const score = finalScore(state.alignedHits, state.violationHits)
    return (
      <div className="integrity-game">
        <section className="integrity-panel" aria-labelledby="integrity-result-title">
          <h2 id="integrity-result-title">Ronde selesai</h2>
          <dl className="integrity-summary">
            <div><dt>Kata selaras kena</dt><dd>{state.alignedHits}</dd></div>
            <div><dt>Kata pelanggaran kena</dt><dd>{state.violationHits}</dd></div>
          </dl>
          <p className="integrity-final-score" aria-label={`Skor akhir ${score} dari 100`}>{score}<small> / 100</small></p>
          <small className={`journey-status ${scoreStatus(score).toLowerCase()}`}>{scoreStatus(score)}</small>
          <div className="integrity-actions">
            <button className="primary-action" type="button" autoFocus onClick={finish}>Lanjut</button>
          </div>
        </section>
      </div>
    )
  }

  const secondsLeft = Math.ceil((ROUND_DURATION_MS - state.clockMs) / 1000)
  return (
    <div className="integrity-game">
      <div className="integrity-hud">
        <span className="integrity-hud-item">SKOR <span className="integrity-hud-value">{state.score}</span></span>
        <span className="integrity-hud-item">WAKTU <span className="integrity-hud-value">{secondsLeft}</span></span>
        <MuteButton muted={muted} onToggle={toggleMute} />
        <button className="secondary-action" type="button" onClick={cancel}>Batal</button>
      </div>
      <div
        ref={playAreaRef}
        className="integrity-play"
        role="group"
        aria-label="Area tembak"
        tabIndex={0}
        onPointerMove={movePointer}
        onPointerDown={pressPointer}
        onKeyDown={pressKey}
        onKeyUp={releaseKey}
        onBlur={releaseAllKeys}
      >
        {visibleTargets(state).map((target) => (
          <div
            key={target.id}
            className="integrity-target"
            style={{
              top: `${LANE_CENTER_Y[target.lane] * 100}%`,
              transform: `translateX(${(targetLeft(target, state.motionClockMs) / TARGET_WIDTH) * 100}%)`,
            }}
          >
            {target.word}
          </div>
        ))}
        {state.projectiles.map((projectile) => (
          <CardProjectile key={projectile.id} className="integrity-projectile" style={{ left: `${projectile.x * 100}%`, top: `${projectile.y * 100}%` }} />
        ))}
        <div role="status">
          {state.feedback.map((item) => (
            <div key={item.id} className="integrity-feedback" style={{ left: `${item.x * 100}%`, top: `${item.y * 100}%` }}>
              <FeedbackContent item={item} />
            </div>
          ))}
        </div>
        <EdcLauncher className="integrity-launcher" style={{ left: `${state.launcherX * 100}%` }} />
      </div>
    </div>
  )
}
