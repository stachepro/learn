import {
  createContext, useContext, useState, useCallback, useEffect, type ReactNode,
} from 'react'
import { storage } from '../utils/storage'
import { getLevelFromExp, calcHabitExp } from '../utils/exp'
import { checkBadges } from '../utils/badges'
import { todayStr, yesterdayStr } from '../utils/date'
import type {
  Habit, DailyLogs, DayLog, HabitLog, UserProfile,
  PomodoroSession, PomodoroSettings, Category, CompletionMode, ScheduleOptions,
} from '../types'
import { getHabitGoal } from '../types'

interface AppContextValue {
  habits: Habit[]
  logs: DailyLogs
  profile: UserProfile
  pomodoroSettings: PomodoroSettings
  categories: Category[]
  todayLog: DayLog
  freeSessions: PomodoroSession[]
  addHabit: (name: string, emoji: string, categoryId: string, mode?: CompletionMode, goal?: number, schedule?: ScheduleOptions, labelColor?: string) => void
  deleteHabit: (id: string) => void
  editHabit: (id: string, name: string, emoji: string, categoryId: string, mode?: CompletionMode, goal?: number, schedule?: ScheduleOptions, labelColor?: string) => void
  incrementCompletion: (habitId: string) => void
  toggleHabitComplete: (habitId: string) => void
  addJustStartXP: (amount: number) => void
  setHabitBoostMode: (habitId: string, on: boolean) => void
  setHabitNote: (habitId: string, note: string) => void
  addPomodoroSession: (session: PomodoroSession, xpAmount?: number, isBoost?: boolean, autoComplete?: boolean) => void
  addFreeSession: (session: PomodoroSession) => void
  updateUsername: (name: string) => void
  updatePomodoroSettings: (settings: PomodoroSettings) => void
  addCustomCategory: (cat: Category) => void
  deleteCustomCategory: (id: string) => void
}

const AppContext = createContext<AppContextValue | null>(null)

function defaultHabitLog(): HabitLog {
  return { completed: false, boostMode: false, boostUsed: false, notes: '', pomodoroSessions: [], completionCount: 0 }
}

function migrateHabitLog(raw: Partial<HabitLog>): HabitLog {
  return {
    completed: raw.completed ?? false,
    boostMode: (raw as { hardMode?: boolean }).hardMode ?? raw.boostMode ?? false,
    boostUsed: raw.boostUsed ?? false,
    notes: raw.notes ?? '',
    pomodoroSessions: raw.pomodoroSessions ?? [],
    completedAt: raw.completedAt,
    completionCount: raw.completionCount ?? 0,
  }
}

function recalcExp(logs: DailyLogs, justStartXP = 0): number {
  let total = justStartXP
  for (const day of Object.values(logs))
    for (const h of Object.values(day.habits)) {
      const hl = migrateHabitLog(h)
      if (hl.completed) total += calcHabitExp(hl.pomodoroSessions)
    }
  return total
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [habits, setHabitsState] = useState<Habit[]>(() => storage.getHabits())
  const [logs, setLogsState] = useState<DailyLogs>(() => storage.getDailyLogs())
  const [profile, setProfileState] = useState<UserProfile>(() => storage.getUserProfile())
  const [pomodoroSettings, setPomodoroSettingsState] = useState<PomodoroSettings>(() => storage.getPomodoroSettings())
  const [categories, setCategoriesState] = useState<Category[]>(() => storage.getCategories())
  const [freeSessions, setFreeSessionsState] = useState<PomodoroSession[]>(() => storage.getFreeSessions())

  const today = todayStr()
  const todayLog: DayLog = logs[today] ?? { date: today, habits: {} }

  useEffect(() => {
    const p = storage.getUserProfile()
    const yesterday = yesterdayStr()
    if (p.lastActiveDate && p.lastActiveDate !== today && p.lastActiveDate !== yesterday) {
      const updated = { ...p, streak: 0 }
      storage.setUserProfile(updated)
      setProfileState(updated)
    }
  }, [today])

  const saveHabits = (h: Habit[]) => { setHabitsState(h); storage.setHabits(h) }
  const saveLogs = (l: DailyLogs) => { setLogsState(l); storage.setDailyLogs(l) }
  const saveProfile = (p: UserProfile) => { setProfileState(p); storage.setUserProfile(p) }

  const patchDayHabitLog = (habitId: string, currentLogs: DailyLogs, patch: Partial<HabitLog>): DailyLogs => {
    const currentDay: DayLog = currentLogs[today] ?? { date: today, habits: {} }
    const currentHL: HabitLog = migrateHabitLog(currentDay.habits[habitId] ?? {})
    return {
      ...currentLogs,
      [today]: { ...currentDay, habits: { ...currentDay.habits, [habitId]: { ...currentHL, ...patch } } },
    }
  }

  const syncProfile = (newLogs: DailyLogs, base: UserProfile): UserProfile => {
    const totalExp = recalcExp(newLogs, base.justStartXP ?? 0)
    const p = { ...base, totalExp, level: getLevelFromExp(totalExp) }
    p.badges = checkBadges(p, newLogs)
    return p
  }

  const addJustStartXP = useCallback((amount: number) => {
    const updated = { ...profile, justStartXP: (profile.justStartXP ?? 0) + amount }
    saveProfile(syncProfile(logs, updated))
  }, [profile, logs])

  const addHabit = useCallback((name: string, emoji: string, categoryId: string, mode: CompletionMode = 'single', goal?: number, schedule?: ScheduleOptions, labelColor?: string) => {
    const today = todayStr()
    const h: Habit = {
      id: crypto.randomUUID(), name: name.trim(), emoji, categoryId,
      createdAt: new Date().toISOString(),
      createdDate: today,
      completionMode: mode,
      ...(mode !== 'single' && goal ? { completionGoal: goal } : {}),
      ...(schedule?.recurrence ? { recurrence: schedule.recurrence } : {}),
      ...(schedule?.recurrenceDays?.length ? { recurrenceDays: schedule.recurrenceDays } : {}),
      ...(schedule?.timeWindow ? { timeWindow: schedule.timeWindow } : {}),
      ...(labelColor ? { labelColor } : {}),
    }
    saveHabits([...habits, h])
  }, [habits])

  const deleteHabit = useCallback((id: string) => {
    saveHabits(habits.filter((h) => h.id !== id))
  }, [habits])

  const editHabit = useCallback((id: string, name: string, emoji: string, categoryId: string, mode: CompletionMode = 'single', goal?: number, schedule?: ScheduleOptions, labelColor?: string) => {
    saveHabits(habits.map((h) => h.id === id ? {
      ...h, name: name.trim(), emoji, categoryId,
      completionMode: mode,
      completionGoal: mode !== 'single' && goal ? goal : undefined,
      pomodoroEnabled: mode === 'pomodoro',
      pomodoroGoal: mode === 'pomodoro' ? goal : undefined,
      recurrence: schedule?.recurrence ?? h.recurrence,
      recurrenceDays: schedule?.recurrenceDays ?? h.recurrenceDays,
      timeWindow: schedule?.timeWindow !== undefined ? schedule.timeWindow : h.timeWindow,
      labelColor: labelColor ?? undefined,
    } : h))
  }, [habits])

  const toggleHabitComplete = useCallback((habitId: string) => {
    const raw = logs[today]?.habits[habitId]
    const current = raw ? migrateHabitLog(raw) : defaultHabitLog()
    const nowCompleted = !current.completed
    const newLogs = patchDayHabitLog(habitId, logs, {
      completed: nowCompleted,
      completedAt: nowCompleted ? new Date().toISOString() : undefined,
    })
    saveLogs(newLogs)
    let p = { ...profile }
    if (nowCompleted) {
      const yesterday = yesterdayStr()
      if (p.lastActiveDate === today) { /* already today */ }
      else if (p.lastActiveDate === yesterday || !p.lastActiveDate) {
        p.streak = (p.streak || 0) + 1
        if (p.streak > p.longestStreak) p.longestStreak = p.streak
      } else {
        p.streak = 1
        if (1 > p.longestStreak) p.longestStreak = 1
      }
      p.lastActiveDate = today
    }
    saveProfile(syncProfile(newLogs, p))
  }, [logs, profile, today])

  const incrementCompletion = useCallback((habitId: string) => {
    const habit = habits.find((h) => h.id === habitId)
    if (!habit) return
    const goal = getHabitGoal(habit)
    const currentDay: DayLog = logs[today] ?? { date: today, habits: {} }
    const currentHL = migrateHabitLog(currentDay.habits[habitId] ?? {})
    const newCount = (currentHL.completionCount ?? 0) + 1
    const nowCompleted = !currentHL.completed && newCount >= goal
    const newLogs = patchDayHabitLog(habitId, logs, {
      completionCount: newCount,
      ...(nowCompleted ? { completed: true, completedAt: new Date().toISOString() } : {}),
    })
    saveLogs(newLogs)
    let p = { ...profile }
    if (nowCompleted) {
      const yesterday = yesterdayStr()
      if (p.lastActiveDate !== today) {
        if (p.lastActiveDate === yesterday || !p.lastActiveDate) {
          p.streak = (p.streak || 0) + 1
          if (p.streak > p.longestStreak) p.longestStreak = p.streak
        } else {
          p.streak = 1
          if (1 > p.longestStreak) p.longestStreak = 1
        }
        p.lastActiveDate = today
      }
      saveProfile(syncProfile(newLogs, p))
    } else {
      saveProfile(p)
    }
  }, [habits, logs, profile, today])

  const setHabitBoostMode = useCallback((habitId: string, on: boolean) => {
    const newLogs = patchDayHabitLog(habitId, logs, { boostMode: on })
    saveLogs(newLogs)
  }, [logs, today])

  const setHabitNote = useCallback((habitId: string, note: string) => {
    saveLogs(patchDayHabitLog(habitId, logs, { notes: note }))
  }, [logs])

  // xpAmount: 10=normal, 15=boost or extra. isBoost=true sets boostUsed. autoComplete=true marks habit done.
  const addPomodoroSession = useCallback((session: PomodoroSession, xpAmount: number = 10, isBoost: boolean = false, autoComplete: boolean = false) => {
    const currentDay: DayLog = logs[today] ?? { date: today, habits: {} }
    const currentHL: HabitLog = migrateHabitLog(currentDay.habits[session.habitId] ?? {})
    const newHL: HabitLog = {
      ...currentHL,
      pomodoroSessions: [...currentHL.pomodoroSessions, { ...session, xp: xpAmount }],
      ...(isBoost ? { boostUsed: true } : {}),
      ...(autoComplete ? { completed: true, completedAt: new Date().toISOString() } : {}),
    }
    const newLogs: DailyLogs = {
      ...logs,
      [today]: { ...currentDay, habits: { ...currentDay.habits, [session.habitId]: newHL } },
    }
    saveLogs(newLogs)
    let p = { ...profile }
    if (autoComplete) {
      const yesterday = yesterdayStr()
      if (p.lastActiveDate !== today) {
        if (p.lastActiveDate === yesterday || !p.lastActiveDate) {
          p.streak = (p.streak || 0) + 1
          if (p.streak > p.longestStreak) p.longestStreak = p.streak
        } else {
          p.streak = 1
          if (1 > p.longestStreak) p.longestStreak = 1
        }
        p.lastActiveDate = today
      }
      saveProfile(syncProfile(newLogs, p))
    } else {
      const newExp = p.totalExp + xpAmount
      p = { ...p, totalExp: newExp, level: getLevelFromExp(newExp) }
      p.badges = checkBadges(p, newLogs)
      saveProfile(p)
    }
  }, [logs, profile, today])

  const addFreeSession = useCallback((session: PomodoroSession) => {
    storage.addFreeSession(session)
    setFreeSessionsState(storage.getFreeSessions())
    const p = { ...profile, totalExp: profile.totalExp + 10 }
    p.level = getLevelFromExp(p.totalExp)
    p.badges = checkBadges(p, logs)
    saveProfile(p)
  }, [profile, logs])

  const updateUsername = useCallback((name: string) => { saveProfile({ ...profile, username: name }) }, [profile])

  const updatePomodoroSettings = useCallback((settings: PomodoroSettings) => {
    setPomodoroSettingsState(settings)
    storage.setPomodoroSettings(settings)
  }, [])

  const addCustomCategory = useCallback((cat: Category) => {
    storage.addCustomCategory(cat)
    setCategoriesState(storage.getCategories())
  }, [])

  const deleteCustomCategory = useCallback((id: string) => {
    storage.deleteCustomCategory(id)
    setCategoriesState(storage.getCategories())
  }, [])

  return (
    <AppContext.Provider value={{
      habits, logs, profile, pomodoroSettings, categories, todayLog, freeSessions,
      addHabit, deleteHabit, editHabit,
      toggleHabitComplete, incrementCompletion, setHabitBoostMode, setHabitNote, addJustStartXP,
      addPomodoroSession, addFreeSession,
      updateUsername, updatePomodoroSettings,
      addCustomCategory, deleteCustomCategory,
    }}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
