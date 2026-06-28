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
  const { habits, profile, todayLog, logs } = useApp()
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
        <p className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.3)' }}>
          {formatDisplayDate(new Date())}
        </p>

        {/* Hero cards */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">

          {/* Streak — Duolingo flame */}
          <div className="relative col-span-1 rounded-3xl p-4 overflow-hidden glass-streak">
            <div className="fire-wrap">
              <div className="flame-outer" />
              <div className="flame-mid" />
              <div className="flame-core" />
            </div>
            <div className="relative z-10">
              <p className="text-[10px] font-bold uppercase tracking-widest mb-0.5" style={{ color: 'rgba(249,115,22,0.7)' }}>Seri</p>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-black" style={{ color: '#fb923c' }}>{profile.streak}</span>
                <span className="text-sm font-semibold" style={{ color: 'rgba(249,115,22,0.5)' }}>gün</span>
              </div>
              <p className="text-[11px] mt-1" style={{ color: 'rgba(249,115,22,0.5)' }}>En iyi: {profile.longestStreak}</p>
            </div>
          </div>

          {/* Level */}
          <div
            className="col-span-1 rounded-3xl p-4"
            style={{
              background: 'rgba(16,185,129,0.08)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: '1px solid rgba(16,185,129,0.22)',
              boxShadow: '0 0 30px rgba(16,185,129,0.1)',
            }}
          >
            <p className="text-[10px] font-bold uppercase tracking-widest mb-0.5" style={{ color: 'rgba(52,211,153,0.7)' }}>Seviye</p>
            <div className="flex items-baseline gap-1 mb-2.5">
              <span className="text-4xl font-black" style={{ color: '#6ee7b7' }}>{profile.level}</span>
            </div>
            <ExpBar totalExp={profile.totalExp} level={profile.level} compact />
          </div>

          {/* Progress */}
          <div
            className="col-span-2 sm:col-span-1 rounded-3xl p-4 habit-row-inner"
            style={{
              background: allDone ? 'rgba(34,197,94,0.08)' : 'rgba(255,255,255,0.032)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: `1px solid ${allDone ? 'rgba(34,197,94,0.22)' : 'rgba(255,255,255,0.08)'}`,
              boxShadow: allDone ? '0 0 28px rgba(34,197,94,0.1)' : '0 2px 20px rgba(0,0,0,0.3)',
            }}
          >
            <p className="text-[10px] font-bold uppercase tracking-widest mb-0.5"
              style={{ color: allDone ? 'rgba(34,197,94,0.7)' : 'rgba(255,255,255,0.3)' }}>
              {allDone ? 'Tamamlandı' : 'Bugün'}
            </p>
            <div className="flex items-baseline gap-1 mb-2.5">
              <span className="text-4xl font-black" style={{ color: allDone ? '#4ade80' : '#e8e8f4' }}>{completed}</span>
              <span className="text-sm" style={{ color: 'rgba(255,255,255,0.35)' }}>/ {total}</span>
            </div>
            {total > 0 ? (
              <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.07)' }}>
                <div
                  className="h-full rounded-full pomo-progress-fill"
                  style={{
                    width: `${(completed / total) * 100}%`,
                    background: allDone
                      ? 'linear-gradient(90deg, #22c55e, #4ade80)'
                      : 'linear-gradient(90deg, #6366f1, #8b5cf6)',
                    boxShadow: allDone ? '0 0 8px rgba(34,197,94,0.5)' : '0 0 8px rgba(99,102,241,0.4)',
                  }}
                />
              </div>
            ) : (
              <p className="text-xs" style={{ color: 'rgba(255,255,255,0.2)' }}>Alışkanlık yok</p>
            )}
          </div>
        </div>

        {/* Habits header + add/free pomodoro */}
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.3)' }}>
            Alışkanlıklar
          </h2>
          <div className="flex items-center gap-2">
            {/* Free pomodoro */}
            <button
              onClick={startFree}
              disabled={freeRunning}
              className="btn-press flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl transition-all"
              style={freeRunning ? {
                background: 'rgba(239,68,68,0.15)',
                border: '1px solid rgba(239,68,68,0.3)',
                color: '#fca5a5',
              } : {
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: 'rgba(255,255,255,0.45)',
              }}
            >
              🧘 {freeRunning ? 'Çalışıyor' : 'Serbest'}
            </button>

            <button
              onClick={() => setShowAdd(true)}
              className="btn-press flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-xl transition-all"
              style={{
                background: 'rgba(99,102,241,0.15)',
                border: '1px solid rgba(99,102,241,0.3)',
                color: '#a5b4fc',
                boxShadow: '0 0 12px rgba(99,102,241,0.1)',
              }}
            >
              + Ekle
            </button>
          </div>
        </div>

        {/* Habit list */}
        {habits.length === 0 ? (
          <button
            onClick={() => setShowAdd(true)}
            className="btn-press w-full rounded-3xl p-10 text-center transition-all"
            style={{
              background: 'rgba(255,255,255,0.025)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              border: '1px dashed rgba(255,255,255,0.1)',
            }}
          >
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3 text-2xl"
              style={{ background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.2)' }}
            >
              +
            </div>
            <p className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.5)' }}>İlk alışkanlığını ekle</p>
            <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.25)' }}>Her gün küçük adımlar büyük değişimler yaratır</p>
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
          <div
            className="rounded-3xl overflow-hidden"
            style={{
              background: 'rgba(255,255,255,0.028)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              border: '1px solid rgba(255,255,255,0.07)',
            }}
          >
            <p className="text-[10px] font-bold uppercase tracking-widest px-4 py-3"
              style={{ color: 'rgba(255,255,255,0.3)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              Günlük İstatistikler
            </p>
            <div className="grid grid-cols-3 divide-x" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
              <StatCell label="Aktif çalışma" value={formatMinutes(todayWork)} />
              <StatCell label="Mola süresi" value={formatMinutes(todayBreak)} />
              <StatCell
                label="Dünkü"
                value={vsYesterday === null ? '--' : `${vsYesterday >= 0 ? '+' : ''}${vsYesterday}%`}
                color={vsYesterday === null ? undefined : vsYesterday >= 0 ? '#4ade80' : '#f87171'}
              />
            </div>
          </div>
        )}

        {/* Contributions */}
        <div
          className="rounded-3xl p-5"
          style={{
            background: 'rgba(255,255,255,0.025)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            border: '1px solid rgba(255,255,255,0.07)',
          }}
        >
          <ContributionsGrid />
        </div>
      </div>
    </>
  )
}

function StatCell({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="px-4 py-4" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
      <p className="text-[10px] mb-1 font-medium" style={{ color: 'rgba(255,255,255,0.3)' }}>{label}</p>
      <p className="text-xl font-bold" style={{ color: color ?? '#e8e8f4' }}>{value}</p>
    </div>
  )
}
