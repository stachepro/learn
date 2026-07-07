import { useState, useEffect } from 'react'
import { usePomodoro } from '../context/PomodoroContext'
import { useApp } from '../context/AppContext'
import { formatSeconds } from '../utils/date'

/* ════════════════════════════════════════════════
   POMODORO BAR — koyu, yüzen mini-player.
   Üstte ilerleme çizgisi; solda halka içinde emoji,
   ortada faz + süre, altta müzik çaları andıran
   simetrik kontrol dizisi. Sağ üstteki genişletme
   butonu masa saati odak moduna geçirir.
   ════════════════════════════════════════════════ */

export default function PomodoroBar() {
  const {
    activeHabitId, phase, secondsLeft, totalSeconds, sessionCount,
    isVisible, isPaused, isFree, soundEnabled, isFocusMode,
    pauseResume, startBreak, skipBreak, stopTimer, toggleSound, toggleFocusMode,
    finishEarly,
  } = usePomodoro()
  const { habits } = useApp()
  const [confirmEarly, setConfirmEarly] = useState(false)

  // Faz değişince onay durumunu sıfırla
  useEffect(() => { setConfirmEarly(false) }, [phase])

  const isActive = phase !== 'idle' && activeHabitId !== null
  if (!isActive || !isVisible || isFocusMode) return null

  const habit = isFree ? null : habits.find((h) => h.id === activeHabitId)
  const isWork = phase === 'work'
  const isBreak = phase === 'break'
  const isWorkDone = phase === 'work-done'
  const isDone = phase === 'break-done'
  const waiting = isWorkDone || isDone

  const progress = totalSeconds > 0 ? ((totalSeconds - secondsLeft) / totalSeconds) * 100 : 0
  // Koyu zeminde canlı vurgular: odak = turuncu, mola = yeşil
  const accent = isWork || isDone ? '#fb923c' : '#4ade80'
  const accentGlow = isWork || isDone ? 'rgba(251,146,60,' : 'rgba(74,222,128,'

  // Emoji halkası geometrisi
  const RR = 19
  const RC = 2 * Math.PI * RR

  const ghost: React.CSSProperties = {
    width: 38, height: 38, borderRadius: 13,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.1)',
    color: 'rgba(255,255,255,0.72)',
  }

  return (
    <div className="animate-slide-bar fixed left-3 right-3 z-30 bottom-[calc(5rem+env(safe-area-inset-bottom)+0.6rem)] sm:bottom-4 sm:left-1/2 sm:right-auto sm:-translate-x-1/2 sm:w-[30rem]">
      <div
        className="rounded-[24px] overflow-hidden"
        style={{
          background: 'linear-gradient(155deg, #232030 0%, #17141f 55%, #131019 100%)',
          border: '1px solid rgba(255,255,255,0.09)',
          boxShadow: `0 18px 44px -14px rgba(10,8,20,0.7), 0 0 24px -8px ${accentGlow}0.25)`,
        }}
      >
        {/* İnce ilerleme çizgisi */}
        <div className="relative h-[3px]" style={{ background: 'rgba(255,255,255,0.07)' }}>
          <div
            className="progress-fill absolute inset-y-0 left-0 rounded-r-full"
            style={{ width: `${progress}%`, background: accent, boxShadow: `0 0 10px ${accentGlow}0.9)` }}
          />
        </div>

        {/* Üst satır: kimlik + süre */}
        <div className="flex items-center gap-3 px-4 pt-2.5 pb-1">
          {/* Halka içinde emoji */}
          <div className="relative flex-shrink-0" style={{ width: 44, height: 44 }}>
            <svg width="44" height="44" viewBox="0 0 44 44" className="-rotate-90">
              <circle cx="22" cy="22" r={RR} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="2.5" />
              <circle
                cx="22" cy="22" r={RR}
                fill="none" stroke={accent} strokeWidth="2.5" strokeLinecap="round"
                strokeDasharray={RC} strokeDashoffset={RC * (1 - progress / 100)}
                style={{ transition: 'stroke-dashoffset 1s linear, stroke 0.4s ease' }}
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-lg leading-none">
              {isFree ? '🧘' : (habit?.emoji ?? '🍅')}
            </span>
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-semibold truncate leading-tight" style={{ color: '#f2f0f7' }}>
              {isFree ? 'Serbest Çalışma' : (habit?.name ?? '')}
            </p>
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] leading-tight mt-0.5" style={{ color: accent }}>
              {isWorkDone ? 'Çalışma Bitti' : isDone ? 'Mola Bitti' : isWork ? (isPaused ? 'Durakladı' : 'Odak') : (isPaused ? 'Durakladı' : 'Mola')}
              <span style={{ color: 'rgba(255,255,255,0.3)' }}> · {sessionCount} seans</span>
            </p>
          </div>

          <span
            className="tnum font-mono text-[26px] font-bold flex-shrink-0 leading-none"
            style={{ color: waiting ? accent : '#f2f0f7', opacity: isPaused ? 0.5 : 1, transition: 'opacity 0.3s ease' }}
          >
            {waiting ? '✓' : formatSeconds(secondsLeft)}
          </span>
        </div>

        {/* Alt satır: kontroller */}
        <div className="flex items-center justify-center gap-3 px-4 pb-3 pt-1.5">
          {confirmEarly && !isFree ? (
            <>
              <span className="text-xs font-semibold" style={{ color: 'rgba(255,255,255,0.55)' }}>
                Seansı erken bitir?
              </span>
              <button
                onClick={() => { finishEarly(); setConfirmEarly(false) }}
                className="btn-press h-9 px-4 rounded-xl text-xs font-bold"
                style={{ background: '#4ade80', color: '#06210f' }}
              >
                Evet, Tamamla
              </button>
              <button onClick={() => setConfirmEarly(false)} aria-label="Vazgeç" className="btn-press" style={ghost}>
                <XIcon />
              </button>
            </>
          ) : (
            <>
              <button
                onClick={toggleSound}
                aria-label={soundEnabled ? 'Sesi kapat' : 'Sesi aç'}
                className="btn-press" style={ghost}
              >
                {soundEnabled ? <BellIcon /> : <BellOffIcon />}
              </button>

              {isWork && !isFree ? (
                <button
                  onClick={() => setConfirmEarly(true)}
                  aria-label="Erken bitir" title="Erken bitir"
                  className="btn-press"
                  style={{ ...ghost, color: '#4ade80', border: '1px solid rgba(74,222,128,0.3)' }}
                >
                  <CheckIcon />
                </button>
              ) : isBreak ? (
                <button onClick={skipBreak} aria-label="Molayı atla" title="Molayı atla" className="btn-press" style={ghost}>
                  <SkipIcon />
                </button>
              ) : (
                <span style={{ width: 38 }} />
              )}

              {/* Merkez: büyük oynat/duraklat veya faz CTA'sı */}
              {waiting ? (
                <button
                  onClick={isWorkDone ? startBreak : skipBreak}
                  className="btn-press h-11 px-5 rounded-full text-xs font-bold"
                  style={{
                    background: accent,
                    color: '#131019',
                    boxShadow: `0 6px 18px -6px ${accentGlow}0.8)`,
                  }}
                >
                  {isWorkDone ? '☕ Mola Başlat' : '🔥 Çalışmaya Başla'}
                </button>
              ) : (
                <button
                  onClick={pauseResume}
                  aria-label={isPaused ? 'Devam et' : 'Duraklat'}
                  className="btn-press rounded-full flex items-center justify-center"
                  style={{
                    width: 46, height: 46,
                    background: accent,
                    color: '#131019',
                    boxShadow: `0 6px 18px -6px ${accentGlow}0.8)`,
                  }}
                >
                  {isPaused ? <PlayIcon size={17} /> : <PauseIcon size={17} />}
                </button>
              )}

              <button
                onClick={stopTimer}
                aria-label="Durdur" title="Durdur"
                className="btn-press"
                style={{ ...ghost, color: 'rgba(255,120,100,0.85)', border: '1px solid rgba(255,120,100,0.25)' }}
              >
                <StopIcon />
              </button>

              {/* Odak modu — masa saati */}
              <button
                onClick={toggleFocusMode}
                aria-label="Odak Modu" title="Odak Modu"
                className="btn-press" style={ghost}
              >
                <ExpandIcon />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

/* ── İkonlar ── */
const PlayIcon = ({ size = 13 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="currentColor" style={{ marginLeft: 2 }}>
    <path d="M4 2.5l10 5.5-10 5.5V2.5z" />
  </svg>
)
const PauseIcon = ({ size = 13 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="currentColor">
    <rect x="3" y="2" width="4" height="12" rx="1" />
    <rect x="9" y="2" width="4" height="12" rx="1" />
  </svg>
)
const CheckIcon = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
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
  <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
    <path d="M3 2.5l8 5.5-8 5.5V2.5zM13 2h1.5v12H13V2z" />
  </svg>
)
const StopIcon = () => (
  <svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor">
    <rect x="2.5" y="2.5" width="11" height="11" rx="2" />
  </svg>
)
const BellIcon = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
    <path d="M8 1a1 1 0 0 1 1 1v.5A4.5 4.5 0 0 1 12.5 7v2.5l1 1.5H2.5l1-1.5V7A4.5 4.5 0 0 1 7 2.5V2a1 1 0 0 1 1-1zm0 13a2 2 0 0 0 2-2H6a2 2 0 0 0 2 2z" />
  </svg>
)
const BellOffIcon = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" opacity="0.5">
    <path d="M8 1a1 1 0 0 1 1 1v.5A4.5 4.5 0 0 1 12.5 7v2.5l1 1.5H2.5l1-1.5V7A4.5 4.5 0 0 1 7 2.5V2a1 1 0 0 1 1-1zm0 13a2 2 0 0 0 2-2H6a2 2 0 0 0 2 2z" />
    <line x1="1" y1="1" x2="15" y2="15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
)
const ExpandIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 3 21 3 21 9" />
    <polyline points="9 21 3 21 3 15" />
    <line x1="21" y1="3" x2="14" y2="10" />
    <line x1="3" y1="21" x2="10" y2="14" />
  </svg>
)
