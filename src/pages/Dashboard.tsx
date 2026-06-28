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

const blueGlass = {
  background: 'rgba(10, 28, 92, 0.55)',
  backdropFilter: 'blur(28px) saturate(190%)',
  WebkitBackdropFilter: 'blur(28px) saturate(190%)',
  border: '1px solid rgba(70, 135, 255, 0.28)',
  boxShadow: [
    '0 20px 55px rgba(0,8,70,0.55)',
    '0 6px 18px rgba(0,15,90,0.35)',
    'inset 0 2px 0 rgba(120,185,255,0.22)',
    'inset 0 -2px 0 rgba(0,0,65,0.45)',
  ].join(', '),
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
        <p className="text-xs font-medium" style={{ color: 'rgba(140,180,255,0.4)' }}>
          {formatDisplayDate(new Date())}
        </p>

        {/* Hero cards */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">

          {/* Streak — no fire, amber pulse glow via CSS class */}
          <div className="relative col-span-1 rounded-3xl p-4 overflow-hidden glass-streak">
            <div className="relative z-10">
              <p className="text-[10px] font-bold uppercase tracking-widest mb-0.5"
                style={{ color: 'rgba(253,224,71,0.7)' }}>Seri</p>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-black" style={{ color: '#fde047' }}>{profile.streak}</span>
                <span className="text-sm font-semibold" style={{ color: 'rgba(253,224,71,0.5)' }}>gün</span>
              </div>
              <p className="text-[11px] mt-1" style={{ color: 'rgba(251,191,36,0.5)' }}>
                En iyi: {profile.longestStreak}
              </p>
            </div>
          </div>

          {/* Level — teal glass */}
          <div
            className="col-span-1 rounded-3xl p-4"
            style={{
              background: 'rgba(5, 55, 40, 0.58)',
              backdropFilter: 'blur(28px) saturate(190%)',
              WebkitBackdropFilter: 'blur(28px) saturate(190%)',
              border: '1px solid rgba(16,185,129,0.30)',
              boxShadow: [
                '0 20px 55px rgba(0,30,20,0.52)',
                '0 6px 18px rgba(0,50,35,0.3)',
                'inset 0 2px 0 rgba(60,220,150,0.2)',
                'inset 0 -2px 0 rgba(0,35,25,0.48)',
              ].join(', '),
            }}
          >
            <p className="text-[10px] font-bold uppercase tracking-widest mb-0.5"
              style={{ color: 'rgba(52,211,153,0.7)' }}>Seviye</p>
            <div className="flex items-baseline gap-1 mb-2.5">
              <span className="text-4xl font-black" style={{ color: '#6ee7b7' }}>{profile.level}</span>
            </div>
            <ExpBar totalExp={profile.totalExp} level={profile.level} compact />
          </div>

          {/* Today progress */}
          <div
            className="col-span-2 sm:col-span-1 rounded-3xl p-4 habit-row-inner"
            style={allDone ? {
              background: 'rgba(5, 55, 35, 0.58)',
              backdropFilter: 'blur(28px) saturate(190%)',
              WebkitBackdropFilter: 'blur(28px) saturate(190%)',
              border: '1px solid rgba(34,197,94,0.30)',
              boxShadow: [
                '0 0 40px rgba(34,197,94,0.2)',
                '0 20px 55px rgba(0,40,20,0.5)',
                'inset 0 2px 0 rgba(60,220,100,0.2)',
                'inset 0 -2px 0 rgba(0,30,15,0.45)',
              ].join(', '),
            } : { ...blueGlass }}
          >
            <p className="text-[10px] font-bold uppercase tracking-widest mb-0.5"
              style={{ color: allDone ? 'rgba(74,222,128,0.75)' : 'rgba(140,180,255,0.55)' }}>
              {allDone ? 'Tamamlandı' : 'Bugün'}
            </p>
            <div className="flex items-baseline gap-1 mb-2.5">
              <span className="text-4xl font-black" style={{ color: allDone ? '#4ade80' : '#c7d8ff' }}>
                {completed}
              </span>
              <span className="text-sm" style={{ color: 'rgba(140,185,255,0.4)' }}>/ {total}</span>
            </div>
            {total > 0 ? (
              <div className="h-1.5 rounded-full overflow-hidden"
                style={{ background: 'rgba(0,10,60,0.5)', boxShadow: 'inset 0 1px 0 rgba(0,0,60,0.4)' }}>
                <div
                  className="h-full rounded-full pomo-progress-fill"
                  style={{
                    width: `${(completed / total) * 100}%`,
                    background: allDone
                      ? 'linear-gradient(90deg, #22c55e, #4ade80)'
                      : 'linear-gradient(90deg, #3b82f6, #60a5fa)',
                    boxShadow: allDone ? '0 0 8px rgba(34,197,94,0.5)' : '0 0 8px rgba(59,130,246,0.5)',
                  }}
                />
              </div>
            ) : (
              <p className="text-xs" style={{ color: 'rgba(140,180,255,0.3)' }}>Alışkanlık yok</p>
            )}
          </div>
        </div>

        {/* Habits header */}
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-widest" style={{ color: 'rgba(140,185,255,0.45)' }}>
            Alışkanlıklar
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={startFree}
              disabled={freeRunning}
              className="btn-press flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl transition-all"
              style={freeRunning ? {
                background: 'rgba(239,68,68,0.18)',
                border: '1px solid rgba(239,68,68,0.35)',
                color: '#fca5a5',
                boxShadow: 'inset 0 1px 0 rgba(255,120,120,0.15)',
              } : {
                background: 'rgba(10,28,92,0.55)',
                border: '1px solid rgba(70,135,255,0.28)',
                color: 'rgba(180,210,255,0.55)',
                boxShadow: 'inset 0 1px 0 rgba(120,185,255,0.12)',
              }}
            >
              🧘 {freeRunning ? 'Çalışıyor' : 'Serbest'}
            </button>
            <button
              onClick={() => setShowAdd(true)}
              className="btn-press flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-xl transition-all"
              style={{
                background: 'rgba(37,99,235,0.25)',
                border: '1px solid rgba(96,165,250,0.35)',
                color: '#93c5fd',
                boxShadow: 'inset 0 1px 0 rgba(150,210,255,0.18)',
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
              ...blueGlass,
              border: '1px dashed rgba(70,135,255,0.22)',
            }}
          >
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3 text-2xl"
              style={{
                background: 'rgba(37,99,235,0.2)',
                border: '1px solid rgba(96,165,250,0.3)',
                boxShadow: 'inset 0 1px 0 rgba(150,210,255,0.18)',
              }}
            >+</div>
            <p className="text-sm font-semibold" style={{ color: 'rgba(180,210,255,0.55)' }}>İlk alışkanlığını ekle</p>
            <p className="text-xs mt-1" style={{ color: 'rgba(140,185,255,0.3)' }}>Her gün küçük adımlar büyük değişimler yaratır</p>
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
          <div className="rounded-3xl overflow-hidden" style={blueGlass}>
            <p className="text-[10px] font-bold uppercase tracking-widest px-4 py-3"
              style={{ color: 'rgba(140,185,255,0.45)', borderBottom: '1px solid rgba(70,135,255,0.12)' }}>
              Günlük İstatistikler
            </p>
            <div className="grid grid-cols-3 divide-x" style={{ borderColor: 'rgba(70,135,255,0.1)' }}>
              <StatCell label="Aktif çalışma" value={formatMinutes(todayWork + todayFreeWork)} />
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
        <div className="rounded-3xl p-5" style={blueGlass}>
          <ContributionsGrid />
        </div>
      </div>
    </>
  )
}

function StatCell({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="px-4 py-4" style={{ borderColor: 'rgba(70,135,255,0.1)' }}>
      <p className="text-[10px] mb-1 font-medium" style={{ color: 'rgba(140,185,255,0.4)' }}>{label}</p>
      <p className="text-xl font-bold" style={{ color: color ?? '#c7d8ff' }}>{value}</p>
    </div>
  )
}
