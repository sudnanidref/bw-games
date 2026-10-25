import { afterEach, describe, expect, it, vi } from 'vitest'
import { playCring } from './effects'

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('local success sound', () => {
  it('synthesizes a 370 ms sine sweep without a sound file', () => {
    const frequency = {
      setValueAtTime: vi.fn(),
      linearRampToValueAtTime: vi.fn(),
    }
    const oscillator = {
      type: 'sine', frequency, connect: vi.fn(), start: vi.fn(), stop: vi.fn(), onended: null,
    } as unknown as OscillatorNode
    const gainParam = {
      setValueAtTime: vi.fn(),
      linearRampToValueAtTime: vi.fn(),
      exponentialRampToValueAtTime: vi.fn(),
    }
    const gain = { gain: gainParam, connect: vi.fn() } as unknown as GainNode
    class FakeAudioContext {
      currentTime = 2
      destination = {} as AudioNode
      state: AudioContextState = 'running'
      createOscillator = vi.fn(() => oscillator)
      createGain = vi.fn(() => gain)
      resume = vi.fn(async () => undefined)
      close = vi.fn(async () => undefined)
    }
    vi.stubGlobal('AudioContext', FakeAudioContext)

    expect(playCring()).toBe(true)
    expect(oscillator.type).toBe('sine')
    expect(frequency.setValueAtTime).toHaveBeenCalledWith(1_320, 2)
    expect(frequency.linearRampToValueAtTime).toHaveBeenNthCalledWith(1, 1_760, 2.18)
    expect(frequency.linearRampToValueAtTime).toHaveBeenNthCalledWith(2, 1_320, 2.37)
    expect(gainParam.linearRampToValueAtTime).toHaveBeenCalledWith(0.16, 2.03)
    expect(oscillator.start).toHaveBeenCalledWith(2)
    expect(oscillator.stop).toHaveBeenCalledWith(2.37)
  })

  it('fails quietly when browser audio is unavailable', () => {
    vi.stubGlobal('AudioContext', undefined)
    expect(playCring()).toBe(false)
  })
})