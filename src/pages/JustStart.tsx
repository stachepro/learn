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

type TileState = 'completed' | 'active' | 'next' | 'locked'

const TILE_STYLE: Record<TileState, { bg: string; border: string; color: string; opacity?: number }> = {
  completed: {
    bg: 'rgba(34,197,94,0.18)',
    border: 'rgba(34,197,94,0.55)',
    color: '#6ee79f',
  },
  active: {
    bg: 'rgba(225,90,60,0.2)',
    border: 'rgba(225,90,60,0.7)',
    color: '#f08a6a',
  },
  next: {
    bg: 'rgba(255,255,255,0.12)',
    border: 'rgba(255,255,255,0.45)',
    color: '#f1f5f5',
  },
  locked: {
    bg: 'rgba(255,255,255,0.03)',
    border: 'rgba(255,255,255,0.06)',
    color: 'rgba(241,245,245,0.18)',
  },
}

export default function JustStart() {
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
  const completedCount = done.filter(Boolean).length
  const progress = Math.round((completedCount / STEPS.length) * 100)
  const xpAmount = Math.round(TOTAL_MINUTES / pomodoroSettings.workDuration * 10)

  const tileState = (i: number): TileState => {
    if (done[i]) return 'completed'
    if (active === i) return 'active'
    if (i === nextIdx && active === null) return 'next'
    return 'locked'
  }

  const startNext = () => {
    if (active !== null || allDone || nextIdx === -1) return
    clearTick()
    setActive(nextIdx)
    setSecs(STEPS[nextIdx] * 60)
    setPaused(false)
  }

  const togglePause = () => setPaused(p => !p)

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
    <div className="max-w-sm mx-auto px-4 pt-6 pb-40">

      {/* Header */}
      <div className="mb-6">
        <h1 className="display text-2xl font-extrabold tracking-tight" style={{ color: '#f1f5f5' }}>
          Just Start
        </h1>
        <p className="text-xs mt-1" style={{ color: 'rgba(241,245,245,0.4)' }}>
          Sadece başlamak yeter · {completedMins}/{TOTAL_MINUTES} dk
        </p>

        {/* Progress bar */}
        <div className="mt-3 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.07)' }}>
          <div
            className="h-1.5 rounded-full transition-all duration-700"
            style={{
              width: `${progress}%`,
              background: progress === 100
                ? 'linear-gradient(90deg, #22c55e, #4ade80)'
                : 'linear-gradient(90deg, #f08a6a, #e15a3c)',
              boxShadow: progress > 0 ? `0 0 8px ${progress === 100 ? 'rgba(34,197,94,0.6)' : 'rgba(225,90,60,0.5)'}` : 'none',
            }}
          />
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-[10px]" style={{ color: 'rgba(241,245,245,0.3)' }}>%0</span>
          <span
            className="text-[10px] font-bold tabular-nums"
            style={{ color: progress === 100 ? '#6ee79f' : 'rgba(241,245,245,0.45)' }}
          >
            %{progress}
          </span>
        </div>
      </div>

      {/* Step grid */}
      <div className="grid grid-cols-5 gap-1.5 mb-6">
        {STEPS.map((min, i) => {
          const state = tileState(i)
          const s = TILE_STYLE[state]
          const isFlashing = flash === i
          return (
            <div
              key={i}
              className={`flex flex-col items-center justify-center rounded-xl py-3 ${isFlashing ? 'animate-done-flash' : ''} ${state === 'active' ? 'animate-pulse-subtle' : ''}`}
              style={{
                background: s.bg,
                border: `1.5px solid ${s.border}`,
                color: s.color,
                boxShadow: state === 'completed' ? '0 0 8px rgba(34,197,94,0.15)'
                  : state === 'active' ? '0 0 12px rgba(225,90,60,0.25)'
                  : state === 'next' ? '0 0 10px rgba(255,255,255,0.08)'
                  : 'none',
              }}
            >
              <span className="text-sm font-bold leading-none">
                {state === 'completed' ? '✓' : state === 'active' ? '▶' : min}
              </span>
              <span className="text-[9px] mt-0.5 leading-none" style={{ opacity: 0.6 }}>dk</span>
            </div>
          )
        })}
      </div>

      {/* Timer — only when a step is active */}
      {active !== null && (
        <div className="text-center mb-6 animate-fade-up">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] mb-2" style={{ color: '#f08a6a' }}>
            {STEPS[active]} dakika · {paused ? 'Durakladı' : 'Devam ediyor'}
          </p>
          <div
            className="tnum text-6xl font-mono font-bold leading-none"
            style={{ color: '#f1f5f5', textShadow: '0 0 30px rgba(225,90,60,0.4)' }}
          >
            {fmt(secs)}
          </div>
          <button
            onClick={cancelStep}
            className="mt-3 text-xs underline"
            style={{ color: 'rgba(241,245,245,0.35)' }}
          >
            adımı iptal et
          </button>
        </div>
      )}

      {/* All done — XP claim */}
      {allDone && (
        <div
          className="glass g-lime rounded-2xl px-4 py-4 text-center space-y-3 mb-6 animate-fade-up"
          style={{ border: '1px solid rgba(34,197,94,0.35)' }}
        >
          <p className="text-base font-bold" style={{ color: '#6ee79f' }}>
            🎉 {TOTAL_MINUTES} dakika tamamlandı!
          </p>
          {!xpClaimed ? (
            <button
              onClick={claimXP}
              className="btn-press w-full py-2.5 rounded-xl text-sm font-bold"
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

      {/* Stats */}
      <div className="flex items-center justify-center gap-8 py-4">
        <div className="text-center">
          <p className="text-2xl font-bold tnum" style={{ color: '#f1f5f5' }}>{stats.today}</p>
          <p className="text-[10px] font-bold uppercase tracking-[0.15em] mt-1" style={{ color: 'rgba(241,245,245,0.35)' }}>Bugün</p>
        </div>
        <div className="w-px h-8" style={{ background: 'rgba(255,255,255,0.1)' }} />
        <div className="text-center">
          <p className="text-2xl font-bold tnum" style={{ color: '#f1f5f5' }}>{stats.allTime}</p>
          <p className="text-[10px] font-bold uppercase tracking-[0.15em] mt-1" style={{ color: 'rgba(241,245,245,0.35)' }}>Toplam</p>
        </div>
      </div>

      {/* Bottom action bar */}
      <div
        className="fixed bottom-[4.5rem] sm:bottom-0 left-0 right-0 z-20 px-4 py-4"
        style={{
          background: 'rgba(10,11,12,0.92)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderTop: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        <div className="max-w-sm mx-auto space-y-2">
          {/* Buttons row */}
          <div className="flex gap-2">
            {/* Primary action */}
            {active === null && !allDone && (
              <button
                onClick={startNext}
                className="btn-press flex-1 py-3 rounded-2xl text-sm font-bold"
                style={{ background: 'rgba(34,197,94,0.9)', color: '#06210f' }}
              >
                Başla
              </button>
            )}
            {active !== null && (
              <button
                onClick={togglePause}
                className="btn-press flex-1 py-3 rounded-2xl text-sm font-bold"
                style={{
                  background: paused ? 'rgba(34,197,94,0.9)' : 'rgba(255,255,255,0.1)',
                  color: paused ? '#06210f' : '#f1f5f5',
                }}
              >
                {paused ? '▶ Devam Et' : '⏸ Duraklat'}
              </button>
            )}
            {allDone && (
              <div className="flex-1 py-3 rounded-2xl text-sm font-bold text-center" style={{ color: 'rgba(241,245,245,0.35)', background: 'rgba(255,255,255,0.04)' }}>
                Tamamlandı ✓
              </div>
            )}

            {/* Reset */}
            <button
              onClick={reset}
              className="ctrl btn-press px-4 py-3 rounded-2xl text-xs font-semibold flex-shrink-0"
            >
              Süreci Sıfırla
            </button>
          </div>

          {/* Hint line */}
          <p className="text-center text-xs" style={{ color: 'rgba(241,245,245,0.35)' }}>
            {active !== null
              ? `${STEPS[active]} dakikalık adım · ${fmt(secs)} kaldı`
              : allDone
                ? '115 dakika tamamlandı — harika iş!'
                : nextIdx >= 0
                  ? `${STEPS[nextIdx]} dakika için başlayacak`
                  : ''}
          </p>
        </div>
      </div>
    </div>
  )
}
