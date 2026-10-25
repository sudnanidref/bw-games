import { useEffect, useRef, useState, type FormEvent } from 'react'
import { ArrowRight, RotateCcw, Send, Volume2, VolumeX, X } from 'lucide-react'
import type { GameProps } from '../contract'
import { scoreStatus } from '../score-status'
import { useGameMusic } from '../useGameMusic'
import { outcomeMatchesSource, parseCurrentInstructionResponse, type InstructionRequest } from './ai-contract'
import { BOARD_SIZE, MAX_INSTRUCTION_CHARACTERS, ROUND_SECONDS, applyAction, calculateScore, countInstructionCharacters, generateTarget, limitInstruction, type Board, type RoundState, type Score } from './game'
import { GUIDE_GROUPS, GUIDE_VOCAB } from './guide'
import './style.css'

type Message = { speaker: 'player' | 'teammate'; text: string }
type Round = {
  id: number
  state: RoundState
  target: Board
  board: Board
  transcript: Message[]
  counted: number
  rejected: number
  remaining: number
  score: Score | null
}

const SHAPE_LABEL: Record<string, string> = { circle: 'lingkaran', square: 'kotak', triangle: 'segitiga' }
const COLOR_LABEL: Record<string, string> = { red: 'merah', blue: 'biru', green: 'hijau' }

// Reuse the Customer Focus character + scene art so Blind Builder shares the hub theme.
const art = '/assets/customer-focus/'
type Reaction = 'happy' | 'worried' | null

function newRound(id: number): Round {
  return { id, state: 'active', target: generateTarget(), board: [],
    transcript: [{ speaker: 'teammate', text: 'Saya siap. Beri tahu apa yang harus saya susun.' }],
    counted: 0, rejected: 0, remaining: ROUND_SECONDS, score: null }
}

function BoardView({ board, label }: { board: Board; label: string }) {
  return <div className="bb-board" role="grid" aria-label={label}>
    {Array.from({ length: BOARD_SIZE * BOARD_SIZE }, (_, index) => {
      const row = Math.floor(index / BOARD_SIZE)
      const column = index % BOARD_SIZE
      const object = board.find((item) => item.row === row && item.column === column)
      return <div className="bb-cell" role="gridcell" key={index} aria-label={`Baris ${row + 1}, kolom ${column + 1}${object ? `, ${SHAPE_LABEL[object.shape]} ${COLOR_LABEL[object.color]}` : ', kosong'}`}>
        <span className="bb-coordinate">{String.fromCharCode(65 + row)}{column + 1}</span>
        {object && <span className={`bb-piece bb-${object.shape} bb-${object.color}`} aria-hidden="true" />}
      </div>
    })}
  </div>
}

function formatTime(seconds: number) {
  return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`
}

function InstructionGuide({ onPick, disabled }: { onPick: (example: string) => void; disabled: boolean }) {
  return <details className="bb-guide">
    <summary>Cara memberi instruksi <span>contoh yang bisa diproses</span></summary>
    <div className="bb-guide-body">
      <p className="bb-guide-lead">Rekanmu memahami tiga tindakan. Tulis satu tindakan per instruksi, maksimal {MAX_INSTRUCTION_CHARACTERS} karakter. Klik contoh untuk memakainya.</p>
      {GUIDE_GROUPS.map((group) => <div className="bb-guide-group" key={group.title}>
        <strong>{group.title}</strong>
        <small>{group.hint}</small>
        <ul>{group.examples.map((example) => <li key={example}>
          <button type="button" onClick={() => onPick(example)} disabled={disabled}>{example}</button>
        </li>)}</ul>
      </div>)}
      <dl className="bb-guide-vocab">{GUIDE_VOCAB.map((item) => <div key={item.label}>
        <dt>{item.label}</dt><dd>{item.values}</dd>
      </div>)}</dl>
    </div>
  </details>
}

export function BlindBuilder({ context, onComplete, onCancel, onError }: GameProps) {
  const { audio, muted, toggleMute } = useGameMusic()
  const [round, setRound] = useState<Round>(() => newRound(1))
  const [instruction, setInstruction] = useState('')
  const [reaction, setReaction] = useState<Reaction>(null)
  const roundRef = useRef(round)
  const deadlineRef = useRef(Date.now() + ROUND_SECONDS * 1000)
  const pendingRef = useRef<AbortController | null>(null)
  const closedRef = useRef(false)
  const committedRef = useRef(false)
  roundRef.current = round

  useEffect(() => { void audio.start() }, [audio])
  useEffect(() => () => { closedRef.current = true; pendingRef.current?.abort() }, [])
  useEffect(() => {
    for (const name of ['confused', 'confused-happy', 'worried', 'worried-happy', 'lobby', 'counter']) {
      const image = new Image()
      image.src = `${art}${name}.png`
    }
  }, [])

  function finalize(current: Round, timedOut: boolean) {
    if (closedRef.current || current.state === 'results') return
    const remaining = timedOut ? 0 : Math.max(0, Math.ceil((deadlineRef.current - Date.now()) / 1000))
    const result: Round = { ...current, state: 'results', remaining,
      score: calculateScore(current.target, current.board, {
        countedPlayerInstructions: current.counted, rejectedPlayerInstructions: current.rejected,
        remainingSeconds: remaining, timedOut,
      }) }
    pendingRef.current?.abort()
    audio.stop()
    roundRef.current = result
    setRound(result)
  }

  useEffect(() => {
    if (round.state !== 'active' && round.state !== 'resolving') return
    const timer = window.setInterval(() => {
      const current = roundRef.current
      if (current.state !== 'active' && current.state !== 'resolving') return
      const remaining = Math.max(0, Math.ceil((deadlineRef.current - Date.now()) / 1000))
      if (remaining === 0) finalize(current, true)
      else setRound({ ...current, remaining })
    }, 200)
    return () => window.clearInterval(timer)
  }, [round.state])

  function replay() {
    pendingRef.current?.abort()
    try {
      const next = newRound(roundRef.current.id + 1)
      deadlineRef.current = Date.now() + ROUND_SECONDS * 1000
      roundRef.current = next
      setInstruction('')
      setReaction(null)
      setRound(next)
      void audio.start()
    } catch (error) { audio.stop(); onError(error instanceof Error ? error : new Error('Could not start a round.')) }
  }

  function leave() {
    closedRef.current = true
    pendingRef.current?.abort()
    audio.stop()
    onCancel()
  }

  function useExample(example: string) {
    if (roundRef.current.state !== 'active') return
    setInstruction(limitInstruction(example))
    document.getElementById('bb-instruction')?.focus()
  }

  async function sendInstruction(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const current = roundRef.current
    const text = instruction.trim()
    if (closedRef.current || current.state !== 'active' || !text || countInstructionCharacters(text) > MAX_INSTRUCTION_CHARACTERS) return
    if (Date.now() >= deadlineRef.current) { finalize(current, true); return }
    const request: InstructionRequest = { roundId: current.id, instruction: text, board: current.board, transcript: current.transcript }
    const controller = new AbortController()
    pendingRef.current = controller
    roundRef.current = { ...current, state: 'resolving' }
    setRound(roundRef.current)
    setInstruction('')

    let body: unknown
    try {
      const response = await fetch('/api/instruction', { method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify(request), signal: controller.signal })
      if (!response.ok) throw new Error('Instruction service unavailable.')
      body = await response.json()
    } catch {
      const latest = roundRef.current
      if (!closedRef.current && latest.id === request.roundId && latest.state === 'resolving') {
        const next: Round = { ...latest, state: 'active', transcript: [...latest.transcript,
          { speaker: 'player', text }, { speaker: 'teammate', text: 'Saya belum bisa memprosesnya. Coba ucapkan ulang; papan belum saya ubah.' }] }
        roundRef.current = next
        setReaction('worried')
        setRound(next)
      }
      return
    } finally { if (pendingRef.current === controller) pendingRef.current = null }

    const latest = roundRef.current
    if (closedRef.current || latest.id !== request.roundId || latest.state !== 'resolving') return
    if (Date.now() >= deadlineRef.current) { finalize(latest, true); return }
    const response = parseCurrentInstructionResponse(body, request.roundId, latest.state)
    if (!response || !outcomeMatchesSource(request, response.outcome)) {
      const next: Round = { ...latest, state: 'active', transcript: [...latest.transcript,
        { speaker: 'player', text }, { speaker: 'teammate', text: 'Saya belum bisa memprosesnya. Coba ucapkan ulang; papan belum saya ubah.' }] }
      roundRef.current = next
      setReaction('worried')
      setRound(next)
      return
    }

    const outcome = response.outcome
    let teammateText: string
    let board = latest.board
    let rejected = latest.rejected
    let nextReaction: Reaction = 'worried'
    if (outcome.type === 'clarification') teammateText = outcome.message
    else if (outcome.type === 'message') { teammateText = outcome.message; rejected += 1 }
    else {
      const result = applyAction(board, outcome.action)
      if (result.ok) { board = result.board; teammateText = result.summary; nextReaction = 'happy' }
      else {
        rejected += 1
        teammateText = result.error === 'occupied' ? 'Sel itu sudah terisi. Sel kosong mana yang harus saya pakai?'
          : result.error === 'invalid-move' ? 'Perpindahan hanya satu sel ke kiri, kanan, atas, atau bawah. Ke arah mana?'
            : result.error === 'object-not-found' ? 'Saya tidak menemukan bentuk itu di sana. Bisa diperjelas?'
              : 'Posisi itu di luar papan. Coba baris dan kolom dari 1 sampai 5.'
      }
    }
    const next: Round = { ...latest, state: 'active', board, counted: latest.counted + 1, rejected,
      transcript: [...latest.transcript, { speaker: 'player', text }, { speaker: 'teammate', text: teammateText }] }
    roundRef.current = next
    setReaction(nextReaction)
    setRound(next)
  }

  const playing = round.state === 'active' || round.state === 'resolving'
  const finalScore = round.score?.final ?? 0
  const portrait = round.state === 'resolving' ? 'confused'
    : round.state === 'results' ? (finalScore >= 50 ? 'confused-happy' : 'worried')
      : reaction === 'happy' ? 'confused-happy' : reaction === 'worried' ? 'worried' : 'confused'
  const moodLabel = portrait === 'confused-happy' ? 'senang' : portrait === 'worried' ? 'cemas' : 'siap membantu'
  return <section className="blind-builder cf-game" aria-label="Blind Builder" onPointerDownCapture={() => { void audio.start() }} onKeyDownCapture={() => { void audio.start() }}>
    <img className="bb-scene-bg" src={`${art}lobby.png`} alt="" aria-hidden="true" />
    <img key={portrait} className={`bb-teammate bb-teammate-${portrait}`} src={`${art}${portrait}.png`} alt={`Rekan setim, ${moodLabel}`} />
    <img className="bb-scene-counter" src={`${art}counter.png`} alt="" aria-hidden="true" />
    <div className="bb-stage">
    <div className="bb-toolbar">
      <strong>BLIND BUILDER <span>/ COLLABORATIVE</span></strong>
      <div className="bb-actions">
        {playing && <span className={round.remaining <= 10 ? 'bb-timer bb-urgent' : 'bb-timer'} aria-live="polite">{formatTime(round.remaining)} <small>SISA WAKTU</small></span>}
        {playing && <button type="button" className="bb-quiet" onClick={() => finalize(roundRef.current, Date.now() >= deadlineRef.current)}>Selesaikan ronde</button>}
        <button type="button" className="bb-icon" onClick={toggleMute} aria-pressed={muted} aria-label={muted ? 'Nyalakan suara' : 'Matikan suara'} title={muted ? 'Nyalakan suara' : 'Matikan suara'}>{muted ? <VolumeX size={18} /> : <Volume2 size={18} />}</button>
        <button type="button" className="bb-icon" onClick={leave} aria-label="Keluar permainan" title="Keluar permainan"><X size={18} /></button>
      </div>
    </div>

    {round.state === 'results' && round.score ? <>
      <div className="bb-heading"><span>RONDE SELESAI</span><h2>{round.score.final >= 80 ? 'Kompak!' : round.score.final >= 50 ? 'Makin dekat.' : 'Draf pertama.'}</h2><p>Rekanmu mengikuti {round.score.exactMatches} dari {round.target.length} detail target dengan tepat.</p></div>
      <div className="bb-layout bb-results">
        <div className="bb-boards">
          <div className="bb-panel"><div className="bb-label">TARGET <span>ACUAN</span></div><BoardView board={round.target} label="Papan target" /></div>
          <div className="bb-panel"><div className="bb-label">REKAN <span>HASIL AKHIR</span></div><BoardView board={round.board} label="Papan akhir rekan" /></div>
        </div>
        <aside className="bb-score">
          <span>SKOR TIM</span><strong>{round.score.final}<small>/100</small></strong>
          <dl><div><dt>Akurasi</dt><dd>{Math.round(round.score.accuracy)}%</dd></div><div><dt>Komunikasi</dt><dd>{Math.round(round.score.communication)}%</dd></div><div><dt>Sisa waktu</dt><dd>{Math.round(round.score.speed)}%</dd></div></dl>
          <p>{round.score.accuracy === 100 ? 'Arahan yang jelas membuat setiap detail tepat.' : 'Coba sebutkan warna, bentuk, dan posisi persis di tiap instruksi.'}</p>
          <button type="button" className="bb-primary" disabled={committedRef.current} onClick={() => {
            if (committedRef.current) return
            committedRef.current = true
            onComplete({ valueId: context.valueId, score: round.score!.final })
          }}>Lanjutkan perjalanan <ArrowRight size={17} /></button>
          <button type="button" className="bb-quiet" onClick={replay}><RotateCcw size={15} /> Main lagi</button>
        </aside>
      </div>
    </> : <>
      <div className="bb-heading"><span>RONDE {String(round.id).padStart(2, '0')} / SUSUN ULANG POLANYA</span><h2>Beri petunjuk untuk rekanmu.</h2><p>Rekanmu tidak bisa melihat acuanmu. Satu instruksi = satu tindakan: <b>taruh</b>, <b>pindahkan</b>, atau <b>hapus</b>. Selalu sebutkan warna, bentuk, dan posisi. Contoh: “Taruh lingkaran biru di kiri atas”. Lihat panduan lengkap di bawah.</p></div>
      <div className="bb-layout">
        <div className="bb-boards">
          <div className="bb-panel"><div className="bb-label">ACUANMU <span>HANYA KAMU YANG BISA LIHAT</span></div><BoardView board={round.target} label="Papan target kamu" /><p>Bentuk sama. Warna sama. Sel sama.</p></div>
          <div className="bb-panel"><div className="bb-label">PAPAN REKAN <span>LANGSUNG</span></div><BoardView board={round.board} label="Papan rekan" /><p>Merah / Biru / Hijau</p></div>
        </div>
        <aside className="bb-conversation">
          <div className="bb-label">REKANMU <span>{round.counted} INSTRUKSI</span></div>
          <div className="bb-transcript" aria-live="polite" aria-label="Percakapan">{round.transcript.map((message, index) => <div className={`bb-message bb-${message.speaker}`} key={`${round.id}-${index}`}><span>{message.speaker === 'player' ? 'kamu' : 'rekan'}</span><p>{message.text}</p></div>)}{round.state === 'resolving' && <p className="bb-wait">Sedang memikirkan...</p>}</div>
          <InstructionGuide onPick={useExample} disabled={round.state !== 'active'} />
          <form className="bb-composer" onSubmit={sendInstruction}>
            <label htmlFor="bb-instruction">INSTRUKSIMU</label>
            <textarea id="bb-instruction" value={instruction} onChange={(event) => setInstruction(limitInstruction(event.target.value))}
              onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); event.currentTarget.form?.requestSubmit() } }}
              disabled={round.state !== 'active'} rows={3} placeholder="mis. Taruh lingkaran biru di kiri atas" />
            <div><span>{countInstructionCharacters(instruction)} / {MAX_INSTRUCTION_CHARACTERS}</span><button type="submit" className="bb-primary" disabled={round.state !== 'active' || !instruction.trim()}><Send size={15} /> Kirim</button></div>
          </form>
        </aside>
      </div>
    </>}
    </div>
  </section>
}
