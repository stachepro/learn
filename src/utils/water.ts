import type { WaterEntry } from '../types'
import { trMonthName } from './date'

export function formatLiters(ml: number): string {
  if (ml <= 0) return '0 Litre'
  const liters = Math.round((ml / 1000) * 100) / 100
  const str = Number.isInteger(liters) ? liters.toFixed(0) : liters.toString()
  return `${str} Litre`
}

export function formatMl(ml: number): string {
  if (ml >= 1000) return formatLiters(ml)
  return `${ml} ml`
}

export function formatWaterAmount(ml: number): string {
  if (ml < 1000) return `${ml.toLocaleString('tr-TR')} ml`
  return `${(ml / 1000).toLocaleString('tr-TR', { maximumFractionDigits: 2 })} L`
}

export function dayTotalMl(entries: WaterEntry[], date: string): number {
  return entries.filter((e) => e.date === date).reduce((sum, e) => sum + e.ml, 0)
}

export function entriesForDate(entries: WaterEntry[], date: string): WaterEntry[] {
  return entries.filter((e) => e.date === date).sort((a, b) => a.timestamp.localeCompare(b.timestamp))
}

export interface DayTotal { date: string; ml: number }

export function totalsByDate(entries: WaterEntry[]): DayTotal[] {
  const map = new Map<string, number>()
  for (const e of entries) map.set(e.date, (map.get(e.date) ?? 0) + e.ml)
  return Array.from(map.entries()).map(([date, ml]) => ({ date, ml })).sort((a, b) => b.date.localeCompare(a.date))
}

export function totalsForMonth(entries: WaterEntry[], year: number, month: number): DayTotal[] {
  const prefix = `${year}-${String(month + 1).padStart(2, '0')}`
  return totalsByDate(entries.filter((e) => e.date.startsWith(prefix)))
}

export interface MonthTotal { year: number; month: number; ml: number; label: string }

export function totalsForYear(entries: WaterEntry[], year: number): MonthTotal[] {
  const totals: MonthTotal[] = Array.from({ length: 12 }, (_, m) => ({ year, month: m, ml: 0, label: trMonthName(m) }))
  for (const e of entries) {
    const [y, m] = e.date.split('-').map(Number)
    if (y === year) totals[m - 1].ml += e.ml
  }
  return totals
}

export function averageDailyMl(entries: WaterEntry[]): number {
  const days = totalsByDate(entries)
  if (days.length === 0) return 0
  return Math.round(days.reduce((s, d) => s + d.ml, 0) / days.length)
}

export function bestDay(entries: WaterEntry[]): DayTotal | null {
  const days = totalsByDate(entries)
  if (days.length === 0) return null
  return days.reduce((best, d) => (d.ml > best.ml ? d : best), days[0])
}

export type WaterGoalResolver = number | ((date: string) => number)

export function goalForDate(goal: WaterGoalResolver, date: string): number {
  return typeof goal === 'function' ? goal(date) : goal
}

export function daysGoalMet(entries: WaterEntry[], goal: WaterGoalResolver): number {
  return totalsByDate(entries).filter((d) => d.ml >= goalForDate(goal, d.date)).length
}

export function elapsedDaysInMonth(year: number, month: number, today: string): number {
  const prefix = `${year}-${String(month + 1).padStart(2, '0')}`
  const currentPrefix = today.slice(0, 7)
  if (prefix > currentPrefix) return 0
  if (prefix < currentPrefix) return new Date(year, month + 1, 0).getDate()
  return Number(today.slice(8, 10))
}

export interface WaterMonthSummary {
  total: number
  average: number
  goalDays: number
  elapsedDays: number
  best: DayTotal | null
}

export function waterMonthSummary(
  entries: WaterEntry[],
  year: number,
  month: number,
  today: string,
  goal: WaterGoalResolver,
): WaterMonthSummary {
  const days = totalsForMonth(entries, year, month)
  const elapsedDays = elapsedDaysInMonth(year, month, today)
  const total = days.reduce((sum, day) => sum + day.ml, 0)
  return {
    total,
    average: elapsedDays > 0 ? Math.round(total / elapsedDays) : 0,
    goalDays: days.filter((day) => day.ml >= goalForDate(goal, day.date)).length,
    elapsedDays,
    best: days.length > 0 ? days.reduce((best, day) => day.ml > best.ml ? day : best, days[0]) : null,
  }
}

export function yearsAvailable(entries: WaterEntry[]): number[] {
  const years = new Set(entries.map((e) => Number(e.date.slice(0, 4))))
  years.add(new Date().getFullYear())
  return Array.from(years).sort((a, b) => b - a)
}
