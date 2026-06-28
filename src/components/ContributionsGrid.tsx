import { useApp } from '../context/AppContext'
import { dateStr, getDaysInMonth, getFirstDayOfMonth, trMonthName, TR_DAY_SHORTS } from '../utils/date'

function completionColor(count: number): string {
  if (count === 0) return '#16162a'
  if (count === 1) return '#133a22'
  if (count === 2) return '#1a5c33'
  if (count === 3) return '#228248'
  if (count === 4) return '#2aaa5c'
  return '#32d46e'
}

function completionBorder(count: number): string {
  if (count === 0) return '#1e1e32'
  if (count === 1) return '#1e5230'
  if (count === 2) return '#226640'
  if (count === 3) return '#2a9050'
  return '#30bb62'
}

export default function ContributionsGrid() {
  const { logs } = useApp()
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth()

  const daysInMonth = getDaysInMonth(year, month)
  const firstDay = getFirstDayOfMonth(year, month)
  const todayKey = dateStr(now)

  const getCount = (day: number): number => {
    const key = dateStr(new Date(year, month, day))
    const log = logs[key]
    if (!log) return 0
    return Object.values(log.habits).filter((h) => h.completed).length
  }

  const totalActive = Array.from({ length: daysInMonth }, (_, i) =>
    getCount(i + 1) > 0 ? 1 : 0
  ).reduce((a: number, b: number) => a + b, 0)

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-semibold text-subtle uppercase tracking-widest">
          {trMonthName(month)} Aktivitesi
        </p>
        <p className="text-[11px] text-muted">
          {totalActive} / {daysInMonth} gün aktif
        </p>
      </div>

      {/* Day-of-week headers */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {TR_DAY_SHORTS.map((d) => (
          <div key={d} className="text-center text-[9px] text-muted py-0.5 font-medium">
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {/* Empty cells before month starts */}
        {Array.from({ length: firstDay }).map((_, i) => (
          <div key={`e${i}`} className="aspect-square" />
        ))}

        {/* Day cells */}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1
          const key = dateStr(new Date(year, month, day))
          const count = getCount(day)
          const isFuture = key > todayKey
          const isToday = key === todayKey

          return (
            <div
              key={day}
              className="contrib-cell aspect-square rounded-md flex items-center justify-center relative"
              style={{
                background: isFuture ? '#0e0e1a' : completionColor(count),
                border: `1px solid ${isFuture ? '#16162a' : completionBorder(count)}`,
                outline: isToday ? '2px solid #8b5cf660' : undefined,
                outlineOffset: isToday ? '1px' : undefined,
                opacity: isFuture ? 0.3 : 1,
              }}
              title={`${day} ${trMonthName(month)}: ${count} tamamlandı`}
            >
              {!isFuture && count > 0 && (
                <span
                  className="text-[10px] font-bold leading-none select-none"
                  style={{ color: count >= 3 ? '#e0ffe8' : '#a0ddb0' }}
                >
                  {count}
                </span>
              )}
              {isToday && count === 0 && (
                <span className="w-1 h-1 rounded-full bg-accent/60 absolute" />
              )}
            </div>
          )
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-end gap-1.5 mt-2">
        <span className="text-[10px] text-muted">Az</span>
        {[0, 1, 2, 3, 4, 5].map((n) => (
          <div
            key={n}
            className="w-3 h-3 rounded-sm"
            style={{ background: completionColor(n), border: `1px solid ${completionBorder(n)}` }}
          />
        ))}
        <span className="text-[10px] text-muted">Çok</span>
      </div>
    </div>
  )
}
