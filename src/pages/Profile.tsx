import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { ALL_BADGES } from '../utils/badges'
import { formatMinutes } from '../utils/date'
import { expProgressInCurrentLevel } from '../utils/exp'

export default function Profile() {
  const navigate = useNavigate()
  const { profile, logs, freeSessions } = useApp()
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  const { current, needed, percentage } = expProgressInCurrentLevel(profile.totalExp)
  const allDays = Object.values(logs)
  const allHL = allDays.flatMap((d) => Object.values(d.habits))
  const totalCompleted = allHL.filter((h) => h.completed).length
  const totalPomodoros = allHL.reduce((acc, h) => acc + h.pomodoroSessions.length, 0) + freeSessions.length
  const totalBoostUsed = allHL.filter((h) => h.boostUsed).length
  const totalWorkMin = allHL.reduce((acc, h) =>
    acc + h.pomodoroSessions.reduce((s, p) => s + p.workDuration, 0), 0)
    + freeSessions.reduce((acc, s) => acc + s.workDuration, 0)
  const freeMin = freeSessions.reduce((acc, s) => acc + s.workDuration, 0)

  const dayTotals = allDays.map((d) =>
    Object.values(d.habits).reduce((acc, h) =>
      acc + h.pomodoroSessions.reduce((s, p) => s + p.workDuration, 0), 0))
  const avgDaily = dayTotals.length > 0 ? Math.round(dayTotals.reduce((a, b) => a + b, 0) / dayTotals.length) : 0
  const bestDay = dayTotals.length > 0 ? Math.max(...dayTotals) : 0

  return (
    <div className={`max-w-3xl mx-auto px-4 py-6 pb-40 sm:pb-8 space-y-5 ${mounted ? 'page-enter' : 'opacity-0'}`}>

      {/* Ayarlar butonu — sağ üst */}
      <div className="flex justify-end -mb-1">
        <button
          onClick={() => navigate('/settings')}
          aria-label="Ayarlar"
          className="btn-press w-10 h-10 rounded-full flex items-center justify-center"
          style={{ background: 'rgb(var(--ink) / 0.05)', border: '1px solid rgb(var(--ink) / 0.09)', color: 'rgb(var(--ink) / 0.6)' }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
        </button>
      </div>

      {/* Profile card */}
      <div className="glass g-neutral p-5" style={{ borderRadius: 24 }}>
        <div className="flex items-start gap-4">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
            style={{
              background: 'linear-gradient(150deg, #fbbf24, #f97316)',
              boxShadow: '0 10px 24px -8px rgba(249,115,22,0.55), inset 0 1px 0 rgba(255,255,255,0.4)',
            }}
          >
            <span className="display font-black" style={{ color: '#2a1402' }}>{profile.username.charAt(0).toUpperCase()}</span>
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="display text-2xl font-extrabold mb-1">{profile.username}</h1>
            <div className="flex items-center gap-2.5 flex-wrap text-xs mb-3 ink-60">
              <span><span className="font-black energy-text">{profile.streak}</span> gün seri 🔥</span>
              <span>·</span>
              <span>En iyi <span className="font-bold">{profile.longestStreak}</span> gün</span>
              <span>·</span>
              <span>{profile.badges.length}/{ALL_BADGES.length} rozet</span>
            </div>
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-medium">
                <span className="font-bold">Seviye {profile.level}</span>
                <span className="ink-60 tnum">{current}/{needed} XP</span>
              </div>
              <div className="well rounded-full overflow-hidden" style={{ height: 9 }}>
                <div className="h-full rounded-full progress-fill energy-fill"
                  style={{ width: `${percentage}%` }} />
              </div>
              <p className="text-[11px] ink-45 tnum">Toplam {profile.totalExp} XP</p>
            </div>
          </div>
        </div>
      </div>

      {/* Geçmiş — takvim + günlük döküm sayfasına git */}
      <button
        onClick={() => navigate('/history')}
        className="glass g-neutral glass-lift tile-press btn-press w-full flex items-center gap-3.5 px-5 py-4 text-left"
        style={{ borderRadius: 22 }}
      >
        <span
          className="w-11 h-11 rounded-2xl flex items-center justify-center text-xl flex-shrink-0"
          style={{ background: 'linear-gradient(150deg, #60a5fa, #2563eb)', boxShadow: '0 8px 20px -6px rgba(37,99,235,0.55)' }}
        >
          📅
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold" style={{ color: 'rgb(var(--ink))' }}>Geçmiş</p>
          <p className="text-xs mt-0.5 ink-60">Takvim ve günlük dökümü görüntüle</p>
        </div>
        <span className="text-lg flex-shrink-0 ink-35">›</span>
      </button>

      {/* Stats */}
      <div>
        <p className="display text-sm font-bold mb-3" style={{ color: 'rgb(var(--ink))' }}>Tüm Zamanlar</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <StatCard variant="g-lime" label="Tamamlanan" value={String(totalCompleted)} emoji="✅" />
          <StatCard variant="g-rust" label="Pomodoro" value={String(totalPomodoros)} emoji="🍅" />
          <StatCard variant="g-teal" label="Toplam Çalışma" value={formatMinutes(totalWorkMin)} emoji="⏱" />
          <StatCard variant="g-cream" label="Boost" value={String(totalBoostUsed)} emoji="⚡" />
          <StatCard variant="g-teal" label="Serbest Çalışma" value={formatMinutes(freeMin)} emoji="🧘" />
          <StatCard variant="g-sky" label="Günlük Ort." value={formatMinutes(avgDaily)} emoji="📊" />
          <StatCard variant="g-amber" label="En İyi Gün" value={formatMinutes(bestDay)} emoji="🏆" />
        </div>
      </div>

      {/* Badges */}
      <div>
        <p className="display text-sm font-bold mb-3" style={{ color: 'rgb(var(--ink))' }}>
          Rozetler <span style={{ color: 'rgb(var(--ink) / 0.5)' }}>({profile.badges.length}/{ALL_BADGES.length})</span>
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {ALL_BADGES.map((badge) => {
            const earned = profile.badges.includes(badge.id)
            return (
              <div
                key={badge.id}
                className={`glass ${earned ? 'g-lime' : 'g-neutral'} flex items-start gap-3 px-4 py-3.5`}
                style={{ borderRadius: 18, opacity: earned ? 1 : 0.62 }}
              >
                <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                  style={{ background: earned ? 'rgba(34,197,94,0.18)' : 'rgb(var(--ink) / 0.05)', filter: earned ? undefined : 'grayscale(1) opacity(0.55)' }}>
                  {earned ? badge.emoji : '🔒'}
                </div>
                <div>
                  <p className="text-sm font-bold">{badge.name}</p>
                  <p className="text-xs mt-0.5 ink-60">{badge.description}</p>
                  {!earned && <p className="text-[11px] mt-1 italic ink-45">{badge.condition}</p>}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value, emoji, variant }: { label: string; value: string; emoji: string; variant: string }) {
  return (
    <div className={`glass ${variant} p-4`} style={{ borderRadius: 20 }}>
      <div className="flex items-start justify-between mb-2">
        <span className="text-xl">{emoji}</span>
        <span className="text-[10px] font-semibold uppercase tracking-wider ink-60">{label}</span>
      </div>
      <p className="display text-2xl font-extrabold tnum">{value}</p>
    </div>
  )
}
