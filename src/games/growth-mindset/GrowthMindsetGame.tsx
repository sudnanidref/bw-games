import { useEffect, useRef } from 'react'
import type { PlayableGame } from '../contract'
import { mountGrowthGame } from './engine'
import './growth-mindset.css'

export const GrowthMindsetGame: PlayableGame = ({ context, onComplete, onCancel, onError }) => {
  const host = useRef<HTMLDivElement>(null)
  const callbacks = useRef({ onComplete, onCancel, onError })
  const { valueId } = context

  useEffect(() => {
    callbacks.current = { onComplete, onCancel, onError }
  })

  useEffect(() => {
    if (!host.current) return
    const game = mountGrowthGame(host.current, {
      onComplete: (score) => callbacks.current.onComplete({ valueId, score }),
      onCancel: () => callbacks.current.onCancel(),
      onError: (error) => callbacks.current.onError(error),
    })
    return () => game.destroy()
  }, [valueId])

  return <div ref={host} className="gm-host" />
}
