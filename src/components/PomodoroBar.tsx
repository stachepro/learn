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
  const fillColor = isWork ? '#c0432e' : '#2f7d44'
  const labelColor = isWork ? '#e08a6a' : '#5fb070'

  const relaunch = () => {
    if (isFree) startFree()
    else if (activeHabitId) startPomodoro(activeHabitId)
  }

  const iconBtn = 'btn-press w-9 h-9 rounded-xl flex items-center justify-center'

  return (
    <div
      className="animate-slide-bar fixed bottom-16 sm:bottom-0 left-0 right-0 z-30"
      style={{
        background: 'rgba(48,62,77,0.82)',
        backdropFilter: 'blur(24px) saturate(150%)',
        WebkitBackdropFilter: 'blur(24px) saturate(150%)',
        borderTop: '1px solid rgba(255,255,255,0.16)',
        boxShadow: '0 -8px 28px -14px rgba(15,30,46,0.7)',
      }}
    >
      {/* Progress bar */}
      <div className="relative h-[3px]" style={{ background: 'rgba(255,255,255,0.14)' }}>
        <div
          className="progress-fill absolute inset-y-0 left-0 rounded-r-full"
          style={{ width: `${progress}%`, background: fillColor, boxShadow: `0 0 10px ${fillColor}` }}
        />
      </div>

      <div className="max-w-3xl mx-auto px-5 py-3 flex items-center gap-5">
        {/* Left: identity */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <span className="text-2xl flex-shrink-0 leading-none">
            {isFree ? '🧘' : (habit?.emoji ?? '🍅')}
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold truncate leading-tight" style={{ color: '#f1f5f5' }}>
              {isFree ? 'Serbest Çalışma' : (habit?.name ?? '')}
            </p>
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] leading-tight mt-0.5" style={{ color: labelColor }}>
              {isDone ? 'Mola Bitti' : isWork ? 'Odak' : 'Mola'} · {sessionCount} tamamlandı
            </p>
          </div>
        </div>

        {/* Center: time */}
        <div className="flex-shrink-0 tnum text-2xl font-mono font-bold" style={{ color: isDone ? labelColor : '#f1f5f5' }}>
          {isDone ? '✓' : formatSeconds(secondsLeft)}
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {(isWork || isBreak) && (
            <button
              onClick={pauseResume}
              aria-label={isPaused ? 'Devam et' : 'Duraklat'}
              className={iconBtn}
              style={{ background: 'rgba(255,255,255,0.85)', color: '#21303d' }}
            >
              {isPaused ? <PlayIcon /> : <PauseIcon />}
            </button>
          )}

          {isDone && (
            <button
              onClick={relaunch}
              className="btn-press h-9 px-4 rounded-xl text-xs font-bold"
              style={{ background: '#c0432e', color: '#fff5f2' }}
            >
              Yeni Oturum
            </button>
          )}

          {(isBreak || isDone) && (
            <button
              onClick={skipBreak}
              aria-label="Molayı atla"
              className={iconBtn}
              style={{ background: 'rgba(255,255,255,0.18)', color: 'rgba(241,245,245,0.7)' }}
              title="Molayı atla"
            >
              <SkipIcon />
            </button>
          )}

          <button
            onClick={stopTimer}
            aria-label="Durdur"
            className={iconBtn}
            style={{ background: 'rgba(192,67,46,0.9)', color: '#fff5f2' }}
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
  <svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor">
    <path d="M4 2.5l10 5.5-10 5.5V2.5z" />
  </svg>
)
const PauseIcon = () => (
  <svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor">
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
