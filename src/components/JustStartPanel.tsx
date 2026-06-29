import { useState, useEffect, useRef, useCallback } from 'react'
import { useApp } from '../context/AppContext'
import { usePomodoro } from '../context/PomodoroContext'
import { playBell } from '../utils/sound'

const STEPS = [1, 2, 3, 4, 5, 10, 15, 20, 25, 30]
const TOTAL_MINUTES = 115
const LS_STATS = 'juststart_stats'

function fmt(s: number) {
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
}

function loadStats() {
  try {
    const d = JSON.parse(localStorage.getItem(LS_STATS) || 'null')
    const today = new Date().toISOString().slice(0, 10)
    return { today: d?.date === today ? (d.today ?? 0) : 0, allTime: d?.allTime ?? 0 }
  } catch { return { today: 0, allTime: 0 } }
}

function saveStats(today: number, allTime: number) {
  localStorage.setItem(LS_STATS, JSON.stringify({
    date: new Date().toISOString().slice(0, 10), today, allTime,
  }))
}

export default function JustStartPanel() {
  const { pomodoroSettings, addJustStartXP } = useApp()
  const { soundEnabled } = usePomodoro()
  const soundRef = useRef(soundEnabled)
  useEffect(() => { soundRef.current = soundEnabled }, [soundEnabled])

  const [done, setDone] = useState<boolean[]>(Array(10).fill(false))
  const [active, setActive] = useState<number | null>(null)
  const [secs, setSecs] = useState(0)
  const [paused, setPaused] = useState(false)
  const [xpClaimed, setXpClaimed] = useState(false)
  const [flash, setFlash] = useState<number | null>(null)
  const [stats, setStats] = useState(loadStats)
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const clearTick = useCallback(() => {
    if (tickRef.current) { clearInterval(tickRef.current); tickRef.current = null }
  }, [])

  useEffect(() => () => clearTick(), [clearTick])

  useEffect(() => {
    if (active === null || paused) { clearTick(); return }
    const idx = active
    tickRef.current = setInterval(() => {
      setSecs(s => {
        if (s <= 1) {
          clearTick()
          if (soundRef.current) playBell()
          setFlash(idx)
          setTimeout(() => setFlash(null), 700)
          setDone(prev => { const n = [...prev]; n[idx] = true; return n })
          setActive(null)
          return 0
        }
        return s - 1
      })
    }, 1000)
    return clearTick
  }, [active, paused, clearTick])

  const nextIdx = done.findIndex(v => !v)
  const allDone = nextIdx === -1
  const completedMins = done.reduce((a, d, i) => d ? a + STEPS[i] : a, 0)
  const progress = Math.round((completedMins / TOTAL_MINUTES) * 100)
  const xpAmount = Math.round(TOTAL_MINUTES / pomodoroSettings.workDuration * 10)

  const startStep = (i: number) => {
    if (active !== null || done[i] || i !== nextIdx) return
    clearTick()
    setActive(i)
    setSecs(STEPS[i] * 60)
    setPaused(false)
  }

  const cancelStep = () => {
    clearTick()
    setActive(null)
    setSecs(0)
    setPaused(false)
  }

  const reset = () => {
    clearTick()
    setDone(Array(10).fill(false))
    setActive(null)
    setSecs(0)
    setPaused(false)
    setXpClaimed(false)
  }

  const claimXP = () => {
    if (xpClaimed) return
    addJustStartXP(xpAmount)
    setXpClaimed(true)
    const n = { today: stats.today + 1, allTime: stats.allTime + 1 }
    setStats(n)
    saveStats(n.today, n.allTime)
  }

  return (
    <div className="space-y-5 pb-4">

      {/* Step grid */}
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] ink-45 mb-3">
          Adımlar · {completedMins}/{TOTAL_MINUTES} dk
        </p>
        <div className="grid grid-cols-5 gap-2">
          {STEPS.map((min, i) => {
            const isDone = done[i]
            const isActive = active === i
            const isAvail = !isDone && !isActive && i === nextIdx && active === null
            const isLocked = !isDone && !isActive && !isAvail

            return (
              <button
                key={i}
                onClick={() => startStep(i)}
                disabled={!isAvail}
                className={`flex flex-col items-center justify-center rounded-2xl py-3.5 font-bold transition-all ${isAvail ? 'btn-press' : ''} ${flash === i ? 'animate-done-flash' : ''}`}
                style={{
                  background: isDone
                    ? 'rgba(34,197,94,0.16)'
                    : isActive
                      ? 'rgba(225,90,60,0.14)'
                      : isAvail
                        ? 'rgba(255,255,255,0.1)'
                        : 'rgba(255,255,255,0.03)',
                  border: `1.5px solid ${
                    isDone ? 'rgba(34,197,94,0.5)'
                    : isActive ? 'rgba(225,90,60,0.55)'
                    : isAvail ? 'rgba(255,255,255,0.28)'
                    : 'rgba(255,255,255,0.07)'
                  }`,
                  color: isDone ? '#6ee79f'
                    : isActive ? '#f08a6a'
                    : isAvail ? 'rgba(241,245,245,0.9)'
                    : 'rgba(241,245,245,0.2)',
                  cursor: isAvail ? 'pointer' : 'default',
                  boxShadow: isDone ? '0 0 10px rgba(34,197,94,0.18)'
                    : isActive ? '0 0 12px rgba(225,90,60,0.2)'
                    : 'none',
                  opacity: isLocked ? 0.5 : 1,
                }}
              >
                <span className="text-base leading-none">{isDone ? '✓' : isActive ? '▶' : min}</span>
                <span className="text-[9px] mt-1 leading-none" style={{ opacity: 0.55 }}>dk</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Timer card — shows while a step is running */}
      {active !== null && (
        <div
          className="glass g-neutral rounded-2xl px-4 py-3.5 flex items-center gap-4 animate-fade-up"
          style={{ border: '1px solid rgba(225,90,60,0.3)' }}
        >
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: '#f08a6a' }}>
              {STEPS[active]} dakika · {paused ? 'Durakladı' : 'Devam ediyor'}
            </p>
            <p className="tnum text-3xl font-mono font-bold leading-none mt-1" style={{ color: '#f1f5f5' }}>
              {fmt(secs)}
            </p>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <button
              onClick={() => setPaused(p => !p)}
              className="btn-press h-9 px-4 rounded-xl text-xs font-bold"
              style={{
                background: paused ? 'rgba(34,197,94,0.9)' : 'rgba(255,255,255,0.1)',
                color: paused ? '#06210f' : '#f1f5f5',
              }}
            >
              {paused ? '▶ Devam' : '⏸ Duraklat'}
            </button>
            <button
              onClick={cancelStep}
              className="ctrl btn-press h-9 w-9 rounded-xl flex items-center justify-center text-sm"
              title="Adımı iptal et"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Progress bar */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-bold uppercase tracking-[0.18em] ink-45">İlerleme</span>
          <span className="text-[11px] font-bold tabular-nums" style={{ color: progress === 100 ? '#6ee79f' : 'rgba(241,245,245,0.65)' }}>
            %{progress}
          </span>
        </div>
        <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
          <div
            className="h-2 rounded-full transition-all duration-700"
            style={{
              width: `${progress}%`,
              background: progress === 100
                ? 'linear-gradient(90deg, #22c55e, #4ade80)'
                : 'linear-gradient(90deg, #f08a6a, #e15a3c)',
              boxShadow: progress > 0
                ? `0 0 10px ${progress === 100 ? 'rgba(34,197,94,0.55)' : 'rgba(225,90,60,0.45)'}`
                : 'none',
            }}
          />
        </div>
      </div>

      {/* XP claim card */}
      {allDone && (
        <div
          className="glass g-lime rounded-2xl px-4 py-4 text-center space-y-3 animate-fade-up"
          style={{ border: '1px solid rgba(34,197,94,0.35)' }}
        >
          <p className="text-base font-bold" style={{ color: '#6ee79f' }}>
            🎉 {TOTAL_MINUTES} dakika tamamlandı!
          </p>
          {!xpClaimed ? (
            <button
              onClick={claimXP}
              className="btn-press w-full py-2.5 rounded-xl text-sm font-bold animate-value-pop"
              style={{ background: 'rgba(34,197,94,0.9)', color: '#06210f' }}
            >
              🏆 {xpAmount} XP Kazan
            </button>
          ) : (
            <p className="text-sm font-semibold" style={{ color: 'rgba(110,231,159,0.7)' }}>
              ✓ {xpAmount} XP kazanıldı
            </p>
          )}
        </div>
      )}

      {/* Next step hint */}
      {!allDone && active === null && nextIdx >= 0 && (
        <p className="text-center text-xs ink-45">
          {done.some(Boolean)
            ? `↑ ${STEPS[nextIdx]} dakikalık adımı başlatmak için tıkla`
            : `↑ 1 dakikayla başla — sadece başlamak yeter`}
        </p>
      )}

      {/* Stats */}
      <div
        className="glass g-neutral rounded-2xl px-5 py-4 flex items-center justify-center gap-8"
      >
        <div className="text-center">
          <p className="text-2xl font-bold tnum" style={{ color: '#f1f5f5' }}>{stats.today}</p>
          <p className="text-[10px] font-bold uppercase tracking-[0.15em] ink-45 mt-1">Bugün</p>
        </div>
        <div className="w-px h-10" style={{ background: 'rgba(255,255,255,0.1)' }} />
        <div className="text-center">
          <p className="text-2xl font-bold tnum" style={{ color: '#f1f5f5' }}>{stats.allTime}</p>
          <p className="text-[10px] font-bold uppercase tracking-[0.15em] ink-45 mt-1">Toplam</p>
        </div>
      </div>

      {/* Reset */}
      <button
        onClick={reset}
        className="ctrl btn-press w-full py-2.5 rounded-xl text-xs font-semibold"
      >
        ↺ Session Sıfırla
      </button>
    </div>
  )
}
