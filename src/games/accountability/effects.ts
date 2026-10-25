export function playCring(): boolean {
  try {
    const AudioContextConstructor = globalThis.AudioContext
    if (typeof AudioContextConstructor !== 'function') return false
    const context = new AudioContextConstructor()
    const startAt = context.currentTime
    const endAt = startAt + 0.37
    const oscillator = context.createOscillator()
    const gain = context.createGain()

    oscillator.type = 'sine'
    oscillator.frequency.setValueAtTime(1_320, startAt)
    oscillator.frequency.linearRampToValueAtTime(1_760, startAt + 0.18)
    oscillator.frequency.linearRampToValueAtTime(1_320, endAt)
    gain.gain.setValueAtTime(0.0001, startAt)
    gain.gain.linearRampToValueAtTime(0.16, startAt + 0.03)
    gain.gain.exponentialRampToValueAtTime(0.0001, endAt)
    oscillator.connect(gain)
    gain.connect(context.destination)
    oscillator.onended = () => { void context.close().catch(() => undefined) }
    oscillator.start(startAt)
    oscillator.stop(endAt)
    if (context.state === 'suspended') void context.resume().catch(() => undefined)
    return true
  } catch {
    return false
  }
}