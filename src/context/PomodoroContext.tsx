import {
  createContext, useContext, useState, useEffect, useRef, useCallback, type ReactNode,
} from 'react'
import { useApp } from './AppContext'
import { todayStr, formatSeconds } from '../utils/date'
import { playBell } from '../utils/sound'
import { getHabitMode, getHabitGoal } from '../types'
import { storage } from '../utils/storage'
import { scheduleTimerNotification, cancelTimerNotification, NOTIF_POMODORO } from '../utils/timerNotifications'
import { enterFocusNative, exitFocusNative } from '../utils/focusMode'
import { hapticEvent } from '../utils/haptics'
import { showToast } from '../utils/toast'
import { DEFAULT_SESSION_EXP } from '../utils/exp'
import LuupiIcon from '../components/ui/LuupiIcon'
import type { PomodoroPhase } from '../utils/pomodoroView'

export const FREE_ID = '__free__'
// 'work-done' = work finished, waiting for the user to start the break (manual mode)
// 'break-done' = break finished, waiting for the user to start the next work round
interface PomodoroContextValue {
  activeHabitId: string | null
  phase: PomodoroPhase
  secondsLeft: number
  totalSeconds: number
  sessionCount: number
  isVisible: boolean
  isPaused: boolean
  todayFocusSeconds: number
  isFree: boolean
  isBoostSession: boolean
  isExtraSession: boolean
  soundEnabled: boolean
  isFocusMode: boolean
  toggleFocusMode: () => void
  startPomodoro: (habitId: string) => void
  startFree: () => void
  pauseResume: () => void
  startBreak: () => void
  skipBreak: () => void
  finishEarly: () => void
  stopTimer: () => void
  showBar: () => void
  hideBar: () => void
  toggleSound: () => void
  displayTime: string
}

const PomodoroContext = createContext<PomodoroContextValue | null>(null)

export function PomodoroProvider({ children }: { children: ReactNode }) {
  const { pomodoroSettings, addPomodoroSession, addFreeSession, logs, freeSessions, todayLog, habits } = useApp()
  const [activeHabitId, setActiveHabitId] = useState<string | null>(null)
  const [phase, setPhase] = useState<PomodoroPhase>('idle')
  const [secondsLeft, setSecondsLeft] = useState(0)
  const [totalSeconds, setTotalSeconds] = useState(0)
  const [sessionCount, setSessionCount] = useState(0)
  const [isVisible, setIsVisible] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [isBoostSession, setIsBoostSession] = useState(false)
  const [isExtraSession, setIsExtraSession] = useState(false)
  const [soundEnabled, setSoundEnabled] = useState(() => storage.getSoundEnabled())
  const [isFocusMode, setIsFocusMode] = useState(false)

  const settingsRef = useRef(pomodoroSettings)
  const activeHabitIdRef = useRef<string | null>(null)
  const isBoostRef = useRef(false)
  const soundEnabledRef = useRef(soundEnabled)
  const todayLogRef = useRef(todayLog)
  const habitsRef = useRef(habits)
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null)
  // Duvar saati bazlı sayaç: geri sayım her tikte endAt'ten hesaplanır.
  // Uygulama arka plana alınsa/kapatılsa bile süre gerçek zamanda ilerler.
  const endAtRef = useRef<number | null>(null)
  const pausedRemainingRef = useRef<number | null>(null)
  const today = todayStr()

  const notifyAt = (atMs: number, forPhase: 'work' | 'break') => {
  if (forPhase === 'work') scheduleTimerNotification(NOTIF_POMODORO, atMs, 'Pomodoro bitti', 'Çalışma süresi doldu — mola zamanı!')
  else scheduleTimerNotification(NOTIF_POMODORO, atMs, 'Mola bitti', 'Çalışmaya dönme zamanı!')
  }

  useEffect(() => { settingsRef.current = pomodoroSettings }, [pomodoroSettings])
  useEffect(() => { activeHabitIdRef.current = activeHabitId }, [activeHabitId])
  useEffect(() => { todayLogRef.current = todayLog }, [todayLog])
  useEffect(() => { isBoostRef.current = isBoostSession }, [isBoostSession])
  useEffect(() => { habitsRef.current = habits }, [habits])
  useEffect(() => { soundEnabledRef.current = soundEnabled }, [soundEnabled])

  const isFree = activeHabitId === FREE_ID

  // ── Odak modu (masa saati) ──
  // Native yan etkiler tek yerden yönetilir: girişte rotasyon serbest +
  // ekran uyanık + durum çubuğu gizli; çıkışta (veya unmount'ta) hepsi geri.
  useEffect(() => {
    if (!isFocusMode) return
    void enterFocusNative()
    return () => { void exitFocusNative() }
  }, [isFocusMode])

  // Sayaç tamamen durunca odak modundan otomatik çık
  useEffect(() => {
    if (phase === 'idle') setIsFocusMode(false)
  }, [phase])

  const toggleFocusMode = useCallback(() => {
    void hapticEvent('featured')
    setIsFocusMode((f) => !f)
  }, [])

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

  const calcBoostAndSecs = (habitId: string): { boost: boolean; secs: number } => {
    if (habitId === FREE_ID) return { boost: false, secs: settingsRef.current.workDuration * 60 }
    const hl = todayLogRef.current.habits[habitId]
    const boost = (hl?.boostMode ?? false) && !(hl?.boostUsed ?? false)
    const secs = boost
      ? Math.round(settingsRef.current.workDuration * 1.5) * 60
      : settingsRef.current.workDuration * 60
    return { boost, secs }
  }

  // Begin (or auto-begin) a work round for the active habit, recomputing boost/secs.
  const beginWork = () => {
    const id = activeHabitIdRef.current
    if (!id) return
    clearTick()
    const { boost, secs } = calcBoostAndSecs(id)
    endAtRef.current = Date.now() + secs * 1000
    pausedRemainingRef.current = null
    notifyAt(endAtRef.current, 'work')
    setPhase('work')
    setSecondsLeft(secs)
    setTotalSeconds(secs)
    setIsPaused(false)
    setIsBoostSession(boost)
    isBoostRef.current = boost
  }

  // Begin (or auto-begin) the break.
  const beginBreak = () => {
    clearTick()
    const breakSecs = settingsRef.current.breakDuration * 60
    endAtRef.current = Date.now() + breakSecs * 1000
    pausedRemainingRef.current = null
    notifyAt(endAtRef.current, 'break')
    setPhase('break')
    setSecondsLeft(breakSecs)
    setTotalSeconds(breakSecs)
    setIsPaused(false)
    setIsBoostSession(false)
    isBoostRef.current = false
  }

  const finishWork = useCallback((habitId: string) => {
    cancelTimerNotification(NOTIF_POMODORO)
    endAtRef.current = null
    // Work-end alert rings 3× in a row
    if (soundEnabledRef.current) playBell(3)
    const boost = isBoostRef.current
    const workDuration = settingsRef.current.workDuration
    const session = {
      id: crypto.randomUUID(),
      habitId,
      date: todayStr(),
      workDuration,
      breakDuration: settingsRef.current.breakDuration,
      timestamp: new Date().toISOString(),
    }

    let earnedXp = DEFAULT_SESSION_EXP
    if (habitId === FREE_ID) {
      addFreeSession(session)
    } else {
      const habit = habitsRef.current.find((h) => h.id === habitId)
      const sessionsDone = todayLogRef.current.habits[habitId]?.pomodoroSessions.length ?? 0
      const pomGoal = habit ? getHabitGoal(habit) : 0
      const isGoalMode = habit ? getHabitMode(habit) === 'pomodoro' && pomGoal > 0 : false
      const isExtra = isGoalMode && sessionsDone >= pomGoal
      const autoComplete = isGoalMode
        && !todayLogRef.current.habits[habitId]?.completed
        && sessionsDone + 1 === pomGoal

      // Extra sessions = 1.5× base (15 XP). Boost sessions = 1.5× base (15 XP). Both independent.
      const xpAmount = isExtra ? 15 : boost ? 15 : 10
      earnedXp = xpAmount
      addPomodoroSession(session, xpAmount, boost && !isExtra, autoComplete)
      setIsExtraSession(isExtra)
    }

    setSessionCount((c) => c + 1)
    setIsPaused(false)
    setIsBoostSession(false)
    isBoostRef.current = false
    showToast({
      id: `pomodoro-complete-${session.id}`,
      tone: 'reward',
      icon: '✦',
      title: 'Odak tamamlandı',
      message: `${workDuration} dk odak · +${earnedXp} XP`,
    })

    if (settingsRef.current.autoLoop) {
      // Auto mode: break starts immediately
      const breakSecs = settingsRef.current.breakDuration * 60
      endAtRef.current = Date.now() + breakSecs * 1000
      notifyAt(endAtRef.current, 'break')
      setPhase('break')
      setSecondsLeft(breakSecs)
      setTotalSeconds(breakSecs)
    } else {
      // Manual mode: wait for the user to press "Mola Başlat"
      setPhase('work-done')
    }
  }, [addPomodoroSession, addFreeSession])

  const finishBreak = useCallback(() => {
    cancelTimerNotification(NOTIF_POMODORO)
    endAtRef.current = null
    if (soundEnabledRef.current) playBell()
      showToast({ tone: 'success', contextIcon: <LuupiIcon name="coffee" size={16} />, title: 'Mola tamamlandı', message: 'Yeni odak turuna hazırsın.' })
    if (settingsRef.current.autoLoop) {
      // Auto mode: next work round starts immediately
      beginWork()
    } else {
      // Manual mode: wait for the user to press "Çalışmaya Başla"
      setPhase('break-done')
    }
  }, [])

  // Sayaç tiki — kalan süre her seferinde duvar saatinden (endAt) hesaplanır;
  // arka planda geçen süre kaybolmaz. Görünürlük değişince anında güncellenir.
  useEffect(() => {
    if (phase === 'idle' || phase === 'work-done' || phase === 'break-done' || isPaused) { clearTick(); return }
    const tick = () => {
      const endAt = endAtRef.current
      if (endAt == null) return
      const left = Math.max(0, Math.ceil((endAt - Date.now()) / 1000))
      setSecondsLeft(left)
      if (left <= 0) {
        clearTick()
        if (phase === 'work') finishWork(activeHabitIdRef.current!)
        else if (phase === 'break') finishBreak()
      }
    }
    tick()
    tickRef.current = setInterval(tick, 500)
    const onVisible = () => { if (!document.hidden) tick() }
    document.addEventListener('visibilitychange', onVisible)
    return () => { clearTick(); document.removeEventListener('visibilitychange', onVisible) }
  }, [phase, isPaused, finishWork, finishBreak])

  // ── Kalıcılık: aktif sayaç durumu depoya yazılır; uygulama tamamen
  //    kapatılıp açılsa bile kaldığı yerden (ya da bittiyse bitmiş olarak) sürer ──
  useEffect(() => {
    if (phase === 'idle' || !activeHabitId) return
    storage.setPomodoroActive({
      habitId: activeHabitId,
      phase,
      endAt: endAtRef.current,
      pausedRemaining: pausedRemainingRef.current,
      totalSeconds,
      sessionCount,
      isPaused,
      isBoost: isBoostSession,
      isExtra: isExtraSession,
    })
  }, [activeHabitId, phase, isPaused, totalSeconds, sessionCount, isBoostSession, isExtraSession])

  const restoredRef = useRef(false)
  useEffect(() => {
    if (restoredRef.current) return
    restoredRef.current = true
    const saved = storage.getPomodoroActive()
    if (!saved) return
    setActiveHabitId(saved.habitId)
    activeHabitIdRef.current = saved.habitId
    setSessionCount(saved.sessionCount)
    setTotalSeconds(saved.totalSeconds)
    setIsBoostSession(saved.isBoost)
    isBoostRef.current = saved.isBoost
    setIsExtraSession(saved.isExtra)
    setIsVisible(true)
    if (saved.phase === 'work-done' || saved.phase === 'break-done') {
      setPhase(saved.phase)
      return
    }
    if (saved.isPaused && saved.pausedRemaining != null) {
      pausedRemainingRef.current = saved.pausedRemaining
      setIsPaused(true)
      setPhase(saved.phase)
      setSecondsLeft(Math.ceil(saved.pausedRemaining))
      return
    }
    if (saved.endAt != null && saved.endAt > Date.now()) {
      endAtRef.current = saved.endAt
      setPhase(saved.phase)
      setSecondsLeft(Math.ceil((saved.endAt - Date.now()) / 1000))
      notifyAt(saved.endAt, saved.phase)
      return
    }
    // Süre uygulama kapalıyken doldu: seansı say ve bekleme fazına geç
    if (saved.phase === 'work') finishWork(saved.habitId)
    else finishBreak()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const launch = useCallback((habitId: string) => {
    clearTick()
    const { boost, secs } = calcBoostAndSecs(habitId)
    endAtRef.current = Date.now() + secs * 1000
    pausedRemainingRef.current = null
    notifyAt(endAtRef.current, 'work')
    setActiveHabitId(habitId)
    setPhase('work')
    setSecondsLeft(secs)
    setTotalSeconds(secs)
    setIsPaused(false)
    setIsVisible(true)
    setIsBoostSession(boost)
    isBoostRef.current = boost
    void hapticEvent('featured')
    showToast({
      tone: 'info',
      icon: '◎',
      title: 'Odak başladı',
      message: `${Math.round(secs / 60)} dakikalık alan senin.`,
      haptic: 'none',
    })
  }, [])

  const startPomodoro = useCallback((habitId: string) => launch(habitId), [launch])
  const startFree = useCallback(() => launch(FREE_ID), [launch])

  const pauseResume = useCallback(() => {
    void hapticEvent('control')
    setIsPaused((p) => {
      const next = !p
      if (next) {
        // Duraklat: kalan süreyi sakla, bildirim iptal
        if (endAtRef.current != null) {
          pausedRemainingRef.current = Math.max(0, (endAtRef.current - Date.now()) / 1000)
        }
        endAtRef.current = null
        cancelTimerNotification(NOTIF_POMODORO)
      } else if (phase === 'work' || phase === 'break') {
        // Devam et: kalan süreden yeni bitiş anı kur
        const remaining = pausedRemainingRef.current ?? secondsLeft
        endAtRef.current = Date.now() + remaining * 1000
        pausedRemainingRef.current = null
        notifyAt(endAtRef.current, phase)
      }
      return next
    })
  }, [phase, secondsLeft])

  const toggleSound = useCallback(() => {
    void hapticEvent('selection')
    setSoundEnabled((prev) => {
      const next = !prev
      soundEnabledRef.current = next
      storage.setSoundEnabled(next)
      return next
    })
  }, [])

  // Manual "Mola Başlat" — start the break after a work round (from 'work-done')
  const startBreak = useCallback(() => {
    void hapticEvent('featured')
    beginBreak()
  }, [])

  const skipBreak = useCallback(() => {
    void hapticEvent('featured')
    clearTick()
    // Re-check boost status (may have changed since previous session used it)
    const currentId = activeHabitId
    if (!currentId) return
    const { boost, secs } = calcBoostAndSecs(currentId)
    endAtRef.current = Date.now() + secs * 1000
    pausedRemainingRef.current = null
    notifyAt(endAtRef.current, 'work')
    setPhase('work')
    setSecondsLeft(secs)
    setTotalSeconds(secs)
    setIsPaused(false)
    setIsBoostSession(boost)
    isBoostRef.current = boost
  }, [activeHabitId])

  const finishEarly = useCallback(() => {
    if (phase !== 'work' || !activeHabitId) return
    clearTick()
    finishWork(activeHabitId)
  }, [phase, activeHabitId, finishWork])

  const stopTimer = useCallback(() => {
    clearTick()
    cancelTimerNotification(NOTIF_POMODORO)
    endAtRef.current = null
    pausedRemainingRef.current = null
    storage.setPomodoroActive(null)
    setPhase('idle'); setSecondsLeft(0); setTotalSeconds(0)
    setActiveHabitId(null); setSessionCount(0); setIsPaused(false)
    setIsVisible(false); setIsBoostSession(false); setIsExtraSession(false)
    isBoostRef.current = false
    showToast({ tone: 'warning', contextIcon: '■', title: 'Seans sonlandırıldı', message: 'Bu turun ilerlemesi kaydedilmedi.' })
  }, [])

  return (
    <PomodoroContext.Provider value={{
      activeHabitId, phase, secondsLeft, totalSeconds, sessionCount,
      isVisible, isPaused, todayFocusSeconds, isFree, isBoostSession, isExtraSession,
      soundEnabled, isFocusMode, toggleFocusMode,
      startPomodoro, startFree, pauseResume, startBreak, skipBreak, finishEarly, stopTimer, toggleSound,
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
