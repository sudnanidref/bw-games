import { useEffect, useState } from 'react'
import { createGameAudio } from './integrity/audio'

// All playable stages share one music track and one saved mute preference.
export function useGameMusic() {
  const [audio] = useState(() => createGameAudio())
  const [muted, setMuted] = useState(() => audio.isMuted())

  useEffect(() => () => audio.stop(), [audio])

  function toggleMute() {
    const next = !audio.isMuted()
    audio.setMuted(next)
    setMuted(next)
  }

  return { audio, muted, toggleMute }
}
