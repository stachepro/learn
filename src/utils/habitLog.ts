import type { HabitLog } from '../types'

export function defaultHabitLog(): HabitLog {
  return { completed: false, boostMode: false, boostUsed: false, notes: '', pomodoroSessions: [], completionCount: 0 }
}

// Eski kayıtlarda boostMode'un adı hardMode'du; okurken yeni ada çevrilir.
export function migrateHabitLog(raw: Partial<HabitLog>): HabitLog {
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
