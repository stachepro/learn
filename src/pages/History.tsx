import { useState, useEffect } from 'react'
import { useApp } from '../context/AppContext'
import { getDaysInMonth, getFirstDayOfMonth, dateStr, formatMinutes, trMonthName, TR_DAY_SHORTS } from '../utils/date'

export default function History() {
  const { logs, habits, categories } = useApp()
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])
  const now = new Date()
  const [viewYear, setViewYear] = useState(now.getFullYear())
  const [viewMonth, setViewMonth] = useState(now.getMonth())
  const [selectedDay, setSelectedDay] = useState<string | null>(null)

  const daysInMonth = getDaysInMonth(viewYear, viewMonth)
  const firstDay = getFirstDayOfMonth(viewYear, viewMonth)

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear((y) => y - 1) }
    else setViewMonth((m) => m - 1)
    setSelectedDay(null)
  }
  const nextMonth = () => {
    if (viewYear === now.getFullYear() && viewMonth === now.getMonth()) return
    if (viewMonth === 11) { setViewMonth(0); setViewYear((y) => y + 1) }
    else setViewMonth((m) => m + 1)
    setSelectedDay(null)
  }
  const isAtMaxMonth = viewYear === now.getFullYear() && viewMonth === now.getMonth()

  const dayActivity = (day: number) => {
    const key = dateStr(new Date(viewYear, viewMonth, day))
    const log = logs[key]
    if (!log) return null
    const completed = Object.values(log.habits).filter((h) => h.completed).length
    return completed > 0 ? completed : null
  }

  const last30: { key: string; label: string }[] = []
  for (let i = 0; i < 30; i++) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    last30.push({
      key: dateStr(d),
      label: d.toLocaleDateString('tr-TR', { weekday: 'short', day: 'numeric', month: 'short' }),
    })
  }

  const selectedLog = selectedDay ? logs[selectedDay] : null

  const navBtn = 'ctrl btn-press w-9 h-9 rounded-xl flex items-center justify-center text-lg'

  return (
    <div className={`max-w-3xl mx-auto px-4 py-6 pb-40 sm:pb-8 space-y-5 ${mounted ? 'page-enter' : 'opacity-0'}`}>
      <div>
        <h1 className="display text-3xl font-extrabold" style={{ color: '#f1f5f5' }}>Geçmiş</h1>
        <p className="text-sm mt-1" style={{ color: 'rgba(241,245,245,0.55)' }}>Alışkanlık geçmişin</p>
      </div>

      {/* Calendar */}
      <div className="glass g-neutral" style={{ borderRadius: 24 }}>
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <button onClick={prevMonth} aria-label="Önceki ay" className={navBtn}>
            ←
          </button>
          <span className="display text-base font-bold">{trMonthName(viewMonth)} {viewYear}</span>
          <button onClick={nextMonth} disabled={isAtMaxMonth} aria-label="Sonraki ay"
            className={`${navBtn} disabled:opacity-25`}>
            →
          </button>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 px-2 pt-3 pb-1">
          {TR_DAY_SHORTS.map((d) => (
            <div key={d} className="text-center text-[11px] font-bold uppercase tracking-wider py-1 ink-45">{d}</div>
          ))}
        </div>

        {/* Days */}
        <div className="grid grid-cols-7 px-2 pb-4 gap-1">
          {Array.from({ length: firstDay }).map((_, i) => <div key={`e${i}`} />)}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1
            const key = dateStr(new Date(viewYear, viewMonth, day))
            const activity = dayActivity(day)
            const isToday = key === dateStr(new Date())
            const isFuture = new Date(viewYear, viewMonth, day) > new Date()
            const isSelected = selectedDay === key

            return (
              <button
                key={day}
                onClick={() => !isFuture && setSelectedDay(isSelected ? null : key)}
                disabled={isFuture}
                className="btn-press aspect-square flex items-center justify-center rounded-xl text-xs tnum transition-all disabled:cursor-default"
                style={{
                  background: isSelected
                    ? 'rgb(34,197,94)'
                    : activity
                      ? 'rgba(34,197,94,0.22)'
                      : isToday
                        ? 'rgba(255,255,255,0.06)'
                        : 'transparent',
                  color: isSelected
                    ? '#06210f'
                    : isFuture
                      ? 'rgba(232,237,238,0.2)'
                      : '#e8edee',
                  fontWeight: (activity || isToday || isSelected) ? 700 : 500,
                  boxShadow: isToday && !isSelected ? 'inset 0 0 0 2px rgba(34,197,94,0.7)' : 'none',
                }}
              >
                {day}
              </button>
            )
          })}
        </div>
      </div>

      {/* Day detail */}
      {selectedDay && (
        <div className="glass g-neutral animate-fade-in" style={{ borderRadius: 24 }}>
          <div className="px-5 py-3.5" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
            <p className="display text-sm font-bold">
              {new Date(selectedDay + 'T12:00:00').toLocaleDateString('tr-TR', {
                weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
              })}
            </p>
          </div>
          {selectedLog ? (
            <div>
              {Object.entries(selectedLog.habits).map(([habitId, h], idx, arr) => {
                const habit = habits.find((hb) => hb.id === habitId)
                const cat = categories.find((c) => c.id === habit?.categoryId)
                const workMin = h.pomodoroSessions.reduce((acc, p) => acc + p.workDuration, 0)
                return (
                  <div
                    key={habitId}
                    className="flex items-start gap-3 px-5 py-3.5"
                    style={{ borderBottom: idx < arr.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none' }}
                  >
                    <span className="text-xl mt-0.5 flex-shrink-0">{habit?.emoji ?? '⭐'}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold"
                          style={{
                            opacity: h.completed ? 1 : 0.5,
                            textDecoration: h.completed ? 'none' : 'line-through',
                          }}>
                          {habit?.name ?? 'Silinmiş alışkanlık'}
                        </p>
                        {h.boostMode && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-md font-bold"
                            style={{ background: 'rgba(245,158,11,0.92)', color: '#2a1804' }}>
                            BOOST
                          </span>
                        )}
                      </div>
                      {cat && (
                        <p className="text-[11px] mt-0.5 font-medium ink-60">{cat.emoji} {cat.name}</p>
                      )}
                      {h.pomodoroSessions.length > 0 && (
                        <p className="text-[11px] mt-1 ink-45">
                          🍅 {h.pomodoroSessions.length} pomodoro · {formatMinutes(workMin)}
                        </p>
                      )}
                      {h.notes && (
                        <p className="text-xs mt-1 italic ink-60">"{h.notes}"</p>
                      )}
                    </div>
                    <div
                      className="w-2.5 h-2.5 rounded-full mt-2 flex-shrink-0"
                      style={{ background: h.completed ? 'rgb(34,197,94)' : 'rgba(255,255,255,0.14)' }}
                    />
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="px-5 py-10 text-sm text-center ink-45">Bu gün için kayıt yok</p>
          )}
        </div>
      )}

      {/* Last 30 days */}
      <div>
        <p className="display text-sm font-bold mb-3" style={{ color: '#f1f5f5' }}>Son 30 Gün</p>
        <div className="glass g-neutral" style={{ borderRadius: 24 }}>
          {last30.map(({ key, label }, idx) => {
            const log = logs[key]
            const done = log ? Object.values(log.habits).filter((h) => h.completed).length : 0
            const tot = log ? Object.values(log.habits).length : 0
            const work = log ? Object.values(log.habits).reduce((acc, h) =>
              acc + h.pomodoroSessions.reduce((s, p) => s + p.workDuration, 0), 0) : 0
            const isSelected = selectedDay === key
            return (
              <button
                key={key}
                onClick={() => setSelectedDay(key === selectedDay ? null : key)}
                className="btn-press w-full flex items-center justify-between px-5 py-3 text-left soft-trans"
                style={{
                  background: isSelected ? 'rgba(34,197,94,0.14)' : 'transparent',
                  borderBottom: idx < last30.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none',
                }}
              >
                <span className="text-sm w-36 text-left font-medium" style={{ opacity: isSelected ? 1 : 0.7 }}>
                  {label}
                </span>
                {done > 0 ? (
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold" style={{ color: '#34c759' }}>
                      {done}/{tot} alışkanlık
                    </span>
                    {work > 0 && <span className="text-xs ink-45">{formatMinutes(work)}</span>}
                  </div>
                ) : (
                  <span className="text-xs ink-35">Aktivite yok</span>
                )}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
