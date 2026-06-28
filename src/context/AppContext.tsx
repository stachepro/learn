import {
  createContext, useContext, useState, useCallback, useEffect, type ReactNode,
} from 'react'
import { storage } from '../utils/storage'
import { getLevelFromExp, calcHabitExp } from '../utils/exp'
import { checkBadges } from '../utils/badges'
import { todayStr, yesterdayStr } from '../utils/date'
import type {
  Habit, DailyLogs, DayLog, HabitLog, UserProfile,
  PomodoroSession, PomodoroSettings, Category,
} from '../types'

interface AppContextValue {
  habits: Habit[]
  logs: DailyLogs
  profile: UserProfile
  pomodoroSettings: PomodoroSettings
  categories: Category[]
  todayLog: DayLog
  freeSessions: PomodoroSession[]
  addHabit: (name: string, emoji: string, categoryId: string) => void
  deleteHabit: (id: string) => void
  editHabit: (id: string, name: string, emoji: string, categoryId: string) => void
  toggleHabitComplete: (habitId: string) => void
  setHabitBoostMode: (habitId: string, on: boolean) => void
  setHabitNote: (habitId: string, note: string) => void
  addPomodoroSession: (session: PomodoroSession, xpAmount?: number) => void
  addFreeSession: (session: PomodoroSession) => void
  updateUsername: (name: string) => void
  updatePomodoroSettings: (settings: PomodoroSettings) => void
  addCustomCategory: (cat: Category) => void
  deleteCustomCategory: (id: string) => void
}

const AppContext = createContext<AppContextValue | null>(null)

function defaultHabitLog(): HabitLog {
  return { completed: false, boostMode: false, boostUsed: false, notes: '', pomodoroSessions: [] }
}

function migrateHabitLog(raw: Partial<HabitLog>): HabitLog {
  return {
    completed: raw.completed ?? false,
    boostMode: (raw as { hardMode?: boolean }).hardMode ?? raw.boostMode ?? false,
    boostUsed: raw.boostUsed ?? false,
    notes: raw.notes ?? '',
    pomodoroSessions: raw.pomodoroSessions ?? [],
    completedAt: raw.completedAt,
  }
}

function recalcExp(logs: DailyLogs): number {
  let total = 0
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
    const totalExp = recalcExp(newLogs)
    const p = { ...base, totalExp, level: getLevelFromExp(totalExp) }
    p.badges = checkBadges(p, newLogs)
    return p
  }

  const addHabit = useCallback((name: string, emoji: string, categoryId: string) => {
    const h: Habit = { id: crypto.randomUUID(), name: name.trim(), emoji, categoryId, createdAt: new Date().toISOString() }
    saveHabits([...habits, h])
  }, [habits])

  const deleteHabit = useCallback((id: string) => {
    saveHabits(habits.filter((h) => h.id !== id))
  }, [habits])

  const editHabit = useCallback((id: string, name: string, emoji: string, categoryId: string) => {
    saveHabits(habits.map((h) => h.id === id ? { ...h, name: name.trim(), emoji, categoryId } : h))
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

  const setHabitBoostMode = useCallback((habitId: string, on: boolean) => {
    const newLogs = patchDayHabitLog(habitId, logs, { boostMode: on })
    saveLogs(newLogs)
  }, [logs, today])

  const setHabitNote = useCallback((habitId: string, note: string) => {
    saveLogs(patchDayHabitLog(habitId, logs, { notes: note }))
  }, [logs])

  // xpAmount: 10 = normal, 15 = boost success. Sets boostUsed=true if xpAmount > 10.
  const addPomodoroSession = useCallback((session: PomodoroSession, xpAmount: number = 10) => {
    const currentDay: DayLog = logs[today] ?? { date: today, habits: {} }
    const currentHL: HabitLog = migrateHabitLog(currentDay.habits[session.habitId] ?? {})
    const isBoostSuccess = xpAmount > 10
    const newLogs: DailyLogs = {
      ...logs,
      [today]: {
        ...currentDay,
        habits: {
          ...currentDay.habits,
          [session.habitId]: {
            ...currentHL,
            pomodoroSessions: [...currentHL.pomodoroSessions, { ...session, xp: xpAmount }],
            ...(isBoostSuccess ? { boostUsed: true } : {}),
          },
        },
      },
    }
    saveLogs(newLogs)
    const p = { ...profile, totalExp: profile.totalExp + xpAmount }
    p.level = getLevelFromExp(p.totalExp)
    p.badges = checkBadges(p, newLogs)
    saveProfile(p)
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
      toggleHabitComplete, setHabitBoostMode, setHabitNote,
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
