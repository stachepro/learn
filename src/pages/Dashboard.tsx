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
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: 'rgba(26,23,38,0.42)' }}>
              {formatDisplayDate(new Date())}
            </p>
            <h1 className="display text-[26px] sm:text-3xl font-extrabold mt-1 leading-tight" style={{ color: '#1a1726' }}>
              Merhaba, {profile.username}
            </h1>
          </div>
          <div
            className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'linear-gradient(150deg, #fbbf24, #f97316)', boxShadow: '0 8px 18px -8px rgba(249,115,22,0.5)' }}
          >
            <span className="display font-black" style={{ color: '#2a1402' }}>{profile.username.charAt(0).toUpperCase()}</span>
          </div>
        </div>

        {/* Thin stat strip — gamification, compact */}
        <div className="grid grid-cols-3 gap-2.5">
          {/* Streak */}
          <div className="rounded-2xl flame-glow tile-press flex items-center gap-2.5 px-3 py-2.5" style={{ background: '#faecd6', border: '1px solid #f3dcb0' }}>
            <FlameIcon size={22} />
            <div className="min-w-0">
              <p key={profile.streak} className="display text-xl font-black tnum leading-none animate-value-pop" style={{ color: '#9a4d0a' }}>{profile.streak}</p>
              <p className="text-[10px] font-bold uppercase tracking-wide mt-0.5" style={{ color: '#b87520' }}>seri</p>
            </div>
          </div>
          {/* Level */}
          <div className="rounded-2xl tile-press flex items-center gap-2.5 px-3 py-2.5" style={{ background: '#e7f4d8', border: '1px solid #cfe7af' }}>
            <BoltIcon size={22} />
            <div className="min-w-0 flex-1">
              <p key={profile.level} className="display text-xl font-black tnum leading-none animate-value-pop" style={{ color: '#3b6d11' }}>{profile.level}</p>
              <div className="mt-1"><ExpBar totalExp={profile.totalExp} level={profile.level} compact tiny /></div>
            </div>
          </div>
          {/* Today */}
          <div className="rounded-2xl tile-press flex items-center gap-2.5 px-3 py-2.5 soft-trans" style={allDone ? { background: '#e7f4d8', border: '1px solid #cfe7af' } : { background: '#e6f0fb', border: '1px solid #c5ddf6' }}>
            <CheckRingIcon size={22} done={allDone} />
            <div className="min-w-0">
              <p key={completed} className="display text-xl font-black tnum leading-none animate-value-pop" style={{ color: allDone ? '#3b6d11' : '#185fa5' }}>{completed}/{total}</p>
              <p className="text-[10px] font-bold uppercase tracking-wide mt-0.5" style={{ color: allDone ? '#4e8a1e' : '#3f7bc0' }}>{allDone ? 'bitti' : 'bugün'}</p>
            </div>
          </div>
        </div>

        {/* Habits header */}
        <div className="flex items-center justify-between pt-1">
          <h2 className="display text-lg font-extrabold" style={{ color: '#1a1726' }}>
            Bugün
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={startFree}
              disabled={freeRunning}
              className="chip btn-press flex items-center gap-1.5 text-xs px-3.5 py-2"
              style={freeRunning ? { background: '#e2503f', color: '#fff5f2', borderColor: 'transparent' } : undefined}
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
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3 text-2xl font-black ring-pulse" style={{ background: '#e7f4d8', color: '#3b6d11' }}>+</div>
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
            <p className="display text-sm font-bold px-5 py-3.5" style={{ borderBottom: '1px solid rgba(26,23,38,0.08)' }}>
              Günlük İstatistikler
            </p>
            <div className="grid grid-cols-3">
              <StatCell label="Aktif çalışma" value={formatMinutes(todayWork + todayFreeWork)} />
              <StatCell label="Mola süresi" value={formatMinutes(todayBreak)} border />
              <StatCell
                label="Dünkü"
                value={vsYesterday === null ? '--' : `${vsYesterday >= 0 ? '+' : ''}${vsYesterday}%`}
                border
                color={vsYesterday === null ? undefined : vsYesterday >= 0 ? '#3b6d11' : '#cc4322'}
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

function BoltIcon({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M13 2L4 14h6l-1 8 9-12h-6l1-8z" fill="rgb(99,153,34)" />
    </svg>
  )
}

function CheckRingIcon({ size = 24, done }: { size?: number; done?: boolean }) {
  const c = done ? 'rgb(99,153,34)' : 'rgb(55,138,221)'
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="9" stroke={c} strokeWidth="2.2" />
      <path d="M8 12l3 3 5-6" stroke={c} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function StatCell({ label, value, color, border }: { label: string; value: string; color?: string; border?: boolean }) {
  return (
    <div className="px-5 py-4" style={border ? { borderLeft: '1px solid rgba(26,23,38,0.08)' } : undefined}>
      <p className="text-[10px] mb-1 font-semibold uppercase tracking-wider ink-45">{label}</p>
      <p className="display text-xl font-bold tnum" style={color ? { color } : undefined}>{value}</p>
    </div>
  )
}
