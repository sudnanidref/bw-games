import { useEffect, useRef } from 'react'
import type { PlayableGame } from '../contract'
import { useGameMusic } from '../useGameMusic'
import { mountGrowthGame } from './engine'
import './growth-mindset.css'

export const GrowthMindsetGame: PlayableGame = ({ context, onComplete, onCancel, onError }) => {
  const host = useRef<HTMLDivElement>(null)
  const callbacks = useRef({ onComplete, onCancel, onError })
  const { valueId } = context
  const { audio, toggleMute } = useGameMusic()

  useEffect(() => {
    callbacks.current = { onComplete, onCancel, onError }
  })

  useEffect(() => {
    if (!host.current) return
    const game = mountGrowthGame(host.current, {
      onComplete: (score) => callbacks.current.onComplete({ valueId, score }),
      onCancel: () => callbacks.current.onCancel(),
      onError: (error) => callbacks.current.onError(error),
      music: {
        start: () => { void audio.start() },
        stop: () => audio.stop(),
        isMuted: () => audio.isMuted(),
        toggleMute,
      },
    })
    return () => game.destroy()
  }, [audio, valueId])

  return <div ref={host} className="gm-host" />
}
