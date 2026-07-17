import type { WakeRecord } from '../types'
import { addDaysStr } from './date'

export function timeToMinutes(time: string): number {
  const [hour, minute] = time.split(':').map(Number)
  return hour * 60 + minute
}

export function minutesToTime(minutes: number): string {
  const normalized = ((Math.round(minutes) % 1440) + 1440) % 1440
  return `${String(Math.floor(normalized / 60)).padStart(2, '0')}:${String(normalized % 60).padStart(2, '0')}`
}

// Saatler doğrusal değildir: 23:50 ve 00:10 ortalaması 12:00 değil 00:00'dır.
export function averageWakeTime(records: WakeRecord[]): string | null {
  if (records.length === 0) return null
  let sin = 0
  let cos = 0
  for (const record of records) {
    const angle = timeToMinutes(record.time) / 1440 * Math.PI * 2
    sin += Math.sin(angle)
    cos += Math.cos(angle)
  }
  let angle = Math.atan2(sin / records.length, cos / records.length)
  if (angle < 0) angle += Math.PI * 2
  return minutesToTime(angle / (Math.PI * 2) * 1440)
}

export function earliestWakeTime(records: WakeRecord[]): string | null {
  if (records.length === 0) return null
  return records.reduce((earliest, record) => timeToMinutes(record.time) < timeToMinutes(earliest) ? record.time : earliest, records[0].time)
}

export function latestWakeTime(records: WakeRecord[]): string | null {
  if (records.length === 0) return null
  return records.reduce((latest, record) => timeToMinutes(record.time) > timeToMinutes(latest) ? record.time : latest, records[0].time)
}

export function wakeGoalDifference(time: string, goal: string): number {
  let difference = timeToMinutes(time) - timeToMinutes(goal)
  if (difference > 720) difference -= 1440
  if (difference < -720) difference += 1440
  return difference
}

export function wakeGoalForRecord(record: WakeRecord, currentGoal: string | null): string | null {
  return record.goal === undefined ? currentGoal : record.goal
}

export function isWakeOnGoal(record: WakeRecord, currentGoal: string | null): boolean | null {
  const goal = wakeGoalForRecord(record, currentGoal)
  return goal ? wakeGoalDifference(record.time, goal) <= 0 : null
}

export function wakeRhythmStreak(records: WakeRecord[], today: string): number {
  const dates = new Set(records.map((record) => record.date))
  let cursor = dates.has(today) ? today : addDaysStr(today, -1)
  let streak = 0
  while (dates.has(cursor)) {
    streak += 1
    cursor = addDaysStr(cursor, -1)
  }
  return streak
}

export function wakeGoalRate(records: WakeRecord[], currentGoal: string | null): number | null {
  const measured = records.filter((record) => wakeGoalForRecord(record, currentGoal) !== null)
  if (measured.length === 0) return null
  const onGoal = measured.filter((record) => isWakeOnGoal(record, currentGoal)).length
  return Math.round(onGoal / measured.length * 100)
}

export function formatWakeDifference(difference: number): string {
  if (difference === 0) return 'Tam hedef saatinde'
  return difference < 0 ? `Hedefinden ${Math.abs(difference)} dk önce` : `Hedefinden ${difference} dk sonra`
}
