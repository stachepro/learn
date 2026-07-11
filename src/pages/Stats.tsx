import { useState, useEffect } from 'react'
import { useApp } from '../context/AppContext'
import ContributionsGrid from '../components/ContributionsGrid'
import BackBar from '../components/BackBar'
import CategoryPie from '../components/CategoryPie'
import { formatMinutes, trMonthName } from '../utils/date'
import { storage } from '../utils/storage'
import { averageWakeTime, earliestWakeTime, latestWakeTime } from './WakeUp'

export default function Stats() {
  const { logs, freeSessions } = useApp()
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])

  const wakeRecords = storage.getWakeRecords()
  const wakeAvg = averageWakeTime(wakeRecords)

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
      <BackBar />
      {/* Header */}
      <div>
        <h1 className="display text-3xl font-extrabold" style={{ color: 'rgb(var(--ink))' }}>İstatistikler</h1>
        <p className="text-sm mt-1" style={{ color: 'rgb(var(--ink) / 0.55)' }}>{trMonthName(now.getMonth())} {now.getFullYear()} özeti</p>
      </div>

      {/* Monthly activity grid */}
      <div className="glass glass-lift g-neutral p-5 animate-fade-up" style={{ borderRadius: 24, animationDelay: '0.04s' }}>
        <ContributionsGrid />
      </div>

      {/* Monthly pomodoro stats */}
      <div className="animate-fade-up" style={{ animationDelay: '0.09s' }}>
        <p className="display text-sm font-bold mb-3" style={{ color: 'rgb(var(--ink))' }}>Bu Ay · Pomodoro</p>
        <div className="grid grid-cols-2 gap-3">
          <div className="glass glass-lift g-rust p-4" style={{ borderRadius: 20 }}>
            <div className="flex items-start justify-between mb-2">
              <span className="text-xl">🍅</span>
              <span className="text-[10px] font-semibold uppercase tracking-wider ink-60">Süre</span>
            </div>
            <p className="display text-2xl font-extrabold tnum animate-value-pop" key={pomMinutes}>{formatMinutes(pomMinutes)}</p>
            <p className="text-[11px] mt-1 ink-45">Toplam odak süresi</p>
          </div>
          <div className="glass glass-lift g-cream p-4" style={{ borderRadius: 20 }}>
            <div className="flex items-start justify-between mb-2">
              <span className="text-xl">⏱</span>
              <span className="text-[10px] font-semibold uppercase tracking-wider ink-60">Sayı</span>
            </div>
            <p className="display text-2xl font-extrabold tnum animate-value-pop" key={pomCount}>{pomCount} <span className="text-base font-bold">Pomodoro</span></p>
            <p className="text-[11px] mt-1 ink-45">Tamamlanan oturum</p>
          </div>
        </div>
      </div>

      {/* Wake-up stats */}
      {wakeRecords.length > 0 && (
        <div className="animate-fade-up" style={{ animationDelay: '0.12s' }}>
          <p className="display text-sm font-bold mb-3" style={{ color: 'rgb(var(--ink))' }}>Uyanma</p>
          <div className="glass g-cream p-4" style={{ borderRadius: 20 }}>
            <div className="flex items-start justify-between mb-2">
              <span className="text-xl">🌅</span>
              <span className="text-[10px] font-semibold uppercase tracking-wider ink-60">{wakeRecords.length} gün</span>
            </div>
            <div className="grid grid-cols-3 text-center">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider ink-45 mb-1">Ortalama</p>
                <p className="display text-xl font-extrabold tnum">{wakeAvg ?? '--'}</p>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider ink-45 mb-1">En erken</p>
                <p className="display text-xl font-extrabold tnum" style={{ color: '#16803c' }}>{earliestWakeTime(wakeRecords) ?? '--'}</p>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider ink-45 mb-1">En geç</p>
                <p className="display text-xl font-extrabold tnum" style={{ color: '#cc4322' }}>{latestWakeTime(wakeRecords) ?? '--'}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Category distribution */}
      <div className="animate-fade-up" style={{ animationDelay: '0.14s' }}>
        <p className="display text-sm font-bold mb-3" style={{ color: 'rgb(var(--ink))' }}>Kategori Dağılımı</p>
        <div className="glass g-neutral p-5" style={{ borderRadius: 24 }}>
          <CategoryPie />
        </div>
      </div>
    </div>
  )
}
