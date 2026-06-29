import type { CSSProperties } from 'react'
import { usePomodoro } from '../context/PomodoroContext'

type Edge = 'top' | 'bottom' | 'left' | 'right'

const ANIM: Record<Edge, string> = {
  top: 'pom-from-top',
  bottom: 'pom-from-bottom',
  left: 'pom-from-left',
  right: 'pom-from-right',
}

const PARTICLES: { edge: Edge; pos: number; size: number; dur: number; delay: number }[] = [
  { edge: 'top',    pos: 12, size: 3, dur: 3.5, delay: 0.0 },
  { edge: 'top',    pos: 38, size: 2, dur: 4.2, delay: 1.4 },
  { edge: 'top',    pos: 65, size: 3, dur: 3.8, delay: 2.8 },
  { edge: 'top',    pos: 85, size: 2, dur: 5.0, delay: 0.7 },
  { edge: 'bottom', pos: 22, size: 2, dur: 4.5, delay: 1.0 },
  { edge: 'bottom', pos: 50, size: 3, dur: 3.3, delay: 3.2 },
  { edge: 'bottom', pos: 80, size: 2, dur: 4.8, delay: 0.4 },
  { edge: 'left',   pos: 28, size: 3, dur: 3.9, delay: 2.0 },
  { edge: 'left',   pos: 62, size: 2, dur: 4.4, delay: 0.9 },
  { edge: 'right',  pos: 35, size: 3, dur: 3.6, delay: 1.7 },
  { edge: 'right',  pos: 72, size: 2, dur: 4.1, delay: 3.6 },
]

function particleStyle(p: typeof PARTICLES[number]): CSSProperties {
  const base: CSSProperties = {
    position: 'fixed',
    width: p.size,
    height: p.size,
    borderRadius: '50%',
    background: 'rgba(34,197,94,0.9)',
    boxShadow: '0 0 6px 2px rgba(34,197,94,0.55)',
    willChange: 'transform, opacity',
    animation: `${ANIM[p.edge]} ${p.dur}s ease-in-out ${p.delay}s infinite`,
  }
  if (p.edge === 'top')    return { ...base, top: 0,    left: `${p.pos}%` }
  if (p.edge === 'bottom') return { ...base, bottom: 0, left: `${p.pos}%` }
  if (p.edge === 'left')   return { ...base, left: 0,   top:  `${p.pos}%` }
  return                          { ...base, right: 0,  top:  `${p.pos}%` }
}

export default function PomodoroAmbience() {
  const { phase } = usePomodoro()
  if (phase !== 'work') return null

  return (
    <div className="fixed inset-0 pointer-events-none z-20" aria-hidden>
      <div className="absolute inset-0 pom-edge-glow" />
      {PARTICLES.map((p, i) => <div key={i} style={particleStyle(p)} />)}
    </div>
  )
}
