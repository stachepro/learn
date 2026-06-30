import { useMemo } from 'react'
import { useApp } from '../context/AppContext'

interface Slice {
  id: string
  name: string
  emoji: string
  color: string
  count: number
  pct: number
}

export default function CategoryPie() {
  const { logs, habits, categories } = useApp()

  const { slices, total } = useMemo(() => {
    // habitId → categoryId (deleted habits no longer exist; their logs are purged)
    const habitCat = new Map(habits.map((h) => [h.id, h.categoryId]))

    // All-time completed habit-days grouped by category
    const counts = new Map<string, number>()
    for (const day of Object.values(logs)) {
      for (const [habitId, hl] of Object.entries(day.habits)) {
        if (!hl.completed) continue
        const catId = habitCat.get(habitId)
        if (!catId) continue
        counts.set(catId, (counts.get(catId) ?? 0) + 1)
      }
    }

    const total = Array.from(counts.values()).reduce((a, b) => a + b, 0)
    const slices: Slice[] = categories
      .filter((c) => (counts.get(c.id) ?? 0) > 0)
      .map((c) => {
        const count = counts.get(c.id) ?? 0
        return { id: c.id, name: c.name, emoji: c.emoji, color: c.color, count, pct: total ? Math.round((count / total) * 100) : 0 }
      })
      .sort((a, b) => b.count - a.count)

    return { slices, total }
  }, [logs, habits, categories])

  // Empty state — no completions / no category data yet
  if (total === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-3xl mb-2">📊</p>
        <p className="text-sm font-semibold" style={{ color: '#1a1726' }}>Henüz veri yok</p>
        <p className="text-xs mt-1" style={{ color: 'rgba(26,23,38,0.45)' }}>
          Alışkanlık tamamladıkça kategori dağılımın burada görünecek.
        </p>
      </div>
    )
  }

  // Donut geometry
  const R = 70
  const C = 2 * Math.PI * R
  let accum = 0

  return (
    <div className="flex flex-col sm:flex-row items-center gap-6">
      {/* Donut */}
      <div className="relative flex-shrink-0" style={{ width: 180, height: 180 }}>
        <svg width="180" height="180" viewBox="0 0 200 200" className="-rotate-90">
          <circle cx="100" cy="100" r={R} fill="none" stroke="rgba(26,23,38,0.05)" strokeWidth="28" />
          {slices.map((s) => {
            const frac = s.count / total
            const segLen = frac * C
            const dashoffset = -accum * C
            accum += frac
            return (
              <circle
                key={s.id}
                cx="100" cy="100" r={R}
                fill="none"
                stroke={s.color}
                strokeWidth="28"
                strokeDasharray={`${segLen} ${C - segLen}`}
                strokeDashoffset={dashoffset}
              />
            )
          })}
        </svg>
        {/* Center label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="display text-2xl font-extrabold tnum" style={{ color: '#1a1726' }}>{total}</span>
          <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'rgba(26,23,38,0.45)' }}>
            Tamamlama
          </span>
        </div>
      </div>

      {/* Legend — name + percentage per slice */}
      <div className="flex-1 w-full space-y-1.5">
        {slices.map((s) => (
          <div key={s.id} className="flex items-center gap-2.5">
            <span className="w-3 h-3 rounded-[4px] flex-shrink-0" style={{ background: s.color }} />
            <span className="text-sm flex-1 min-w-0 truncate" style={{ color: 'rgba(26,23,38,0.7)' }}>
              {s.emoji} {s.name}
            </span>
            <span className="text-sm font-bold tnum flex-shrink-0" style={{ color: s.color }}>
              %{s.pct}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
