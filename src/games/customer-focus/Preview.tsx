import { useState } from 'react'
import { ArrowLeft, RotateCcw } from 'lucide-react'
import type { GameResult } from '../contract'
import { MatchTheSolution } from './MatchTheSolution'

export function CustomerFocusPreview() {
  const [round, setRound] = useState(0)
  const [result, setResult] = useState<GameResult | null>(null)
  const [cancelled, setCancelled] = useState(false)
  const [error, setError] = useState('')

  function restart() {
    setRound((previous) => previous + 1)
    setResult(null)
    setCancelled(false)
    setError('')
  }

  return (
    <div className="match-preview">
      <header className="match-preview-header"><a href="/"><ArrowLeft size={18} /> Kembali ke hub</a><span>PREVIEW LOKAL / CUSTOMER FOCUS</span></header>
      <main className="match-preview-content">
        <div className="match-preview-heading"><span className="match-kicker">BRILiaN WAY / GAME 05</span><h1>Customer Focus</h1><p>Melayani dengan cepat, tepat, dan memberi nilai tambah.</p></div>
        {result || cancelled || error ? (
          <section className="match-game match-result" aria-label="Hasil preview">
            <span className="match-kicker">PREVIEW LOKAL</span>
            <h2>{error ? 'Permainan terhenti.' : cancelled ? 'Ronde dibatalkan.' : 'Skor tercatat.'}</h2>
            {result && <div className="match-final-score">{result.score}<span> / 100</span></div>}
            {error && <p role="alert">{error}</p>}
            <button type="button" className="primary-action" onClick={restart}><RotateCcw size={18} /> Main lagi</button>
          </section>
        ) : (
          <MatchTheSolution key={round} context={{ valueId: 'customer-focus', playerName: 'Preview', priorResults: [] }} onComplete={setResult} onCancel={() => setCancelled(true)} onError={(failure) => setError(failure.message)} />
        )}
      </main>
    </div>
  )
}