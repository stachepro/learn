// Shared AudioContext — reused across calls instead of leaking a new one per play.
let sharedCtx: AudioContext | null = null

function getCtx(): AudioContext | null {
  try {
    if (!sharedCtx) sharedCtx = new AudioContext()
    if (sharedCtx.state === 'suspended') void sharedCtx.resume()
    return sharedCtx
  } catch {
    return null
  }
}

// Plays a soft bell chord `repeat` times in quick succession (gap seconds apart).
export function playBell(repeat = 1, gap = 0.6) {
  const ctx = getCtx()
  if (!ctx) return
  // A major chord: A5, C#6, E6 — yumuşak çan sesi
  const notes = [880, 1108.73, 1318.51]
  for (let r = 0; r < repeat; r++) {
    const base = ctx.currentTime + r * gap
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.type = 'sine'
      osc.frequency.value = freq
      const t = base + i * 0.12
      gain.gain.setValueAtTime(0, t)
      gain.gain.linearRampToValueAtTime(0.22 / (i + 1), t + 0.015)
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 2.2)
      osc.start(t)
      osc.stop(t + 2.3)
    })
  }
}

// Short, soft confirmation blip for button taps.
export function playConfirm() {
  const ctx = getCtx()
  if (!ctx) return
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.connect(gain)
  gain.connect(ctx.destination)
  osc.type = 'sine'
  osc.frequency.value = 720
  const t = ctx.currentTime
  gain.gain.setValueAtTime(0, t)
  gain.gain.linearRampToValueAtTime(0.18, t + 0.01)
  gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.18)
  osc.start(t)
  osc.stop(t + 0.2)
}
