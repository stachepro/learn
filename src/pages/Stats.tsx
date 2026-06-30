import { useState, useEffect } from 'react'
import { useApp } from '../context/AppContext'
import ContributionsGrid from '../components/ContributionsGrid'
import CategoryPie from '../components/CategoryPie'
import { formatMinutes, trMonthName } from '../utils/date'

export default function Stats() {
  const { logs, freeSessions } = useApp()
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])

  const now = new Date()
  const monthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

  // Monthly pomodoro totals — from habit sessions + free sessions in the current month
  let pomCount = 0
  let pomMinutes = 0
  for (const [dateKey, day] of Object.entries(logs)) {
    if (!dateKey.startsWith(monthPrefix)) continue
    for (const hl of Object.values(day.habits)) {
      for (const s of hl.pomodoroSessions) {
        pomCount += 1
        pomMinutes += s.workDuration
      }
    }
  }
  for (const s of freeSessions) {
    if (!s.date.startsWith(monthPrefix)) continue
    pomCount += 1
    pomMinutes += s.workDuration
  }

  return (
    <div className={`max-w-3xl mx-auto px-4 py-6 pb-40 sm:pb-8 space-y-5 ${mounted ? 'page-enter' : 'opacity-0'}`}>
      {/* Header */}
      <div>
        <h1 className="display text-3xl font-extrabold" style={{ color: '#1a1726' }}>İstatistikler</h1>
        <p className="text-sm mt-1" style={{ color: 'rgba(26,23,38,0.55)' }}>{trMonthName(now.getMonth())} {now.getFullYear()} özeti</p>
      </div>

      {/* Monthly activity grid */}
      <div className="glass g-neutral p-5" style={{ borderRadius: 24 }}>
        <ContributionsGrid />
      </div>

      {/* Monthly pomodoro stats */}
      <div>
        <p className="display text-sm font-bold mb-3" style={{ color: '#1a1726' }}>Bu Ay · Pomodoro</p>
        <div className="grid grid-cols-2 gap-3">
          <div className="glass g-rust p-4" style={{ borderRadius: 20 }}>
            <div className="flex items-start justify-between mb-2">
              <span className="text-xl">🍅</span>
              <span className="text-[10px] font-semibold uppercase tracking-wider ink-60">Süre</span>
            </div>
            <p className="display text-2xl font-extrabold tnum">{formatMinutes(pomMinutes)}</p>
            <p className="text-[11px] mt-1 ink-45">Toplam odak süresi</p>
          </div>
          <div className="glass g-cream p-4" style={{ borderRadius: 20 }}>
            <div className="flex items-start justify-between mb-2">
              <span className="text-xl">⏱</span>
              <span className="text-[10px] font-semibold uppercase tracking-wider ink-60">Sayı</span>
            </div>
            <p className="display text-2xl font-extrabold tnum">{pomCount} <span className="text-base font-bold">Pomodoro</span></p>
            <p className="text-[11px] mt-1 ink-45">Tamamlanan oturum</p>
          </div>
        </div>
      </div>

      {/* Category distribution */}
      <div>
        <p className="display text-sm font-bold mb-3" style={{ color: '#1a1726' }}>Kategori Dağılımı</p>
        <div className="glass g-neutral p-5" style={{ borderRadius: 24 }}>
          <CategoryPie />
        </div>
      </div>
    </div>
  )
}
