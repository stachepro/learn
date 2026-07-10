import type { Habit, DailyLogs, UserProfile, PomodoroSettings, Category, PomodoroSession, NoRushRecord, TodoItem, ActivePomodoroState, WakeRecord, WaterEntry } from '../types'
import { DEFAULT_CATEGORIES } from './categories'
import { persistNative } from './nativeStorage'
import { captureError } from './errorReporting'
import { SCHEMA_VERSION, migrationsToRun, type MigrationOutcome } from './schema'

const KEYS = {
  SCHEMA_VERSION: 'luupi_schema_version',
  HABITS: 'luupi_habits',
  DAILY_LOGS: 'luupi_daily_logs',
  USER_PROFILE: 'luupi_user_profile',
  POMODORO_SETTINGS: 'luupi_pomodoro_settings',
  CATEGORIES: 'luupi_categories',
  FREE_SESSIONS: 'luupi_free_sessions',
  SOUND_ENABLED: 'luupi_sound_enabled',
  NO_RUSH_HISTORY: 'luupi_no_rush_history',
  TODOS: 'luupi_todos',
  POMODORO_ACTIVE: 'luupi_pomodoro_active',
  WAKE_RECORDS: 'luupi_wake_records',
  WAKE_GOAL: 'luupi_wake_goal',
  WATER_ENTRIES: 'luupi_water_entries',
  WATER_BOTTLE_ML: 'luupi_water_bottle_ml',
  WATER_GOAL_ML: 'luupi_water_goal_ml',
} as const

export const DEFAULT_WATER_BOTTLE_ML = 200
export const DEFAULT_WATER_GOAL_ML = 2500

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch { return fallback }
}

// localStorage doluysa setItem QuotaExceededError fırlatır. Yakalanmazsa yazma
// çağrısının geldiği yer (bir tamamlama, bir not) uygulamayı çökertir.
// Native'de kalıcı depo Preferences olduğu için önce oraya yazılır: localStorage
// başarısız olsa bile veri hayatta kalır.
function write<T>(key: string, value: T): void {
  const raw = JSON.stringify(value)
  persistNative(key, raw)
  try {
    localStorage.setItem(key, raw)
  } catch (err) {
    captureError(err, 'manual')
    window.dispatchEvent(new CustomEvent('luupi-storage-full', { detail: key }))
  }
}

// Kayıtlı alışkanlığı okurken eksik alanları tamamlar. Tüm alanları tek tek
// saymak yerine yayılım kullanır: aksi halde Habit'e eklenen her yeni alan
// (labelColor, timeOfDay gibi) burada listelenmediği için sessizce silinir.
export function migrateHabit(h: Partial<Habit> & { id: string; name: string; createdAt: string }): Habit {
  return {
    ...h,
    emoji: h.emoji ?? '⭐',
    categoryId: h.categoryId ?? 'diger',
  }
}

export const storage = {
  // null = hiç damgalanmamış (ilk kurulum ya da sürümlemeden önceki veri)
  getSchemaVersion: (): number | null => read<number | null>(KEYS.SCHEMA_VERSION, null),
  setSchemaVersion: (v: number) => write(KEYS.SCHEMA_VERSION, v),

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
    try {
      localStorage.setItem(KEYS.SOUND_ENABLED, on ? 'true' : 'false')
      persistNative(KEYS.SOUND_ENABLED, on ? 'true' : 'false')
    } catch { /* ignore */ }
  },

  getNoRushHistory: (): NoRushRecord[] => read(KEYS.NO_RUSH_HISTORY, []),
  addNoRushRecord: (record: NoRushRecord) => {
    const existing = read<NoRushRecord[]>(KEYS.NO_RUSH_HISTORY, [])
    write(KEYS.NO_RUSH_HISTORY, [record, ...existing])
  },
  deleteNoRushRecord: (id: string) => {
    const existing = read<NoRushRecord[]>(KEYS.NO_RUSH_HISTORY, [])
    write(KEYS.NO_RUSH_HISTORY, existing.filter((r) => r.id !== id))
  },

  getTodos: (): TodoItem[] => read(KEYS.TODOS, []),
  setTodos: (todos: TodoItem[]) => write(KEYS.TODOS, todos),

  getPomodoroActive: (): ActivePomodoroState | null => read<ActivePomodoroState | null>(KEYS.POMODORO_ACTIVE, null),
  setPomodoroActive: (state: ActivePomodoroState | null) => write(KEYS.POMODORO_ACTIVE, state),

  getWakeRecords: (): WakeRecord[] => read(KEYS.WAKE_RECORDS, []),
  addWakeRecord: (record: WakeRecord) => {
    const existing = read<WakeRecord[]>(KEYS.WAKE_RECORDS, [])
    write(KEYS.WAKE_RECORDS, [...existing.filter((r) => r.date !== record.date), record])
  },
  clearWakeRecords: () => write(KEYS.WAKE_RECORDS, []),
  getWakeGoal: (): string | null => read<string | null>(KEYS.WAKE_GOAL, null),
  setWakeGoal: (time: string) => write(KEYS.WAKE_GOAL, time),

  getWaterEntries: (): WaterEntry[] => read(KEYS.WATER_ENTRIES, []),
  addWaterEntry: (entry: WaterEntry) => {
    const existing = read<WaterEntry[]>(KEYS.WATER_ENTRIES, [])
    write(KEYS.WATER_ENTRIES, [...existing, entry])
  },
  deleteWaterEntry: (id: string) => {
    const existing = read<WaterEntry[]>(KEYS.WATER_ENTRIES, [])
    write(KEYS.WATER_ENTRIES, existing.filter((e) => e.id !== id))
  },
  clearWaterEntries: () => write(KEYS.WATER_ENTRIES, []),

  getWaterBottleMl: (): number => read<number>(KEYS.WATER_BOTTLE_ML, DEFAULT_WATER_BOTTLE_ML),
  setWaterBottleMl: (ml: number) => write(KEYS.WATER_BOTTLE_ML, ml),

  getWaterGoalMl: (): number => read<number>(KEYS.WATER_GOAL_ML, DEFAULT_WATER_GOAL_ML),
  setWaterGoalMl: (ml: number) => write(KEYS.WATER_GOAL_ML, ml),
  // Günlük Özet su bölümünü yalnızca hedef gerçekten girilmişse gösterir —
  // getWaterGoalMl varsayılan döndürdüğü için "girilmiş mi" sorusuna cevap veremez
  hasWaterGoal: (): boolean => read<number | null>(KEYS.WATER_GOAL_ML, null) != null,
}

/* Açılışta, React render edilmeden önce çalışır.

   Damga yoksa iki ihtimal var: gerçek ilk kurulum (hiç veri yok) damgalanıp
   geçilir; veri var ama damga yoksa bu, sürümleme öncesi kayıttır — v1 biçimiyle
   birebir aynıdır (eski alan adlarını okuma sırasında migrateHabit ve
   migrateHabitLog çeviriyor), v1 sayılır ve sonraki adımlar çalıştırılır.

   Veri uygulamadan yeniyse (kullanıcı sürüm düşürdü) hiçbir şeye dokunulmaz —
   anlamadığımız bir biçimi bozmaktansa okumaya çalışmak yeğdir. */
export function runMigrations(): MigrationOutcome {
  let current = storage.getSchemaVersion()

  if (current == null) {
    const hasData =
      read<unknown>(KEYS.USER_PROFILE, null) != null ||
      read<unknown>(KEYS.HABITS, null) != null
    if (!hasData) {
      storage.setSchemaVersion(SCHEMA_VERSION)
      return { status: 'fresh' }
    }
    current = 1
  }
  if (current > SCHEMA_VERSION) {
    captureError(new Error(`Kayıtlı veri sürümü ${current}, uygulama ${SCHEMA_VERSION} bekliyor`), 'manual')
    return { status: 'downgrade', from: current }
  }
  if (current === SCHEMA_VERSION) return { status: 'current' }

  const steps = migrationsToRun(current)
  for (const step of steps) step.run()
  storage.setSchemaVersion(SCHEMA_VERSION)
  return { status: 'migrated', from: current, ran: steps.map((s) => s.to) }
}
