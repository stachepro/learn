import type { CSSProperties } from 'react'
import type { PomodoroVisualState } from '../../utils/pomodoroView'

const SIZE = 320
const CENTER = SIZE / 2
const RADIUS = 132
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

export default function PomodoroDial({
  progress,
  state,
  time,
  label,
  sessionLabel,
}: {
  progress: number
  state: PomodoroVisualState
  time: string
  label: string
  sessionLabel?: string
}) {
  const normalized = Math.min(1, Math.max(0, progress))
  const complete = state === 'work-complete' || state === 'break-complete'

  return (
    <div className={`pomodoro-dial pomodoro-dial--${state}`} style={{ '--pomodoro-progress': normalized } as CSSProperties}>
      <div className="pomodoro-dial__halo" aria-hidden />
      <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="pomodoro-dial__svg" aria-hidden>
        <circle className="pomodoro-dial__track" cx={CENTER} cy={CENTER} r={RADIUS} />
        <circle
          className="pomodoro-dial__progress"
          cx={CENTER}
          cy={CENTER}
          r={RADIUS}
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={CIRCUMFERENCE * (1 - (complete ? 1 : normalized))}
        />
        {Array.from({ length: 12 }, (_, index) => {
          const angle = (index / 12) * Math.PI * 2 - Math.PI / 2
          const inner = RADIUS + 13
          const outer = RADIUS + 19
          return (
            <line
              key={index}
              className="pomodoro-dial__marker"
              x1={CENTER + Math.cos(angle) * inner}
              y1={CENTER + Math.sin(angle) * inner}
              x2={CENTER + Math.cos(angle) * outer}
              y2={CENTER + Math.sin(angle) * outer}
            />
          )
        })}
      </svg>

      <div className="pomodoro-dial__center">
        <span className="pomodoro-dial__state"><i aria-hidden />{label}</span>
        <strong key={`${state}-${time}`} className={complete ? 'pomodoro-dial__complete' : ''}>
          {complete ? '✓' : time}
        </strong>
        {sessionLabel && <small>{sessionLabel}</small>}
      </div>
    </div>
  )
}
