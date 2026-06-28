import { useState, useEffect } from 'react'
import { useApp } from '../context/AppContext'
import { ALL_BADGES } from '../utils/badges'
import { formatMinutes } from '../utils/date'
import { expProgressInCurrentLevel } from '../utils/exp'

const g = (bg: string, border: string, color: string) => ({ background: bg, border: `1px solid ${border}`, color })

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

  const glass = {
    background: 'rgba(255,255,255,0.032)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    border: '1px solid rgba(255,255,255,0.08)',
    boxShadow: '0 4px 24px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.06)',
  }

  return (
    <div className={`max-w-3xl mx-auto px-4 py-6 pb-32 sm:pb-8 space-y-5 ${mounted ? 'page-enter' : 'opacity-0'}`}>

      {/* Profile card */}
      <div className="rounded-3xl p-5" style={glass}>
        <div className="flex items-start gap-4">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-black flex-shrink-0"
            style={{
              background: 'linear-gradient(135deg, rgba(16,185,129,0.2), rgba(5,150,105,0.15))',
              border: '1px solid rgba(16,185,129,0.3)',
              color: '#34d399',
              boxShadow: '0 0 20px rgba(16,185,129,0.2)',
            }}
          >
            {profile.username.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            {editingName ? (
              <div className="flex items-center gap-2 mb-2">
                <input
                  autoFocus
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleNameSave(); if (e.key === 'Escape') { setNameInput(profile.username); setEditingName(false) } }}
                  className="glass-input text-lg font-bold flex-1"
                />
                <button onClick={handleNameSave} className="btn-press text-xs px-3 py-1.5 rounded-xl font-semibold" style={{ background: 'rgba(34,197,94,0.15)', color: '#4ade80', border: '1px solid rgba(34,197,94,0.3)' }}>Kaydet</button>
              </div>
            ) : (
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-xl font-bold text-txt">{profile.username}</h1>
                <button onClick={() => { setNameInput(profile.username); setEditingName(true) }}
                  className="text-xs transition-colors" style={{ color: 'rgba(255,255,255,0.25)' }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.6)')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.25)')}>
                  Düzenle
                </button>
              </div>
            )}
            <div className="flex items-center gap-2.5 flex-wrap text-xs mb-3" style={{ color: 'rgba(255,255,255,0.4)' }}>
              <span><span className="font-bold" style={{ color: '#fb923c' }}>{profile.streak}</span> gün seri</span>
              <span>·</span>
              <span>En iyi <span className="font-semibold text-txt">{profile.longestStreak}</span> gün</span>
              <span>·</span>
              <span>{profile.badges.length}/{ALL_BADGES.length} rozet</span>
            </div>
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="font-bold" style={{ color: '#34d399' }}>Seviye {profile.level}</span>
                <span style={{ color: 'rgba(255,255,255,0.35)' }}>{current}/{needed} EXP</span>
              </div>
              <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.07)' }}>
                <div className="h-full rounded-full pomo-progress-fill"
                  style={{ width: `${percentage}%`, background: 'linear-gradient(90deg, #10b981, #34d399)', boxShadow: '0 0 8px rgba(16,185,129,0.4)' }} />
              </div>
              <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.2)' }}>Toplam {profile.totalExp} EXP</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: 'rgba(255,255,255,0.3)' }}>Tüm Zamanlar</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <StatCard label="Tamamlanan" value={String(totalCompleted)} emoji="✅" color="#4ade80" />
          <StatCard label="Pomodoro" value={String(totalPomodoros)} emoji="🍅" color="#f87171" />
          <StatCard label="Toplam Çalışma" value={formatMinutes(totalWorkMin)} emoji="⏱" color="#34d399" />
          <StatCard label="Boost" value={String(totalBoostUsed)} emoji="⚡" color="#fde047" />
          <StatCard label="Serbest Çalışma" value={formatMinutes(freeMin)} emoji="🧘" color="#34d399" />
          <StatCard label="Günlük Ort." value={formatMinutes(avgDaily)} emoji="📊" color="#67e8f9" />
          <StatCard label="En İyi Gün" value={formatMinutes(bestDay)} emoji="🏆" color="#fb923c" />
        </div>
      </div>

      {/* Badges */}
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: 'rgba(255,255,255,0.3)' }}>
          Rozetler <span style={{ color: 'rgba(255,255,255,0.2)' }}>({profile.badges.length}/{ALL_BADGES.length})</span>
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {ALL_BADGES.map((badge) => {
            const earned = profile.badges.includes(badge.id)
            return (
              <div
                key={badge.id}
                className="flex items-start gap-3 rounded-2xl px-4 py-3.5 transition-all"
                style={{
                  background: earned ? 'rgba(16,185,129,0.09)' : 'rgba(255,255,255,0.025)',
                  backdropFilter: 'blur(16px)',
                  WebkitBackdropFilter: 'blur(16px)',
                  border: `1px solid ${earned ? 'rgba(16,185,129,0.25)' : 'rgba(255,255,255,0.07)'}`,
                  opacity: earned ? 1 : 0.45,
                  boxShadow: earned ? '0 0 16px rgba(16,185,129,0.12)' : 'none',
                }}
              >
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                  style={{ background: earned ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.05)' }}
                >
                  {earned ? '🏅' : '🔒'}
                </div>
                <div>
                  <p className={`text-sm font-semibold ${earned ? 'text-txt' : 'text-subtle'}`}>{badge.name}</p>
                  <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>{badge.description}</p>
                  {!earned && <p className="text-[11px] mt-1 italic" style={{ color: 'rgba(255,255,255,0.2)' }}>{badge.condition}</p>}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Pomodoro settings */}
      <div className="rounded-3xl overflow-hidden" style={glass}>
        <p className="text-[10px] font-bold uppercase tracking-widest px-5 py-3.5"
          style={{ color: 'rgba(255,255,255,0.3)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          🍅 Pomodoro Ayarları
        </p>
        <div className="p-5 space-y-5">
          {[
            { label: 'Çalışma süresi', value: workDur, set: setWorkDur, min: 5, max: 90, step: 5 },
            { label: 'Mola süresi', value: breakDur, set: setBreakDur, min: 1, max: 30, step: 1 },
          ].map(({ label, value, set, min, max, step }) => (
            <div key={label} className="space-y-2">
              <div className="flex justify-between text-sm">
                <span style={{ color: 'rgba(255,255,255,0.45)' }}>{label}</span>
                <span className="font-semibold text-txt">{value} dakika</span>
              </div>
              <input type="range" min={min} max={max} step={step} value={value}
                onChange={(e) => set(Number(e.target.value))} className="w-full" />
            </div>
          ))}
          <button
            onClick={handleSavePomo}
            className="pill-btn btn-press px-5 py-2.5 text-sm font-semibold transition-all"
            style={saved
              ? g('rgba(34,197,94,0.15)', 'rgba(34,197,94,0.35)', '#4ade80')
              : { background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: 'white', boxShadow: '0 4px 16px rgba(16,185,129,0.35)' }
            }
          >
            {saved ? '✓ Kaydedildi' : 'Kaydet'}
          </button>
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value, emoji, color }: { label: string; value: string; emoji: string; color: string }) {
  return (
    <div
      className="rounded-2xl p-4"
      style={{
        background: 'rgba(255,255,255,0.028)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        border: '1px solid rgba(255,255,255,0.07)',
      }}
    >
      <div className="flex items-start justify-between mb-2">
        <span className="text-xl">{emoji}</span>
        <span className="text-[10px] font-medium" style={{ color: 'rgba(255,255,255,0.3)' }}>{label}</span>
      </div>
      <p className="text-2xl font-bold" style={{ color }}>{value}</p>
    </div>
  )
}
