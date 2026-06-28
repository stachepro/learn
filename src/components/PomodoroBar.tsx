import { usePomodoro } from '../context/PomodoroContext'
import { useApp } from '../context/AppContext'
import { formatSeconds } from '../utils/date'

export default function PomodoroBar() {
  const {
    activeHabitId, phase, secondsLeft, totalSeconds, sessionCount,
    isVisible, isPaused, isFree, pauseResume, skipBreak, stopTimer, startPomodoro, startFree,
  } = usePomodoro()
  const { habits } = useApp()

  const isActive = phase !== 'idle' && activeHabitId !== null
  if (!isActive || !isVisible) return null

  const habit = isFree ? null : habits.find((h) => h.id === activeHabitId)
  const isWork = phase === 'work'
  const isBreak = phase === 'break'
  const isDone = phase === 'break-done'

  const progress = totalSeconds > 0 ? ((totalSeconds - secondsLeft) / totalSeconds) * 100 : 0
  const fillColor = isWork ? '#ef4444' : '#22c55e'

  const relaunch = () => {
    if (isFree) startFree()
    else if (activeHabitId) startPomodoro(activeHabitId)
  }

  return (
    <div
      className="animate-slide-bar fixed bottom-14 sm:bottom-0 left-0 right-0 z-30"
      style={{
        background: 'rgba(3, 8, 44, 0.93)',
        backdropFilter: 'blur(32px) saturate(190%)',
        WebkitBackdropFilter: 'blur(32px) saturate(190%)',
        borderTop: '1px solid rgba(60,110,255,0.25)',
        boxShadow: '0 -8px 32px rgba(0,8,70,0.5), inset 0 1px 0 rgba(80,150,255,0.15)',
      }}
    >
      {/* Progress bar */}
      <div className="relative h-[3px]" style={{ background: 'rgba(255,255,255,0.07)' }}>
        <div
          className="pomo-progress-fill absolute inset-y-0 left-0 rounded-r-full"
          style={{ width: `${progress}%`, background: fillColor, boxShadow: `0 0 8px ${fillColor}80` }}
        />
      </div>

      <div className="max-w-3xl mx-auto px-5 py-3 flex items-center gap-5">
        {/* Left: identity */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <span className="text-2xl flex-shrink-0 leading-none">
            {isFree ? '🧘' : (habit?.emoji ?? '🍅')}
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-txt truncate leading-tight">
              {isFree ? 'Serbest Çalışma' : (habit?.name ?? '')}
            </p>
            <p
              className="text-[10px] font-bold uppercase tracking-widest leading-tight mt-0.5"
              style={{ color: fillColor }}
            >
              {isDone ? 'Mola Bitti' : isWork ? 'Odak' : 'Mola'} · {sessionCount} tamamlandı
            </p>
          </div>
        </div>

        {/* Center: time */}
        <div className="flex-shrink-0 tabular-nums text-2xl font-mono font-bold" style={{ color: isDone ? fillColor : '#e8e8f4' }}>
          {isDone ? '✓' : formatSeconds(secondsLeft)}
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {(isWork || isBreak) && (
            <button
              onClick={pauseResume}
              className="btn-press w-9 h-9 rounded-xl flex items-center justify-center transition-all"
              style={{ background: 'rgba(20,50,140,0.55)', border: '1px solid rgba(70,135,255,0.28)', boxShadow: 'inset 0 1px 0 rgba(120,185,255,0.18)' }}
            >
              {isPaused ? <PlayIcon /> : <PauseIcon />}
            </button>
          )}

          {isDone && (
            <button
              onClick={relaunch}
              className="btn-press h-9 px-4 rounded-xl text-xs font-bold"
              style={{ background: 'rgba(239,68,68,0.2)', color: '#fca5a5', border: '1px solid rgba(239,68,68,0.35)' }}
            >
              Yeni Oturum
            </button>
          )}

          {(isBreak || isDone) && (
            <button
              onClick={skipBreak}
              className="btn-press w-9 h-9 rounded-xl flex items-center justify-center transition-all"
              style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.4)' }}
              title="Molayı atla"
            >
              <SkipIcon />
            </button>
          )}

          <button
            onClick={stopTimer}
            className="btn-press w-9 h-9 rounded-xl flex items-center justify-center transition-all"
            style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(239,68,68,0.4)' }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#ef4444')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(239,68,68,0.4)')}
            title="Durdur"
          >
            <StopIcon />
          </button>
        </div>
      </div>
    </div>
  )
}

const PlayIcon = () => (
  <svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor" style={{ color: 'rgba(255,255,255,0.7)' }}>
    <path d="M4 2.5l10 5.5-10 5.5V2.5z" />
  </svg>
)
const PauseIcon = () => (
  <svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor" style={{ color: 'rgba(255,255,255,0.7)' }}>
    <rect x="3" y="2" width="4" height="12" rx="1" />
    <rect x="9" y="2" width="4" height="12" rx="1" />
  </svg>
)
const SkipIcon = () => (
  <svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor">
    <path d="M3 2.5l8 5.5-8 5.5V2.5zM13 2h1.5v12H13V2z" />
  </svg>
)
const StopIcon = () => (
  <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
    <rect x="2" y="2" width="12" height="12" rx="2" />
  </svg>
)
