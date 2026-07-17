import { useCallback, useEffect, useRef, useState } from 'react'
import { usePomodoro } from '../context/PomodoroContext'
import { useApp } from '../context/AppContext'
import { formatSeconds } from '../utils/date'
import { formatFocusTotal, getPomodoroVisualState, POMODORO_STATE_COPY } from '../utils/pomodoroView'
import { PomodoroStopSheet } from './pomodoro/PomodoroSheets'

const CONTROLS_HIDE_MS = 4500

function ClockDigits({ text, dim, blink }: { text: string; dim: boolean; blink: boolean }) {
  return (
    <div className="focus-time" style={{ opacity: dim ? 0.38 : 1 }}>
      {[...text].map((character, index) => character === ':'
        ? <span key={`colon-${index}`} className={`focus-colon ${blink ? 'focus-colon-blink' : ''}`}>:</span>
        : <span key={`${index}-${character}`} className="focus-digit">{character}</span>)}
    </div>
  )
}

export default function FocusMode() {
  const {
    isFocusMode, toggleFocusMode, phase, secondsLeft, totalSeconds, sessionCount,
    isPaused, isFree, soundEnabled, activeHabitId,
    pauseResume, startBreak, skipBreak, stopTimer, toggleSound,
  } = usePomodoro()
  const { habits } = useApp()
  const [controlsOn, setControlsOn] = useState(true)
  const [stopOpen, setStopOpen] = useState(false)
  const [now, setNow] = useState(() => new Date())
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const exitRef = useRef<HTMLButtonElement>(null)
  const overlayRef = useRef<HTMLDivElement>(null)
  const stopOpenRef = useRef(false)

  useEffect(() => { stopOpenRef.current = stopOpen }, [stopOpen])

  const poke = useCallback(() => {
    setControlsOn(true)
    if (hideTimer.current) clearTimeout(hideTimer.current)
    hideTimer.current = setTimeout(() => setControlsOn(false), CONTROLS_HIDE_MS)
  }, [])

  useEffect(() => {
    if (!isFocusMode) return
    poke()
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const frame = requestAnimationFrame(() => exitRef.current?.focus())
    const onKeyDown = (event: KeyboardEvent) => {
      if (stopOpenRef.current) return
      if (event.key === 'Escape') {
        event.preventDefault()
        toggleFocusMode()
      } else if (event.key === 'Tab') {
        poke()
        const focusable = Array.from(overlayRef.current?.querySelectorAll<HTMLButtonElement>('button:not([disabled])') ?? [])
        if (focusable.length === 0) return
        const first = focusable[0]
        const last = focusable[focusable.length - 1]
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault()
          last.focus()
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault()
          first.focus()
        }
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => {
      cancelAnimationFrame(frame)
      document.removeEventListener('keydown', onKeyDown)
      if (hideTimer.current) clearTimeout(hideTimer.current)
      previous?.focus()
    }
  }, [isFocusMode, poke, toggleFocusMode])

  useEffect(() => {
    if (!isFocusMode) return
    const timer = setInterval(() => setNow(new Date()), 10_000)
    return () => clearInterval(timer)
  }, [isFocusMode])

  if (!isFocusMode || phase === 'idle') return null

  const isWork = phase === 'work'
  const isBreak = phase === 'break'
  const waiting = phase === 'work-done' || phase === 'break-done'
  const running = (isWork || isBreak) && !isPaused
  const state = getPomodoroVisualState(phase, isPaused)
  const habit = isFree ? null : habits.find((item) => item.id === activeHabitId)
  const title = isFree ? 'Serbest Odak' : habit ? habit.name : 'Pomodoro'
  const progress = totalSeconds > 0 ? ((totalSeconds - secondsLeft) / totalSeconds) * 100 : 0
  const elapsedSeconds = Math.max(0, totalSeconds - secondsLeft)
  const clock = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
  const dotCount = Math.min(sessionCount + (isWork ? 1 : 0), 8)

  const toggleControls = () => {
    if (controlsOn) {
      setControlsOn(false)
      if (hideTimer.current) clearTimeout(hideTimer.current)
    } else {
      poke()
    }
  }

  return (
    <>
      <div
        ref={overlayRef}
        className={`focus-overlay focus-overlay--${state} fixed inset-0 z-[90] select-none`}
        onClick={toggleControls}
        role="dialog"
        aria-modal="true"
        aria-label="Tam ekran odak modu"
      >
        <div className="focus-mode-halo absolute inset-0 pointer-events-none" />
        <div className="focus-stage relative h-full w-full flex flex-col items-center justify-center">
          <div className="focus-mode-top">
            <span>{clock}</span>
            <strong>{title}</strong>
          </div>

          <button
            ref={exitRef}
            type="button"
            onClick={(event) => { event.stopPropagation(); toggleFocusMode() }}
            aria-label="Odak modundan çık"
            className={`focus-control-button focus-control-button--exit focus-ctl ${controlsOn ? '' : 'focus-ctl-hidden-top'}`}
          >
            <CollapseIcon />
          </button>

          <div className="focus-mode-center">
            <span className="focus-mode-phase">{running && <i className="focus-live-dot" aria-hidden />}{POMODORO_STATE_COPY[state].label}</span>

            {waiting ? (
              <div className="focus-mode-complete animate-pop" onClick={(event) => event.stopPropagation()}>
                <span className="focus-time">✓</span>
                <button type="button" onClick={phase === 'work-done' ? startBreak : skipBreak} className="focus-phase-cta">
                  {phase === 'work-done' ? 'Molayı Başlat' : 'Yeni Odak Başlat'}
                </button>
              </div>
            ) : (
              <>
                <ClockDigits text={formatSeconds(secondsLeft)} dim={isPaused} blink={running} />
                <div className="focus-mode-progress" aria-hidden><span style={{ width: `${progress}%` }} /></div>
              </>
            )}

            {dotCount > 0 && (
              <div className="focus-session-dots" aria-label={`${sessionCount} seans tamamlandı`}>
                {Array.from({ length: dotCount }, (_, index) => (
                  <span key={index} className={isWork && index === dotCount - 1 ? 'is-current focus-live-dot' : ''} />
                ))}
                {sessionCount > 8 && <small>+{sessionCount - 8}</small>}
              </div>
            )}
          </div>

          <div className={`focus-mode-controls focus-ctl ${controlsOn ? '' : 'focus-ctl-hidden'}`} onClick={(event) => event.stopPropagation()}>
            <button type="button" onClick={() => { toggleSound(); poke() }} aria-label={soundEnabled ? 'Sesi kapat' : 'Sesi aç'} className="focus-control-button">
              {soundEnabled ? <BellIcon /> : <BellOffIcon />}
            </button>
            {(isWork || isBreak) && (
              <button type="button" onClick={() => { pauseResume(); poke() }} aria-label={isPaused ? 'Devam et' : 'Duraklat'} className="focus-control-button focus-control-button--primary">
                {isPaused ? <PlayIcon /> : <PauseIcon />}
              </button>
            )}
            {isBreak && (
              <button type="button" onClick={() => { skipBreak(); poke() }} aria-label="Molayı atla" className="focus-control-button"><SkipIcon /></button>
            )}
            <button type="button" onClick={() => setStopOpen(true)} aria-label="Seansı sonlandır" className="focus-control-button focus-control-button--stop"><StopIcon /></button>
          </div>

          <span className={`focus-mode-tap-cue focus-ctl ${controlsOn ? '' : 'is-visible'}`}>DOKUN</span>
        </div>
      </div>

      {stopOpen && (
        <PomodoroStopSheet elapsedLabel={formatFocusTotal(elapsedSeconds)} onClose={() => setStopOpen(false)} onConfirm={stopTimer} />
      )}
    </>
  )
}

const PlayIcon = () => <svg width="22" height="22" viewBox="0 0 16 16" fill="currentColor" aria-hidden><path d="M4 2.5 14 8 4 13.5z" /></svg>
const PauseIcon = () => <svg width="22" height="22" viewBox="0 0 16 16" fill="currentColor" aria-hidden><rect x="3" y="2" width="4" height="12" rx="1" /><rect x="9" y="2" width="4" height="12" rx="1" /></svg>
const StopIcon = () => <svg width="15" height="15" viewBox="0 0 16 16" fill="currentColor" aria-hidden><rect x="2.5" y="2.5" width="11" height="11" rx="2" /></svg>
const SkipIcon = () => <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden><path d="M3 2.5 11 8l-8 5.5zM13 2h1.5v12H13z" /></svg>
const BellIcon = () => <svg width="17" height="17" viewBox="0 0 16 16" fill="currentColor" aria-hidden><path d="M8 1a1 1 0 0 1 1 1v.5A4.5 4.5 0 0 1 12.5 7v2.5l1 1.5H2.5l1-1.5V7A4.5 4.5 0 0 1 7 2.5V2a1 1 0 0 1 1-1Zm0 13a2 2 0 0 0 2-2H6a2 2 0 0 0 2 2Z" /></svg>
const BellOffIcon = () => <svg width="17" height="17" viewBox="0 0 16 16" fill="currentColor" aria-hidden><path d="M8 1a1 1 0 0 1 1 1v.5A4.5 4.5 0 0 1 12.5 7v2.5l1 1.5H2.5l1-1.5V7A4.5 4.5 0 0 1 7 2.5V2a1 1 0 0 1 1-1Zm0 13a2 2 0 0 0 2-2H6a2 2 0 0 0 2 2Z" opacity=".35" /><path d="m2 2 12 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>
const CollapseIcon = () => <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M9 3v6H3M15 21v-6h6M3 9l6-6M21 15l-6 6" /></svg>
