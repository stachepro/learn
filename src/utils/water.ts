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

export function daysGoalMet(entries: WaterEntry[], goalMl: number): number {
  return totalsByDate(entries).filter((d) => d.ml >= goalMl).length
}

export function yearsAvailable(entries: WaterEntry[]): number[] {
  const years = new Set(entries.map((e) => Number(e.date.slice(0, 4))))
  years.add(new Date().getFullYear())
  return Array.from(years).sort((a, b) => b - a)
}
