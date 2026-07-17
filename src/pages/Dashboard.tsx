import { useEffect, useState } from 'react'
import { useApp } from '../context/AppContext'
import HabitCreationFlow from '../components/habits/HabitCreationFlow'
import StreakFlame from '../components/StreakFlame'
import StreakModal from '../components/StreakModal'
import LevelModal from '../components/LevelModal'
import TodayModal from '../components/TodayModal'
import AppButton from '../components/ui/AppButton'
import PageHeader from '../components/ui/PageHeader'
import SurfaceCard from '../components/ui/SurfaceCard'
import HabitSwipeDeck, { type DashboardHabitEntry } from '../components/dashboard/HabitSwipeDeck'
import {
  DashboardResultsSheet,
  MiniResultDeck,
  type DashboardResultEntry,
  type ResultOpenOrigin,
} from '../components/dashboard/DashboardResults'
import { getFlameState, getFreezes } from '../utils/streak'
import { dateStr, formatDisplayDate, logicalNow, yesterdayStr } from '../utils/date'
import { getWindowStatus, isHabitScheduledFor } from '../utils/habitSchedule'
import { migrateHabitLog } from '../utils/habitLog'
import { sortResultsNewestFirst } from '../utils/dashboardResults'
import { showToast } from '../utils/toast'
import type { HabitDayStatus } from '../types'
import LuupiIcon from '../components/ui/LuupiIcon'

export default function Dashboard() {
  const { habits, profile, todayLog, categories, setHabitDayStatus } = useApp()
  const [showCreateFlow, setShowCreateFlow] = useState(false)
  const [statModal, setStatModal] = useState<'streak' | 'level' | 'today' | null>(null)
  const [showResults, setShowResults] = useState(false)
  const [resultOrigin, setResultOrigin] = useState<ResultOpenOrigin | null>(null)
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 60_000)
    return () => window.clearInterval(timer)
  }, [])

  const today = dateStr(now)
  const scheduledHabits = habits.filter((habit) => isHabitScheduledFor(habit, today))
  const entries: DashboardHabitEntry[] = scheduledHabits.map((habit) => ({
    habit,
    log: migrateHabitLog(todayLog.habits[habit.id] ?? {}),
    category: categories.find((category) => category.id === habit.categoryId),
    windowExpired: getWindowStatus(habit, now) === 'expired',
  }))
  const pendingEntries = entries.filter(({ log }) => !log.completed && !log.skippedAt)
  const resultEntries: DashboardResultEntry[] = sortResultsNewestFirst(entries
    .filter(({ log }) => log.completed || Boolean(log.skippedAt))
    .map((entry) => ({
      ...entry,
      status: entry.log.completed ? 'completed' as const : 'skipped' as const,
      resolvedAt: entry.log.completedAt ?? entry.log.skippedAt ?? `${today}T00:00:00`,
    })))

  const completedCount = resultEntries.filter((entry) => entry.status === 'completed').length
  const skippedCount = resultEntries.filter((entry) => entry.status === 'skipped').length
  const resolvedCount = resultEntries.length
  const flameState = getFlameState(profile, today, yesterdayStr())
  const freezes = getFreezes(profile)

  const handleResolve = (habitId: string, status: HabitDayStatus) => {
    setHabitDayStatus(habitId, status)
  }

  const handleUndo = (habitId: string) => {
    const entry = resultEntries.find((item) => item.habit.id === habitId)
    setHabitDayStatus(habitId, 'pending')
    if (resultEntries.length === 1) {
      setShowResults(false)
      setResultOrigin(null)
    }
    showToast({
      tone: 'info',
      icon: '↶',
      title: 'Ana desteye geri alındı',
      message: entry?.habit.name,
      haptic: 'light',
    })
  }

  const openResults = (origin?: ResultOpenOrigin) => {
    setResultOrigin(origin ?? null)
    setShowResults(true)
  }

  const closeResults = () => {
    setShowResults(false)
    setResultOrigin(null)
  }

  return (
    <>
      {showCreateFlow && <HabitCreationFlow onClose={() => setShowCreateFlow(false)} />}

      {statModal === 'streak' && <StreakModal onClose={() => setStatModal(null)} />}
      {statModal === 'level' && <LevelModal onClose={() => setStatModal(null)} />}
      {statModal === 'today' && <TodayModal onClose={() => setStatModal(null)} />}
      {showResults && resultEntries.length > 0 && (
        <DashboardResultsSheet entries={resultEntries} origin={resultOrigin} onClose={closeResults} onUndo={handleUndo} />
      )}

      <div className="dashboard-redesign max-w-xl mx-auto px-4 pt-6">
        <PageHeader
          title="Bugün"
          subtitle={formatDisplayDate(logicalNow())}
          action={(
            <AppButton tone="primary" size="sm" haptic="light" onClick={() => setShowCreateFlow(true)}>
              + Ekle
            </AppButton>
          )}
        />

        <section className="dashboard-pulse" aria-label="Günün kısa özeti">
          <button type="button" className="dashboard-pulse__item dashboard-pulse__item--streak" onClick={() => setStatModal('streak')}>
            <span className="dashboard-pulse__icon"><StreakFlame state={flameState} size={24} /></span>
            <span><strong>{profile.streak}</strong><small>gün seri</small></span>
          {freezes > 0 && <em><LuupiIcon name="snowflake" size={14} /> {freezes}</em>}
          </button>
          <button type="button" className="dashboard-pulse__item" onClick={() => setStatModal('level')}>
            <span className="dashboard-pulse__symbol">✦</span>
            <span><strong>{profile.level}</strong><small>seviye</small></span>
          </button>
          <button type="button" className="dashboard-pulse__item" onClick={() => setStatModal('today')}>
            <span className="dashboard-pulse__symbol">◎</span>
            <span><strong>{resolvedCount}/{scheduledHabits.length}</strong><small>işlendi</small></span>
          </button>
        </section>

        <main className="dashboard-flow">
          <div className="dashboard-flow__heading">
            <div>
              <span className="type-caption uppercase tracking-[0.15em]" style={{ color: 'rgb(var(--brand-lime-strong))' }}>
                Günün akışı
              </span>
              <h1 className="type-section-title mt-1">
                {pendingEntries.length > 0 ? 'Bugünün kartları' : 'Bugünün kartları işlendi'}
              </h1>
            </div>
            {scheduledHabits.length > 0 && (
              <span className="dashboard-flow__progress">{completedCount} tamamlandı · {skippedCount} atlandı</span>
            )}
          </div>

          {habits.length === 0 ? (
            <SurfaceCard variant="hero" interactive onClick={() => setShowCreateFlow(true)} className="dashboard-empty">
              <span className="dashboard-empty__icon">＋</span>
              <h2>İlk kartını oluştur</h2>
              <p>Bugünün akışını bir alışkanlıkla başlat.</p>
            </SurfaceCard>
          ) : scheduledHabits.length === 0 ? (
            <SurfaceCard variant="tinted" className="dashboard-empty">
            <span className="dashboard-empty__emoji"><LuupiIcon name="cloud" size={48} /></span>
              <h2>Bugün planlı kart yok</h2>
              <p>Ritmini dinlendir veya yeni bir alışkanlık ekle.</p>
            </SurfaceCard>
          ) : pendingEntries.length > 0 ? (
            <HabitSwipeDeck entries={pendingEntries} onResolve={handleResolve} />
          ) : (
            <SurfaceCard variant="hero" className="dashboard-complete-scene">
              <div className="dashboard-complete-scene__mark">✓</div>
              <span className="type-caption uppercase tracking-[0.15em]">Akış tamamlandı</span>
              <h2>Bugünün kararları hazır.</h2>
              <p>{completedCount} alışkanlık tamamlandı, {skippedCount} alışkanlık bugün atlandı.</p>
              <AppButton tone="tonal" size="sm" onClick={() => openResults()}>Sonuçları gör</AppButton>
            </SurfaceCard>
          )}

          <MiniResultDeck entries={resultEntries} onOpen={openResults} />
        </main>
      </div>
    </>
  )
}
