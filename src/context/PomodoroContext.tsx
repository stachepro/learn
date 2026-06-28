import {
  createContext, useContext, useState, useEffect, useRef, useCallback, type ReactNode,
} from 'react'
import { useApp } from './AppContext'
import { todayStr, formatSeconds } from '../utils/date'
import { playBell } from '../utils/sound'

export const FREE_ID = '__free__'
type TimerPhase = 'idle' | 'work' | 'break' | 'break-done'

interface PomodoroContextValue {
  activeHabitId: string | null
  phase: TimerPhase
  secondsLeft: number
  totalSeconds: number
  sessionCount: number
  isVisible: boolean
  isPaused: boolean
  todayFocusSeconds: number
  isFree: boolean
  isBoostSession: boolean
  startPomodoro: (habitId: string) => void
  startFree: () => void
  pauseResume: () => void
  skipBreak: () => void
  stopTimer: () => void
  showBar: () => void
  hideBar: () => void
  displayTime: string
}

const PomodoroContext = createContext<PomodoroContextValue | null>(null)

export function PomodoroProvider({ children }: { children: ReactNode }) {
  const { pomodoroSettings, addPomodoroSession, addFreeSession, logs, freeSessions, todayLog } = useApp()
  const [activeHabitId, setActiveHabitId] = useState<string | null>(null)
  const [phase, setPhase] = useState<TimerPhase>('idle')
  const [secondsLeft, setSecondsLeft] = useState(0)
  const [totalSeconds, setTotalSeconds] = useState(0)
  const [sessionCount, setSessionCount] = useState(0)
  const [isVisible, setIsVisible] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [isBoostSession, setIsBoostSession] = useState(false)

  const settingsRef = useRef(pomodoroSettings)
  const isBoostRef = useRef(false)
  const todayLogRef = useRef(todayLog)
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const today = todayStr()

  useEffect(() => { settingsRef.current = pomodoroSettings }, [pomodoroSettings])
  useEffect(() => { todayLogRef.current = todayLog }, [todayLog])
  useEffect(() => { isBoostRef.current = isBoostSession }, [isBoostSession])

  const isFree = activeHabitId === FREE_ID

  const completedFocusSec = (() => {
    const dayLog = logs[today]
    const habitMin = dayLog
      ? Object.values(dayLog.habits).reduce(
          (acc, h) => acc + h.pomodoroSessions.reduce((s, p) => s + p.workDuration * 60, 0), 0,
        )
      : 0
    const freeMin = freeSessions
      .filter((s) => s.date === today)
      .reduce((acc, s) => acc + s.workDuration * 60, 0)
    return habitMin + freeMin
  })()

  const currentElapsed = phase === 'work' && totalSeconds > 0 ? totalSeconds - secondsLeft : 0
  const todayFocusSeconds = completedFocusSec + currentElapsed

  const clearTick = () => {
    if (tickRef.current) { clearInterval(tickRef.current); tickRef.current = null }
  }

  const finishWork = useCallback((habitId: string) => {
    playBell()
    const boost = isBoostRef.current
    // Boost success: 1.5× XP (15). Normal: 10. Store actual workDuration (base, not boosted time)
    const xpAmount = boost ? 15 : 10
    const workDuration = settingsRef.current.workDuration
    const session = {
      id: crypto.randomUUID(),
      habitId,
      date: todayStr(),
      workDuration,
      breakDuration: settingsRef.current.breakDuration,
      timestamp: new Date().toISOString(),
    }
    if (habitId === FREE_ID) addFreeSession(session)
    else addPomodoroSession(session, xpAmount)

    setSessionCount((c) => c + 1)
    const breakSecs = settingsRef.current.breakDuration * 60
    setPhase('break')
    setSecondsLeft(breakSecs)
    setTotalSeconds(breakSecs)
    setIsPaused(false)
    // Reset boost after success
    setIsBoostSession(false)
    isBoostRef.current = false
  }, [addPomodoroSession, addFreeSession])

  const finishBreak = useCallback(() => {
    playBell()
    setPhase('break-done')
  }, [])

  useEffect(() => {
    if (phase === 'idle' || phase === 'break-done' || isPaused) { clearTick(); return }
    tickRef.current = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          clearTick()
          if (phase === 'work') finishWork(activeHabitId!)
          else if (phase === 'break') finishBreak()
          return 0
        }
        return s - 1
      })
    }, 1000)
    return clearTick
  }, [phase, isPaused, activeHabitId, finishWork, finishBreak])

  const calcBoostAndSecs = (habitId: string): { boost: boolean; secs: number } => {
    if (habitId === FREE_ID) return { boost: false, secs: settingsRef.current.workDuration * 60 }
    const hl = todayLogRef.current.habits[habitId]
    const boost = (hl?.boostMode ?? false) && !(hl?.boostUsed ?? false)
    const secs = boost
      ? Math.round(settingsRef.current.workDuration * 1.5) * 60
      : settingsRef.current.workDuration * 60
    return { boost, secs }
  }

  const launch = useCallback((habitId: string) => {
    clearTick()
    const { boost, secs } = calcBoostAndSecs(habitId)
    setActiveHabitId(habitId)
    setPhase('work')
    setSecondsLeft(secs)
    setTotalSeconds(secs)
    setIsPaused(false)
    setIsVisible(true)
    setIsBoostSession(boost)
    isBoostRef.current = boost
  }, [])

  const startPomodoro = useCallback((habitId: string) => launch(habitId), [launch])
  const startFree = useCallback(() => launch(FREE_ID), [launch])
  const pauseResume = useCallback(() => setIsPaused((p) => !p), [])

  const skipBreak = useCallback(() => {
    clearTick()
    // Re-check boost status (may have changed since previous session used it)
    const currentId = activeHabitId
    if (!currentId) return
    const { boost, secs } = calcBoostAndSecs(currentId)
    setPhase('work')
    setSecondsLeft(secs)
    setTotalSeconds(secs)
    setIsPaused(false)
    setIsBoostSession(boost)
    isBoostRef.current = boost
  }, [activeHabitId])

  const stopTimer = useCallback(() => {
    clearTick()
    setPhase('idle'); setSecondsLeft(0); setTotalSeconds(0)
    setActiveHabitId(null); setSessionCount(0); setIsPaused(false)
    setIsVisible(false); setIsBoostSession(false); isBoostRef.current = false
  }, [])

  return (
    <PomodoroContext.Provider value={{
      activeHabitId, phase, secondsLeft, totalSeconds, sessionCount,
      isVisible, isPaused, todayFocusSeconds, isFree, isBoostSession,
      startPomodoro, startFree, pauseResume, skipBreak, stopTimer,
      showBar: () => setIsVisible(true),
      hideBar: () => setIsVisible(false),
      displayTime: formatSeconds(secondsLeft),
    }}>
      {children}
    </PomodoroContext.Provider>
  )
}

export function usePomodoro() {
  const ctx = useContext(PomodoroContext)
  if (!ctx) throw new Error('usePomodoro must be used within PomodoroProvider')
  return ctx
}
