import { useState, useEffect, useRef, useCallback, type CSSProperties } from 'react'
import { useApp } from '../context/AppContext'
import { usePomodoro } from '../context/PomodoroContext'
import { playBell } from '../utils/sound'
import { todayStr } from '../utils/date'
import BackBar from '../components/BackBar'
import TimerDial from '../components/TimerDial'
import Confetti from '../components/Confetti'
import { scheduleTimerNotification, cancelTimerNotification, NOTIF_JUSTSTART } from '../utils/timerNotifications'

/* ════════════════════════════════════════════════
   JUST START — 1 dakikayla başla, 30'a kadar tırman.
   Kadran merkezi kayan rakamlarla işler; çalışırken
   kadrandan kor taneleri yükselir. Her biten adım
   ✓ çizimi + "+X dk" pop'uyla kutlanır; gün bitince
   konfeti yağar. Amaç: her adımı küçük bir zafer
   gibi hissettirmek.
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

// Adım süresine göre teşvik cümlesi — sayaç işlerken kadranın altında
function encourage(min: number): string {
  if (min <= 1) return 'Sadece 1 dakika — en zor kısmı hallettin, başladın.'
  if (min <= 5) return 'Isınıyorsun, ritim gelmeye başladı.'
  if (min <= 15) return 'Momentum sende — akışta kal.'
  return 'Derin çalışma bölgesindesin, harika gidiyorsun.'
}

/* ── Kayan rakamlı sayaç — her rakam değişince alttan süzülür ── */
function AnimatedTime({ text, color, dim, blink }: {
  text: string; color: string; dim: boolean; blink: boolean
}) {
  return (
    <div
      className="display tnum font-extrabold leading-none"
      style={{ fontSize: 54, color, opacity: dim ? 0.35 : 1, transition: 'opacity 0.35s ease, color 0.4s ease' }}
    >
      {[...text].map((ch, i) =>
        ch === ':' ? (
          <span key={`c${i}`} className={`focus-colon ${blink ? 'focus-colon-blink' : ''}`}>:</span>
        ) : (
          <span key={`${i}-${ch}`} className="focus-digit">{ch}</span>
        ),
      )}
    </div>
  )
}

/* ── Çizilerek beliren onay işareti ── */
function CheckDraw({ size = 15, color = 'currentColor', strokeWidth = 2.4 }: {
  size?: number; color?: string; strokeWidth?: number
}) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <polyline className="js-check-draw" points="2.5 8.5 6.5 12.5 13.5 4" />
    </svg>
  )
}

/* ── Kadrandan yükselen kor taneleri — sayaç işlerken ── */
const EMBERS = [
  { left: 16, delay: 0.0, dur: 3.4, size: 4 },
  { left: 30, delay: 1.2, dur: 2.9, size: 3 },
  { left: 47, delay: 0.5, dur: 3.8, size: 5 },
  { left: 60, delay: 1.8, dur: 3.1, size: 3 },
  { left: 73, delay: 0.8, dur: 3.6, size: 4 },
  { left: 84, delay: 2.3, dur: 3.2, size: 3 },
  { left: 24, delay: 2.7, dur: 3.0, size: 3 },
  { left: 55, delay: 3.1, dur: 3.5, size: 4 },
]

function Embers({ accent }: { accent: string }) {
  return (
    <div className="absolute inset-0 pointer-events-none" aria-hidden>
      {EMBERS.map((e, i) => (
        <span
          key={i}
          className="js-ember"
          style={{
            left: `${e.left}%`, bottom: 36,
            width: e.size, height: e.size,
            background: accent,
            boxShadow: `0 0 6px ${accent}`,
            '--dur': `${e.dur}s`, '--delay': `${e.delay}s`,
          } as CSSProperties}
        />
      ))}
    </div>
  )
}

export default function JustStart() {
  const { pomodoroSettings, addJustStartXP } = useApp()
  const { soundEnabled, toggleSound } = usePomodoro()
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
  // Adım bitti kutlaması: kadran merkezinde ✓ + "+X dk" (1.8 sn)
  const [celebrate, setCelebrate] = useState<{ min: number } | null>(null)
  const [showConfetti, setShowConfetti] = useState(false)
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const endAtRef = useRef<number | null>(init.endAt)
  const pausedRemainingRef = useRef<number | null>(init.pausedRemaining)
  const celebrateTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const confettiTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const clearTick = useCallback(() => {
    if (tickRef.current) { clearInterval(tickRef.current); tickRef.current = null }
  }, [])

  useEffect(() => () => {
    clearTick()
    if (celebrateTimerRef.current) clearTimeout(celebrateTimerRef.current)
    if (confettiTimerRef.current) clearTimeout(confettiTimerRef.current)
  }, [clearTick])

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
        // Kutlama: kadran merkezinde kısa bir zafer anı
        setCelebrate({ min: STEPS[idx] })
        if (celebrateTimerRef.current) clearTimeout(celebrateTimerRef.current)
        celebrateTimerRef.current = setTimeout(() => setCelebrate(null), 1800)
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

  // Gün oturum içinde tamamlanınca (sayfa yüklenirken değil) konfeti yağar
  const prevAllDoneRef = useRef(allDone)
  useEffect(() => {
    if (allDone && !prevAllDoneRef.current) {
      setShowConfetti(true)
      if (confettiTimerRef.current) clearTimeout(confettiTimerRef.current)
      confettiTimerRef.current = setTimeout(() => setShowConfetti(false), 3600)
    }
    prevAllDoneRef.current = allDone
  }, [allDone])

  const startNext = () => {
    if (active !== null || allDone || nextIdx === -1) return
    setCelebrate(null)
    if (celebrateTimerRef.current) clearTimeout(celebrateTimerRef.current)
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
    setCelebrate(null)
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
  const celebrating = active === null && celebrate !== null

  /* Adım karosu — iki anlamlı satır halinde çizilir: Isınma / Tırmanış */
  const renderTile = (min: number, i: number) => {
    const isDone = done[i]
    const isActive = active === i
    const isNext = !isDone && !isActive && i === nextIdx && active === null
    const isFlashing = flash === i
    return (
      <button
        key={i}
        onClick={isNext ? startNext : undefined}
        disabled={!isNext}
        className={`animate-cell-pop relative overflow-hidden flex flex-col items-center justify-center rounded-2xl py-3 ${isNext ? 'btn-press ring-pulse' : ''} ${isActive ? 'js-step-glow' : ''} ${isFlashing ? 'animate-done-flash' : ''}`}
        style={{
          animationDelay: `${i * 0.03}s`,
          background: isDone ? 'rgba(34,197,94,0.14)'
            : isActive ? 'rgba(249,115,22,0.08)'
            : isNext ? '#ffffff'
            : 'rgb(var(--ink) / 0.04)',
          border: `1.5px solid ${
            isDone ? 'rgba(34,197,94,0.45)'
            : isActive ? 'rgba(249,115,22,0.55)'
            : isNext ? 'rgb(var(--ink) / 0.18)'
            : 'rgb(var(--ink) / 0.07)'
          }`,
          color: isDone ? '#15803d'
            : isActive ? '#c2410c'
            : isNext ? 'rgb(var(--ink))'
            : 'rgb(var(--ink) / 0.28)',
          cursor: isNext ? 'pointer' : 'default',
        }}
      >
        {/* Aktif karoda alttan dolan ilerleme */}
        {isActive && (
          <span
            className="absolute inset-x-0 bottom-0"
            style={{
              height: `${stepProgress * 100}%`,
              background: 'rgba(249,115,22,0.16)',
              transition: 'height 1s linear',
            }}
          />
        )}
        <span className="relative text-base font-bold leading-none h-4 flex items-center">
          {isDone ? <CheckDraw size={15} /> : isActive ? '▶' : min}
        </span>
        <span className="relative text-[9px] font-semibold mt-1 leading-none" style={{ opacity: 0.6 }}>
          {isDone || isActive ? `${min}dk` : 'dk'}
        </span>
      </button>
    )
  }

  return (
    <div className="max-w-sm mx-auto px-4 pt-6 pb-40">
      <BackBar />
      {showConfetti && <Confetti />}

      {/* Başlık */}
      <div className="mb-7 text-center">
        <h1 className="display text-2xl font-extrabold tracking-tight" style={{ color: 'rgb(var(--ink))' }}>
          Just Start
        </h1>
        <p className="text-xs mt-1" style={{ color: 'rgb(var(--ink) / 0.45)' }}>
          Sadece başlamak yeter · {completedMins}/{TOTAL_MINUTES} dk
        </p>
      </div>

      {/* ── Kadran ── */}
      <div className="flex flex-col items-center animate-fade-up">
        <div className="relative">
          <TimerDial progress={dialProgress} accent={accent} showArc={showArc} ticking={ticking}>
            {celebrating ? (
              <>
                {/* Patlama halkası + zafer anı */}
                <span
                  className="js-burst-ring absolute rounded-full pointer-events-none"
                  style={{ inset: 22, border: '3px solid rgba(34,197,94,0.55)' }}
                />
                <div className="js-celebrate flex flex-col items-center">
                  <span
                    className="w-14 h-14 rounded-full flex items-center justify-center"
                    style={{ background: 'rgba(34,197,94,0.9)', color: '#06210f', boxShadow: '0 10px 26px -8px rgba(34,197,94,0.6)' }}
                  >
                    <CheckDraw size={26} strokeWidth={2.6} />
                  </span>
                  <span className="display text-2xl font-extrabold mt-2.5" style={{ color: '#15803d' }}>
                    +{celebrate.min} dk
                  </span>
                  <span className="text-[11px] font-semibold mt-1" style={{ color: 'rgb(var(--ink) / 0.45)' }}>
                    adım tamamlandı
                  </span>
                </div>
              </>
            ) : (
              <>
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
                {allDone ? (
                  <span className="display tnum font-extrabold leading-none mt-2.5" style={{ fontSize: 54, color: '#15803d' }}>
                    ✓
                  </span>
                ) : (
                  <div className="mt-2.5">
                    <AnimatedTime
                      text={fmt(active !== null ? secs : STEPS[nextIdx] * 60)}
                      color={active !== null ? 'rgb(var(--ink))' : 'rgb(var(--ink) / 0.28)'}
                      dim={paused}
                      blink={ticking}
                    />
                  </div>
                )}
                <span className="text-[11px] font-semibold mt-2" style={{ color: 'rgb(var(--ink) / 0.45)' }}>
                  {completedCount}/10 adım tamamlandı
                </span>
              </>
            )}
          </TimerDial>
          {ticking && <Embers accent={accent} />}
        </div>

        {/* Teşvik satırı — sayaç işlerken */}
        {active !== null && (
          <p
            key={`${active}-${paused}`}
            className="animate-fade-in text-xs mt-3 text-center px-6"
            style={{ color: 'rgb(var(--ink) / 0.5)' }}
          >
            {paused ? 'Nefes al — acele yok, kaldığın yerden devam edersin.' : encourage(STEPS[active])}
          </p>
        )}
      </div>

      {/* ── Kontroller ── */}
      <div className="mt-6 space-y-3">
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
                background: paused ? 'rgba(34,197,94,0.9)' : 'rgb(var(--ink) / 0.06)',
                color: paused ? '#06210f' : 'rgb(var(--ink))',
                border: '1px solid rgb(var(--ink) / 0.08)',
              }}
            >
              {paused ? '▶ Devam Et' : '⏸ Duraklat'}
            </button>
            <div className="flex gap-2 animate-fade-up">
              <button
                onClick={toggleSound}
                className="ctrl btn-press flex-1 py-2.5 rounded-2xl text-xs font-semibold"
              >
                {soundEnabled ? '🔔 Ses açık' : '🔕 Ses kapalı'}
              </button>
              <button
                onClick={cancelStep}
                className="btn-press flex-1 py-2.5 rounded-2xl text-xs font-bold"
                style={{ background: 'rgba(225,90,60,0.12)', color: '#b3422a', boxShadow: 'inset 0 0 0 1px rgba(225,90,60,0.3)' }}
              >
                Adımı İptal Et
              </button>
            </div>
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
                <p className="text-sm font-semibold animate-check" style={{ color: '#15803d', opacity: 0.75 }}>
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

      {/* ── Süreç çubuğu: her adım %10 — ortada yüzde etiketi ── */}
      <div className="mt-6 animate-fade-up">
        <div className="well relative h-7 rounded-full overflow-hidden">
          {/* Dolgu — parlayan enerji şeridi, %100'de yeşile döner.
              Not: .energy-fill kendi position'ını kurduğu için akışta kalır. */}
          <div
            className={`progress-fill h-full rounded-full ${completedCount === STEPS.length ? 'acc-fill' : 'energy-fill'}`}
            style={{ width: `${completedCount * 10}%` }}
          />
          {/* %10'luk dilim ayraçları — her kutucuk eşit pay */}
          {Array.from({ length: 9 }).map((_, i) => (
            <span
              key={i}
              className="absolute inset-y-1.5"
              style={{ left: `${(i + 1) * 10}%`, width: 1, background: 'rgb(var(--ink) / 0.1)' }}
            />
          ))}
          {/* Ortadaki yüzde etiketi */}
          <span
            key={completedCount}
            className="animate-value-pop absolute inset-0 flex items-center justify-center text-[11px] font-bold tnum"
            style={{ color: completedCount === STEPS.length ? '#06210f' : 'rgb(var(--ink))' }}
          >
            %{completedCount * 10} tamamlandı
          </span>
        </div>
      </div>

      {/* ── Adım yolculuğu: Isınma → Tırmanış ── */}
      <div className="mt-7">
        <div className="flex items-center justify-between mb-2.5 px-0.5">
          <span className="text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: 'rgb(var(--ink) / 0.45)' }}>
            Adım Yolculuğu
          </span>
          <span className="text-[10px] font-bold tabular-nums" style={{ color: 'rgb(var(--ink) / 0.45)' }}>
            {completedMins}/{TOTAL_MINUTES} dk
          </span>
        </div>

        <p className="text-[9px] font-bold uppercase tracking-[0.16em] mb-1.5 px-0.5" style={{ color: 'rgb(var(--ink) / 0.3)' }}>
          Isınma
        </p>
        <div className="grid grid-cols-5 gap-2">
          {STEPS.slice(0, 5).map((min, i) => renderTile(min, i))}
        </div>

        <p className="text-[9px] font-bold uppercase tracking-[0.16em] mt-3 mb-1.5 px-0.5" style={{ color: 'rgb(var(--ink) / 0.3)' }}>
          Tırmanış
        </p>
        <div className="grid grid-cols-5 gap-2">
          {STEPS.slice(5).map((min, i) => renderTile(min, i + 5))}
        </div>

        {!allDone && active === null && (
          <p className="text-center text-[11px] mt-3" style={{ color: 'rgb(var(--ink) / 0.4)' }}>
            {done.some(Boolean)
              ? `Sıradaki adım ${STEPS[nextIdx]} dakika — hazır olunca başla.`
              : '1 dakikayla başla, her adımda biraz daha uzat.'}
          </p>
        )}
      </div>

      {/* ── İstatistikler ── */}
      <div className="grid grid-cols-2 gap-3 mt-6">
        <div className="glass g-lime rounded-2xl px-4 py-4 text-center animate-fade-up" style={{ animationDelay: '0.05s' }}>
          <p key={stats.today} className="display text-3xl font-extrabold tnum animate-value-pop" style={{ color: 'rgb(var(--txt))' }}>
            {stats.today}
          </p>
          <p className="text-[10px] font-bold uppercase tracking-[0.15em] mt-1 ink-60">Bugünkü Tur</p>
        </div>
        <div className="glass g-neutral rounded-2xl px-4 py-4 text-center animate-fade-up" style={{ animationDelay: '0.1s' }}>
          <p key={stats.allTime} className="display text-3xl font-extrabold tnum animate-value-pop" style={{ color: 'rgb(var(--ink))' }}>
            {stats.allTime}
          </p>
          <p className="text-[10px] font-bold uppercase tracking-[0.15em] mt-1" style={{ color: 'rgb(var(--ink) / 0.45)' }}>Toplam Tur</p>
        </div>
      </div>

      {/* ── Sıfırlama — yanlışlıkla basmaya karşı onaylı ── */}
      {hasProgress && (
        <div className="mt-6">
          {confirmReset ? (
            <div className="flex items-center gap-2 animate-fade-up">
              <span className="text-xs font-semibold flex-1 text-right" style={{ color: 'rgb(var(--ink) / 0.55)' }}>
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
              style={{ color: 'rgb(var(--ink) / 0.4)' }}
            >
              ↺ Günü Sıfırla
            </button>
          )}
        </div>
      )}

      <p className="text-center text-[11px] mt-4" style={{ color: 'rgb(var(--ink) / 0.4)' }}>
        10 adımın hepsini bitirince {xpAmount} XP kazanırsın.
      </p>
    </div>
  )
}
