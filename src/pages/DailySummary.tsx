import { useState, useEffect, type ReactNode } from 'react'
import { useApp } from '../context/AppContext'
import { FREE_ID } from '../context/PomodoroContext'
import { storage } from '../utils/storage'
import { isHabitScheduledFor } from '../utils/habitSchedule'
import { migrateHabitLog } from '../utils/habitLog'
import { dayTotalMl, formatMl } from '../utils/water'
import { todayStr, formatDisplayDate, formatMinutes, formatHMS } from '../utils/date'
import type { PomodoroSession } from '../types'

/* Günlük Özet — bugünün dökümü tek sayfada:
   - Alışkanlıklar: hepsi, ✓/✗ durumuyla
   - Su & Uyanma: yalnızca hedef girilmişse
   - Pomodoro / Acele Yok / To-do: yalnızca bugün TAMAMLANANLAR
     (yarım kalan ya da hiç dokunulmayan iş burada görünmez)
   Üstteki ↻ butonu içerik ağacını yeniden monte eder: tüm giriş
   animasyonları baştan oynar. */

export default function DailySummary() {
  const [mounted, setMounted] = useState(false)
  const [replayKey, setReplayKey] = useState(0)
  useEffect(() => { setMounted(true) }, [])

  return (
    <div className={`max-w-3xl mx-auto px-4 py-6 pb-40 sm:pb-8 ${mounted ? 'page-enter' : 'opacity-0'}`}>
      <div className="flex items-start justify-between mb-5">
        <div>
          <h1 className="display text-3xl font-extrabold" style={{ color: '#1a1726' }}>Özet</h1>
          <p className="text-sm mt-1" style={{ color: 'rgba(26,23,38,0.55)' }}>{formatDisplayDate(new Date())}</p>
        </div>
        <button
          onClick={() => setReplayKey((k) => k + 1)}
          aria-label="Animasyonu tekrar oynat"
          title="Animasyonu tekrar oynat"
          className="ctrl btn-press w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 mt-1"
        >
          <svg key={replayKey} width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="animate-replay-spin">
            <path d="M3 12a9 9 0 1 0 3.51-7.13" />
            <path d="M3 3v6h6" />
          </svg>
        </button>
      </div>

      {/* key değişince alt ağaç yeniden kurulur → animasyonlar tekrar oynar */}
      <SummaryContent key={replayKey} />
    </div>
  )
}

function SummaryContent() {
  const { habits, todayLog, freeSessions, categories } = useApp()
  const today = todayStr()

  // Progress bar'lar mount'tan bir kare sonra dolmaya başlasın
  const [grown, setGrown] = useState(false)
  useEffect(() => {
    const raf = requestAnimationFrame(() => setGrown(true))
    return () => cancelAnimationFrame(raf)
  }, [])

  /* ── Alışkanlıklar: bugüne planlı olanların tamamı ── */
  const habitEntries = habits
    .filter((h) => isHabitScheduledFor(h, today))
    .map((h) => ({ habit: h, log: migrateHabitLog(todayLog.habits[h.id] ?? {}) }))
  const doneCount = habitEntries.filter(({ log }) => log.completed).length

  /* ── Su: yalnızca hedef girilmişse ── */
  const showWater = storage.hasWaterGoal()
  const waterGoal = storage.getWaterGoalMl()
  const waterActual = showWater ? dayTotalMl(storage.getWaterEntries(), today) : 0
  const waterPct = waterGoal > 0 ? Math.min(100, (waterActual / waterGoal) * 100) : 0

  /* ── Uyanma: yalnızca hedef girilmişse ── */
  const wakeGoal = storage.getWakeGoal()
  const wakeRecord = wakeGoal ? storage.getWakeRecords().find((r) => r.date === today) : undefined
  const wokeOnTime = !!wakeRecord && !!wakeGoal && wakeRecord.time <= wakeGoal

  /* ── Pomodoro: bugün biten oturumlar ── */
  const habitSessions: PomodoroSession[] = Object.values(todayLog.habits)
    .flatMap((raw) => migrateHabitLog(raw).pomodoroSessions)
  const freeToday = (freeSessions ?? []).filter((s) => s.date === today)
  const sessions = [...habitSessions, ...freeToday].sort((a, b) => a.timestamp.localeCompare(b.timestamp))
  const totalPomMin = sessions.reduce((acc, s) => acc + s.workDuration, 0)

  const sessionLabel = (s: PomodoroSession): { emoji: string; name: string } => {
    if (s.habitId === FREE_ID) return { emoji: '🧘', name: 'Serbest odak' }
    const h = habits.find((x) => x.id === s.habitId)
    return h ? { emoji: h.emoji, name: h.name } : { emoji: '🍅', name: 'Pomodoro' }
  }

  /* ── Acele Yok: bugün tamamlanan kayıtlar ── */
  const noRushToday = storage.getNoRushHistory()
    .filter((r) => r.completedAt.startsWith(today))

  /* ── To-do: bugün tamamlananlar ── */
  const todosToday = storage.getTodos()
    .filter((t) => t.done && t.completedAt?.startsWith(today))

  const anythingToShow =
    habitEntries.length > 0 || showWater || !!wakeGoal ||
    sessions.length > 0 || noRushToday.length > 0 || todosToday.length > 0

  if (!anythingToShow) {
    return (
      <div className="glass g-neutral p-10 text-center animate-pop" style={{ borderRadius: 24 }}>
        <p className="text-3xl mb-3">🌤️</p>
        <p className="display text-base font-bold">Bugün henüz kayıt yok</p>
        <p className="text-xs mt-1 ink-60">Gün ilerledikçe özetin burada birikecek</p>
      </div>
    )
  }

  // Kartlar sırayla belirsin diye kademeli gecikme
  let order = 0
  const nextDelay = () => `${order++ * 90}ms`

  return (
    <div className="space-y-4">
      {/* ── Alışkanlıklar ── */}
      {habitEntries.length > 0 && (
        <SectionCard
          emoji="✅"
          title="Alışkanlıklar"
          right={<span className="text-xs font-bold tnum ink-45">{doneCount}/{habitEntries.length}</span>}
          delay={nextDelay()}
        >
          <div className="space-y-1.5">
            {habitEntries.map(({ habit, log }, i) => {
              const cat = categories.find((c) => c.id === habit.categoryId)
              return (
                <div
                  key={habit.id}
                  className="flex items-center gap-2.5 rounded-2xl px-3 py-2.5 animate-pop"
                  style={{
                    animationDelay: `${120 + i * 45}ms`,
                    background: log.completed ? '#e9f9ee' : 'rgba(26,23,38,0.03)',
                    border: log.completed ? '1px solid #c2ecd0' : '1px solid rgba(26,23,38,0.05)',
                  }}
                >
                  <span className="text-base leading-none flex-shrink-0">{habit.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-xs font-semibold leading-snug"
                      style={{
                        color: log.completed ? '#15803d' : '#1a1726',
                        textDecoration: log.completed ? 'line-through' : 'none',
                        textDecorationColor: 'rgba(21,128,61,0.4)',
                        overflowWrap: 'anywhere',
                      }}
                    >
                      {habit.name}
                    </p>
                    {cat && <p className="text-[10px] font-semibold mt-0.5 ink-45">{cat.emoji} {cat.name}</p>}
                  </div>
                  <StatusDot done={log.completed} />
                </div>
              )
            })}
          </div>
        </SectionCard>
      )}

      {/* ── Su Takibi — yalnızca hedef girilmişse ── */}
      {showWater && (
        <SectionCard
          emoji="💧"
          title="Su Takibi"
          right={
            <span className="text-xs font-bold tnum" style={{ color: waterActual >= waterGoal ? '#15803d' : '#1d4ed8' }}>
              {formatMl(waterActual)} / {formatMl(waterGoal)}
            </span>
          }
          delay={nextDelay()}
        >
          <div className="well rounded-full overflow-hidden" style={{ height: 10 }}>
            <div
              className="h-full rounded-full progress-fill"
              style={{
                width: grown ? `${waterPct}%` : '0%',
                background: waterActual >= waterGoal
                  ? 'linear-gradient(90deg, #34d36f, #1f9d4d)'
                  : 'linear-gradient(90deg, #60a5fa, #2563eb)',
              }}
            />
          </div>
          <p className="text-[11px] mt-2 ink-45">
            {waterActual >= waterGoal
              ? 'Hedef tamamlandı 🎉'
              : `Hedefe ${formatMl(waterGoal - waterActual)} kaldı`}
          </p>
        </SectionCard>
      )}

      {/* ── Uyanma — yalnızca hedef girilmişse ── */}
      {wakeGoal && (
        <SectionCard
          emoji="🌅"
          title="Uyanma"
          right={wakeRecord && (
            <span className="text-xs font-bold" style={{ color: wokeOnTime ? '#15803d' : '#b87520' }}>
              {wokeOnTime ? 'hedefinde ✓' : 'hedef sonrası'}
            </span>
          )}
          delay={nextDelay()}
        >
          <div className="flex items-center gap-3">
            <TimeBox label="Hedef" value={wakeGoal} />
            <span className="ink-35 text-lg">→</span>
            <TimeBox
              label="Uyanış"
              value={wakeRecord?.time ?? '--:--'}
              color={wakeRecord ? (wokeOnTime ? '#15803d' : '#b87520') : undefined}
            />
          </div>
        </SectionCard>
      )}

      {/* ── Pomodoro — yalnızca bugün bitenler ── */}
      {sessions.length > 0 && (
        <SectionCard
          emoji="🍅"
          title="Pomodoro"
          right={<span className="text-xs font-bold tnum ink-45">{sessions.length} oturum · {formatMinutes(totalPomMin)}</span>}
          delay={nextDelay()}
        >
          <div className="space-y-1.5">
            {sessions.map((s, i) => {
              const { emoji, name } = sessionLabel(s)
              const time = new Date(s.timestamp).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
              return (
                <div
                  key={s.id}
                  className="flex items-center gap-2.5 rounded-2xl px-3 py-2.5 animate-pop"
                  style={{ animationDelay: `${120 + i * 45}ms`, background: 'rgba(26,23,38,0.03)', border: '1px solid rgba(26,23,38,0.05)' }}
                >
                  <span className="text-base leading-none flex-shrink-0">{emoji}</span>
                  <p className="text-xs font-semibold flex-1 min-w-0" style={{ overflowWrap: 'anywhere' }}>{name}</p>
                  <span className="text-[11px] font-bold tnum flex-shrink-0" style={{ color: '#a33418' }}>{formatMinutes(s.workDuration)}</span>
                  <span className="text-[10px] tnum flex-shrink-0 ink-45">{time}</span>
                </div>
              )
            })}
          </div>
        </SectionCard>
      )}

      {/* ── Acele Yok — yalnızca bugün bitenler ── */}
      {noRushToday.length > 0 && (
        <SectionCard emoji="☕" title="Acele Yok" delay={nextDelay()}>
          <div className="space-y-1.5">
            {noRushToday.map((r, i) => (
              <div
                key={r.id}
                className="flex items-center gap-2.5 rounded-2xl px-3 py-2.5 animate-pop"
                style={{ animationDelay: `${120 + i * 45}ms`, background: '#efe7db', border: '1px solid #ddccb0' }}
              >
                <p className="text-xs font-semibold flex-1 min-w-0" style={{ color: '#4a3220', overflowWrap: 'anywhere' }}>{r.title}</p>
                <span className="text-[10px] font-bold flex-shrink-0" style={{ color: '#8a6a4d' }}>{r.stageCount} aşama</span>
                <span className="text-[11px] font-bold tnum flex-shrink-0" style={{ color: '#6b4a35' }}>{formatHMS(r.totalSeconds)}</span>
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {/* ── Klasik To-do — yalnızca bugün tamamlananlar ── */}
      {todosToday.length > 0 && (
        <SectionCard
          emoji="📝"
          title="Klasik To-do"
          right={<span className="text-xs font-bold tnum ink-45">{todosToday.length} tamam</span>}
          delay={nextDelay()}
        >
          <div className="space-y-1.5">
            {todosToday.map((t, i) => (
              <div
                key={t.id}
                className="flex items-center gap-2.5 rounded-2xl px-3 py-2.5 animate-pop"
                style={{ animationDelay: `${120 + i * 45}ms`, background: '#e5f6ea', border: '1px solid #c3e8cf' }}
              >
                <StatusDot done />
                <p
                  className="text-xs font-semibold flex-1 min-w-0"
                  style={{ color: '#166534', textDecoration: 'line-through', textDecorationColor: 'rgba(22,101,52,0.35)', overflowWrap: 'anywhere' }}
                >
                  {t.text}
                </p>
              </div>
            ))}
          </div>
        </SectionCard>
      )}
    </div>
  )
}

function SectionCard({ emoji, title, right, children, delay }: {
  emoji: string
  title: string
  right?: ReactNode
  children: ReactNode
  delay: string
}) {
  return (
    <div className="glass g-neutral animate-pop" style={{ borderRadius: 24, animationDelay: delay }}>
      <div className="flex items-center justify-between gap-3 px-5 py-3.5" style={{ borderBottom: '1px solid rgba(26,23,38,0.08)' }}>
        <p className="display text-sm font-bold">{emoji} {title}</p>
        {right}
      </div>
      <div className="p-4">{children}</div>
    </div>
  )
}

function StatusDot({ done }: { done: boolean }) {
  if (done) {
    return (
      <span
        className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
        style={{ background: '#16a34a', boxShadow: '0 3px 8px -3px rgba(34,197,94,0.6)' }}
      >
        <svg width="11" height="9" viewBox="0 0 14 11" fill="none"><path d="M1.5 6L5 9.5L12.5 1.5" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
      </span>
    )
  }
  return (
    <span
      className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
      style={{ background: 'rgba(26,23,38,0.06)', border: '1.5px solid rgba(26,23,38,0.14)' }}
    >
      <svg width="9" height="9" viewBox="0 0 10 10" fill="none"><path d="M1.5 1.5l7 7M8.5 1.5l-7 7" stroke="rgba(26,23,38,0.35)" strokeWidth="1.8" strokeLinecap="round" /></svg>
    </span>
  )
}

function TimeBox({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="flex-1 rounded-2xl px-3 py-3 text-center" style={{ background: 'rgba(26,23,38,0.03)', border: '1px solid rgba(26,23,38,0.06)' }}>
      <p className="display text-xl font-black tnum leading-none" style={{ color: color ?? '#1a1726' }}>{value}</p>
      <p className="text-[9px] font-bold uppercase tracking-wide mt-1.5 ink-45">{label}</p>
    </div>
  )
}
