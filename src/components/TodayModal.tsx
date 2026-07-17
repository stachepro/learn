import { useEffect, useMemo, useState } from 'react'
import { useApp } from '../context/AppContext'
import StatModalShell from './StatModalShell'
import { useCountUp } from '../utils/useCountUp'
import { isHabitScheduledFor, getWindowStatus } from '../utils/habitSchedule'
import { migrateHabitLog } from '../utils/habitLog'
import { dateStr, formatMinutes } from '../utils/date'
import { getHabitTimeOfDay, type Habit, type HabitLog, type TimeOfDay } from '../types'
import LuupiIcon from './ui/LuupiIcon'
import type { IconName } from '../utils/icons'

/* Bugün penceresi: günün ilerleme halkası + vakit gruplarına göre
   saat damgalı tamamlama dökümü. */

const RING_R = 52
const RING_C = 2 * Math.PI * RING_R

const TIME_GROUPS: { id: TimeOfDay; label: string; icon: IconName }[] = [
  { id: 'morning', label: 'Sabah', icon: 'sunrise' },
  { id: 'afternoon', label: 'Öğle', icon: 'sun' },
  { id: 'evening', label: 'Akşam', icon: 'moon' },
  { id: 'any', label: 'Gün İçinde', icon: 'clock' },
]

export default function TodayModal({ onClose }: { onClose: () => void }) {
  const { habits, todayLog, freeSessions } = useApp()
  const [mounted, setMounted] = useState(false)
  useEffect(() => { const t = requestAnimationFrame(() => setMounted(true)); return () => cancelAnimationFrame(t) }, [])

  const now = new Date()
  const today = dateStr(now)

  const entries = useMemo(() =>
    habits
      .filter((h) => isHabitScheduledFor(h, today))
      .map((h) => ({ habit: h, log: migrateHabitLog(todayLog.habits[h.id] ?? {}) })),
  [habits, todayLog, today])

  const completed = entries.filter(({ log }) => log.completed).length
  const total = entries.length
  const pct = total === 0 ? 0 : (completed / total) * 100
  const allDone = total > 0 && completed === total
  const shownCompleted = useCountUp(completed, 600)

  const todayWork = entries.reduce((acc, { log }) => acc + log.pomodoroSessions.reduce((s, p) => s + p.workDuration, 0), 0)
    + (freeSessions ?? []).filter((s) => s.date === today).reduce((acc, s) => acc + s.workDuration, 0)

  const dashOffset = mounted ? RING_C * (1 - pct / 100) : RING_C
  const ringColor = allDone ? ['#4ade80', '#16a34a'] : ['#60a5fa', '#2563eb']

  return (
    <StatModalShell
      title="Bugün"
      subtitle={allDone ? 'Günün hepsi tamam — harikasın!' : 'Günün dökümü'}
      onClose={onClose}
      headerIcon={<span className="text-xl leading-none"><LuupiIcon name={allDone ? 'confetti' : 'list-check'} /></span>}
    >
      {/* ── İlerleme halkası ── */}
      <div
        className="rounded-3xl px-4 pt-6 pb-5 text-center animate-pop"
        style={{
          background: allDone
            ? 'radial-gradient(circle at 50% 30%, rgba(74,222,128,0.3), rgba(22,163,74,0.05))'
            : 'radial-gradient(circle at 50% 30%, rgba(96,165,250,0.25), rgba(37,99,235,0.04))',
        }}
      >
        <div className="relative w-36 h-36 mx-auto">
          <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
            <circle cx="60" cy="60" r={RING_R} fill="none" stroke="rgb(var(--ink) / 0.07)" strokeWidth="9" />
            <circle
              cx="60" cy="60" r={RING_R} fill="none"
              stroke="url(#today-ring-grad)" strokeWidth="9" strokeLinecap="round"
              strokeDasharray={RING_C} strokeDashoffset={dashOffset}
              className="pie-slice"
            />
            <defs>
              <linearGradient id="today-ring-grad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor={ringColor[0]} />
                <stop offset="100%" stopColor={ringColor[1]} />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <p className="display text-3xl font-black tnum leading-none" style={{ color: allDone ? '#15803d' : 'var(--sf-blue-tx)' }}>
              {shownCompleted}<span className="text-lg ink-45">/{total}</span>
            </p>
            <p className="text-[9px] font-bold uppercase tracking-widest mt-1 ink-45">tamamlandı</p>
          </div>
        </div>
        {todayWork > 0 && (
          <p className="text-[11px] font-semibold mt-3 ink-45">
            Bugün <span className="tnum font-bold" style={{ color: 'var(--sf-blue-tx)' }}>{formatMinutes(todayWork)}</span> odaklanılmış çalışma
          </p>
        )}
      </div>

      {/* ── Vakit gruplarına göre döküm ── */}
      {total === 0 ? (
        <div className="text-center py-6">
          <p className="text-2xl mb-2"><LuupiIcon name="calendar" size={32} /></p>
          <p className="text-sm font-semibold ink-60">Bugün için planlanmış alışkanlık yok</p>
        </div>
      ) : (
        TIME_GROUPS.map(({ id, label, icon }) => {
          const group = entries.filter(({ habit }) => getHabitTimeOfDay(habit) === id)
          if (group.length === 0) return null
          return (
            <div key={id} className="animate-pop" style={{ animationDelay: '80ms' }}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm leading-none"><LuupiIcon name={icon} size={16} /></span>
                <p className="display text-sm font-extrabold" style={{ color: 'rgb(var(--ink))' }}>{label}</p>
                <span className="text-[10px] font-bold tnum ink-45">
                  {group.filter(({ log }) => log.completed).length}/{group.length}
                </span>
              </div>
              <div className="space-y-1.5">
                {group.map(({ habit, log }, i) => (
                  <HabitStatusRow key={habit.id} habit={habit} log={log} now={now} delay={120 + i * 50} />
                ))}
              </div>
            </div>
          )
        })
      )}
    </StatModalShell>
  )
}

function HabitStatusRow({ habit, log, now, delay }: { habit: Habit; log: HabitLog; now: Date; delay: number }) {
  const done = log.completed
  const missed = !done && getWindowStatus(habit, now) === 'expired'
  const completedTime = log.completedAt
    ? new Date(log.completedAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
    : null

  return (
    <div
      className="flex items-center gap-2.5 rounded-2xl px-3 py-2.5 animate-pop"
      style={{
        animationDelay: `${delay}ms`,
        background: done ? '#e9f9ee' : missed ? 'rgba(245,158,11,0.07)' : 'rgb(var(--ink) / 0.03)',
        border: done ? '1px solid #c2ecd0' : '1px solid rgb(var(--ink) / 0.05)',
        opacity: missed ? 0.8 : 1,
      }}
    >
      <span className="text-base leading-none flex-shrink-0"><LuupiIcon name={habit.icon} size={18} /></span>
      <p
        className="text-xs font-semibold flex-1 min-w-0 truncate"
        style={{ color: done ? '#15803d' : 'rgb(var(--ink))', textDecoration: done ? 'line-through' : 'none', textDecorationColor: 'rgba(21,128,61,0.4)' }}
      >
        {habit.name}
      </p>
      {done ? (
        <span className="text-[10px] font-bold tnum flex-shrink-0" style={{ color: '#3f9d62' }}>
          ✓ {completedTime ?? 'tamam'}
        </span>
      ) : missed ? (
        <span className="text-[10px] font-bold flex-shrink-0" style={{ color: 'rgba(245,158,11,0.9)' }}><LuupiIcon name="alarm" size={14} /> pencere kapandı</span>
      ) : (
        <span className="text-[10px] font-bold flex-shrink-0 ink-45">bekliyor</span>
      )}
    </div>
  )
}
