import { useState, useEffect } from 'react'
import { useApp } from '../context/AppContext'
import { usePomodoro } from '../context/PomodoroContext'
import HabitRow from '../components/HabitRow'
import ExpBar from '../components/ExpBar'
import AddHabitModal from '../components/AddHabitModal'
import ContributionsGrid from '../components/ContributionsGrid'
import { formatDisplayDate, formatMinutes, yesterdayStr } from '../utils/date'
import { isHabitScheduledFor, getWindowStatus } from '../utils/habitSchedule'
import type { HabitLog } from '../types'

function emptyLog(): HabitLog {
  return { completed: false, boostMode: false, boostUsed: false, notes: '', pomodoroSessions: [] }
}

export default function Dashboard() {
  const { habits, profile, todayLog, logs, freeSessions } = useApp()
  const { startFree, phase, isFree } = usePomodoro()
  const [showAdd, setShowAdd] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [now, setNow] = useState(() => new Date())
  const yesterday = yesterdayStr()

  useEffect(() => { setMounted(true) }, [])

  // Update `now` every minute so time-window expiry is reflected in real time
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000)
    return () => clearInterval(id)
  }, [])

  const todayDateStr = now.toISOString().slice(0, 10)

  // Only habits scheduled for today
  const scheduledHabits = habits.filter((h) => isHabitScheduledFor(h, todayDateStr))
  const allEntries = scheduledHabits.map((h) => ({ habit: h, log: todayLog.habits[h.id] ?? emptyLog() }))

  // Active: completed OR time window not yet expired
  const habitEntries = allEntries.filter(({ habit, log }) =>
    log.completed || getWindowStatus(habit, now) !== 'expired'
  )
  // Missed: window expired and not completed
  const missedEntries = allEntries.filter(({ habit, log }) =>
    !log.completed && getWindowStatus(habit, now) === 'expired'
  )

  const completed = allEntries.filter(({ log }) => log.completed).length
  const total = scheduledHabits.length
  const allDone = total > 0 && completed === total && missedEntries.length === 0

  const todayWork = habitEntries.reduce(
    (acc, { log }) => acc + log.pomodoroSessions.reduce((s, p) => s + p.workDuration, 0), 0)
  const todayFreeWork = (freeSessions ?? [])
    .filter((s) => s.date === new Date().toISOString().slice(0, 10))
    .reduce((acc, s) => acc + s.workDuration, 0)
  const todayBreak = habitEntries.reduce(
    (acc, { log }) => acc + log.pomodoroSessions.reduce((s, p) => s + p.breakDuration, 0), 0)
  const yesterdayWork = (() => {
    const yd = logs[yesterday]
    if (!yd) return 0
    return Object.values(yd.habits).reduce(
      (acc, h) => acc + h.pomodoroSessions.reduce((s, p) => s + p.workDuration, 0), 0)
  })()
  const vsYesterday = yesterdayWork === 0 ? null
    : Math.round(((todayWork - yesterdayWork) / yesterdayWork) * 100)

  const freeRunning = phase !== 'idle' && isFree

  return (
    <>
      {showAdd && <AddHabitModal onClose={() => setShowAdd(false)} />}

      <div className={`max-w-3xl mx-auto px-4 py-6 pb-36 sm:pb-24 space-y-5 ${mounted ? 'page-enter' : 'opacity-0'}`}>
        {/* Greeting */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: 'rgba(241,245,245,0.5)' }}>
            {formatDisplayDate(new Date())}
          </p>
          <h1 className="display text-[28px] sm:text-3xl font-extrabold mt-1 leading-tight" style={{ color: '#f1f5f5' }}>
            Merhaba, <span className="energy-text">{profile.username}</span>
          </h1>
        </div>

        {/* Hero mosaic — gamified energy blocks */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {/* Streak — flame hero, amber breathing glow */}
          <div className="glass g-flame flame-glow tile-press col-span-1 p-4 relative overflow-hidden" style={{ borderRadius: 24 }}>
            <FlameIcon className="absolute -right-3 -bottom-3 opacity-[0.13]" size={92} />
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] ink-60 mb-1">Seri</p>
            <div className="flex items-baseline gap-1">
              <span key={profile.streak} className="display text-[42px] font-black tnum energy-text leading-none animate-value-pop">{profile.streak}</span>
              <span className="text-sm font-semibold ink-60">gün</span>
            </div>
            <p className="text-[11px] mt-2 ink-45">En uzun seri: <span className="font-bold" style={{ color: 'rgba(251,191,36,0.9)' }}>{profile.longestStreak}</span></p>
          </div>

          {/* Level — green progress */}
          <div className="glass g-lime tile-press col-span-1 p-4" style={{ borderRadius: 24 }}>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] ink-60 mb-1">Seviye</p>
            <div className="flex items-baseline gap-1 mb-2.5">
              <span key={profile.level} className="display text-[42px] font-black tnum acc-text leading-none animate-value-pop">{profile.level}</span>
            </div>
            <ExpBar totalExp={profile.totalExp} level={profile.level} compact />
          </div>

          {/* Today progress — green when done, neutral otherwise */}
          <div className={`glass ${allDone ? 'g-lime' : 'g-neutral'} tile-press col-span-2 sm:col-span-1 p-4 soft-trans`} style={{ borderRadius: 24 }}>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] ink-60 mb-1">
              {allDone ? '🎉 Tamamlandı' : 'Bugün'}
            </p>
            <div className="flex items-baseline gap-1 mb-2.5">
              <span key={completed} className={`display text-[42px] font-black tnum leading-none animate-value-pop ${allDone ? 'acc-text' : ''}`} style={!allDone ? { color: '#f1f5f5' } : undefined}>{completed}</span>
              <span className="text-sm ink-60">/ {total}</span>
            </div>
            {total > 0 ? (
              <div className="well rounded-full overflow-hidden" style={{ height: 8 }}>
                <div
                  className={`h-full rounded-full progress-fill ${allDone ? 'acc-fill' : ''}`}
                  style={{
                    width: `${(completed / total) * 100}%`,
                    ...(allDone ? {} : { background: 'linear-gradient(90deg, #f59e0b, #fb8b3d)', boxShadow: '0 0 10px rgba(245,158,11,0.5)' }),
                  }}
                />
              </div>
            ) : (
              <p className="text-xs ink-45">Alışkanlık yok</p>
            )}
          </div>
        </div>

        {/* Habits header */}
        <div className="flex items-center justify-between pt-1">
          <h2 className="display text-base font-bold" style={{ color: '#f1f5f5' }}>
            Alışkanlıklar
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={startFree}
              disabled={freeRunning}
              className="chip btn-press flex items-center gap-1.5 text-xs px-3.5 py-2"
              style={freeRunning ? { background: 'rgba(225,90,60,0.92)', color: '#fff5f2', borderColor: 'transparent' } : undefined}
            >
              🧘 {freeRunning ? 'Çalışıyor' : 'Serbest'}
            </button>
            <button
              onClick={() => setShowAdd(true)}
              className="btn-energy btn-press flex items-center gap-1 text-xs px-4 py-2"
            >
              + Ekle
            </button>
          </div>
        </div>

        {/* Habit list */}
        {habits.length === 0 ? (
          <button
            onClick={() => setShowAdd(true)}
            className="glass g-neutral glass-lift btn-press w-full p-10 text-center"
            style={{ borderRadius: 24 }}
          >
            <div className="glass g-lime w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3 text-2xl font-bold acc ring-pulse">+</div>
            <p className="display text-base font-bold">İlk alışkanlığını ekle</p>
            <p className="text-xs mt-1 ink-60">Her gün küçük adımlar büyük değişimler yaratır</p>
          </button>
        ) : habitEntries.length === 0 && missedEntries.length === 0 ? (
          <div className="glass g-neutral p-6 text-center" style={{ borderRadius: 24 }}>
            <p className="text-2xl mb-2">📅</p>
            <p className="text-sm font-semibold ink-60">Bugün için planlanmış alışkanlık yok</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {habitEntries.map(({ habit, log }, i) => (
              <div key={habit.id} className="animate-pop" style={{ animationDelay: `${Math.min(i * 60, 360)}ms` }}>
                <HabitRow habit={habit} log={log} />
              </div>
            ))}
          </div>
        )}

        {/* Missed habits section */}
        {missedEntries.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 pt-1">
              <span className="text-base">⏰</span>
              <h2 className="display text-base font-bold" style={{ color: 'rgba(245,158,11,0.9)' }}>
                Yapılmamış Alışkanlıklar
              </h2>
              <span
                className="text-xs font-bold px-2 py-0.5 rounded-full"
                style={{ background: 'rgba(245,158,11,0.15)', color: 'rgba(245,158,11,0.9)', border: '1px solid rgba(245,158,11,0.3)' }}
              >
                {missedEntries.length}
              </span>
            </div>
            <p className="text-[11px] ink-45 -mt-1">Pencere kapandı — geç de olsa tamamlayabilirsin</p>
            <div className="space-y-2.5" style={{ opacity: 0.75 }}>
              {missedEntries.map(({ habit, log }, i) => (
                <div key={habit.id} className="animate-pop" style={{ animationDelay: `${Math.min(i * 60, 360)}ms` }}>
                  <HabitRow habit={habit} log={log} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Daily stats */}
        {habits.length > 0 && (
          <div className="glass g-neutral" style={{ borderRadius: 24 }}>
            <p className="display text-sm font-bold px-5 py-3.5" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              Günlük İstatistikler
            </p>
            <div className="grid grid-cols-3">
              <StatCell label="Aktif çalışma" value={formatMinutes(todayWork + todayFreeWork)} />
              <StatCell label="Mola süresi" value={formatMinutes(todayBreak)} border />
              <StatCell
                label="Dünkü"
                value={vsYesterday === null ? '--' : `${vsYesterday >= 0 ? '+' : ''}${vsYesterday}%`}
                border
                color={vsYesterday === null ? undefined : vsYesterday >= 0 ? '#34c759' : '#e15a3c'}
              />
            </div>
          </div>
        )}

        {/* Contributions */}
        <div className="glass g-neutral p-5" style={{ borderRadius: 24 }}>
          <ContributionsGrid />
        </div>
      </div>
    </>
  )
}

function FlameIcon({ size = 24, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path
        d="M12 2c.5 3 2.5 4.5 4 6.5C17.5 10.5 18 12.3 18 14a6 6 0 1 1-12 0c0-1.8.7-3.3 1.8-4.5C8.5 8.8 9 7.8 9 6.5c1.2.8 2 2 2.2 3.3C12.2 8.4 12.5 5.7 12 2z"
        fill="rgb(249,115,22)"
      />
    </svg>
  )
}

function StatCell({ label, value, color, border }: { label: string; value: string; color?: string; border?: boolean }) {
  return (
    <div className="px-5 py-4" style={border ? { borderLeft: '1px solid rgba(255,255,255,0.08)' } : undefined}>
      <p className="text-[10px] mb-1 font-semibold uppercase tracking-wider ink-45">{label}</p>
      <p className="display text-xl font-bold tnum" style={color ? { color } : undefined}>{value}</p>
    </div>
  )
}
