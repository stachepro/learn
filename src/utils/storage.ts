import type { Habit, DailyLogs, UserProfile, PomodoroSettings, Category, PomodoroSession, NoRushRecord, TodoItem, ActivePomodoroState, WakeRecord, WaterEntry, WaterGoalRecord } from '../types'
import { DEFAULT_CATEGORIES } from './categories'
import { persistNative, removeNativeAsync } from './nativeStorage'
import { captureError } from './errorReporting'
import { SCHEMA_VERSION, migrationsToRun, type MigrationOutcome } from './schema'
import { DAY_END_HOUR_KEY } from './date'
import { iconFromLegacyEmoji, isIconName, type IconName } from './icons'

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
  WATER_GOAL_HISTORY: 'luupi_water_goal_history',
  STORY_SEEN: 'luupi_story_seen',
  WELCOME_SEEN: 'luupi_welcome_seen',
  LAST_TOOL: 'luupi_last_tool',
  NOTIF_PREFS: 'luupi_notif_prefs',
  DAY_END_HOUR: DAY_END_HOUR_KEY,
  THEME: 'luupi_theme',
  JUST_START_STATE: 'luupi_just_start_state',
  JUST_START_STATS: 'luupi_just_start_stats',
  TODO_STATS: 'luupi_todo_stats',
} as const

export interface JustStartStoredState {
  date: string
  runId: string
  done: boolean[]
  active: number | null
  paused: boolean
  endAt: number | null
  pausedRemaining: number | null
  journeyRecorded: boolean
  rewardGranted: boolean
}

export interface JustStartStats {
  date: string
  today: number
  allTime: number
  lastRewardDate: string
  completedRunIds: string[]
  rewardedRunIds: string[]
  dailyCounts: Record<string, number>
}

export interface TodoStats {
  completedTaskIds: string[]
}

const EMPTY_JUST_START_STATS: JustStartStats = {
  date: '',
  today: 0,
  allTime: 0,
  lastRewardDate: '',
  completedRunIds: [],
  rewardedRunIds: [],
  dailyCounts: {},
}

export interface NotifPrefs {
  streakRisk: boolean
  dailySummary: boolean
}
const DEFAULT_NOTIF_PREFS: NotifPrefs = { streakRisk: true, dailySummary: true }

export const DEFAULT_WATER_BOTTLE_ML = 200
export const DEFAULT_WATER_GOAL_ML = 2500

function localDateString(date = new Date()): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

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
type LegacyHabit = Partial<Habit> & { id: string; name: string; createdAt: string; emoji?: string }
type LegacyCategory = Omit<Partial<Category>, 'icon'> & { id: string; name: string; color: string; icon?: IconName; emoji?: string }

export function migrateHabit(h: LegacyHabit, categoryIcon: IconName = 'sparkles'): Habit {
  const { emoji: _legacyEmoji, ...current } = h
  return {
    ...current,
    icon: isIconName(h.icon) ? h.icon : iconFromLegacyEmoji(h.emoji, categoryIcon),
    categoryId: h.categoryId ?? 'diger',
  }
}

export function migrateCategory(category: LegacyCategory): Category {
  const { emoji: _legacyEmoji, ...current } = category
  return {
    ...current,
    icon: isIconName(category.icon) ? category.icon : iconFromLegacyEmoji(category.emoji, 'shapes'),
  }
}

export const storage = {
  // null = hiç damgalanmamış (ilk kurulum ya da sürümlemeden önceki veri)
  getSchemaVersion: (): number | null => read<number | null>(KEYS.SCHEMA_VERSION, null),
  setSchemaVersion: (v: number) => write(KEYS.SCHEMA_VERSION, v),

  getHabits: (): Habit[] => {
    const raw = read<LegacyHabit[]>(KEYS.HABITS, [])
    const categoryIcons = new Map(storage.getCategories().map((category) => [category.id, category.icon]))
    return raw.map((h) => migrateHabit(h, categoryIcons.get(h.categoryId ?? '') ?? 'sparkles'))
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
    const custom = read<LegacyCategory[]>(KEYS.CATEGORIES, []).map(migrateCategory)
    return [...DEFAULT_CATEGORIES, ...custom]
  },
  getCustomCategories: (): Category[] => read<LegacyCategory[]>(KEYS.CATEGORIES, []).map(migrateCategory),
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
  getTodoStats: (): TodoStats => {
    const current = read<TodoStats | null>(KEYS.TODO_STATS, null)
    if (current) return { completedTaskIds: [...new Set(current.completedTaskIds ?? [])] }
    const migrated = { completedTaskIds: read<TodoItem[]>(KEYS.TODOS, []).filter((todo) => todo.done).map((todo) => todo.id) }
    write(KEYS.TODO_STATS, migrated)
    return migrated
  },
  recordTodoCompletion: (taskId: string): TodoStats => {
    const current = storage.getTodoStats()
    if (current.completedTaskIds.includes(taskId)) return current
    const next = { completedTaskIds: [...current.completedTaskIds, taskId] }
    write(KEYS.TODO_STATS, next)
    return next
  },

  getPomodoroActive: (): ActivePomodoroState | null => read<ActivePomodoroState | null>(KEYS.POMODORO_ACTIVE, null),
  setPomodoroActive: (state: ActivePomodoroState | null) => write(KEYS.POMODORO_ACTIVE, state),

  getWakeRecords: (): WakeRecord[] => read(KEYS.WAKE_RECORDS, []),
  addWakeRecord: (record: WakeRecord) => {
    const existing = read<WakeRecord[]>(KEYS.WAKE_RECORDS, [])
    write(KEYS.WAKE_RECORDS, [...existing.filter((r) => r.date !== record.date), record])
  },
  deleteWakeRecord: (date: string) => {
    const existing = read<WakeRecord[]>(KEYS.WAKE_RECORDS, [])
    write(KEYS.WAKE_RECORDS, existing.filter((record) => record.date !== date))
  },
  clearWakeRecords: () => write(KEYS.WAKE_RECORDS, []),
  getWakeGoal: (): string | null => read<string | null>(KEYS.WAKE_GOAL, null),
  setWakeGoal: (time: string) => {
    const previousGoal = storage.getWakeGoal()
    const records = storage.getWakeRecords()
    if (records.some((record) => record.goal === undefined)) {
      write(KEYS.WAKE_RECORDS, records.map((record) => record.goal === undefined ? { ...record, goal: previousGoal } : record))
    }
    write(KEYS.WAKE_GOAL, time)
  },

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
  getWaterGoalHistory: (): WaterGoalRecord[] =>
    read<WaterGoalRecord[]>(KEYS.WATER_GOAL_HISTORY, [])
      .filter((record) => record.date && Number.isFinite(record.ml))
      .sort((a, b) => a.date.localeCompare(b.date) || a.timestamp.localeCompare(b.timestamp)),
  getWaterGoalForDate: (date: string): number => {
    const history = storage.getWaterGoalHistory()
    const record = [...history].reverse().find((item) => item.date <= date)
    return record?.ml ?? storage.getWaterGoalMl()
  },
  setWaterGoalMl: (ml: number, effectiveDate = localDateString()) => {
    const clamped = Math.max(500, Math.min(6000, Math.round(ml / 50) * 50))
    const previousGoal = storage.getWaterGoalMl()
    const history = storage.getWaterGoalHistory()
    const now = new Date().toISOString()
    let next = history

    // İlk hedef değişikliğinde eski kayıtların o güne kadarki hedefini dondur.
    if (history.length === 0) {
      const earliestDate = storage.getWaterEntries().reduce<string | null>(
        (earliest, entry) => !earliest || entry.date < earliest ? entry.date : earliest,
        null,
      )
      if (earliestDate && earliestDate < effectiveDate) {
        next = [{ date: earliestDate, ml: previousGoal, timestamp: now }]
      }
    }

    next = [
      ...next.filter((record) => record.date !== effectiveDate),
      { date: effectiveDate, ml: clamped, timestamp: now },
    ].sort((a, b) => a.date.localeCompare(b.date) || a.timestamp.localeCompare(b.timestamp))
    write(KEYS.WATER_GOAL_HISTORY, next)
    write(KEYS.WATER_GOAL_ML, clamped)
  },
  // Günlük Özet su bölümünü yalnızca hedef gerçekten girilmişse gösterir —
  // getWaterGoalMl varsayılan döndürdüğü için "girilmiş mi" sorusuna cevap veremez
  hasWaterGoal: (): boolean => read<number | null>(KEYS.WATER_GOAL_ML, null) != null,

  // Özet story'si günde bir kez otomatik oynar; izlenen günün tarihi burada
  getStorySeenDate: (): string | null => read<string | null>(KEYS.STORY_SEEN, null),
  setStorySeenDate: (date: string) => write(KEYS.STORY_SEEN, date),

  // Hafif açılış ekranı bir kez gösterilir; kullanıcıyı bekletmez, sadece yön verir.
  getWelcomeSeen: (): boolean => read<boolean>(KEYS.WELCOME_SEEN, false),
  setWelcomeSeen: (seen: boolean) => write(KEYS.WELCOME_SEEN, seen),

  // Araçlar hub'ı bir sonraki açılışta hızlı bir "devam et" yüzeyi sunar.
  getLastToolPath: (): string | null => read<string | null>(KEYS.LAST_TOOL, null),
  setLastToolPath: (path: string) => write(KEYS.LAST_TOOL, path),

  // Bildirim tercihleri — hangi otomatik bildirimlerin planlanacağını belirler.
  // reminderNotifications planlamadan önce buradan okur; kapalıysa hiç kurulmaz.
  getNotifPrefs: (): NotifPrefs => ({ ...DEFAULT_NOTIF_PREFS, ...read<Partial<NotifPrefs>>(KEYS.NOTIF_PREFS, {}) }),
  setNotifPrefs: (prefs: NotifPrefs) => write(KEYS.NOTIF_PREFS, prefs),

  // Gün bitiş saati (0–4). date.getDayEndHour ile aynı değeri okur; buradaki
  // yazma yolu native kalıcılığı da sağlar (write → persistNative).
  getDayEndHour: (): number => {
    const n = read<number>(KEYS.DAY_END_HOUR, 0)
    return typeof n === 'number' && !Number.isNaN(n) ? Math.min(4, Math.max(0, Math.floor(n))) : 0
  },
  setDayEndHour: (h: number) => write(KEYS.DAY_END_HOUR, Math.min(4, Math.max(0, Math.floor(h)))),

  // Eski Just Start ekranı bu verileri namespaced olmayan iki localStorage
  // anahtarında tutuyordu. İlk okumada sessizce ortak depoya taşıyarak mevcut
  // yolculuğu korur; bundan sonraki kayıtlar native persistence ve export'a girer.
  getJustStartState: (): JustStartStoredState | null => {
    const current = read<JustStartStoredState | null>(KEYS.JUST_START_STATE, null)
    if (current) return current
    try {
      const legacy = JSON.parse(localStorage.getItem('juststart_state') || 'null') as Partial<JustStartStoredState> & { xpClaimed?: boolean } | null
      if (!legacy?.date || !Array.isArray(legacy.done)) return null
      const migrated: JustStartStoredState = {
        date: legacy.date,
        runId: legacy.runId ?? `${legacy.date}-legacy`,
        done: legacy.done,
        active: typeof legacy.active === 'number' ? legacy.active : null,
        paused: !!legacy.paused,
        endAt: typeof legacy.endAt === 'number' ? legacy.endAt : null,
        pausedRemaining: typeof legacy.pausedRemaining === 'number' ? legacy.pausedRemaining : null,
        journeyRecorded: !!legacy.xpClaimed,
        rewardGranted: !!legacy.xpClaimed,
      }
      write(KEYS.JUST_START_STATE, migrated)
      localStorage.removeItem('juststart_state')
      return migrated
    } catch { return null }
  },
  setJustStartState: (state: JustStartStoredState) => write(KEYS.JUST_START_STATE, state),

  getJustStartStats: (): JustStartStats => {
    const current = read<JustStartStats | null>(KEYS.JUST_START_STATS, null)
    if (current) {
      const dailyCounts = { ...(current.dailyCounts ?? {}) }
      if (current.date && current.today > 0 && dailyCounts[current.date] == null) dailyCounts[current.date] = current.today
      return { ...EMPTY_JUST_START_STATS, ...current, dailyCounts }
    }
    try {
      const legacy = JSON.parse(localStorage.getItem('juststart_stats') || 'null') as Partial<JustStartStats> | null
      const migratedState = read<JustStartStoredState | null>(KEYS.JUST_START_STATE, null)
      const migratedRewardDate = migratedState?.rewardGranted ? migratedState.date : ''
      if (!legacy) return { ...EMPTY_JUST_START_STATS, lastRewardDate: migratedRewardDate }
      const migrated: JustStartStats = {
        ...EMPTY_JUST_START_STATS,
        date: legacy.date ?? '',
        today: legacy.today ?? 0,
        allTime: legacy.allTime ?? 0,
        lastRewardDate: legacy.lastRewardDate ?? migratedRewardDate,
        dailyCounts: legacy.date && legacy.today ? { [legacy.date]: legacy.today } : {},
      }
      write(KEYS.JUST_START_STATS, migrated)
      localStorage.removeItem('juststart_stats')
      return migrated
    } catch { return { ...EMPTY_JUST_START_STATS } }
  },

  recordJustStartRun: (runId: string, date: string): { stats: JustStartStats; isNew: boolean; rewardGranted: boolean } => {
    const previous = storage.getJustStartStats()
    const alreadyRecorded = previous.completedRunIds.includes(runId)
    if (alreadyRecorded) {
      return { stats: previous, isNew: false, rewardGranted: previous.rewardedRunIds.includes(runId) }
    }
    const rewardGranted = previous.lastRewardDate !== date
    const stats: JustStartStats = {
      date,
      today: previous.date === date ? previous.today + 1 : 1,
      allTime: previous.allTime + 1,
      lastRewardDate: rewardGranted ? date : previous.lastRewardDate,
      completedRunIds: [...previous.completedRunIds, runId].slice(-40),
      rewardedRunIds: rewardGranted ? [...previous.rewardedRunIds, runId].slice(-40) : previous.rewardedRunIds,
      dailyCounts: { ...previous.dailyCounts, [date]: (previous.dailyCounts[date] ?? 0) + 1 },
    }
    write(KEYS.JUST_START_STATS, stats)
    return { stats, isNew: true, rewardGranted }
  },
}

// ── Veri yönetimi: tüm luupi_ anahtarlarını dışa/içe aktar, sıfırla ──
const ALL_KEYS: readonly string[] = Object.values(KEYS)

export interface ExportBundle {
  app: 'luupi'
  version: number
  exportedAt: string
  data: Record<string, unknown>
}

export interface ImportPreview {
  exportedAt: string
  version: number
  itemCount: number
  data: Record<string, unknown>
}

// Kayıtlı tüm verinin JSON metnini üretir (yedekleme / taşıma için).
export function exportData(): string {
  const data: Record<string, unknown> = {}
  for (const key of ALL_KEYS) {
    try {
      const raw = localStorage.getItem(key)
      if (raw != null) data[key] = JSON.parse(raw)
    } catch { /* okunamayan anahtarı atla */ }
  }
  const bundle: ExportBundle = {
    app: 'luupi',
    version: storage.getSchemaVersion() ?? SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    data,
  }
  return JSON.stringify(bundle, null, 2)
}

// Yedek metnini içe aktarır. Yalnızca tanınan luupi_ anahtarları yazılır;
// başarılıysa true döner (çağıran genelde sayfayı yeniler).
function isCompatibleImportValue(key: string, value: unknown): boolean {
  if ([KEYS.HABITS, KEYS.CATEGORIES, KEYS.FREE_SESSIONS, KEYS.NO_RUSH_HISTORY, KEYS.TODOS, KEYS.WAKE_RECORDS, KEYS.WATER_ENTRIES, KEYS.WATER_GOAL_HISTORY].includes(key as never)) return Array.isArray(value)
  if ([KEYS.DAILY_LOGS, KEYS.USER_PROFILE, KEYS.POMODORO_SETTINGS, KEYS.NOTIF_PREFS, KEYS.JUST_START_STATS, KEYS.TODO_STATS].includes(key as never)) return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
  if ([KEYS.SCHEMA_VERSION, KEYS.WATER_BOTTLE_ML, KEYS.WATER_GOAL_ML, KEYS.DAY_END_HOUR].includes(key as never)) return typeof value === 'number' && Number.isFinite(value)
  if ([KEYS.SOUND_ENABLED, KEYS.WELCOME_SEEN].includes(key as never)) return typeof value === 'boolean'
  if (key === KEYS.THEME) return value === 'light' || value === 'dark' || value === 'system'
  if ([KEYS.WAKE_GOAL, KEYS.STORY_SEEN, KEYS.LAST_TOOL].includes(key as never)) return value === null || typeof value === 'string'
  return true
}

export function inspectImportData(json: string): ImportPreview | null {
  let bundle: unknown
  try { bundle = JSON.parse(json) } catch { return null }
  if (!bundle || typeof bundle !== 'object') return null
  const b = bundle as Partial<ExportBundle>
  if (b.app !== 'luupi' || !b.data || typeof b.data !== 'object' || Array.isArray(b.data)) return null
  if (typeof b.version !== 'number' || !Number.isFinite(b.version) || typeof b.exportedAt !== 'string' || Number.isNaN(Date.parse(b.exportedAt))) return null
  if (b.version > SCHEMA_VERSION) return null
  const allowed = new Set(ALL_KEYS)
  const data: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(b.data)) {
    if (!allowed.has(key)) continue
    if (!isCompatibleImportValue(key, value)) return null
    data[key] = value
  }
  if (Object.keys(data).length === 0) return null
  return { exportedAt: b.exportedAt, version: b.version, itemCount: Object.keys(data).length, data }
}

export function applyImportPreview(preview: ImportPreview): boolean {
  if (!preview.data || Object.keys(preview.data).length === 0) return false
  const importedCategories = Array.isArray(preview.data[KEYS.CATEGORIES])
    ? (preview.data[KEYS.CATEGORIES] as LegacyCategory[]).map(migrateCategory)
    : storage.getCustomCategories()
  const categoryIcons = new Map([...DEFAULT_CATEGORIES, ...importedCategories].map((category) => [category.id, category.icon]))
  for (const [key, value] of Object.entries(preview.data)) {
    if (key === KEYS.CATEGORIES && Array.isArray(value)) {
      write(key, importedCategories)
    } else if (key === KEYS.HABITS && Array.isArray(value)) {
      write(key, (value as LegacyHabit[]).map((habit) => migrateHabit(habit, categoryIcons.get(habit.categoryId ?? '') ?? 'sparkles')))
    } else {
      write(key, value)
    }
  }
  storage.setSchemaVersion(SCHEMA_VERSION)
  return true
}

export function importData(json: string): boolean {
  const preview = inspectImportData(json)
  return preview ? applyImportPreview(preview) : false
}

// Tüm luupi_ verisini kalıcı olarak siler (localStorage + native Preferences).
export async function resetAllData(): Promise<void> {
  const nativeRemovals: Promise<void>[] = []
  for (const key of [...ALL_KEYS, 'juststart_state', 'juststart_stats']) {
    try { localStorage.removeItem(key) } catch { /* ignore */ }
    nativeRemovals.push(removeNativeAsync(key))
  }
  await Promise.all(nativeRemovals)
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
      read<unknown>(KEYS.HABITS, null) != null ||
      read<unknown>(KEYS.CATEGORIES, null) != null
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
  if (current < 4) {
    const categories = storage.getCustomCategories()
    write(KEYS.CATEGORIES, categories)
    const categoryIcons = new Map(storage.getCategories().map((category) => [category.id, category.icon]))
    const habits = read<LegacyHabit[]>(KEYS.HABITS, []).map((habit) =>
      migrateHabit(habit, categoryIcons.get(habit.categoryId ?? '') ?? 'sparkles'))
    write(KEYS.HABITS, habits)
  }
  storage.setSchemaVersion(SCHEMA_VERSION)
  return { status: 'migrated', from: current, ran: steps.map((s) => s.to) }
}
