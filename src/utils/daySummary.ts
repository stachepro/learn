import type { Habit, HabitLog, DayLog, PomodoroSession, NoRushRecord, TodoItem } from '../types'
import { FREE_ID } from '../context/PomodoroContext'
import { storage } from './storage'
import { migrateHabitLog } from './habitLog'
import { isHabitScheduledFor } from './habitSchedule'
import { dayTotalMl } from './water'
import { isWakeOnGoal, wakeGoalDifference } from './wake'
import type { IconName } from './icons'

export type SummaryHabitStatus = 'completed' | 'skipped' | 'pending'

/* Günlük Özet'in tek veri kaynağı: statik sayfa ve story slaytları aynı
   yapıyı okur. Kural: su/uyanma yalnızca hedef GİRİLMİŞSE var (null =
   bölüm/slayt hiç gösterilmez); araçlarda yalnızca o gün TAMAMLANANLAR. */

export interface DaySummary {
  date: string
  habitEntries: { habit: Habit; log: HabitLog; status: SummaryHabitStatus }[]
  doneCount: number
  skippedCount: number
  pendingCount: number
  water: { goal: number; actual: number } | null
  wake: { goal: string; actualTime: string | null; onTime: boolean } | null
  sessions: PomodoroSession[]
  totalPomMin: number
  noRush: NoRushRecord[]
  todos: TodoItem[]
  justStartCount: number
}

export function collectDaySummary(
  habits: Habit[],
  todayLog: DayLog,
  freeSessions: PomodoroSession[],
  date: string,
): DaySummary {
  const habitEntries = habits
    .filter((h) => isHabitScheduledFor(h, date))
    .map((h) => {
      const log = migrateHabitLog(todayLog.habits[h.id] ?? {})
      const status: SummaryHabitStatus = log.completed ? 'completed' : log.skippedAt ? 'skipped' : 'pending'
      return { habit: h, log, status }
    })

  const water = storage.hasWaterGoal()
    ? { goal: storage.getWaterGoalForDate(date), actual: dayTotalMl(storage.getWaterEntries(), date) }
    : null

  const wakeGoal = storage.getWakeGoal()
  const wakeRecord = wakeGoal ? storage.getWakeRecords().find((r) => r.date === date) : undefined
  const recordGoal = wakeRecord?.goal === undefined ? wakeGoal : wakeRecord.goal
  const wake = wakeGoal
    ? { goal: recordGoal ?? wakeGoal, actualTime: wakeRecord?.time ?? null, onTime: !!wakeRecord && isWakeOnGoal(wakeRecord, wakeGoal) === true }
    : null

  const habitSessions = Object.values(todayLog.habits)
    .flatMap((raw) => migrateHabitLog(raw).pomodoroSessions)
  const sessions = [...habitSessions, ...freeSessions.filter((s) => s.date === date)]
    .sort((a, b) => a.timestamp.localeCompare(b.timestamp))

  const doneCount = habitEntries.filter(({ status }) => status === 'completed').length
  const skippedCount = habitEntries.filter(({ status }) => status === 'skipped').length
  const justStartCount = storage.getJustStartStats().dailyCounts[date] ?? 0

  return {
    date,
    habitEntries,
    doneCount,
    skippedCount,
    pendingCount: habitEntries.length - doneCount - skippedCount,
    water,
    wake,
    sessions,
    totalPomMin: sessions.reduce((acc, s) => acc + s.workDuration, 0),
    noRush: storage.getNoRushHistory().filter((r) => r.completedAt.startsWith(date)),
    todos: storage.getTodos().filter((t) => t.done && t.completedAt?.startsWith(date)),
    justStartCount,
  }
}

export function summaryHasAnything(s: DaySummary): boolean {
  return s.habitEntries.length > 0 || s.water !== null || s.wake !== null ||
    s.sessions.length > 0 || s.noRush.length > 0 || s.todos.length > 0
}

export function summaryHasActivity(s: DaySummary): boolean {
  return s.doneCount > 0 || s.skippedCount > 0 || (s.water?.actual ?? 0) > 0 || !!s.wake?.actualTime ||
    s.sessions.length > 0 || s.noRush.length > 0 || s.todos.length > 0 || s.justStartCount > 0
}

export function sessionLabel(s: PomodoroSession, habits: Habit[]): { icon: IconName; name: string } {
  if (s.habitId === FREE_ID) return { icon: 'yoga', name: 'Serbest odak' }
  const h = habits.find((x) => x.id === s.habitId)
  return h ? { icon: h.icon, name: h.name } : { icon: 'timer', name: 'Pomodoro' }
}

/* ── Gün puanı ──────────────────────────────────────────────
   Yalnızca o gün MEVCUT olan hedefler puana girer; olmayan bileşen
   paydaya da girmez (hedef koymayan cezalanmaz):
   - Alışkanlıklar (ağırlık 5): tamamlama oranı
   - Su (2.5): içilen/hedef, 1'de kırpılır
   - Uyanma (2.5): hedefte 1; gecikmeye göre kademeli düşer; kayıt yoksa 0
   Araç kullanımı (pomodoro / Acele Yok / to-do) hedef değil davranıştır:
   ağırlıklı ortalamaya girmez, kullanılan araç başına +0.4 bonus verir.
   Hiç hedefli bileşen yoksa puan yalnızca araç kullanımından türetilir;
   o da yoksa puan yok (null). */

export interface DayScore {
  score: number | null   // 0–10, bir ondalık; null = puanlanacak veri yok
  label: string
  icon: IconName
}

function wakePart(wake: NonNullable<DaySummary['wake']>): number {
  if (!wake.actualTime) return 0
  const late = wakeGoalDifference(wake.actualTime, wake.goal)
  if (late <= 0) return 1
  if (late <= 15) return 0.8
  if (late <= 30) return 0.6
  if (late <= 60) return 0.4
  return 0.2
}

export function calcDayScore(s: DaySummary): DayScore {
  const parts: { weight: number; value: number }[] = []
  if (s.habitEntries.length > 0) parts.push({ weight: 5, value: s.doneCount / s.habitEntries.length })
  if (s.water) parts.push({ weight: 2.5, value: Math.min(1, s.water.actual / s.water.goal) })
  if (s.wake) parts.push({ weight: 2.5, value: wakePart(s.wake) })

  const toolsUsed = [s.sessions.length, s.justStartCount, s.noRush.length, s.todos.length].filter((n) => n > 0).length

  let score: number | null
  if (parts.length > 0) {
    const totalW = parts.reduce((a, p) => a + p.weight, 0)
    const base = 10 * parts.reduce((a, p) => a + p.weight * p.value, 0) / totalW
    score = Math.min(10, base + 0.4 * toolsUsed)
  } else if (toolsUsed > 0) {
    // Hedefsiz gün ama üretkenlik var: 1 araç → 7, 2 → 9, 3 → 10
    score = Math.min(10, 5 + 2 * toolsUsed)
  } else {
    score = null
  }

  if (score === null) return { score: null, label: 'Bugün puanlanacak kayıt yok', icon: 'cloud' }
  score = Math.round(score * 10) / 10
  if (score >= 9) return { score, label: 'Efsane bir gün!', icon: 'trophy' }
  if (score >= 7.5) return { score, label: 'Harika bir gün', icon: 'star' }
  if (score >= 6) return { score, label: 'Sağlam bir gün', icon: 'barbell' }
  if (score >= 4) return { score, label: 'Fena değil', icon: 'seedling' }
  return { score, label: 'Yarın yeni bir gün', icon: 'sunrise' }
}
