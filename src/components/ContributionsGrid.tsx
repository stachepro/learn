import { useApp } from '../context/AppContext'
import { dateStr, getDaysInMonth, getFirstDayOfMonth, trMonthName, TR_DAY_SHORTS } from '../utils/date'

// Frosted green scale that reads on the milky neutral tile
function completionColor(count: number): string {
  if (count === 0) return 'rgba(18,40,58,0.10)'
  if (count === 1) return 'rgba(95,150,110,0.45)'
  if (count === 2) return 'rgba(80,150,95,0.62)'
  if (count === 3) return 'rgba(63,154,85,0.80)'
  if (count === 4) return 'rgba(50,150,75,0.92)'
  return 'rgba(40,140,65,1)'
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
        <p className="display text-sm font-bold">
          {trMonthName(month)} Aktivitesi
        </p>
        <p className="text-[11px] ink-60 tnum">
          {totalActive} / {daysInMonth} gün aktif
        </p>
      </div>

      {/* Day-of-week headers */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {TR_DAY_SHORTS.map((d) => (
          <div key={d} className="text-center text-[9px] ink-45 py-0.5 font-semibold">
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: firstDay }).map((_, i) => (
          <div key={`e${i}`} className="aspect-square" />
        ))}

        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1
          const key = dateStr(new Date(year, month, day))
          const count = getCount(day)
          const isFuture = key > todayKey
          const isToday = key === todayKey

          return (
            <div
              key={day}
              className="contrib-cell aspect-square rounded-lg flex items-center justify-center relative"
              style={{
                background: isFuture ? 'rgba(18,40,58,0.05)' : completionColor(count),
                boxShadow: isToday ? '0 0 0 2px rgba(33,48,61,0.55)' : 'inset 0 0 0 1px rgba(255,255,255,0.18)',
                opacity: isFuture ? 0.5 : 1,
              }}
              title={`${day} ${trMonthName(month)}: ${count} tamamlandı`}
            >
              {!isFuture && count > 0 && (
                <span
                  className="text-[10px] font-bold leading-none select-none tnum"
                  style={{ color: count >= 3 ? '#f1faf2' : '#1c3a26' }}
                >
                  {count}
                </span>
              )}
              {isToday && count === 0 && (
                <span className="w-1 h-1 rounded-full absolute" style={{ background: 'rgba(33,48,61,0.6)' }} />
              )}
            </div>
          )
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-end gap-1.5 mt-3">
        <span className="text-[10px] ink-45">Az</span>
        {[0, 1, 2, 3, 4, 5].map((n) => (
          <div
            key={n}
            className="w-3 h-3 rounded-[5px]"
            style={{ background: completionColor(n), boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.18)' }}
          />
        ))}
        <span className="text-[10px] ink-45">Çok</span>
      </div>
    </div>
  )
}
