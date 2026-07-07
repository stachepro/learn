import { useState, useEffect, useRef, useCallback } from 'react'
import { usePomodoro } from '../context/PomodoroContext'
import { useApp } from '../context/AppContext'
import { formatSeconds } from '../utils/date'

/* ════════════════════════════════════════════════
   ODAK MODU — masa saati. Simsiyah OLED dostu ekran,
   dev rakamlar, minimum hareket. Ekrana dokununca
   kontroller belirir, birkaç saniye sonra kaybolur.
   ════════════════════════════════════════════════ */

const CONTROLS_HIDE_MS = 4500

// Rakamlar tek tek render edilir; değişen rakam yumuşak bir
// kayma+netleşme animasyonuyla yenilenir (key değişimi remount eder).
function ClockDigits({ text, dim, blink }: { text: string; dim: boolean; blink: boolean }) {
  return (
    <div className="focus-time" style={{ opacity: dim ? 0.38 : 1, transition: 'opacity 0.4s ease' }}>
      {[...text].map((ch, i) =>
        ch === ':' ? (
          <span key={`c${i}`} className={`focus-colon ${blink ? 'focus-colon-blink' : ''}`}>:</span>
        ) : (
          <span key={`${i}-${ch}`} className="focus-digit">{ch}</span>
        ),
      )}
    </div>
  )
}

export default function FocusMode() {
  const {
    isFocusMode, toggleFocusMode,
    phase, secondsLeft, totalSeconds, sessionCount,
    isPaused, isFree, soundEnabled, activeHabitId,
    pauseResume, startBreak, skipBreak, stopTimer, toggleSound,
  } = usePomodoro()
  const { habits } = useApp()

  const [controlsOn, setControlsOn] = useState(true)
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Kontrolleri göster + otomatik gizleme sayacını tazele
  const poke = useCallback(() => {
    setControlsOn(true)
    if (hideTimer.current) clearTimeout(hideTimer.current)
    hideTimer.current = setTimeout(() => setControlsOn(false), CONTROLS_HIDE_MS)
  }, [])

  useEffect(() => {
    if (!isFocusMode) return
    poke()
    return () => { if (hideTimer.current) clearTimeout(hideTimer.current) }
  }, [isFocusMode, poke])

  // Duvar saati (küçük, üstte) — dakikada bir güncellemek yeterli
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    if (!isFocusMode) return
    const id = setInterval(() => setNow(new Date()), 10_000)
    return () => clearInterval(id)
  }, [isFocusMode])

  if (!isFocusMode || phase === 'idle') return null

  const isWork = phase === 'work'
  const isBreak = phase === 'break'
  const waiting = phase === 'work-done' || phase === 'break-done'
  const running = (isWork || isBreak) && !isPaused

  const habit = isFree ? null : habits.find((h) => h.id === activeHabitId)
  const title = isFree ? 'Serbest Odak' : (habit ? `${habit.emoji} ${habit.name}` : 'Pomodoro')

  const phaseLabel = isPaused
    ? 'DURAKLATILDI'
    : phase === 'work-done' ? 'ÇALIŞMA BİTTİ'
    : phase === 'break-done' ? 'MOLA BİTTİ'
    : isWork ? 'ODAK' : 'MOLA'

  const progress = totalSeconds > 0 ? ((totalSeconds - secondsLeft) / totalSeconds) * 100 : 0
  const clock = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`

  // Seans noktaları: bitenler dolu, aktif olan yanıp söner
  const dotCount = Math.min(sessionCount + (isWork ? 1 : 0), 8)

  const onBackdropTap = () => {
    if (controlsOn) {
      setControlsOn(false)
      if (hideTimer.current) clearTimeout(hideTimer.current)
    } else {
      poke()
    }
  }

  // Buton stilleri — koyu zemin üzerinde hayalet daireler
  const ghost: React.CSSProperties = {
    width: 52, height: 52, borderRadius: '50%',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.12)',
    color: 'rgba(255,255,255,0.78)',
  }

  return (
    <div
      className="focus-overlay fixed inset-0 z-[90] select-none"
      style={{ background: '#000' }}
      onClick={onBackdropTap}
    >
      {/* Nefes alan çok hafif halo — tek katman, düşük opaklık */}
      <div
        className="focus-halo absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 70% 55% at 50% 46%, rgba(255,255,255,0.05), transparent 65%)' }}
      />

      <div
        className="focus-stage relative h-full w-full flex flex-col items-center justify-center"
        style={{
          paddingTop: 'max(env(safe-area-inset-top), 16px)',
          paddingBottom: 'max(env(safe-area-inset-bottom), 16px)',
          paddingLeft: 'max(env(safe-area-inset-left), 16px)',
          paddingRight: 'max(env(safe-area-inset-right), 16px)',
        }}
      >
        {/* Üst: duvar saati + seans adı */}
        <div className="absolute left-0 right-0 flex flex-col items-center gap-1.5" style={{ top: 'max(env(safe-area-inset-top), 20px)' }}>
          <span className="tnum text-sm font-medium tracking-[0.28em]" style={{ color: 'rgba(255,255,255,0.28)' }}>
            {clock}
          </span>
          <span className="text-xs font-medium tracking-wide" style={{ color: 'rgba(255,255,255,0.34)' }}>
            {title}
          </span>
        </div>

        {/* Çıkış butonu — kontrollerle birlikte görünür */}
        <button
          onClick={(e) => { e.stopPropagation(); toggleFocusMode() }}
          aria-label="Odak modundan çık"
          className={`btn-press absolute focus-ctl ${controlsOn ? '' : 'focus-ctl-hidden-top'}`}
          style={{
            ...ghost, width: 44, height: 44,
            top: 'max(env(safe-area-inset-top), 20px)',
            right: 'max(env(safe-area-inset-right), 20px)',
          }}
        >
          <CollapseIcon />
        </button>

        {/* Orta: faz etiketi + dev saat + ilerleme çizgisi */}
        <div className="flex flex-col items-center">
          <div className="flex items-center gap-2.5 mb-2">
            {(isWork || isBreak) && !isPaused && (
              <span
                className="focus-live-dot inline-block rounded-full"
                style={{ width: 6, height: 6, background: 'rgba(255,255,255,0.55)' }}
              />
            )}
            <span
              className="text-[11px] font-semibold tracking-[0.42em]"
              style={{ color: isPaused ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.42)', marginRight: '-0.42em' }}
            >
              {phaseLabel}
            </span>
          </div>

          {waiting ? (
            <div className="flex flex-col items-center animate-pop" onClick={(e) => e.stopPropagation()}>
              <span className="focus-time" style={{ fontSize: 'min(24vw, 30vh)' }}>✓</span>
              <button
                onClick={phase === 'work-done' ? startBreak : skipBreak}
                className="btn-press mt-6 px-9 py-3.5 rounded-full text-sm font-bold tracking-wide"
                style={{
                  background: 'rgba(255,255,255,0.92)', color: '#0a0a0c',
                  boxShadow: '0 0 40px rgba(255,255,255,0.18)',
                }}
              >
                {phase === 'work-done' ? 'Mola Başlat' : 'Çalışmaya Başla'}
              </button>
            </div>
          ) : (
            <>
              <ClockDigits text={formatSeconds(secondsLeft)} dim={isPaused} blink={running} />
              {/* İnce ilerleme çizgisi */}
              <div
                className="mt-7 rounded-full overflow-hidden"
                style={{ width: 'min(56vw, 380px)', height: 3, background: 'rgba(255,255,255,0.09)' }}
              >
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${progress}%`,
                    background: 'rgba(255,255,255,0.55)',
                    boxShadow: '0 0 10px rgba(255,255,255,0.45)',
                    transition: 'width 1s linear',
                  }}
                />
              </div>
            </>
          )}

          {/* Seans noktaları */}
          {dotCount > 0 && (
            <div className="flex items-center gap-2.5 mt-6">
              {Array.from({ length: dotCount }).map((_, i) => {
                const isCurrent = isWork && i === dotCount - 1
                return (
                  <span
                    key={i}
                    className={isCurrent ? 'focus-live-dot' : ''}
                    style={{
                      width: 5, height: 5, borderRadius: '50%',
                      background: isCurrent ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.7)',
                    }}
                  />
                )
              })}
              {sessionCount > 8 && (
                <span className="text-[10px] tnum" style={{ color: 'rgba(255,255,255,0.35)' }}>+{sessionCount - 8}</span>
              )}
            </div>
          )}
        </div>

        {/* Alt: kontroller — dokununca belirir */}
        <div
          className={`absolute left-0 right-0 flex items-center justify-center gap-5 focus-ctl ${controlsOn ? '' : 'focus-ctl-hidden'}`}
          style={{ bottom: 'max(env(safe-area-inset-bottom), 28px)' }}
          onClick={(e) => e.stopPropagation()}
        >
          <button onClick={() => { toggleSound(); poke() }} aria-label={soundEnabled ? 'Sesi kapat' : 'Sesi aç'} className="btn-press" style={ghost}>
            {soundEnabled ? <BellIcon /> : <BellOffIcon />}
          </button>

          {(isWork || isBreak) && (
            <button
              onClick={() => { pauseResume(); poke() }}
              aria-label={isPaused ? 'Devam et' : 'Duraklat'}
              className="btn-press"
              style={{
                ...ghost, width: 66, height: 66,
                background: 'rgba(255,255,255,0.12)',
                border: '1px solid rgba(255,255,255,0.2)',
                color: 'rgba(255,255,255,0.92)',
              }}
            >
              {isPaused ? <PlayIcon size={22} /> : <PauseIcon size={22} />}
            </button>
          )}

          {isBreak && (
            <button onClick={() => { skipBreak(); poke() }} aria-label="Molayı atla" className="btn-press" style={ghost}>
              <SkipIcon />
            </button>
          )}

          <button
            onClick={() => stopTimer()}
            aria-label="Bitir"
            className="btn-press"
            style={{ ...ghost, color: 'rgba(255,120,100,0.8)', border: '1px solid rgba(255,120,100,0.25)' }}
          >
            <StopIcon />
          </button>
        </div>

        {/* Dokunma ipucu — kontroller gizliyken çok silik */}
        <span
          className="absolute text-[10px] tracking-[0.2em] pointer-events-none focus-ctl"
          style={{
            bottom: 'max(env(safe-area-inset-bottom), 28px)',
            color: 'rgba(255,255,255,0.14)',
            opacity: controlsOn ? 0 : 1,
          }}
        >
          DOKUN
        </span>
      </div>
    </div>
  )
}

/* ── İkonlar ── */
const PlayIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="currentColor" style={{ marginLeft: 2 }}>
    <path d="M4 2.5l10 5.5-10 5.5V2.5z" />
  </svg>
)
const PauseIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="currentColor">
    <rect x="3" y="2" width="4" height="12" rx="1" />
    <rect x="9" y="2" width="4" height="12" rx="1" />
  </svg>
)
const StopIcon = () => (
  <svg width="15" height="15" viewBox="0 0 16 16" fill="currentColor">
    <rect x="2.5" y="2.5" width="11" height="11" rx="2" />
  </svg>
)
const SkipIcon = () => (
  <svg width="15" height="15" viewBox="0 0 16 16" fill="currentColor">
    <path d="M3 2.5l8 5.5-8 5.5V2.5zM13 2h1.5v12H13V2z" />
  </svg>
)
const BellIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
    <path d="M8 1a1 1 0 0 1 1 1v.5A4.5 4.5 0 0 1 12.5 7v2.5l1 1.5H2.5l1-1.5V7A4.5 4.5 0 0 1 7 2.5V2a1 1 0 0 1 1-1zm0 13a2 2 0 0 0 2-2H6a2 2 0 0 0 2 2z" />
  </svg>
)
const BellOffIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" opacity="0.5">
    <path d="M8 1a1 1 0 0 1 1 1v.5A4.5 4.5 0 0 1 12.5 7v2.5l1 1.5H2.5l1-1.5V7A4.5 4.5 0 0 1 7 2.5V2a1 1 0 0 1 1-1zm0 13a2 2 0 0 0 2-2H6a2 2 0 0 0 2 2z" />
    <line x1="1" y1="1" x2="15" y2="15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
)
const CollapseIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="4 14 10 14 10 20" />
    <polyline points="20 10 14 10 14 4" />
    <line x1="14" y1="10" x2="21" y2="3" />
    <line x1="3" y1="21" x2="10" y2="14" />
  </svg>
)
