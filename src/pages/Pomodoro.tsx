import { useState, useEffect } from 'react'
import { useApp } from '../context/AppContext'
import { usePomodoro } from '../context/PomodoroContext'
import { todayStr, formatSeconds } from '../utils/date'

export default function Pomodoro() {
  const { pomodoroSettings, freeSessions } = useApp()
  const {
    phase, secondsLeft, totalSeconds, sessionCount,
    isPaused, isFree, soundEnabled,
    startFree, pauseResume, startBreak, skipBreak, stopTimer, finishEarly, toggleSound,
  } = usePomodoro()
  const [confirmEarly, setConfirmEarly] = useState(false)

  // Reset confirmation when phase changes
  useEffect(() => { setConfirmEarly(false) }, [phase])

  // A non-free habit Pomodoro is occupying the shared timer
  const otherActive = phase !== 'idle' && !isFree

  const isWork = isFree && phase === 'work'
  const isBreak = isFree && phase === 'break'
  const isWorkDone = isFree && phase === 'work-done'
  const isDone = isFree && phase === 'break-done'
  const running = isWork || isBreak || isWorkDone || isDone

  const today = todayStr()
  const todayCount = freeSessions.filter((s) => s.date === today).length

  const progress = totalSeconds > 0 ? ((totalSeconds - secondsLeft) / totalSeconds) * 100 : 0
  const accent = isWork ? '#f97316' : '#22c55e'
  const accentDark = isWork ? '#c2410c' : '#15803d'

  // SVG ring geometry
  const R = 86
  const C = 2 * Math.PI * R
  const showRingProgress = isWork || isBreak
  const dash = showRingProgress ? C * (1 - progress / 100) : C

  const phaseLabel = isWorkDone ? 'Çalışma Bitti' : isDone ? 'Mola Bitti' : isWork ? 'Odak' : isBreak ? 'Mola' : ''

  return (
    <div className="max-w-sm mx-auto px-4 pt-6 pb-40">
      {/* Header */}
      <div className="mb-6 text-center">
        <h1 className="display text-2xl font-extrabold tracking-tight" style={{ color: '#1a1726' }}>
          Pomodoro
        </h1>
        <p className="text-xs mt-1" style={{ color: 'rgba(26,23,38,0.45)' }}>
          Serbest odak · {pomodoroSettings.workDuration} dk seans
        </p>
      </div>

      {otherActive ? (
        /* Another (habit) Pomodoro is running on the shared timer */
        <div
          className="glass g-neutral rounded-2xl px-5 py-8 text-center space-y-2 animate-fade-up"
          style={{ border: '1px solid rgba(26,23,38,0.1)' }}
        >
          <p className="text-3xl leading-none">⏳</p>
          <p className="text-sm font-semibold" style={{ color: '#1a1726' }}>
            Şu anda başka bir Pomodoro çalışıyor
          </p>
          <p className="text-xs" style={{ color: 'rgba(26,23,38,0.5)' }}>
            Serbest seans başlatmak için önce aktif seansı bitir.
          </p>
        </div>
      ) : (
        <>
          {/* Timer ring */}
          <div className="flex flex-col items-center">
            <div className="relative" style={{ width: 200, height: 200 }}>
              <svg width="200" height="200" viewBox="0 0 200 200" className="-rotate-90">
                <circle
                  cx="100" cy="100" r={R}
                  fill="none"
                  stroke="rgba(26,23,38,0.07)"
                  strokeWidth="10"
                />
                {showRingProgress && (
                  <circle
                    cx="100" cy="100" r={R}
                    fill="none"
                    stroke={accent}
                    strokeWidth="10"
                    strokeLinecap="round"
                    strokeDasharray={C}
                    strokeDashoffset={dash}
                    style={{
                      transition: 'stroke-dashoffset 1s linear',
                      filter: `drop-shadow(0 0 6px ${accent}aa)`,
                    }}
                  />
                )}
              </svg>
              {/* Center content */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                {running ? (
                  <>
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: accentDark }}>
                      {phaseLabel}
                    </span>
                    <span
                      className="tnum text-5xl font-mono font-bold leading-none mt-1"
                      style={{ color: '#1a1726' }}
                    >
                      {(isWorkDone || isDone) ? '✓' : formatSeconds(secondsLeft)}
                    </span>
                  </>
                ) : (
                  <>
                    <span className="text-4xl leading-none">🧘</span>
                    <span className="text-xs mt-2 font-semibold" style={{ color: 'rgba(26,23,38,0.5)' }}>
                      Hazır
                    </span>
                  </>
                )}
              </div>
            </div>

            {running && (
              <p className="text-[11px] font-semibold mt-3" style={{ color: 'rgba(26,23,38,0.5)' }}>
                {sessionCount} seans tamamlandı · {isPaused ? 'Durakladı' : 'Devam ediyor'}
              </p>
            )}
          </div>

          {/* Controls */}
          <div className="mt-8 space-y-3">
            {phase === 'idle' && (
              <button
                onClick={startFree}
                className="btn-press w-full py-3.5 rounded-2xl text-sm font-bold"
                style={{ background: 'rgba(34,197,94,0.9)', color: '#06210f' }}
              >
                Başlat
              </button>
            )}

            {(isWork || isBreak) && (
              <div className="flex gap-2">
                <button
                  onClick={pauseResume}
                  className="btn-press flex-1 py-3 rounded-2xl text-sm font-bold"
                  style={{
                    background: isPaused ? 'rgba(34,197,94,0.9)' : 'rgba(26,23,38,0.07)',
                    color: isPaused ? '#06210f' : '#1a1726',
                  }}
                >
                  {isPaused ? '▶ Devam Et' : '⏸ Duraklat'}
                </button>
                {isBreak && (
                  <button
                    onClick={skipBreak}
                    className="ctrl btn-press px-4 py-3 rounded-2xl text-xs font-semibold flex-shrink-0"
                  >
                    Molayı Atla
                  </button>
                )}
              </div>
            )}

            {isWorkDone && (
              <button
                onClick={startBreak}
                className="btn-press w-full py-3.5 rounded-2xl text-sm font-bold"
                style={{ background: 'rgba(34,197,94,0.9)', color: '#06210f' }}
              >
                Mola Başlat
              </button>
            )}

            {isDone && (
              <button
                onClick={skipBreak}
                className="btn-press w-full py-3.5 rounded-2xl text-sm font-bold"
                style={{ background: '#f97316', color: '#fff5f2' }}
              >
                Çalışmaya Başla
              </button>
            )}

            {/* Early finish (work only) */}
            {isWork && (
              confirmEarly ? (
                <div className="flex gap-2 items-center animate-fade-up">
                  <button
                    onClick={() => { finishEarly(); setConfirmEarly(false) }}
                    className="btn-press flex-1 py-3 rounded-2xl text-sm font-bold"
                    style={{ background: 'rgba(34,197,94,0.9)', color: '#06210f' }}
                  >
                    Evet, Tamamla
                  </button>
                  <button
                    onClick={() => setConfirmEarly(false)}
                    className="ctrl btn-press px-4 py-3 rounded-2xl text-xs font-semibold flex-shrink-0"
                  >
                    Vazgeç
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmEarly(true)}
                  className="btn-press w-full py-3 rounded-2xl text-xs font-bold"
                  style={{
                    background: 'rgba(34,197,94,0.16)',
                    color: '#15803d',
                    boxShadow: 'inset 0 0 0 1px rgba(34,197,94,0.4)',
                  }}
                >
                  ✓ Erken Bitir
                </button>
              )
            )}

            {/* Secondary row: sound + cancel */}
            {running && (
              <div className="flex gap-2">
                <button
                  onClick={toggleSound}
                  className="ctrl btn-press flex-1 py-2.5 rounded-2xl text-xs font-semibold"
                >
                  {soundEnabled ? '🔔 Ses açık' : '🔕 Ses kapalı'}
                </button>
                <button
                  onClick={stopTimer}
                  className="btn-press flex-1 py-2.5 rounded-2xl text-xs font-bold"
                  style={{ background: 'rgba(225,90,60,0.14)', color: '#b3422a', boxShadow: 'inset 0 0 0 1px rgba(225,90,60,0.35)' }}
                >
                  İptal Et
                </button>
              </div>
            )}
          </div>

          {/* Today's free sessions */}
          <div className="flex items-center justify-center gap-8 py-6 mt-2">
            <div className="text-center">
              <p className="text-2xl font-bold tnum" style={{ color: '#1a1726' }}>{todayCount}</p>
              <p className="text-[10px] font-bold uppercase tracking-[0.15em] mt-1" style={{ color: 'rgba(26,23,38,0.45)' }}>
                Bugünkü Seans
              </p>
            </div>
            <div className="w-px h-8" style={{ background: 'rgba(26,23,38,0.07)' }} />
            <div className="text-center">
              <p className="text-2xl font-bold tnum" style={{ color: '#1a1726' }}>{freeSessions.length}</p>
              <p className="text-[10px] font-bold uppercase tracking-[0.15em] mt-1" style={{ color: 'rgba(26,23,38,0.45)' }}>
                Toplam Seans
              </p>
            </div>
          </div>

          <p className="text-center text-[11px]" style={{ color: 'rgba(26,23,38,0.4)' }}>
            Her tamamlanan serbest seans 10 XP kazandırır.
          </p>
        </>
      )}
    </div>
  )
}
