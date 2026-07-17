import { useState } from 'react'
import { useLocation } from 'react-router-dom'
import { usePomodoro } from '../context/PomodoroContext'
import { useApp } from '../context/AppContext'
import { formatSeconds } from '../utils/date'
import { formatFocusTotal, getPomodoroVisualState, POMODORO_STATE_COPY } from '../utils/pomodoroView'
import { PomodoroStopSheet } from './pomodoro/PomodoroSheets'
import LuupiIcon from './ui/LuupiIcon'

export default function PomodoroBar() {
  const location = useLocation()
  const {
    activeHabitId, phase, secondsLeft, totalSeconds, sessionCount,
    isVisible, isPaused, isFree, soundEnabled, isFocusMode,
    pauseResume, startBreak, skipBreak, stopTimer, toggleSound, toggleFocusMode,
  } = usePomodoro()
  const { habits } = useApp()
  const [stopOpen, setStopOpen] = useState(false)

  const active = phase !== 'idle' && activeHabitId !== null
  if (!active || !isVisible || isFocusMode || location.pathname === '/pomodoro') return null

  const habit = isFree ? null : habits.find((item) => item.id === activeHabitId)
  const waiting = phase === 'work-done' || phase === 'break-done'
  const state = getPomodoroVisualState(phase, isPaused)
  const progress = totalSeconds > 0 ? ((totalSeconds - secondsLeft) / totalSeconds) * 100 : 0
  const elapsedSeconds = Math.max(0, totalSeconds - secondsLeft)

  return (
    <>
      <div className={`pomodoro-mini-player pomodoro-mini-player--${state}`}>
        <div className="pomodoro-mini-player__surface">
          <div className="pomodoro-mini-player__track" aria-hidden><span style={{ width: `${progress}%` }} /></div>
          <div className="pomodoro-mini-player__main">
            <span className="pomodoro-mini-player__emoji" aria-hidden><LuupiIcon name={isFree ? 'focus' : habit?.icon ?? 'timer'} size={20} /></span>
            <span className="pomodoro-mini-player__copy">
              <strong>{isFree ? 'Serbest Odak' : habit?.name ?? 'Pomodoro'}</strong>
              <small>{POMODORO_STATE_COPY[state].label} · {sessionCount} seans</small>
            </span>
            <b>{waiting ? '✓' : formatSeconds(secondsLeft)}</b>
            <button type="button" onClick={toggleFocusMode} className="pomodoro-mini-control" aria-label="Tam ekran odak"><ExpandIcon /></button>
          </div>
          <div className="pomodoro-mini-player__controls">
            <button type="button" onClick={toggleSound} className="pomodoro-mini-control" aria-label={soundEnabled ? 'Sesi kapat' : 'Sesi aç'}>{soundEnabled ? <BellIcon /> : <BellOffIcon />}</button>
            {phase === 'break' && <button type="button" onClick={skipBreak} className="pomodoro-mini-control" aria-label="Molayı atla"><SkipIcon /></button>}
            {waiting ? (
              <button type="button" onClick={phase === 'work-done' ? startBreak : skipBreak} className="pomodoro-mini-primary">
                {phase === 'work-done' ? 'Molayı Başlat' : 'Yeni Odak'}
              </button>
            ) : (
              <button type="button" onClick={pauseResume} className="pomodoro-mini-primary" aria-label={isPaused ? 'Devam et' : 'Duraklat'}>
                {isPaused ? <PlayIcon /> : <PauseIcon />}
              </button>
            )}
            <button type="button" onClick={() => setStopOpen(true)} className="pomodoro-mini-control pomodoro-mini-control--stop" aria-label="Seansı sonlandır"><StopIcon /></button>
          </div>
        </div>
      </div>

      {stopOpen && (
        <PomodoroStopSheet elapsedLabel={formatFocusTotal(elapsedSeconds)} onClose={() => setStopOpen(false)} onConfirm={stopTimer} />
      )}
    </>
  )
}

const PlayIcon = () => <svg width="17" height="17" viewBox="0 0 16 16" fill="currentColor" aria-hidden><path d="M4 2.5 14 8 4 13.5z" /></svg>
const PauseIcon = () => <svg width="17" height="17" viewBox="0 0 16 16" fill="currentColor" aria-hidden><rect x="3" y="2" width="4" height="12" rx="1" /><rect x="9" y="2" width="4" height="12" rx="1" /></svg>
const StopIcon = () => <svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor" aria-hidden><rect x="2.5" y="2.5" width="11" height="11" rx="2" /></svg>
const SkipIcon = () => <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" aria-hidden><path d="M3 2.5 11 8l-8 5.5zM13 2h1.5v12H13z" /></svg>
const BellIcon = () => <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" aria-hidden><path d="M8 1a1 1 0 0 1 1 1v.5A4.5 4.5 0 0 1 12.5 7v2.5l1 1.5H2.5l1-1.5V7A4.5 4.5 0 0 1 7 2.5V2a1 1 0 0 1 1-1Zm0 13a2 2 0 0 0 2-2H6a2 2 0 0 0 2 2Z" /></svg>
const BellOffIcon = () => <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" aria-hidden><path d="M8 1a1 1 0 0 1 1 1v.5A4.5 4.5 0 0 1 12.5 7v2.5l1 1.5H2.5l1-1.5V7A4.5 4.5 0 0 1 7 2.5V2a1 1 0 0 1 1-1Zm0 13a2 2 0 0 0 2-2H6a2 2 0 0 0 2 2Z" opacity=".35" /><path d="m2 2 12 12" fill="none" stroke="currentColor" strokeWidth="1.8" /></svg>
const ExpandIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" /></svg>
