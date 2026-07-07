import { useState, useEffect, useRef, useCallback } from 'react'
import { useApp } from '../context/AppContext'
import { usePomodoro } from '../context/PomodoroContext'
import { playBell } from '../utils/sound'
import { todayStr } from '../utils/date'
import BackBar from '../components/BackBar'
import TimerDial from '../components/TimerDial'
import { scheduleTimerNotification, cancelTimerNotification, NOTIF_JUSTSTART } from '../utils/timerNotifications'

/* ════════════════════════════════════════════════
   JUST START — 1 dakikayla başla, 30'a kadar tırman.
   Pomodoro ile aynı kadran dili: aktif adımda geri
   sayım, beklemede günün toplam ilerlemesi görünür.
   ════════════════════════════════════════════════ */

const STEPS = [1, 2, 3, 4, 5, 10, 15, 20, 25, 30]
const TOTAL_MINUTES = 115
const LS_STATS = 'juststart_stats'
const LS_STATE = 'juststart_state'

// Günün oturumu depodan yüklenir: sayaç duvar saatine göre işler, uygulama
// kapalıyken dolan adım "tamamlandı" sayılır.
interface JSInit {
  done: boolean[]; active: number | null; secs: number; paused: boolean
  xpClaimed: boolean; endAt: number | null; pausedRemaining: number | null
}
function initState(): JSInit {
  const fresh: JSInit = {
    done: Array(10).fill(false), active: null, secs: 0, paused: false,
    xpClaimed: false, endAt: null, pausedRemaining: null,
  }
  try {
    const d = JSON.parse(localStorage.getItem(LS_STATE) || 'null')
    if (!d || d.date !== todayStr()) return fresh
    const done: boolean[] = Array.isArray(d.done) && d.done.length === STEPS.length ? d.done : fresh.done
    let active: number | null = typeof d.active === 'number' ? d.active : null
    let endAt: number | null = typeof d.endAt === 'number' ? d.endAt : null
    let paused: boolean = !!d.paused
    const pausedRemaining: number | null = typeof d.pausedRemaining === 'number' ? d.pausedRemaining : null
    let secs = 0
    if (active != null) {
      if (paused && pausedRemaining != null) secs = Math.ceil(pausedRemaining)
      else if (endAt != null && endAt > Date.now()) secs = Math.ceil((endAt - Date.now()) / 1000)
      else { done[active] = true; active = null; endAt = null; paused = false }
    }
    return { done, active, secs, paused, xpClaimed: !!d.xpClaimed, endAt, pausedRemaining }
  } catch { return fresh }
}

function fmt(s: number) {
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
}

function loadStats() {
  try {
    const d = JSON.parse(localStorage.getItem(LS_STATS) || 'null')
    const today = todayStr()
    return { today: d?.date === today ? (d.today ?? 0) : 0, allTime: d?.allTime ?? 0 }
  } catch { return { today: 0, allTime: 0 } }
}

function saveStats(today: number, allTime: number) {
  localStorage.setItem(LS_STATS, JSON.stringify({
    date: todayStr(), today, allTime,
  }))
}

export default function JustStart() {
  const { pomodoroSettings, addJustStartXP } = useApp()
  const { soundEnabled } = usePomodoro()
  const soundRef = useRef(soundEnabled)
  useEffect(() => { soundRef.current = soundEnabled }, [soundEnabled])

  const initRef = useRef<JSInit | null>(null)
  if (initRef.current === null) initRef.current = initState()
  const init = initRef.current

  const [done, setDone] = useState<boolean[]>(init.done)
  const [active, setActive] = useState<number | null>(init.active)
  const [secs, setSecs] = useState(init.secs)
  const [paused, setPaused] = useState(init.paused)
  const [xpClaimed, setXpClaimed] = useState(init.xpClaimed)
  const [flash, setFlash] = useState<number | null>(null)
  const [stats, setStats] = useState(loadStats)
  const [confirmReset, setConfirmReset] = useState(false)
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const endAtRef = useRef<number | null>(init.endAt)
  const pausedRemainingRef = useRef<number | null>(init.pausedRemaining)

  const clearTick = useCallback(() => {
    if (tickRef.current) { clearInterval(tickRef.current); tickRef.current = null }
  }, [])

  useEffect(() => () => clearTick(), [clearTick])

  // Oturum durumunu kalıcılaştır — uygulama kapansa bile devam edebilsin
  useEffect(() => {
    localStorage.setItem(LS_STATE, JSON.stringify({
      date: todayStr(), done, active, paused, xpClaimed,
      endAt: endAtRef.current, pausedRemaining: pausedRemainingRef.current,
    }))
  }, [done, active, paused, xpClaimed])

  // Duvar saati bazlı tik: kalan süre endAt'ten hesaplanır, arka planda kaybolmaz
  useEffect(() => {
    if (active === null || paused) { clearTick(); return }
    const idx = active
    const tick = () => {
      const endAt = endAtRef.current
      if (endAt == null) return
      const left = Math.max(0, Math.ceil((endAt - Date.now()) / 1000))
      setSecs(left)
      if (left <= 0) {
        clearTick()
        endAtRef.current = null
        cancelTimerNotification(NOTIF_JUSTSTART)
        if (soundRef.current) playBell()
        setFlash(idx)
        setTimeout(() => setFlash(null), 700)
        setDone(prev => { const n = [...prev]; n[idx] = true; return n })
        setActive(null)
      }
    }
    tick()
    tickRef.current = setInterval(tick, 500)
    const onVisible = () => { if (!document.hidden) tick() }
    document.addEventListener('visibilitychange', onVisible)
    return () => { clearTick(); document.removeEventListener('visibilitychange', onVisible) }
  }, [active, paused, clearTick])

  const nextIdx = done.findIndex(v => !v)
  const allDone = nextIdx === -1
  const completedMins = done.reduce((a, d, i) => d ? a + STEPS[i] : a, 0)
  const completedCount = done.filter(Boolean).length
  const xpAmount = Math.round(TOTAL_MINUTES / pomodoroSettings.workDuration * 10)

  const startNext = () => {
    if (active !== null || allDone || nextIdx === -1) return
    clearTick()
    const secsTotal = STEPS[nextIdx] * 60
    endAtRef.current = Date.now() + secsTotal * 1000
    pausedRemainingRef.current = null
    scheduleTimerNotification(
      NOTIF_JUSTSTART, endAtRef.current,
      'Adım tamamlandı ✨', `${STEPS[nextIdx]} dakikalık adım bitti — sıradaki seni bekliyor!`,
    )
    setActive(nextIdx)
    setSecs(secsTotal)
    setPaused(false)
  }

  const togglePause = () => {
    setPaused(p => {
      const next = !p
      if (next) {
        if (endAtRef.current != null) {
          pausedRemainingRef.current = Math.max(0, (endAtRef.current - Date.now()) / 1000)
        }
        endAtRef.current = null
        cancelTimerNotification(NOTIF_JUSTSTART)
      } else if (active !== null) {
        const remaining = pausedRemainingRef.current ?? secs
        endAtRef.current = Date.now() + remaining * 1000
        pausedRemainingRef.current = null
        scheduleTimerNotification(
          NOTIF_JUSTSTART, endAtRef.current,
          'Adım tamamlandı ✨', `${STEPS[active]} dakikalık adım bitti — sıradaki seni bekliyor!`,
        )
      }
      return next
    })
  }

  const cancelStep = () => {
    clearTick()
    endAtRef.current = null
    pausedRemainingRef.current = null
    cancelTimerNotification(NOTIF_JUSTSTART)
    setActive(null)
    setSecs(0)
    setPaused(false)
  }

  const reset = () => {
    clearTick()
    endAtRef.current = null
    pausedRemainingRef.current = null
    cancelTimerNotification(NOTIF_JUSTSTART)
    setDone(Array(10).fill(false))
    setActive(null)
    setSecs(0)
    setPaused(false)
    setXpClaimed(false)
    setConfirmReset(false)
  }

  const claimXP = () => {
    if (xpClaimed) return
    addJustStartXP(xpAmount)
    setXpClaimed(true)
    const n = { today: stats.today + 1, allTime: stats.allTime + 1 }
    setStats(n)
    saveStats(n.today, n.allTime)
  }

  // ── Kadran durumu ──
  // Aktif adımda: adımın geri sayımı (turuncu). Beklemede: günün toplam
  // ilerlemesi (yeşil) — tikler kazanılan dakikaları gösterir.
  const stepTotal = active !== null ? STEPS[active] * 60 : 0
  const stepProgress = stepTotal > 0 ? (stepTotal - secs) / stepTotal : 0
  const dayProgress = completedMins / TOTAL_MINUTES
  const dialProgress = active !== null ? stepProgress : dayProgress
  const accent = active !== null ? '#f97316' : '#22c55e'
  const accentSoft = active !== null ? 'rgba(249,115,22,' : 'rgba(34,197,94,'
  const ticking = active !== null && !paused
  const showArc = active !== null || completedMins > 0

  const chipLabel = active !== null
    ? (paused ? 'Durakladı' : `Adım ${active + 1}/10 · ${STEPS[active]} dk`)
    : allDone ? 'Gün Tamam'
    : `Sıradaki · ${STEPS[nextIdx]} dk`

  const hasProgress = done.some(Boolean) || active !== null || xpClaimed

  return (
    <div className="max-w-sm mx-auto px-4 pt-6 pb-40">
      <BackBar />

      {/* Başlık */}
      <div className="mb-7 text-center">
        <h1 className="display text-2xl font-extrabold tracking-tight" style={{ color: '#1a1726' }}>
          Just Start
        </h1>
        <p className="text-xs mt-1" style={{ color: 'rgba(26,23,38,0.45)' }}>
          Sadece başlamak yeter · {completedMins}/{TOTAL_MINUTES} dk
        </p>
      </div>

      {/* ── Kadran ── */}
      <div className="flex flex-col items-center animate-fade-up">
        <TimerDial progress={dialProgress} accent={accent} showArc={showArc} ticking={ticking}>
          <span
            key={chipLabel}
            className="pom-chip px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-[0.18em]"
            style={{
              background: `${accentSoft}0.12)`,
              color: active !== null ? '#c2410c' : '#15803d',
              border: `1px solid ${accentSoft}0.3)`,
            }}
          >
            {chipLabel}
          </span>
          <span
            className="display tnum font-extrabold leading-none mt-2.5"
            style={{
              fontSize: 54,
              color: active !== null ? '#1a1726' : allDone ? '#15803d' : 'rgba(26,23,38,0.28)',
              transition: 'color 0.4s ease',
            }}
          >
            {allDone ? '✓' : fmt(active !== null ? secs : STEPS[nextIdx] * 60)}
          </span>
          <span className="text-[11px] font-semibold mt-2" style={{ color: 'rgba(26,23,38,0.45)' }}>
            {completedCount}/10 adım tamamlandı
          </span>
        </TimerDial>
      </div>

      {/* ── Kontroller ── */}
      <div className="mt-7 space-y-3">
        {active === null && !allDone && (
          <button
            onClick={startNext}
            className="btn-press btn-go w-full py-4 text-[15px] font-bold animate-fade-up"
          >
            ▶ Başla — {STEPS[nextIdx]} dakika
          </button>
        )}

        {active !== null && (
          <>
            <button
              onClick={togglePause}
              className="btn-press w-full py-3.5 rounded-2xl text-sm font-bold animate-fade-up"
              style={{
                background: paused ? 'rgba(34,197,94,0.9)' : 'rgba(26,23,38,0.06)',
                color: paused ? '#06210f' : '#1a1726',
                border: '1px solid rgba(26,23,38,0.08)',
              }}
            >
              {paused ? '▶ Devam Et' : '⏸ Duraklat'}
            </button>
            <button
              onClick={cancelStep}
              className="btn-press w-full py-2.5 rounded-2xl text-xs font-bold animate-fade-up"
              style={{ background: 'rgba(225,90,60,0.12)', color: '#b3422a', boxShadow: 'inset 0 0 0 1px rgba(225,90,60,0.3)' }}
            >
              Adımı İptal Et
            </button>
          </>
        )}

        {/* Gün bitti — XP al / yeni tur */}
        {allDone && (
          <div
            className="glass g-lime rounded-2xl px-4 py-4 text-center space-y-3 animate-pop"
            style={{ border: '1px solid rgba(34,197,94,0.35)' }}
          >
            <p className="text-base font-bold" style={{ color: '#15803d' }}>
              🎉 {TOTAL_MINUTES} dakika tamamlandı!
            </p>
            {!xpClaimed ? (
              <button
                onClick={claimXP}
                className="btn-press btn-energy w-full py-3 text-sm"
              >
                🏆 {xpAmount} XP Kazan
              </button>
            ) : (
              <>
                <p className="text-sm font-semibold" style={{ color: '#15803d', opacity: 0.75 }}>
                  ✓ {xpAmount} XP kazanıldı
                </p>
                <button
                  onClick={reset}
                  className="btn-press btn-go w-full py-3 text-sm font-bold"
                >
                  ↺ Yeni Tura Başla
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* ── Adım yolculuğu ── */}
      <div className="mt-7">
        <div className="flex items-center justify-between mb-2.5 px-0.5">
          <span className="text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: 'rgba(26,23,38,0.45)' }}>
            Adım Yolculuğu
          </span>
          <span className="text-[10px] font-bold tabular-nums" style={{ color: 'rgba(26,23,38,0.45)' }}>
            {completedMins}/{TOTAL_MINUTES} dk
          </span>
        </div>
        <div className="grid grid-cols-5 gap-2">
          {STEPS.map((min, i) => {
            const isDone = done[i]
            const isActive = active === i
            const isNext = !isDone && !isActive && i === nextIdx && active === null
            const isFlashing = flash === i
            return (
              <button
                key={i}
                onClick={isNext ? startNext : undefined}
                disabled={!isNext}
                className={`animate-cell-pop flex flex-col items-center justify-center rounded-2xl py-3 ${isNext ? 'btn-press ring-pulse' : ''} ${isActive ? 'js-step-glow' : ''} ${isFlashing ? 'animate-done-flash' : ''}`}
                style={{
                  animationDelay: `${i * 0.03}s`,
                  background: isDone ? 'rgba(34,197,94,0.14)'
                    : isActive ? 'rgba(249,115,22,0.14)'
                    : isNext ? '#ffffff'
                    : 'rgba(26,23,38,0.04)',
                  border: `1.5px solid ${
                    isDone ? 'rgba(34,197,94,0.45)'
                    : isActive ? 'rgba(249,115,22,0.55)'
                    : isNext ? 'rgba(26,23,38,0.18)'
                    : 'rgba(26,23,38,0.07)'
                  }`,
                  color: isDone ? '#15803d'
                    : isActive ? '#c2410c'
                    : isNext ? '#1a1726'
                    : 'rgba(26,23,38,0.28)',
                  cursor: isNext ? 'pointer' : 'default',
                }}
              >
                <span className="text-base font-bold leading-none">
                  {isDone ? '✓' : isActive ? '▶' : min}
                </span>
                <span className="text-[9px] font-semibold mt-1 leading-none" style={{ opacity: 0.6 }}>
                  {isDone || isActive ? `${min}dk` : 'dk'}
                </span>
              </button>
            )
          })}
        </div>
        {!allDone && active === null && (
          <p className="text-center text-[11px] mt-3" style={{ color: 'rgba(26,23,38,0.4)' }}>
            {done.some(Boolean)
              ? `Sıradaki adım ${STEPS[nextIdx]} dakika — hazır olunca başla.`
              : '1 dakikayla başla, her adımda biraz daha uzat.'}
          </p>
        )}
      </div>

      {/* ── İstatistikler ── */}
      <div className="grid grid-cols-2 gap-3 mt-6">
        <div className="glass g-lime rounded-2xl px-4 py-4 text-center animate-fade-up" style={{ animationDelay: '0.05s' }}>
          <p className="display text-3xl font-extrabold tnum" style={{ color: 'rgb(var(--txt))' }}>{stats.today}</p>
          <p className="text-[10px] font-bold uppercase tracking-[0.15em] mt-1 ink-60">Bugünkü Tur</p>
        </div>
        <div className="glass g-neutral rounded-2xl px-4 py-4 text-center animate-fade-up" style={{ animationDelay: '0.1s' }}>
          <p className="display text-3xl font-extrabold tnum" style={{ color: '#1a1726' }}>{stats.allTime}</p>
          <p className="text-[10px] font-bold uppercase tracking-[0.15em] mt-1" style={{ color: 'rgba(26,23,38,0.45)' }}>Toplam Tur</p>
        </div>
      </div>

      {/* ── Sıfırlama — yanlışlıkla basmaya karşı onaylı ── */}
      {hasProgress && (
        <div className="mt-6">
          {confirmReset ? (
            <div className="flex items-center gap-2 animate-fade-up">
              <span className="text-xs font-semibold flex-1 text-right" style={{ color: 'rgba(26,23,38,0.55)' }}>
                Tüm adımlar silinsin mi?
              </span>
              <button
                onClick={reset}
                className="btn-press px-4 py-2.5 rounded-xl text-xs font-bold"
                style={{ background: 'rgba(225,90,60,0.92)', color: '#fff5f2' }}
              >
                Evet, Sıfırla
              </button>
              <button
                onClick={() => setConfirmReset(false)}
                className="ctrl btn-press px-4 py-2.5 rounded-xl text-xs font-semibold"
              >
                Vazgeç
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmReset(true)}
              className="btn-press w-full py-2 text-xs font-semibold"
              style={{ color: 'rgba(26,23,38,0.4)' }}
            >
              ↺ Günü Sıfırla
            </button>
          )}
        </div>
      )}

      <p className="text-center text-[11px] mt-4" style={{ color: 'rgba(26,23,38,0.4)' }}>
        10 adımın hepsini bitirince {xpAmount} XP kazanırsın.
      </p>
    </div>
  )
}
