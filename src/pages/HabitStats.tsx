import { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { getCategoryColor } from '../utils/categories'
import { isHabitScheduledFor } from '../utils/habitSchedule'
import {
  getDaysInMonth, getFirstDayOfMonth, trMonthName, TR_DAY_SHORTS,
} from '../utils/date'

// Local YYYY-MM-DD key — avoids the UTC shift that toISOString() causes on
// local-midnight Dates in timezones ahead of UTC.
function ymd(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

type DayStatus = 'done' | 'missed' | 'today-pending' | 'off' | 'future' | 'none'

const STATUS_STYLE: Record<DayStatus, { bg: string; ring: string; color: string }> = {
  done:          { bg: 'rgb(34,197,94)',        ring: 'rgba(34,197,94,0.5)',  color: '#06210f' },
  missed:        { bg: 'rgba(225,90,60,0.85)',  ring: 'rgba(225,90,60,0.5)',  color: '#fff5f2' },
  'today-pending': { bg: 'rgba(245,158,11,0.18)', ring: 'rgb(245,158,11)',     color: '#b45309' },
  off:           { bg: 'rgba(26,23,38,0.05)',   ring: 'rgba(26,23,38,0.06)',  color: 'rgba(26,23,38,0.3)' },
  future:        { bg: 'rgba(26,23,38,0.03)',   ring: 'rgba(26,23,38,0.05)',  color: 'rgba(26,23,38,0.25)' },
  none:          { bg: 'rgba(26,23,38,0.04)',   ring: 'rgba(26,23,38,0.05)',  color: 'rgba(26,23,38,0.25)' },
}

export default function HabitStats() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { habits, logs, categories } = useApp()
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])

  const habit = habits.find((h) => h.id === id)

  const now = new Date()
  const [viewYear, setViewYear] = useState(now.getFullYear())
  const [viewMonth, setViewMonth] = useState(now.getMonth())

  const today = ymd(new Date())
  const createdKey = habit?.createdDate ?? (habit ? ymd(new Date(habit.createdAt)) : today)

  // Status of the habit for a given date key (YYYY-MM-DD)
  const statusFor = (key: string): DayStatus => {
    if (!habit) return 'none'
    if (key < createdKey) return 'none'
    if (key > today) return 'future'
    if (!isHabitScheduledFor(habit, key)) return 'off'
    const completed = logs[key]?.habits[habit.id]?.completed
    if (completed) return 'done'
    if (key === today) return 'today-pending'
    return 'missed'
  }

  // Success % over a set of date keys: done / (done + missed)
  const successPct = (keys: string[]): { pct: number; done: number; total: number } => {
    let done = 0, total = 0
    for (const k of keys) {
      const s = statusFor(k)
      if (s === 'done') { done++; total++ }
      else if (s === 'missed') { total++ }
    }
    return { pct: total === 0 ? 0 : Math.round((done / total) * 100), done, total }
  }

  const daysInMonth = getDaysInMonth(viewYear, viewMonth)
  const firstDay = getFirstDayOfMonth(viewYear, viewMonth)

  const monthKeys = useMemo(
    () => Array.from({ length: daysInMonth }, (_, i) => ymd(new Date(viewYear, viewMonth, i + 1))),
    [viewYear, viewMonth, daysInMonth],
  )

  // All-time keys: from creation date through today
  const allTimeKeys = useMemo(() => {
    if (!habit) return []
    const keys: string[] = []
    const start = new Date(createdKey + 'T12:00:00')
    const end = new Date(today + 'T12:00:00')
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      keys.push(ymd(d))
    }
    return keys
  }, [habit, createdKey, today])

  const monthStat = successPct(monthKeys)
  const allStat = successPct(allTimeKeys)

  const prevMonth = () => {
    const d = new Date(viewYear, viewMonth - 1, 1)
    setViewYear(d.getFullYear()); setViewMonth(d.getMonth())
  }
  const nextMonth = () => {
    const d = new Date(viewYear, viewMonth + 1, 1)
    setViewYear(d.getFullYear()); setViewMonth(d.getMonth())
  }

  // Don't navigate past the current month
  const atCurrentMonth = viewYear === now.getFullYear() && viewMonth === now.getMonth()

  if (!habit) {
    return (
      <div className="max-w-sm mx-auto px-4 py-20 text-center">
        <p className="text-4xl mb-3">🔍</p>
        <p className="display text-base font-bold" style={{ color: '#1a1726' }}>Alışkanlık bulunamadı</p>
        <button onClick={() => navigate('/habits')} className="btn-ink btn-press mt-5 px-5 py-2.5 text-sm">
          Alışkanlıklara dön
        </button>
      </div>
    )
  }

  const cat = categories.find((c) => c.id === habit.categoryId)
  const colors = getCategoryColor(cat?.color ?? '#6b7280')

  return (
    <div className={`max-w-sm mx-auto px-4 py-6 pb-40 sm:pb-8 space-y-5 ${mounted ? 'page-enter' : 'opacity-0'}`}>
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/habits')}
          aria-label="Geri"
          className="ctrl btn-press w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
        >
          ←
        </button>
        <span className="text-2xl">{habit.emoji}</span>
        <div className="min-w-0">
          <h1 className="display text-xl font-extrabold truncate" style={{ color: '#1a1726' }}>{habit.name}</h1>
          {cat && (
            <p className="text-[11px] font-semibold" style={{ color: colors.text }}>
              {cat.emoji} {cat.name}
            </p>
          )}
        </div>
      </div>

      {/* Success summary */}
      <div className="grid grid-cols-2 gap-3">
        <div className="glass g-lime p-4" style={{ borderRadius: 20, border: '1px solid rgba(34,197,94,0.3)' }}>
          <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: '#15803d' }}>Bu Ay</p>
          <p className="display text-3xl font-extrabold tnum mt-1" style={{ color: '#15803d' }}>%{monthStat.pct}</p>
          <p className="text-[11px] mt-1" style={{ color: 'rgba(26,23,38,0.45)' }}>
            {monthStat.done}/{monthStat.total} gün başarılı
          </p>
        </div>
        <div className="glass g-neutral p-4" style={{ borderRadius: 20 }}>
          <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'rgba(26,23,38,0.5)' }}>Tüm Zamanlar</p>
          <p className="display text-3xl font-extrabold tnum mt-1" style={{ color: '#1a1726' }}>%{allStat.pct}</p>
          <p className="text-[11px] mt-1" style={{ color: 'rgba(26,23,38,0.45)' }}>
            {allStat.done}/{allStat.total} gün başarılı
          </p>
        </div>
      </div>

      {/* Month navigation + grid */}
      <div className="glass g-neutral p-5" style={{ borderRadius: 24 }}>
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={prevMonth}
            aria-label="Önceki ay"
            className="ctrl btn-press w-8 h-8 rounded-full flex items-center justify-center text-sm"
          >
            ←
          </button>
          <p className="display text-sm font-bold" style={{ color: '#1a1726' }}>
            {trMonthName(viewMonth)} {viewYear}
          </p>
          <button
            onClick={nextMonth}
            disabled={atCurrentMonth}
            aria-label="Sonraki ay"
            className="ctrl btn-press w-8 h-8 rounded-full flex items-center justify-center text-sm"
            style={{ opacity: atCurrentMonth ? 0.35 : 1 }}
          >
            →
          </button>
        </div>

        {/* Day-of-week headers */}
        <div className="grid grid-cols-7 gap-1 mb-1">
          {TR_DAY_SHORTS.map((d) => (
            <div key={d} className="text-center text-[9px] py-0.5 font-semibold" style={{ color: 'rgba(26,23,38,0.45)' }}>
              {d}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: firstDay }).map((_, i) => (
            <div key={`e${i}`} className="aspect-square" />
          ))}

          {monthKeys.map((key, i) => {
            const day = i + 1
            const status = statusFor(key)
            const s = STATUS_STYLE[status]
            const isToday = key === today
            return (
              <div
                key={key}
                className="aspect-square rounded-lg flex items-center justify-center"
                style={{
                  background: s.bg,
                  boxShadow: isToday ? `0 0 0 2px ${s.ring}` : `inset 0 0 0 1px ${s.ring}`,
                }}
                title={`${day} ${trMonthName(viewMonth)}: ${
                  status === 'done' ? 'Tamamlandı'
                  : status === 'missed' ? 'Yapılmadı'
                  : status === 'today-pending' ? 'Bugün · bekliyor'
                  : status === 'off' ? 'Planlı değil'
                  : status === 'future' ? 'Gelmedi'
                  : 'Alışkanlık yoktu'
                }`}
              >
                <span className="text-[10px] font-bold leading-none select-none tnum" style={{ color: s.color }}>
                  {day}
                </span>
              </div>
            )
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-4 mt-4 flex-wrap">
          {([
            ['done', 'Tamamlandı'],
            ['missed', 'Yapılmadı'],
            ['off', 'Planlı değil'],
          ] as [DayStatus, string][]).map(([st, lbl]) => (
            <div key={st} className="flex items-center gap-1.5">
              <span
                className="w-3 h-3 rounded-[5px]"
                style={{ background: STATUS_STYLE[st].bg, boxShadow: `inset 0 0 0 1px ${STATUS_STYLE[st].ring}` }}
              />
              <span className="text-[10px]" style={{ color: 'rgba(26,23,38,0.5)' }}>{lbl}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
