export function todayStr(): string {
  return dateStr(new Date())
}

// Yerel tarihi YYYY-MM-DD üretir. toISOString KULLANMA: UTC verir ve
// Türkiye'de (UTC+3) gece 00:00–03:00 arası kayıtlar düne yazılır.
export function dateStr(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function yesterdayStr(): string {
  const d = new Date()
  d.setDate(d.getDate() - 1)
  return dateStr(d)
}

// YYYY-MM-DD dizgesine gün ekler/çıkarır — saf, "şu an"dan bağımsız
export function addDaysStr(date: string, days: number): string {
  const [y, m, d] = date.split('-').map(Number)
  const dt = new Date(y, m - 1, d + days)
  return dateStr(dt)
}

// İki tarih arasındaki günler, ikisi de HARİÇ. after >= before ise boş döner.
// Seri boşluğunu saymak için: datesBetween(lastActiveDate, today) = kaçırılan günler.
export function datesBetween(after: string, before: string): string[] {
  const out: string[] = []
  let cur = addDaysStr(after, 1)
  while (cur < before) {
    out.push(cur)
    cur = addDaysStr(cur, 1)
  }
  return out
}

export function formatMinutes(minutes: number): string {
  if (minutes === 0) return '0dk'
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h === 0) return `${m}dk`
  if (m === 0) return `${h}sa`
  return `${h}sa ${m}dk`
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

// Ayın ilk gününün takvim sütunu — hafta Pazartesi başlar (TR düzeni)
export function getFirstDayOfMonth(year: number, month: number): number {
  return (new Date(year, month, 1).getDay() + 6) % 7
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

// Takvim başlıkları — Pazartesi başlar (getFirstDayOfMonth ile uyumlu)
export const TR_DAY_SHORTS = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz']
