import { useEffect, useRef, useState, type FormEvent } from 'react'
import { ArrowRight, RotateCcw, Send, Volume2, VolumeX, X } from 'lucide-react'
import type { GameProps } from '../contract'
import { useGameMusic } from '../useGameMusic'
import { outcomeMatchesSource, parseCurrentInstructionResponse, type InstructionRequest } from './ai-contract'
import { BOARD_SIZE, MAX_INSTRUCTION_CHARACTERS, ROUND_SECONDS, applyAction, calculateScore, countInstructionCharacters, generateTarget, limitInstruction, type Board, type RoundState, type Score } from './game'
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

function newRound(id: number): Round {
  return { id, state: 'active', target: generateTarget(), board: [],
    transcript: [{ speaker: 'teammate', text: "I'm ready. Tell me what to build." }],
    counted: 0, rejected: 0, remaining: ROUND_SECONDS, score: null }
}

function BoardView({ board, label }: { board: Board; label: string }) {
  return <div className="bb-board" role="grid" aria-label={label}>
    {Array.from({ length: BOARD_SIZE * BOARD_SIZE }, (_, index) => {
      const row = Math.floor(index / BOARD_SIZE)
      const column = index % BOARD_SIZE
      const object = board.find((item) => item.row === row && item.column === column)
      return <div className="bb-cell" role="gridcell" key={index} aria-label={`Row ${row + 1}, column ${column + 1}${object ? `, ${object.color} ${object.shape}` : ', empty'}`}>
        <span className="bb-coordinate">{String.fromCharCode(65 + row)}{column + 1}</span>
        {object && <span className={`bb-piece bb-${object.shape} bb-${object.color}`} aria-hidden="true" />}
      </div>
    })}
  </div>
}

function formatTime(seconds: number) {
  return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`
}

export function BlindBuilder({ context, onComplete, onCancel, onError }: GameProps) {
  const { audio, muted, toggleMute } = useGameMusic()
  const [round, setRound] = useState<Round>(() => newRound(1))
  const [instruction, setInstruction] = useState('')
  const roundRef = useRef(round)
  const deadlineRef = useRef(Date.now() + ROUND_SECONDS * 1000)
  const pendingRef = useRef<AbortController | null>(null)
  const closedRef = useRef(false)
  const committedRef = useRef(false)
  roundRef.current = round

  useEffect(() => { void audio.start() }, [audio])
  useEffect(() => () => { closedRef.current = true; pendingRef.current?.abort() }, [])

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
          { speaker: 'player', text }, { speaker: 'teammate', text: "I couldn't process that. Please rephrase; I haven't changed the board." }] }
        roundRef.current = next
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
        { speaker: 'player', text }, { speaker: 'teammate', text: "I couldn't process that. Please rephrase; I haven't changed the board." }] }
      roundRef.current = next
      setRound(next)
      return
    }

    const outcome = response.outcome
    let teammateText: string
    let board = latest.board
    let rejected = latest.rejected
    if (outcome.type === 'clarification') teammateText = outcome.message
    else if (outcome.type === 'message') { teammateText = outcome.message; rejected += 1 }
    else {
      const result = applyAction(board, outcome.action)
      if (result.ok) { board = result.board; teammateText = result.summary }
      else {
        rejected += 1
        teammateText = result.error === 'occupied' ? 'That cell is occupied. Which open cell should I use?'
          : result.error === 'invalid-move' ? 'Moves are one cell left, right, up, or down. Which direction should I use?'
            : result.error === 'object-not-found' ? "I couldn't find that shape there. Can you clarify?"
              : 'That position is outside the board. Try a row and column from 1 to 5.'
      }
    }
    const next: Round = { ...latest, state: 'active', board, counted: latest.counted + 1, rejected,
      transcript: [...latest.transcript, { speaker: 'player', text }, { speaker: 'teammate', text: teammateText }] }
    roundRef.current = next
    setRound(next)
  }

  const playing = round.state === 'active' || round.state === 'resolving'
  return <section className="blind-builder" aria-label="Blind Builder" onPointerDownCapture={() => { void audio.start() }} onKeyDownCapture={() => { void audio.start() }}>
    <div className="bb-toolbar">
      <strong>BLIND BUILDER <span>/ COLLABORATIVE</span></strong>
      <div className="bb-actions">
        {playing && <span className={round.remaining <= 10 ? 'bb-timer bb-urgent' : 'bb-timer'} aria-live="polite">{formatTime(round.remaining)} <small>REMAINING</small></span>}
        {playing && <button type="button" className="bb-quiet" onClick={() => finalize(roundRef.current, Date.now() >= deadlineRef.current)}>Submit round</button>}
        <button type="button" className="bb-icon" onClick={toggleMute} aria-pressed={muted} aria-label={muted ? 'Nyalakan suara' : 'Matikan suara'} title={muted ? 'Nyalakan suara' : 'Matikan suara'}>{muted ? <VolumeX size={18} /> : <Volume2 size={18} />}</button>
        <button type="button" className="bb-icon" onClick={leave} aria-label="Exit game" title="Exit game"><X size={18} /></button>
      </div>
    </div>

    {round.state === 'results' && round.score ? <>
      <div className="bb-heading"><span>ROUND COMPLETE</span><h2>{round.score.final >= 80 ? 'In sync.' : round.score.final >= 50 ? 'Getting closer.' : 'A first draft.'}</h2><p>Your teammate followed {round.score.exactMatches} of {round.target.length} target details exactly.</p></div>
      <div className="bb-layout bb-results">
        <div className="bb-boards">
          <div className="bb-panel"><div className="bb-label">TARGET <span>REFERENCE</span></div><BoardView board={round.target} label="Target board" /></div>
          <div className="bb-panel"><div className="bb-label">TEAMMATE <span>FINAL BUILD</span></div><BoardView board={round.board} label="Final teammate board" /></div>
        </div>
        <aside className="bb-score">
          <span>TEAM SCORE</span><strong>{round.score.final}<small>/100</small></strong>
          <dl><div><dt>Accuracy</dt><dd>{Math.round(round.score.accuracy)}%</dd></div><div><dt>Communication</dt><dd>{Math.round(round.score.communication)}%</dd></div><div><dt>Time left</dt><dd>{Math.round(round.score.speed)}%</dd></div></dl>
          <p>{round.score.accuracy === 100 ? 'Clear directions made every detail count.' : 'Try naming the color, shape, and exact position in each instruction.'}</p>
          <button type="button" className="bb-primary" disabled={committedRef.current} onClick={() => {
            if (committedRef.current) return
            committedRef.current = true
            onComplete({ valueId: context.valueId, score: round.score!.final })
          }}>Continue journey <ArrowRight size={17} /></button>
          <button type="button" className="bb-quiet" onClick={replay}><RotateCcw size={15} /> Play again</button>
        </aside>
      </div>
    </> : <>
      <div className="bb-heading"><span>ROUND 01 / RECREATE THE PATTERN</span><h2>Give your teammate a clue.</h2><p>Describe the color, shape, and cell. Your teammate cannot see your reference.</p></div>
      <div className="bb-layout">
        <div className="bb-boards">
          <div className="bb-panel"><div className="bb-label">YOUR REFERENCE <span>ONLY YOU CAN SEE THIS</span></div><BoardView board={round.target} label="Your target board" /><p>Same shapes. Same colors. Same cells.</p></div>
          <div className="bb-panel"><div className="bb-label">TEAMMATE'S BOARD <span>LIVE</span></div><BoardView board={round.board} label="Teammate's board" /><p>Red / Blue / Green</p></div>
        </div>
        <aside className="bb-conversation">
          <div className="bb-label">YOUR TEAMMATE <span>{round.counted} INSTRUCTIONS</span></div>
          <div className="bb-transcript" aria-live="polite" aria-label="Conversation">{round.transcript.map((message, index) => <div className={`bb-message bb-${message.speaker}`} key={`${round.id}-${index}`}><span>{message.speaker}</span><p>{message.text}</p></div>)}{round.state === 'resolving' && <p className="bb-wait">Figuring it out...</p>}</div>
          <form className="bb-composer" onSubmit={sendInstruction}>
            <label htmlFor="bb-instruction">YOUR INSTRUCTION</label>
            <textarea id="bb-instruction" value={instruction} onChange={(event) => setInstruction(limitInstruction(event.target.value))}
              onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); event.currentTarget.form?.requestSubmit() } }}
              disabled={round.state !== 'active'} rows={3} placeholder="e.g. Put the blue circle at top left" />
            <div><span>{countInstructionCharacters(instruction)} / {MAX_INSTRUCTION_CHARACTERS}</span><button type="submit" className="bb-primary" disabled={round.state !== 'active' || !instruction.trim()}><Send size={15} /> Send</button></div>
          </form>
        </aside>
      </div>
    </>}
  </section>
}
