import { useEffect, useState, type CSSProperties, type FormEvent } from 'react'
import { ArrowRight, Award, CircleHelp, Flag, LockKeyhole, Map, RotateCcw, Trophy, UserRound } from 'lucide-react'
import { games } from './games'
import type { GameResult } from './games/contract'
import { completeStage, createJourney, currentValue, stageStatus, totalScore, type Journey } from './journey'
import type { LeaderboardEntry } from './leaderboard'
import { submissionFor } from './leaderboard-client'

export function App() {
  const [name, setName] = useState('')
  const [journey, setJourney] = useState<Journey | null>(null)
  const [nameError, setNameError] = useState('')
  const [gameStarted, setGameStarted] = useState(false)
  const [gameError, setGameError] = useState('')
  const [view, setView] = useState<'journey' | 'leaderboard'>('journey')
  const [entries, setEntries] = useState<LeaderboardEntry[]>([])
  const [leaderboardError, setLeaderboardError] = useState('')
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const current = journey ? currentValue(journey) : null
  const currentGame = games.find((game) => game.id === current)
  const score = journey ? totalScore(journey) : null

  useEffect(() => {
    if (view !== 'leaderboard') return
    const controller = new AbortController()
    setLoadingLeaderboard(true)
    fetch('/api/leaderboard', { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error('Peringkat belum bisa dimuat.')
        return response.json() as Promise<LeaderboardEntry[]>
      })
      .then((list) => { setEntries(list); setLeaderboardError('') })
      .catch(() => { if (!controller.signal.aborted) setLeaderboardError('Peringkat belum bisa dimuat.') })
      .finally(() => { if (!controller.signal.aborted) setLoadingLeaderboard(false) })
    return () => controller.abort()
  }, [view, submitted])

  function start(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const next = createJourney(name, crypto.randomUUID())
    if (!next) {
      setNameError('Masukkan nama 1-24 karakter.')
      return
    }
    setNameError('')
    setJourney(next)
  }

  function finish(result: GameResult) {
    if (!journey || !currentGame) return
    const next = completeStage(journey, result, currentGame.available && Boolean(currentGame.component))
    if (next === journey) {
      setGameError('Hasil tidak valid. Coba lagi.')
      return
    }
    setJourney(next)
    setGameStarted(false)
    setGameError('')
  }

  async function submitRun() {
    if (!journey || submitting || submitted) return
    const payload = submissionFor(journey)
    if (!payload) return
    setSubmitting(true)
    setLeaderboardError('')
    try {
      const response = await fetch('/api/leaderboard', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
      })
      if (!response.ok) throw new Error('Hasil belum terkirim. Coba lagi.')
      setSubmitted(true)
      setView('leaderboard')
    } catch {
      setLeaderboardError('Hasil belum terkirim. Coba lagi.')
    } finally {
      setSubmitting(false)
    }
  }

  const ActiveGame = currentGame?.component
  const priorResults = journey ? Object.freeze(journey.results.map((result) => Object.freeze({ ...result }))) : []

  return (
    <div className="shell">
      <header className="topbar">
        <div className="brand"><span className="brand-mark" aria-hidden="true">B<span>W</span></span><span>BRILiaN <strong>WAY</strong><small>ARCADE JOURNEY</small></span></div>
        <div className="topbar-right"><nav className="view-tabs" aria-label="Tampilan"><button type="button" className={view === 'journey' ? 'selected' : ''} aria-current={view === 'journey' ? 'page' : undefined} onClick={() => setView('journey')}><Map size={16} /> Perjalanan</button><button type="button" className={view === 'leaderboard' ? 'selected' : ''} aria-current={view === 'leaderboard' ? 'page' : undefined} onClick={() => setView('leaderboard')}><Trophy size={16} /> Peringkat</button></nav><span className="session"><UserRound size={17} /> {journey?.playerName ?? 'Pemain baru'}</span></div>
      </header>

      <main className="workspace">
        <aside className="route" aria-label="Rute BRILiaN Way">
          <div className="side-heading"><Map size={18} /><span>RUTE PERMAINAN</span><span className="route-count">{journey?.results.length ?? 0}/5</span></div>
          <ol className="route-list">
            {games.map((game, index) => {
              const state = journey ? stageStatus(journey, game.id) : index === 0 ? 'current' : 'locked'
              const result = journey?.results.find((item) => item.valueId === game.id)
              return <li className={`route-stop ${state}`} key={game.id} style={{ '--stop-accent': game.accent } as CSSProperties}>
                <span className="stop-index">{String(index + 1).padStart(2, '0')}</span>
                <div className="stop-copy"><strong>{game.title}</strong><span>{state === 'complete' ? `${result?.score} / 100 poin` : state === 'current' ? 'Tahap saat ini' : 'Belum terbuka'}</span></div>
                {state === 'complete' ? <Award size={19} aria-label="Selesai" /> : state === 'locked' ? <LockKeyhole size={16} aria-label="Terkunci" /> : <span className="current-dot" aria-label="Saat ini" />}
              </li>
            })}
          </ol>
          <div className="route-footer"><Flag size={17} /><span>Setiap nilai membuka langkah berikutnya.</span></div>
        </aside>

        <section className="main-stage" aria-label="Area permainan">
          <div className="stage-hud"><span><span className="live-dot" /> BRILiaN WAY / {view === 'journey' ? 'PERJALANAN' : 'PERINGKAT'}</span><span>{view === 'leaderboard' ? 'HASIL PEMAIN' : journey ? `TAHAP ${String(Math.min(journey.results.length + 1, 5)).padStart(2, '0')} / 05` : 'SIAP DIMULAI'}</span></div>
          {view === 'leaderboard' ? (
            <div className="leaderboard-stage stage-content"><span className="eyebrow">CATATAN PERJALANAN</span><h1>Papan peringkat</h1><p>Hasil akhir dari lima nilai BRILiaN Way.</p>{leaderboardError && <p role="alert" className="form-error">{leaderboardError}</p>}{loadingLeaderboard ? <p className="ranking-loading">Memuat peringkat...</p> : entries.length ? <ol className="leaderboard-list">{entries.map((entry, index) => <li key={entry.id}><span className="rank">{String(index + 1).padStart(2, '0')}</span><strong>{entry.playerName}</strong><span className="rank-score">{entry.total} <small>/ 500</small></span></li>)}</ol> : <div className="empty-ranking"><Trophy size={42} /><h2>Belum ada hasil</h2><p>Peringkat pertama menunggu pemain yang menuntaskan lima game.</p></div>}</div>
          ) : !journey ? (
            <div className="welcome stage-content">
              <div className="intro-copy"><span className="eyebrow">BERMAIN DENGAN NILAI</span><h1>Lima langkah.<br /><em>Satu arah.</em></h1><p>Mulai perjalanan BRILiaN Way dari Integrity. Lima permainan akan hadir dalam satu rangkaian, dan nilainya dihitung saat semua tahap selesai.</p>
                <form onSubmit={start} className="entry-form"><label htmlFor="player-name">NAMA PEMAIN</label><div className="entry-row"><input id="player-name" value={name} onChange={(event) => { setName(Array.from(event.target.value).slice(0, 24).join('')); setNameError('') }} placeholder="Nama kamu" autoComplete="nickname" aria-invalid={Boolean(nameError)} aria-describedby={nameError ? 'name-error' : undefined} /><button className="primary-action" type="submit">Mulai perjalanan <ArrowRight size={18} /></button></div>{nameError && <span id="name-error" role="alert" className="form-error">{nameError}</span>}</form>
              </div><div className="journey-art" aria-hidden="true"><img src="/journey-map.svg" alt="" /></div>
            </div>
          ) : score !== null ? (
            <div className="result-stage stage-content"><div className="eyebrow">PERJALANAN SELESAI</div><Trophy size={64} strokeWidth={1.5} /><h1>Hasil akhir</h1><div className="final-score">{score}<span>/ 500</span></div><ul className="result-list">{journey.results.map((result) => <li key={result.valueId}><span>{games.find((game) => game.id === result.valueId)?.title}</span><strong>{result.score}</strong></li>)}</ul>{leaderboardError && <p role="alert" className="form-error">{leaderboardError}</p>}<div className="result-actions"><button type="button" className="primary-action" disabled={submitting || submitted} onClick={submitRun}>{submitted ? 'Hasil terkirim' : submitting ? 'Mengirim...' : 'Kirim ke peringkat'} <ArrowRight size={17} /></button><button type="button" className="secondary-action" onClick={() => { setJourney(null); setSubmitted(false); setLeaderboardError('') }}><RotateCcw size={17} /> Main lagi</button></div></div>
          ) : (
            <div className="active-stage stage-content" style={{ '--stage-accent': currentGame?.accent } as CSSProperties}>
              <div className="stage-heading"><span className="eyebrow">NILAI {String(journey.results.length + 1).padStart(2, '0')} / 05</span><h1>{currentGame?.title}</h1><p>{currentGame?.description}</p></div>
              {currentGame?.available && ActiveGame ? gameStarted ? (
                <ActiveGame context={{ valueId: currentGame.id, playerName: journey.playerName, priorResults }} onComplete={finish} onCancel={() => setGameStarted(false)} onError={(error) => { setGameError(error.message); setGameStarted(false) }} />
              ) : <div className="stage-notice"><CircleHelp size={29} /><h2>Siap untuk tantangan?</h2><p>{currentGame.briefing ?? 'Baca tujuan permainan sebelum memulai.'}</p><button className="primary-action" type="button" onClick={() => setGameStarted(true)}>Mulai game <ArrowRight size={18} /></button></div> : (
                <div className="stage-notice"><span className="notice-symbol">{String(journey.results.length + 1).padStart(2, '0')}</span><h2>Game sedang disiapkan</h2><p>Slot {currentGame?.title} belum tersedia. Tahap berikutnya terbuka setelah game ini selesai, tanpa skor sementara.</p><span className="coming-soon">BELUM TERSEDIA</span></div>
              )}
              {gameError && <p role="alert" className="form-error">{gameError}</p>}
              {journey.results.length > 0 && <div className="previous-result"><Award size={18} /> Nilai terakhir: {games[journey.results.length - 1].title} <strong>{journey.results[journey.results.length - 1].score} / 100</strong></div>}
            </div>
          )}
          <div className="stage-bottom"><span>INTEGRITY → COLLABORATIVE → ACCOUNTABILITY → GROWTH MINDSET → CUSTOMER FOCUS</span><span>{journey ? `${journey.results.length} NILAI SELESAI` : 'MULAI DARI INTEGRITY'}</span></div>
        </section>
      </main>
    </div>
  )
}