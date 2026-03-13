// Audio melody using Web Audio API — works fully offline
let audioCtx: AudioContext | null = null

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    audioCtx = new AudioContext()
  }
  return audioCtx
}

function playNote(ctx: AudioContext, frequency: number, startTime: number, duration: number) {
  const oscillator = ctx.createOscillator()
  const gain = ctx.createGain()

  oscillator.type = 'sine'
  oscillator.frequency.value = frequency
  gain.gain.value = 0.5

  oscillator.connect(gain)
  gain.connect(ctx.destination)

  oscillator.start(startTime)
  const fadeOut = 0.05
  gain.gain.setValueAtTime(0.5, startTime)
  gain.gain.setValueAtTime(0.5, startTime + duration - fadeOut)
  gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration)
  oscillator.stop(startTime + duration)
}

const MELODY: { freq: number; duration: number }[] = [
  { freq: 587.33, duration: 0.3 },   // D5
  { freq: 783.99, duration: 0.45 },  // G5
  { freq: 739.99, duration: 0.15 },  // F#5
  { freq: 659.25, duration: 0.3 },   // E5
  { freq: 783.99, duration: 0.3 },   // G5
]

export function playEndMelody() {
  const ctx = getAudioContext()
  let time = ctx.currentTime
  for (const note of MELODY) {
    playNote(ctx, note.freq, time, note.duration)
    time += note.duration
  }
}
