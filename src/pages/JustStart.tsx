import { useCallback, useEffect, useRef, useState } from 'react'
import { useApp } from '../context/AppContext'
import { usePomodoro } from '../context/PomodoroContext'
import BackBar from '../components/BackBar'
import AppButton from '../components/ui/AppButton'
import JustStartHero, { type JustStartVisualState } from '../components/just-start/JustStartHero'
import MomentumPath from '../components/just-start/MomentumPath'
import JustStartConfirmSheet, { type JustStartSheetKind } from '../components/just-start/JustStartConfirmSheet'
import { playBell } from '../utils/sound'
import { todayStr } from '../utils/date'
import { storage, type JustStartStoredState } from '../utils/storage'
import { showToast } from '../utils/toast'
import { scheduleTimerNotification, cancelTimerNotification, NOTIF_JUSTSTART } from '../utils/timerNotifications'
import LuupiIcon from '../components/ui/LuupiIcon'

const STEPS = [1, 2, 3, 4, 5, 10, 15, 20, 25, 30]
const TOTAL_MINUTES = 115
const DAILY_REWARD_XP = 50

interface InitialState extends JustStartStoredState {
  seconds: number
}

function createRunId(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`
}

function freshState(date = todayStr()): InitialState {
  return {
    date,
    runId: createRunId(),
    done: Array(STEPS.length).fill(false),
    active: null,
    seconds: 0,
    paused: false,
    endAt: null,
    pausedRemaining: null,
    journeyRecorded: false,
    rewardGranted: false,
  }
}

function initialState(): InitialState {
  const date = todayStr()
  const stored = storage.getJustStartState()
  if (!stored || stored.date !== date || stored.done.length !== STEPS.length) return freshState(date)

  const next: InitialState = { ...stored, done: [...stored.done], seconds: 0 }
  if (next.active === null) return next

  if (next.paused && next.pausedRemaining !== null) {
    next.seconds = Math.max(0, Math.ceil(next.pausedRemaining))
    return next
  }
  if (next.endAt !== null && next.endAt > Date.now()) {
    next.seconds = Math.max(0, Math.ceil((next.endAt - Date.now()) / 1000))
    return next
  }

  next.done[next.active] = true
  next.active = null
  next.paused = false
  next.endAt = null
  next.pausedRemaining = null
  return next
}

function formatTime(seconds: number): string {
  const safe = Math.max(0, seconds)
  return `${String(Math.floor(safe / 60)).padStart(2, '0')}:${String(safe % 60).padStart(2, '0')}`
}

function SoundIcon({ enabled }: { enabled: boolean }) {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M11 5 6.5 9H3v6h3.5l4.5 4V5Z" />
      {enabled ? <><path d="M15 9.5a4 4 0 0 1 0 5" /><path d="M18 7a7 7 0 0 1 0 10" /></> : <path d="m16 10 5 5m0-5-5 5" />}
    </svg>
  )
}

export default function JustStart() {
  const { addJustStartXP } = useApp()
  const { soundEnabled, toggleSound } = usePomodoro()
  const [initial] = useState(initialState)
  const [done, setDone] = useState(initial.done)
  const [active, setActive] = useState<number | null>(initial.active)
  const [seconds, setSeconds] = useState(initial.seconds)
  const [paused, setPaused] = useState(initial.paused)
  const [runId, setRunId] = useState(initial.runId)
  const [journeyRecorded, setJourneyRecorded] = useState(initial.journeyRecorded)
  const [rewardGranted, setRewardGranted] = useState(initial.rewardGranted)
  const [stats, setStats] = useState(storage.getJustStartStats)
  const [celebrating, setCelebrating] = useState<{ index: number; minutes: number } | null>(null)
  const [sheet, setSheet] = useState<JustStartSheetKind | null>(null)

  const endAtRef = useRef(initial.endAt)
  const pausedRemainingRef = useRef(initial.pausedRemaining)
  const doneRef = useRef(done)
  const soundRef = useRef(soundEnabled)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const celebrationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => { doneRef.current = done }, [done])
  useEffect(() => { soundRef.current = soundEnabled }, [soundEnabled])

  const clearTimer = useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  useEffect(() => () => {
    clearTimer()
    if (celebrationTimerRef.current !== null) clearTimeout(celebrationTimerRef.current)
  }, [clearTimer])

  useEffect(() => {
    storage.setJustStartState({
      date: todayStr(),
      runId,
      done,
      active,
      paused,
      endAt: endAtRef.current,
      pausedRemaining: pausedRemainingRef.current,
      journeyRecorded,
      rewardGranted,
    })
  }, [active, done, journeyRecorded, paused, rewardGranted, runId])

  useEffect(() => {
    if (active === null || paused) {
      clearTimer()
      return
    }
    const stepIndex = active
    const tick = () => {
      if (endAtRef.current === null) return
      const remaining = Math.max(0, Math.ceil((endAtRef.current - Date.now()) / 1000))
      setSeconds(remaining)
      if (remaining > 0) return

      clearTimer()
      endAtRef.current = null
      pausedRemainingRef.current = null
      cancelTimerNotification(NOTIF_JUSTSTART)
      if (soundRef.current) playBell()

      const finishesJourney = doneRef.current.every((value, index) => value || index === stepIndex)
      setDone((current) => {
        const next = [...current]
        next[stepIndex] = true
        return next
      })
      setActive(null)
      setPaused(false)

      if (!finishesJourney) {
        setCelebrating({ index: stepIndex, minutes: STEPS[stepIndex] })
        showToast({
          id: `just-start-step-${runId}-${stepIndex}`,
          tone: 'success',
          contextIcon: <LuupiIcon name="bolt" size={16} />,
          title: `${STEPS[stepIndex]} dakika tamamlandı`,
          message: `Sıradaki adım ${STEPS[stepIndex + 1]} dakika.`,
        })
        if (celebrationTimerRef.current !== null) clearTimeout(celebrationTimerRef.current)
        celebrationTimerRef.current = setTimeout(() => setCelebrating(null), 1050)
      }
    }

    tick()
    intervalRef.current = setInterval(tick, 500)
    const onVisible = () => { if (!document.hidden) tick() }
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      clearTimer()
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [active, clearTimer, paused, runId])

  const nextIndex = done.findIndex((value) => !value)
  const allDone = nextIndex === -1
  const completedMinutes = done.reduce((total, value, index) => value ? total + STEPS[index] : total, 0)
  const completedCount = done.filter(Boolean).length

  useEffect(() => {
    if (!allDone || journeyRecorded) return
    const result = storage.recordJustStartRun(runId, todayStr())
    setStats(result.stats)
    setJourneyRecorded(true)
    setRewardGranted(result.rewardGranted)
    if (!result.isNew) return

    if (result.rewardGranted) addJustStartXP(DAILY_REWARD_XP)
    showToast({
      id: `just-start-journey-${runId}`,
      tone: 'reward',
      contextIcon: <LuupiIcon name="bolt" size={16} />,
      title: 'Momentum yolu tamamlandı',
      message: result.rewardGranted ? `Günlük ödülün +${DAILY_REWARD_XP} XP eklendi.` : 'Yeni turun istatistiklerine kaydedildi.',
    })
  }, [addJustStartXP, allDone, journeyRecorded, runId])

  const startNext = () => {
    if (active !== null || allDone || nextIndex < 0) return
    if (celebrationTimerRef.current !== null) clearTimeout(celebrationTimerRef.current)
    setCelebrating(null)
    clearTimer()
    const duration = STEPS[nextIndex] * 60
    endAtRef.current = Date.now() + duration * 1000
    pausedRemainingRef.current = null
    scheduleTimerNotification(
      NOTIF_JUSTSTART,
      endAtRef.current,
      'Adım tamamlandı',
      `${STEPS[nextIndex]} dakikalık adım bitti. Sıradaki seni bekliyor.`,
    )
    setActive(nextIndex)
    setSeconds(duration)
    setPaused(false)
  }

  const togglePause = () => {
    if (active === null) return
    if (paused) {
      const remaining = pausedRemainingRef.current ?? seconds
      endAtRef.current = Date.now() + remaining * 1000
      pausedRemainingRef.current = null
      scheduleTimerNotification(
        NOTIF_JUSTSTART,
        endAtRef.current,
        'Adım tamamlandı',
        `${STEPS[active]} dakikalık adım bitti. Sıradaki seni bekliyor.`,
      )
      setPaused(false)
      return
    }

    pausedRemainingRef.current = endAtRef.current === null
      ? seconds
      : Math.max(0, (endAtRef.current - Date.now()) / 1000)
    endAtRef.current = null
    cancelTimerNotification(NOTIF_JUSTSTART)
    setPaused(true)
  }

  const cancelStep = () => {
    clearTimer()
    endAtRef.current = null
    pausedRemainingRef.current = null
    cancelTimerNotification(NOTIF_JUSTSTART)
    setActive(null)
    setSeconds(0)
    setPaused(false)
    showToast({ tone: 'warning', contextIcon: 'Ⅱ', title: 'Adım bırakıldı', message: 'Önceki momentumun korunuyor.', haptic: 'warning' })
  }

  const resetJourney = (announce = true) => {
    clearTimer()
    endAtRef.current = null
    pausedRemainingRef.current = null
    cancelTimerNotification(NOTIF_JUSTSTART)
    setDone(Array(STEPS.length).fill(false))
    setActive(null)
    setSeconds(0)
    setPaused(false)
    setRunId(createRunId())
    setJourneyRecorded(false)
    setRewardGranted(false)
    setCelebrating(null)
    if (announce) {
      showToast({ tone: 'info', icon: '↺', title: 'Momentum yolu sıfırlandı', message: 'Hazır olduğunda bir dakikayla yeniden başla.', haptic: 'warning' })
    }
  }

  const activeTotal = active === null ? 0 : STEPS[active] * 60
  const activeProgress = activeTotal === 0 ? 0 : (activeTotal - seconds) / activeTotal
  const heroIndex = celebrating?.index ?? active ?? (allDone ? STEPS.length - 1 : nextIndex)
  const heroMinutes = celebrating?.minutes ?? STEPS[Math.max(0, heroIndex)]
  const visualState: JustStartVisualState = allDone
    ? 'complete'
    : celebrating
      ? 'celebrating'
      : active === null
        ? 'ready'
        : paused
          ? 'paused'
          : 'running'
  const todayRuns = stats.date === todayStr() ? stats.today : 0
  const hasProgress = completedCount > 0 || active !== null

  return (
    <div className="just-start-page">
      <div className="just-start-page__inner">
        <BackBar />

        <header className="just-start-header">
          <div>
            <span className="just-start-header__eyebrow">MOMENTUM ARACI</span>
            <h1>Just Start</h1>
            <p>Büyük planı unut. Sadece sıradaki küçük adımı başlat.</p>
          </div>
          <div className="just-start-header__actions">
            <button type="button" className="just-start-icon-button" onClick={toggleSound} aria-label={soundEnabled ? 'Sesi kapat' : 'Sesi aç'}>
              <SoundIcon enabled={soundEnabled} />
            </button>
            {hasProgress && !allDone && (
              <button type="button" className="just-start-icon-button" onClick={() => setSheet('reset')} aria-label="Momentum yolunu sıfırla">
                <span aria-hidden>•••</span>
              </button>
            )}
          </div>
        </header>

        <main>
          <JustStartHero
            state={visualState}
            stepIndex={heroIndex}
            stepMinutes={heroMinutes}
            time={formatTime(seconds)}
            stepProgress={activeProgress}
            completedMinutes={completedMinutes}
            totalMinutes={TOTAL_MINUTES}
            rewardGranted={rewardGranted}
          />

          <div className="just-start-controls">
            {visualState === 'ready' && (
        <AppButton className="just-start-cta" tone="primary" size="lg" block haptic="medium" onClick={startNext} leadingIcon={<LuupiIcon name="play" size={18} />}>
                {heroMinutes} Dakikayı Başlat
              </AppButton>
            )}
            {(visualState === 'running' || visualState === 'paused') && (
              <>
        <AppButton className="just-start-cta" tone="primary" size="lg" block haptic={paused ? 'medium' : 'light'} onClick={togglePause} leadingIcon={<LuupiIcon name={paused ? 'play' : 'pause'} size={18} />}>
                  {paused ? 'Devam Et' : 'Duraklat'}
                </AppButton>
                <AppButton tone="quiet" size="sm" haptic="light" onClick={() => setSheet('cancel')}>Adımı Bırak</AppButton>
              </>
            )}
            {visualState === 'celebrating' && <div className="just-start-controls__pause" aria-hidden />}
            {visualState === 'complete' && (
              <AppButton className="just-start-new-run" tone="tonal" size="lg" block haptic="medium" onClick={() => resetJourney(false)} leadingIcon={<span aria-hidden>↺</span>}>
                Yeni Bir Tur Başlat
              </AppButton>
            )}
          </div>

          <MomentumPath done={done} active={active} activeProgress={activeProgress} />

          {active === null && !celebrating && (
            <section className="just-start-summary" aria-label="Just Start özeti">
              <div><span>BUGÜN</span><strong>{todayRuns}</strong><small>tam tur</small></div>
              <i aria-hidden />
              <div><span>TÜM ZAMANLAR</span><strong>{stats.allTime}</strong><small>tam tur</small></div>
              <i aria-hidden />
              <div><span>ÖDÜL</span><strong>{stats.lastRewardDate === todayStr() ? '✓' : '50'}</strong><small>{stats.lastRewardDate === todayStr() ? 'alındı' : 'XP'}</small></div>
            </section>
          )}

          <p className="just-start-footnote">Her adım bir başarıdır. Tam yolu bitirmek zorunda değilsin.</p>
        </main>
      </div>

      {sheet && (
        <JustStartConfirmSheet
          kind={sheet}
          onClose={() => setSheet(null)}
          onConfirm={sheet === 'cancel' ? cancelStep : () => resetJourney(true)}
        />
      )}
    </div>
  )
}
