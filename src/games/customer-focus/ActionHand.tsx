import { ArrowRight } from 'lucide-react'
import type { ActionCard } from './service'
import './playing-cards.css'

const art = '/assets/customer-focus/'
const ranks = ['A', 'K', 'Q']

interface ActionHandProps {
  cards: readonly ActionCard[]
  rejected: readonly number[]
  onChoose: (choice: number) => void
}

export function ActionHand({ cards, rejected, onChoose }: ActionHandProps) {
  return (
    <div className="cf-card-table">
      <div className="cf-deck" aria-hidden="true">
        {[0, 1, 2].map(layer => (
          <img key={layer} src={`${art}card-back.png`} alt="" draggable={false} />
        ))}
        <span>DEK TINDAKAN</span>
      </div>
      <div className="cf-hand" role="group" aria-label="Kartu tindakan di tangan" aria-describedby="cf-hand-help">
        {cards.map((card, i) => (
          <div className={`cf-card-slot cf-slot-${i}`} key={card.title}>
            <button
              type="button"
              className={`cf-card cf-card-${i}${rejected.includes(i) ? ' cf-rejected' : ''}`}
              disabled={rejected.includes(i)}
              onClick={() => onChoose(i)}
            >
              <img className="cf-card-face" src={`${art}card-face.png`} alt="" draggable={false} />
              <img className="cf-card-aura" src={`${art}fx-select.png`} alt="" draggable={false} />
              <span className="cf-card-rank" aria-hidden="true">{ranks[i]}</span>
              <span className="cf-card-top">KARTU TINDAKAN</span>
              <strong>{card.title}</strong>
              <span className="cf-card-description">{card.text}</span>
              <span className="cf-card-bottom">
                {rejected.includes(i) ? 'Coba kartu lain' : 'Mainkan kartu'}
                <ArrowRight size={13} aria-hidden="true" />
              </span>
              <span className="cf-card-rank cf-rank-bottom" aria-hidden="true">{ranks[i]}</span>
            </button>
          </div>
        ))}
      </div>
      <p className="cf-hand-help" id="cf-hand-help">
        <span className="cf-hover-help">Arahkan kursor ke kartu untuk melihatnya · Klik untuk memainkan</span>
        <span className="cf-touch-help">Geser untuk melihat kartu · Ketuk untuk memainkan</span>
        <span className="cf-keyboard-help">Tab untuk memilih · Enter / Spasi untuk memainkan</span>
      </p>
    </div>
  )
}
