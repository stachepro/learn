import { useApp } from '../context/AppContext'
import { dateStr, getDaysInMonth, getFirstDayOfMonth, trMonthName, TR_DAY_SHORTS } from '../utils/date'

// Green scale that reads on the dark obsidian tile
function completionColor(count: number): string {
  if (count === 0) return 'rgba(255,255,255,0.05)'
  if (count === 1) return 'rgba(34,197,94,0.30)'
  if (count === 2) return 'rgba(34,197,94,0.48)'
  if (count === 3) return 'rgba(34,197,94,0.68)'
  if (count === 4) return 'rgba(34,197,94,0.86)'
  return 'rgb(34,197,94)'
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
                background: isFuture ? 'rgba(255,255,255,0.03)' : completionColor(count),
                boxShadow: isToday ? '0 0 0 2px rgb(34,197,94)' : 'inset 0 0 0 1px rgba(255,255,255,0.06)',
                opacity: isFuture ? 0.5 : 1,
              }}
              title={`${day} ${trMonthName(month)}: ${count} tamamlandı`}
            >
              {!isFuture && count > 0 && (
                <span
                  className="text-[10px] font-bold leading-none select-none tnum"
                  style={{ color: count >= 3 ? '#06210f' : '#bdf0cd' }}
                >
                  {count}
                </span>
              )}
              {isToday && count === 0 && (
                <span className="w-1 h-1 rounded-full absolute" style={{ background: 'rgb(34,197,94)' }} />
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
            style={{ background: completionColor(n), boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.08)' }}
          />
        ))}
        <span className="text-[10px] ink-45">Çok</span>
      </div>
    </div>
  )
}
