import type { Habit, DailyLogs, UserProfile, PomodoroSettings, Category, PomodoroSession } from '../types'
import { DEFAULT_CATEGORIES } from './categories'

const KEYS = {
  HABITS: 'luupi_habits',
  DAILY_LOGS: 'luupi_daily_logs',
  USER_PROFILE: 'luupi_user_profile',
  POMODORO_SETTINGS: 'luupi_pomodoro_settings',
  CATEGORIES: 'luupi_categories',
  FREE_SESSIONS: 'luupi_free_sessions',
  SOUND_ENABLED: 'luupi_sound_enabled',
} as const

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch { return fallback }
}

function write<T>(key: string, value: T): void {
  localStorage.setItem(key, JSON.stringify(value))
}

function migrateHabit(h: Partial<Habit> & { id: string; name: string; createdAt: string }): Habit {
  return {
    id: h.id,
    name: h.name,
    createdAt: h.createdAt,
    emoji: h.emoji ?? '⭐',
    categoryId: h.categoryId ?? 'diger',
    ...(h.completionMode != null && { completionMode: h.completionMode }),
    ...(h.completionGoal != null && { completionGoal: h.completionGoal }),
    ...(h.pomodoroEnabled != null && { pomodoroEnabled: h.pomodoroEnabled }),
    ...(h.pomodoroGoal != null && { pomodoroGoal: h.pomodoroGoal }),
    ...(h.recurrence != null && { recurrence: h.recurrence }),
    ...(h.recurrenceDays != null && { recurrenceDays: h.recurrenceDays }),
    ...(h.timeWindow != null && { timeWindow: h.timeWindow }),
    ...(h.createdDate != null && { createdDate: h.createdDate }),
  }
}

export const storage = {
  getHabits: (): Habit[] => {
    const raw = read<Partial<Habit>[]>(KEYS.HABITS, [])
    return raw.map((h) => migrateHabit(h as Partial<Habit> & { id: string; name: string; createdAt: string }))
  },
  setHabits: (habits: Habit[]) => write(KEYS.HABITS, habits),

  getDailyLogs: (): DailyLogs => read(KEYS.DAILY_LOGS, {}),
  setDailyLogs: (logs: DailyLogs) => write(KEYS.DAILY_LOGS, logs),

  getUserProfile: (): UserProfile =>
    read(KEYS.USER_PROFILE, {
      username: 'Luupi Kullanıcısı', streak: 0, longestStreak: 0,
      totalExp: 0, level: 1, badges: [], lastActiveDate: '',
    }),
  setUserProfile: (profile: UserProfile) => write(KEYS.USER_PROFILE, profile),

  getPomodoroSettings: (): PomodoroSettings =>
    read(KEYS.POMODORO_SETTINGS, { workDuration: 25, breakDuration: 5, autoLoop: false }),
  setPomodoroSettings: (settings: PomodoroSettings) =>
    write(KEYS.POMODORO_SETTINGS, settings),

  getCategories: (): Category[] => {
    const custom = read<Category[]>(KEYS.CATEGORIES, [])
    return [...DEFAULT_CATEGORIES, ...custom]
  },
  getCustomCategories: (): Category[] => read<Category[]>(KEYS.CATEGORIES, []),
  addCustomCategory: (cat: Category) => {
    const existing = read<Category[]>(KEYS.CATEGORIES, [])
    write(KEYS.CATEGORIES, [...existing, cat])
  },
  deleteCustomCategory: (id: string) => {
    const existing = read<Category[]>(KEYS.CATEGORIES, [])
    write(KEYS.CATEGORIES, existing.filter((c) => c.id !== id))
  },

  getFreeSessions: (): PomodoroSession[] => read(KEYS.FREE_SESSIONS, []),
  addFreeSession: (session: PomodoroSession) => {
    const existing = read<PomodoroSession[]>(KEYS.FREE_SESSIONS, [])
    write(KEYS.FREE_SESSIONS, [...existing, session])
  },

  getSoundEnabled: (): boolean => {
    try { return localStorage.getItem(KEYS.SOUND_ENABLED) !== 'false' } catch { return true }
  },
  setSoundEnabled: (on: boolean): void => {
    try { localStorage.setItem(KEYS.SOUND_ENABLED, on ? 'true' : 'false') } catch { /* ignore */ }
  },
}
