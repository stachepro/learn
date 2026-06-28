import { useState, useEffect } from 'react'
import { useApp } from '../context/AppContext'
import { usePomodoro } from '../context/PomodoroContext'
import HabitRow from '../components/HabitRow'
import ExpBar from '../components/ExpBar'
import AddHabitModal from '../components/AddHabitModal'
import ContributionsGrid from '../components/ContributionsGrid'
import { formatDisplayDate, formatMinutes, yesterdayStr } from '../utils/date'
import type { HabitLog } from '../types'

function emptyLog(): HabitLog {
  return { completed: false, boostMode: false, boostUsed: false, notes: '', pomodoroSessions: [] }
}

export default function Dashboard() {
  const { habits, profile, todayLog, logs, freeSessions } = useApp()
  const { startFree, phase, isFree } = usePomodoro()
  const [showAdd, setShowAdd] = useState(false)
  const [mounted, setMounted] = useState(false)
  const yesterday = yesterdayStr()

  useEffect(() => { setMounted(true) }, [])

  const habitEntries = habits.map((h) => ({ habit: h, log: todayLog.habits[h.id] ?? emptyLog() }))
  const completed = habitEntries.filter(({ log }) => log.completed).length
  const total = habits.length
  const allDone = total > 0 && completed === total

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
          <h1 className="display text-3xl font-extrabold mt-1" style={{ color: '#f1f5f5' }}>
            Merhaba, {profile.username} 👋
          </h1>
        </div>

        {/* Hero mosaic — frosted glass blocks */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {/* Streak — amber, gentle glow */}
          <div className="glass g-amber streak-glow col-span-1 p-4" style={{ borderRadius: 24 }}>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] ink-60 mb-1">Seri</p>
            <div className="flex items-baseline gap-1">
              <span className="display text-4xl font-extrabold tnum">{profile.streak}</span>
              <span className="text-sm font-semibold ink-60">gün</span>
            </div>
            <p className="text-[11px] mt-1.5 ink-45">En iyi: {profile.longestStreak}</p>
          </div>

          {/* Level — teal */}
          <div className="glass g-teal col-span-1 p-4" style={{ borderRadius: 24 }}>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] ink-60 mb-1">Seviye</p>
            <div className="flex items-baseline gap-1 mb-2.5">
              <span className="display text-4xl font-extrabold tnum">{profile.level}</span>
            </div>
            <ExpBar totalExp={profile.totalExp} level={profile.level} compact />
          </div>

          {/* Today progress — lime when done, sky otherwise */}
          <div className={`glass ${allDone ? 'g-lime' : 'g-sky'} col-span-2 sm:col-span-1 p-4 soft-trans`} style={{ borderRadius: 24 }}>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] ink-60 mb-1">
              {allDone ? 'Tamamlandı 🎉' : 'Bugün'}
            </p>
            <div className="flex items-baseline gap-1 mb-2.5">
              <span className="display text-4xl font-extrabold tnum">{completed}</span>
              <span className="text-sm ink-60">/ {total}</span>
            </div>
            {total > 0 ? (
              <div className="well rounded-full overflow-hidden" style={{ height: 7 }}>
                <div
                  className="h-full rounded-full progress-fill"
                  style={{
                    width: `${(completed / total) * 100}%`,
                    background: allDone
                      ? 'linear-gradient(90deg, #2f7d44, #5fb070)'
                      : 'linear-gradient(90deg, #234a6e, #4179ad)',
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
              style={freeRunning ? { background: 'rgba(192,67,46,0.9)', color: '#fff5f2', borderColor: 'transparent' } : undefined}
            >
              🧘 {freeRunning ? 'Çalışıyor' : 'Serbest'}
            </button>
            <button
              onClick={() => setShowAdd(true)}
              className="btn-ink btn-press flex items-center gap-1 text-xs px-4 py-2"
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
            <div className="glass g-amber w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3 text-2xl font-bold">+</div>
            <p className="display text-base font-bold">İlk alışkanlığını ekle</p>
            <p className="text-xs mt-1 ink-60">Her gün küçük adımlar büyük değişimler yaratır</p>
          </button>
        ) : (
          <div className="space-y-2.5">
            {habitEntries.map(({ habit, log }) => (
              <HabitRow key={habit.id} habit={habit} log={log} />
            ))}
          </div>
        )}

        {/* Daily stats */}
        {habits.length > 0 && (
          <div className="glass g-neutral" style={{ borderRadius: 24 }}>
            <p className="display text-sm font-bold px-5 py-3.5" style={{ borderBottom: '1px solid rgba(33,48,61,0.12)' }}>
              Günlük İstatistikler
            </p>
            <div className="grid grid-cols-3">
              <StatCell label="Aktif çalışma" value={formatMinutes(todayWork + todayFreeWork)} />
              <StatCell label="Mola süresi" value={formatMinutes(todayBreak)} border />
              <StatCell
                label="Dünkü"
                value={vsYesterday === null ? '--' : `${vsYesterday >= 0 ? '+' : ''}${vsYesterday}%`}
                border
                color={vsYesterday === null ? undefined : vsYesterday >= 0 ? '#2f7d44' : '#c0432e'}
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

function StatCell({ label, value, color, border }: { label: string; value: string; color?: string; border?: boolean }) {
  return (
    <div className="px-5 py-4" style={border ? { borderLeft: '1px solid rgba(33,48,61,0.12)' } : undefined}>
      <p className="text-[10px] mb-1 font-semibold uppercase tracking-wider ink-45">{label}</p>
      <p className="display text-xl font-bold tnum" style={color ? { color } : undefined}>{value}</p>
    </div>
  )
}
