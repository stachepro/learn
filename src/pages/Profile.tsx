import { useState, useEffect } from 'react'
import { useApp } from '../context/AppContext'
import { ALL_BADGES } from '../utils/badges'
import { formatMinutes } from '../utils/date'
import { expProgressInCurrentLevel } from '../utils/exp'

export default function Profile() {
  const { profile, logs, freeSessions, updateUsername, pomodoroSettings, updatePomodoroSettings } = useApp()
  const [editingName, setEditingName] = useState(false)
  const [nameInput, setNameInput] = useState(profile.username)
  const [workDur, setWorkDur] = useState(pomodoroSettings.workDuration)
  const [breakDur, setBreakDur] = useState(pomodoroSettings.breakDuration)
  const [saved, setSaved] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])
  useEffect(() => { setWorkDur(pomodoroSettings.workDuration); setBreakDur(pomodoroSettings.breakDuration) }, [pomodoroSettings])

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

  const handleNameSave = () => {
    if (nameInput.trim()) updateUsername(nameInput.trim())
    else setNameInput(profile.username)
    setEditingName(false)
  }
  const handleSavePomo = () => {
    updatePomodoroSettings({ workDuration: workDur, breakDuration: breakDur })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className={`max-w-3xl mx-auto px-4 py-6 pb-40 sm:pb-8 space-y-5 ${mounted ? 'page-enter' : 'opacity-0'}`}>

      {/* Profile card */}
      <div className="glass g-neutral p-5" style={{ borderRadius: 24 }}>
        <div className="flex items-start gap-4">
          <div className="glass g-teal w-16 h-16 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0">
            <span className="display font-extrabold">{profile.username.charAt(0).toUpperCase()}</span>
          </div>
          <div className="flex-1 min-w-0">
            {editingName ? (
              <div className="flex items-center gap-2 mb-2">
                <input
                  autoFocus
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleNameSave(); if (e.key === 'Escape') { setNameInput(profile.username); setEditingName(false) } }}
                  className="frost-input text-lg font-bold flex-1"
                />
                <button onClick={handleNameSave} className="btn-ink btn-press text-xs px-3 py-2">Kaydet</button>
              </div>
            ) : (
              <div className="flex items-center gap-2 mb-1">
                <h1 className="display text-2xl font-extrabold">{profile.username}</h1>
                <button onClick={() => { setNameInput(profile.username); setEditingName(true) }}
                  className="chip btn-press text-[11px] px-2.5 py-1">
                  Düzenle
                </button>
              </div>
            )}
            <div className="flex items-center gap-2.5 flex-wrap text-xs mb-3 ink-60">
              <span><span className="font-bold acc">{profile.streak}</span> gün seri</span>
              <span>·</span>
              <span>En iyi <span className="font-bold">{profile.longestStreak}</span> gün</span>
              <span>·</span>
              <span>{profile.badges.length}/{ALL_BADGES.length} rozet</span>
            </div>
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-medium">
                <span className="font-bold">Seviye {profile.level}</span>
                <span className="ink-60 tnum">{current}/{needed} EXP</span>
              </div>
              <div className="well rounded-full overflow-hidden" style={{ height: 7 }}>
                <div className="h-full rounded-full progress-fill"
                  style={{ width: `${percentage}%`, background: 'linear-gradient(90deg, #1f9d4d, #45dc7d)', boxShadow: '0 0 12px rgba(34,197,94,0.6)' }} />
              </div>
              <p className="text-[11px] ink-45 tnum">Toplam {profile.totalExp} EXP</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div>
        <p className="display text-sm font-bold mb-3" style={{ color: '#f1f5f5' }}>Tüm Zamanlar</p>
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
        <p className="display text-sm font-bold mb-3" style={{ color: '#f1f5f5' }}>
          Rozetler <span style={{ color: 'rgba(241,245,245,0.5)' }}>({profile.badges.length}/{ALL_BADGES.length})</span>
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
                  style={{ background: earned ? 'rgba(34,197,94,0.18)' : 'rgba(255,255,255,0.06)' }}>
                  {earned ? '🏅' : '🔒'}
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

      {/* Pomodoro settings */}
      <div className="glass g-neutral" style={{ borderRadius: 24 }}>
        <p className="display text-sm font-bold px-5 py-3.5" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          🍅 Pomodoro Ayarları
        </p>
        <div className="p-5 space-y-5">
          {[
            { label: 'Çalışma süresi', value: workDur, set: setWorkDur, min: 5, max: 90, step: 5 },
            { label: 'Mola süresi', value: breakDur, set: setBreakDur, min: 1, max: 30, step: 1 },
          ].map(({ label, value, set, min, max, step }) => (
            <div key={label} className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="ink-60 font-medium">{label}</span>
                <span className="font-bold tnum">{value} dakika</span>
              </div>
              <input type="range" min={min} max={max} step={step} value={value}
                onChange={(e) => set(Number(e.target.value))} className="w-full" />
            </div>
          ))}
          <button
            onClick={handleSavePomo}
            className="btn-ink btn-press px-5 py-2.5 text-sm"
            style={saved ? { background: 'linear-gradient(160deg, #1f9d4d, #45dc7d)' } : undefined}
          >
            {saved ? '✓ Kaydedildi' : 'Kaydet'}
          </button>
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
