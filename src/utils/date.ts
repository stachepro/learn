export function todayStr(): string {
  return dateStr(new Date())
}

export function dateStr(date: Date): string {
  return date.toISOString().slice(0, 10)
}

export function yesterdayStr(): string {
  const d = new Date()
  d.setDate(d.getDate() - 1)
  return dateStr(d)
}

export function formatMinutes(minutes: number): string {
  if (minutes === 0) return '0d'
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h === 0) return `${m}d`
  if (m === 0) return `${h}sa`
  return `${h}sa ${m}d`
}

export function formatSeconds(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export function formatHMS(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
}

export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate()
}

export function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay()
}

const TR_DAYS = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi']
const TR_MONTHS = [
  'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
  'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık',
]

export function formatDisplayDate(date: Date): string {
  return `${TR_DAYS[date.getDay()]}, ${date.getDate()} ${TR_MONTHS[date.getMonth()]} ${date.getFullYear()}`
}

export function formatShortDate(date: Date): string {
  return `${date.getDate()} ${TR_MONTHS[date.getMonth()]}`
}

export function trMonthName(month: number): string {
  return TR_MONTHS[month]
}

export const TR_DAY_SHORTS = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt']
