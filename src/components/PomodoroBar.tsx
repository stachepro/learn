import { useState, useEffect } from 'react'
import { usePomodoro } from '../context/PomodoroContext'
import { useApp } from '../context/AppContext'
import { formatSeconds } from '../utils/date'

export default function PomodoroBar() {
  const {
    activeHabitId, phase, secondsLeft, totalSeconds, sessionCount,
    isVisible, isPaused, isFree, soundEnabled,
    pauseResume, startBreak, skipBreak, stopTimer, toggleSound,
    finishEarly,
  } = usePomodoro()
  const { habits } = useApp()
  const [confirmEarly, setConfirmEarly] = useState(false)

  // Reset confirmation when phase changes
  useEffect(() => { setConfirmEarly(false) }, [phase])

  const isActive = phase !== 'idle' && activeHabitId !== null
  if (!isActive || !isVisible) return null

  const habit = isFree ? null : habits.find((h) => h.id === activeHabitId)
  const isWork = phase === 'work'
  const isBreak = phase === 'break'
  const isWorkDone = phase === 'work-done'
  const isDone = phase === 'break-done'

  const progress = totalSeconds > 0 ? ((totalSeconds - secondsLeft) / totalSeconds) * 100 : 0
  const fillColor = isWork ? '#f97316' : '#22c55e'
  const labelColor = isWork ? '#c2410c' : '#15803d'

  const iconBtn = 'btn-press w-9 h-9 rounded-xl flex items-center justify-center'

  return (
    <div
      className="animate-slide-bar fixed bottom-20 sm:bottom-0 left-0 right-0 z-30"
      style={{
        background: 'rgba(251,247,240,0.96)',
        backdropFilter: 'blur(24px) saturate(150%)',
        WebkitBackdropFilter: 'blur(24px) saturate(150%)',
        borderTop: '1px solid rgba(26,23,38,0.08)',
        boxShadow: '0 -10px 30px -16px rgba(26,23,38,0.4)',
      }}
    >
      {/* Progress bar */}
      <div className="relative h-[3px]" style={{ background: 'rgba(26,23,38,0.08)' }}>
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
            <p className="text-sm font-semibold truncate leading-tight" style={{ color: '#1a1726' }}>
              {isFree ? 'Serbest Çalışma' : (habit?.name ?? '')}
            </p>
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] leading-tight mt-0.5" style={{ color: labelColor }}>
              {isWorkDone ? 'Çalışma Bitti' : isDone ? 'Mola Bitti' : isWork ? 'Odak' : 'Mola'} · {sessionCount} tamamlandı
            </p>
          </div>
        </div>

        {/* Center: time */}
        <div className="flex-shrink-0 tnum text-2xl font-mono font-bold" style={{ color: (isWorkDone || isDone) ? labelColor : '#1a1726' }}>
          {(isWorkDone || isDone) ? '✓' : formatSeconds(secondsLeft)}
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {confirmEarly ? (
            <>
              <span className="text-xs font-semibold hidden sm:block" style={{ color: 'rgba(26,23,38,0.55)' }}>
                Emin misin?
              </span>
              <button
                onClick={() => { finishEarly(); setConfirmEarly(false) }}
                className="btn-press h-9 px-3 rounded-xl text-xs font-bold"
                style={{ background: 'rgba(34,197,94,0.9)', color: '#06210f' }}
              >
                Evet, Tamamla
              </button>
              <button
                onClick={() => setConfirmEarly(false)}
                className={`ctrl ${iconBtn}`}
                aria-label="Devam et"
                title="Hayır, devam et"
              >
                <XIcon />
              </button>
            </>
          ) : (
            <>
              {(isWork || isBreak) && (
                <button
                  onClick={pauseResume}
                  aria-label={isPaused ? 'Devam et' : 'Duraklat'}
                  className={iconBtn}
                  style={{ background: 'rgb(34,197,94)', color: '#06210f' }}
                >
                  {isPaused ? <PlayIcon /> : <PauseIcon />}
                </button>
              )}

              {isWork && (
                <button
                  onClick={() => setConfirmEarly(true)}
                  aria-label="Erken Bitir"
                  title="Erken Bitir"
                  className={iconBtn}
                  style={{
                    background: 'rgba(34,197,94,0.16)',
                    color: '#15803d',
                    boxShadow: 'inset 0 0 0 1px rgba(34,197,94,0.4)',
                  }}
                >
                  <CheckIcon />
                </button>
              )}

              {isWorkDone && (
                <button
                  onClick={startBreak}
                  className="btn-press h-9 px-4 rounded-xl text-xs font-bold"
                  style={{ background: '#22c55e', color: '#06210f' }}
                >
                  Mola Başlat
                </button>
              )}

              {isDone && (
                <button
                  onClick={skipBreak}
                  className="btn-press h-9 px-4 rounded-xl text-xs font-bold"
                  style={{ background: '#f97316', color: '#fff5f2' }}
                >
                  Çalışmaya Başla
                </button>
              )}

              {isBreak && (
                <button
                  onClick={skipBreak}
                  aria-label="Molayı atla"
                  className={`ctrl ${iconBtn}`}
                  title="Molayı atla"
                >
                  <SkipIcon />
                </button>
              )}

              <button
                onClick={toggleSound}
                aria-label={soundEnabled ? 'Sesi kapat' : 'Sesi aç'}
                className={`ctrl ${iconBtn}`}
                title={soundEnabled ? 'Sesi kapat' : 'Sesi aç'}
              >
                {soundEnabled ? <BellIcon /> : <BellOffIcon />}
              </button>

              <button
                onClick={stopTimer}
                aria-label="Durdur"
                className={iconBtn}
                style={{ background: 'rgba(225,90,60,0.92)', color: '#fff5f2' }}
                title="Durdur"
              >
                <StopIcon />
              </button>
            </>
          )}
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
const CheckIcon = () => (
  <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="2 8 6.5 12.5 14 4" />
  </svg>
)
const XIcon = () => (
  <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <line x1="3" y1="3" x2="13" y2="13" />
    <line x1="13" y1="3" x2="3" y2="13" />
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
const BellIcon = () => (
  <svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor">
    <path d="M8 1a1 1 0 0 1 1 1v.5A4.5 4.5 0 0 1 12.5 7v2.5l1 1.5H2.5l1-1.5V7A4.5 4.5 0 0 1 7 2.5V2a1 1 0 0 1 1-1zm0 13a2 2 0 0 0 2-2H6a2 2 0 0 0 2 2z" />
  </svg>
)
const BellOffIcon = () => (
  <svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor" opacity="0.45">
    <path d="M8 1a1 1 0 0 1 1 1v.5A4.5 4.5 0 0 1 12.5 7v2.5l1 1.5H2.5l1-1.5V7A4.5 4.5 0 0 1 7 2.5V2a1 1 0 0 1 1-1zm0 13a2 2 0 0 0 2-2H6a2 2 0 0 0 2 2z" />
    <line x1="1" y1="1" x2="15" y2="15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
)
