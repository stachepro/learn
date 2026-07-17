import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { usePomodoro } from '../context/PomodoroContext'
import BackBar from '../components/BackBar'
import AppButton from '../components/ui/AppButton'
import PomodoroDial from '../components/pomodoro/PomodoroDial'
import { PomodoroSettingsSheet, PomodoroStopSheet } from '../components/pomodoro/PomodoroSheets'
import { formatSeconds } from '../utils/date'
import { formatFocusTotal, getPomodoroVisualState, POMODORO_STATE_COPY } from '../utils/pomodoroView'

function PlayIcon() {
  return <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden><path d="M4 2.3 14 8 4 13.7z" /></svg>
}
function PauseIcon() {
  return <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden><rect x="3" y="2" width="4" height="12" rx="1" /><rect x="9" y="2" width="4" height="12" rx="1" /></svg>
}
function ExpandIcon() {
  return <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" /></svg>
}
function SettingsIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-2.83 2.83-.06-.06A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 .6 1.7 1.7 0 0 0-.4 1.1V21h-4v-.09A1.7 1.7 0 0 0 8.6 19.4a1.7 1.7 0 0 0-1.88.34l-.06.06-2.83-2.83.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-.6-1 1.7 1.7 0 0 0-1.1-.4H3v-4h.09A1.7 1.7 0 0 0 4.6 8.6a1.7 1.7 0 0 0-.34-1.88l-.06-.06 2.83-2.83.06.06A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-.6 1.7 1.7 0 0 0 .4-1.1V3h4v.09A1.7 1.7 0 0 0 15.4 4.6a1.7 1.7 0 0 0 1.88-.34l.06-.06 2.83 2.83-.06.06A1.7 1.7 0 0 0 19.4 9c.16.36.37.7.6 1 .28.28.67.42 1.1.4H21v4h-.09c-.42-.02-.82.12-1.1.4-.23.3-.44.64-.6 1Z" /></svg>
}
function SoundIcon({ on }: { on: boolean }) {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M11 5 6 9H2v6h4l5 4z" />{on ? <><path d="M15.5 8.5a5 5 0 0 1 0 7M18 6a8.5 8.5 0 0 1 0 12" /></> : <path d="m16 9 5 5m0-5-5 5" />}</svg>
}

export default function Pomodoro() {
  const [searchParams, setSearchParams] = useSearchParams()
  const { habits, pomodoroSettings, updatePomodoroSettings, todayLog, freeSessions } = useApp()
  const {
    activeHabitId, phase, secondsLeft, totalSeconds, sessionCount,
    isPaused, isFree, soundEnabled, todayFocusSeconds,
    startFree, pauseResume, startBreak, skipBreak, stopTimer, toggleSound, toggleFocusMode,
  } = usePomodoro()
  const [settingsOpen, setSettingsOpen] = useState(() => searchParams.get('settings') === '1')
  const [stopOpen, setStopOpen] = useState(false)

  const state = getPomodoroVisualState(phase, isPaused)
  const copy = POMODORO_STATE_COPY[state]
  const activeHabit = activeHabitId && !isFree ? habits.find((habit) => habit.id === activeHabitId) : null
  const active = phase !== 'idle'
  const waiting = phase === 'work-done' || phase === 'break-done'
  const progress = totalSeconds > 0 ? (totalSeconds - secondsLeft) / totalSeconds : 0
  const displayTime = formatSeconds(active && !waiting ? secondsLeft : pomodoroSettings.workDuration * 60)
  const sessionTitle = activeHabit ? activeHabit.name : active ? 'Serbest Odak' : 'Serbest Pomodoro'
  const sessionType = activeHabit ? 'Alışkanlık seansı' : 'Bağımsız odak seansı'
  const elapsedSeconds = Math.max(0, totalSeconds - secondsLeft)
  const todayHabitSessions = Object.values(todayLog.habits).reduce((sum, log) => sum + log.pomodoroSessions.length, 0)
  const todayFreeSessions = freeSessions.filter((session) => session.date === todayLog.date).length
  const todaySessions = todayHabitSessions + todayFreeSessions
  const closeSettings = () => {
    setSettingsOpen(false)
    if (!searchParams.has('settings')) return
    const next = new URLSearchParams(searchParams)
    next.delete('settings')
    setSearchParams(next, { replace: true })
  }

  return (
    <div className={`pomodoro-page pomodoro-page--${state}`}>
      <div className="pomodoro-page__inner">
        <BackBar title="Araçlar" />

        <header className="pomodoro-page__header">
          <div>
            <span>ODAK ARACI</span>
            <h1>Pomodoro</h1>
          </div>
          <div className="pomodoro-page__header-actions">
            <button type="button" className="app-icon-button" onClick={toggleSound} aria-label={soundEnabled ? 'Sesi kapat' : 'Sesi aç'}><SoundIcon on={soundEnabled} /></button>
            <button type="button" className="app-icon-button" onClick={() => setSettingsOpen(true)} aria-label="Pomodoro ayarları"><SettingsIcon /></button>
          </div>
        </header>

        <section className="pomodoro-stage" aria-live="polite">
          <div className="pomodoro-stage__identity">
            <span>{sessionType}</span>
            <strong>{sessionTitle}</strong>
          </div>

          <PomodoroDial
            progress={progress}
            state={state}
            time={displayTime}
            label={copy.label}
            sessionLabel={active ? `${sessionCount} seans tamamlandı` : `${pomodoroSettings.workDuration} dk odak`}
          />

          <p className="pomodoro-stage__cue">{copy.cue}</p>

          <div className="pomodoro-primary-actions">
            {phase === 'idle' && (
              <AppButton tone="primary" size="lg" block onClick={startFree} leadingIcon={<PlayIcon />}>Odaklanmaya Başla</AppButton>
            )}
            {(phase === 'work' || phase === 'break') && (
              <>
                <AppButton tone="primary" size="lg" block onClick={pauseResume} leadingIcon={isPaused ? <PlayIcon /> : <PauseIcon />}>
                  {isPaused ? 'Devam Et' : 'Duraklat'}
                </AppButton>
                <AppButton tone="secondary" size="lg" block onClick={toggleFocusMode} leadingIcon={<ExpandIcon />}>Tam Ekran Odak</AppButton>
              </>
            )}
            {phase === 'work-done' && (
              <AppButton tone="primary" size="lg" block onClick={startBreak}>Molayı Başlat</AppButton>
            )}
            {phase === 'break-done' && (
              <AppButton tone="primary" size="lg" block onClick={skipBreak} leadingIcon={<PlayIcon />}>Yeni Odak Başlat</AppButton>
            )}
          </div>

          {active && (
            <div className="pomodoro-utility-actions">
              {phase === 'break' && <button type="button" onClick={skipBreak}>Molayı Atla</button>}
              {waiting && <button type="button" onClick={toggleFocusMode}><ExpandIcon /> Tam ekrana geç</button>}
              <button type="button" className="is-destructive" onClick={() => setStopOpen(true)}>Seansı Sonlandır</button>
            </div>
          )}
        </section>

        {!active && (
          <>
            <button type="button" className="pomodoro-rhythm-row" onClick={() => setSettingsOpen(true)}>
              <span><SettingsIcon /></span>
              <span><strong>Oturum ritmi</strong><small>{pomodoroSettings.workDuration} dk odak · {pomodoroSettings.breakDuration} dk mola</small></span>
              <b>{pomodoroSettings.autoLoop ? 'Otomatik' : 'Manuel'}</b>
            </button>
            <div className="pomodoro-today-overview">
              <div><span>Bugünkü odak</span><strong>{formatFocusTotal(todayFocusSeconds)}</strong></div>
              <i aria-hidden />
              <div><span>Tamamlanan</span><strong>{todaySessions} seans</strong></div>
            </div>
          </>
        )}
      </div>

      {settingsOpen && (
        <PomodoroSettingsSheet settings={pomodoroSettings} onClose={closeSettings} onSave={updatePomodoroSettings} />
      )}
      {stopOpen && (
        <PomodoroStopSheet elapsedLabel={formatFocusTotal(elapsedSeconds)} onClose={() => setStopOpen(false)} onConfirm={stopTimer} />
      )}
    </div>
  )
}
