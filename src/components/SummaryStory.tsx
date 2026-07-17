import { createPortal } from 'react-dom'
import { useEffect, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent, type ReactNode } from 'react'
import { calcDayScore, type DaySummary } from '../utils/daySummary'
import { formatShortDate, formatMinutes } from '../utils/date'
import { hapticEvent } from '../utils/haptics'
import { capturePointer, releasePointer } from '../utils/pointerGesture'
import { buildSummarySlides, type SummarySlideKind } from '../utils/summaryStory'
import { useReducedMotion } from '../utils/useReducedMotion'
import { formatWaterAmount } from '../utils/water'
import LuupiIcon from './ui/LuupiIcon'
import type { IconName } from '../utils/icons'

const TAP_MAX_MS = 260
const LEFT_ZONE = 0.35
const MOVE_LIMIT = 10

interface StoryPointer {
  id: number
  at: number
  x: number
  y: number
  moved: boolean
  target: HTMLElement
}

export default function SummaryStory({ summary, onClose }: { summary: DaySummary; onClose: (completed: boolean) => void }) {
  const [slides] = useState(() => buildSummarySlides(summary))
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const [replayKey, setReplayKey] = useState(0)
  const [leftTapStep, setLeftTapStep] = useState(0)
  const reducedMotion = useReducedMotion()
  const timerRef = useRef<number | null>(null)
  const remainingRef = useRef(slides[0].duration)
  const startedAtRef = useRef(0)
  const slideKeyRef = useRef('')
  const pointerRef = useRef<StoryPointer | null>(null)
  const rootRef = useRef<HTMLDivElement>(null)
  const previousFocus = useRef<HTMLElement | null>(null)
  const slide = slides[index]

  const clearTimer = () => {
    if (timerRef.current != null) window.clearTimeout(timerRef.current)
    timerRef.current = null
  }

  const finish = (completed: boolean) => {
    clearTimer()
    if (completed) void hapticEvent('success')
    onClose(completed)
  }

  const next = () => {
    if (index >= slides.length - 1) { finish(true); return }
    void hapticEvent('selection')
    setIndex((value) => value + 1)
  }

  const previous = () => {
    void hapticEvent('selection')
    setIndex((value) => Math.max(0, value - 1))
  }

  const replay = () => {
    void hapticEvent('selection')
    remainingRef.current = slide.duration
    setReplayKey((value) => value + 1)
  }

  useEffect(() => {
    previousFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
    document.body.style.overflow = 'hidden'
    rootRef.current?.focus()
    return () => { document.body.style.overflow = ''; previousFocus.current?.focus() }
  }, [])

  useEffect(() => {
    setLeftTapStep(0)
  }, [index])

  useEffect(() => {
    clearTimer()
    const key = `${index}-${replayKey}`
    if (slideKeyRef.current !== key) {
      slideKeyRef.current = key
      remainingRef.current = slide.duration
    }
    if (paused || reducedMotion) return
    startedAtRef.current = performance.now()
    timerRef.current = window.setTimeout(next, remainingRef.current)
    return clearTimer
    // next is intentionally rebound per slide; remainingRef carries pause state.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, paused, reducedMotion, replayKey, slide.duration])

  const pauseTimer = () => {
    if (timerRef.current != null) {
      remainingRef.current = Math.max(0, remainingRef.current - (performance.now() - startedAtRef.current))
      clearTimer()
    }
    setPaused(true)
  }

  const pointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.button !== 0 || !event.isPrimary || pointerRef.current) return
    if (!capturePointer(event.currentTarget, event.pointerId)) return
    pointerRef.current = {
      id: event.pointerId,
      at: Date.now(),
      x: event.clientX,
      y: event.clientY,
      moved: false,
      target: event.currentTarget,
    }
    pauseTimer()
  }

  const pointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const pointer = pointerRef.current
    if (!pointer || pointer.id !== event.pointerId) return
    if (Math.hypot(event.clientX - pointer.x, event.clientY - pointer.y) > MOVE_LIMIT) pointer.moved = true
  }

  const pointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    const pointer = pointerRef.current
    if (!pointer || pointer.id !== event.pointerId) return
    pointerRef.current = null
    releasePointer(pointer.target, pointer.id)
    setPaused(false)
    if (pointer.moved || Date.now() - pointer.at >= TAP_MAX_MS) return
    if (pointer.x <= window.innerWidth * LEFT_ZONE) {
      if (leftTapStep === 0) { replay(); setLeftTapStep(1) } else previous()
    } else next()
  }

  const keyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Escape') { event.preventDefault(); finish(false) }
    if (event.key === 'ArrowRight') { event.preventDefault(); next() }
    if (event.key === 'ArrowLeft') { event.preventDefault(); previous() }
    if (event.key === ' ') {
      event.preventDefault()
      if (paused) setPaused(false)
      else pauseTimer()
    }
  }

  return createPortal(
    <div
      ref={rootRef}
      className={`summary-story summary-story--${slide.kind} ${paused ? 'summary-story--paused' : ''}`}
      role="dialog"
      aria-modal="true"
      aria-label={`${formatShortDate(new Date(`${summary.date}T12:00:00`))} gün özeti, ${index + 1}/${slides.length}`}
      tabIndex={-1}
      onKeyDown={keyDown}
      onPointerDown={pointerDown}
      onPointerMove={pointerMove}
      onPointerUp={pointerUp}
      onPointerCancel={(event) => {
        const pointer = pointerRef.current
        if (!pointer || pointer.id !== event.pointerId) return
        pointerRef.current = null
        releasePointer(pointer.target, pointer.id)
        setPaused(false)
      }}
      onLostPointerCapture={(event) => {
        if (pointerRef.current?.id !== event.pointerId) return
        pointerRef.current = null
        setPaused(false)
      }}
      onContextMenu={(event) => event.preventDefault()}
    >
      <div className="summary-story__ambient" aria-hidden />
      <div className="summary-story__progress" aria-label={`${index + 1} / ${slides.length}`}>
        {slides.map((item, itemIndex) => (
          <span key={item.kind}>
            <i
              key={itemIndex === index ? `${item.kind}-${replayKey}` : item.kind}
              className={itemIndex < index ? 'is-complete' : itemIndex === index ? 'is-current' : ''}
              style={itemIndex === index ? { '--story-duration': `${remainingRef.current}ms`, animationPlayState: paused ? 'paused' : 'running' } as CSSProperties : undefined}
            />
          </span>
        ))}
      </div>
      <button className="summary-story__close" type="button" onPointerDown={(event) => event.stopPropagation()} onPointerUp={(event) => event.stopPropagation()} onClick={() => finish(false)} aria-label="Hikâyeyi kapat">×</button>
      {reducedMotion && <span className="summary-story__motion-note">Dokunarak ilerle</span>}
      <div key={`${slide.kind}-${replayKey}`} className="summary-story__slide">
        <StorySlide kind={slide.kind} summary={summary} />
      </div>
      <div className="summary-story__tap-hints" aria-hidden><span>Başa al / geri</span><span>İleri</span></div>
    </div>, document.body,
  )
}

function Shell({ eyebrow, title, children }: { eyebrow: string; title: ReactNode; children: ReactNode }) {
  return <section className="summary-slide-shell"><span className="summary-slide__eyebrow">{eyebrow}</span><h2>{title}</h2>{children}</section>
}

function StorySlide({ kind, summary }: { kind: SummarySlideKind; summary: DaySummary }) {
  if (kind === 'intro') return <IntroSlide summary={summary} />
  if (kind === 'habits') return <HabitsSlide summary={summary} />
  if (kind === 'goals') return <GoalsSlide summary={summary} />
  if (kind === 'tools') return <ToolsSlide summary={summary} />
  return <ScoreSlide summary={summary} />
}

function IntroSlide({ summary }: { summary: DaySummary }) {
  const decisions = summary.doneCount + summary.skippedCount
  const tools = [summary.sessions.length, summary.justStartCount, summary.todos.length, summary.noRush.length].filter(Boolean).length
  return <Shell eyebrow="GÜNÜN HİKÂYESİ" title={<>Bugünün ritmi<br />bir araya geldi.</>}><div className="summary-story__date"><span>✦</span>{formatShortDate(new Date(`${summary.date}T12:00:00`))}</div><div className="summary-story__opening-metrics"><div><strong>{decisions}</strong><span>habit kararı</span></div><div><strong>{tools}</strong><span>aktif araç</span></div></div></Shell>
}

function HabitsSlide({ summary }: { summary: DaySummary }) {
  return <Shell eyebrow="HABİT KARARLARI" title={<>{summary.doneCount} tamamlandı.<br />Her karar ritminin parçası.</>}><div className="summary-story__habit-counts"><span className="is-done">✓ {summary.doneCount}</span><span className="is-skip">× {summary.skippedCount}</span><span>○ {summary.pendingCount}</span></div><div className="summary-story__habit-list">{summary.habitEntries.slice(0, 4).map(({ habit, status }, index) => <article key={habit.id} style={{ '--story-order': index } as CSSProperties}><span><LuupiIcon name={habit.icon} /></span><strong>{habit.name}</strong><i className={`is-${status}`}>{status === 'completed' ? '✓' : status === 'skipped' ? '×' : '○'}</i></article>)}</div>{summary.habitEntries.length > 4 && <p className="summary-story__more">+{summary.habitEntries.length - 4} habit daha</p>}</Shell>
}

function GoalsSlide({ summary }: { summary: DaySummary }) {
  const waterPct = summary.water ? Math.min(100, Math.round(summary.water.actual / summary.water.goal * 100)) : 0
  return <Shell eyebrow="GÜNLÜK HEDEFLER" title={<>Bedenin ve sabahın<br />bugün böyle ilerledi.</>}><div className="summary-story__goal-grid">{summary.water && <article className={summary.water.actual >= summary.water.goal ? 'is-met' : ''}><span><LuupiIcon name="water" size={18} /> Su ritmi</span><strong>{formatWaterAmount(summary.water.actual)}</strong><small>Hedef {formatWaterAmount(summary.water.goal)}</small><i><b style={{ width: `${waterPct}%` }} /></i></article>}{summary.wake && <article className={summary.wake.onTime ? 'is-met' : ''}><span><LuupiIcon name="sunrise" size={18} /> Uyanma</span><strong>{summary.wake.actualTime ?? '—'}</strong><small>Hedef {summary.wake.goal}</small><i><b style={{ width: summary.wake.onTime ? '100%' : summary.wake.actualTime ? '62%' : '0%' }} /></i></article>}</div></Shell>
}

function ToolsSlide({ summary }: { summary: DaySummary }) {
  const tools = [
    summary.sessions.length ? { icon: 'timer' as const, title: 'Pomodoro', value: `${summary.sessions.length} tur · ${formatMinutes(summary.totalPomMin)}` } : null,
    summary.justStartCount ? { icon: 'bolt' as const, title: 'Just Start', value: `${summary.justStartCount} yolculuk` } : null,
    summary.todos.length ? { icon: 'list-check' as const, title: 'To-do', value: `${summary.todos.length} görev` } : null,
    summary.noRush.length ? { icon: 'coffee' as const, title: 'Acele Yok', value: `${summary.noRush.length} akış` } : null,
  ].filter(Boolean) as { icon: IconName; title: string; value: string }[]
  return <Shell eyebrow="ARAÇ MOMENTUMU" title={<>Niyetini aksiyona<br />{tools.length} araç taşıdı.</>}><div className="summary-story__tools">{tools.map((tool, index) => <article key={tool.title} style={{ '--story-order': index } as CSSProperties}><span><LuupiIcon name={tool.icon} /></span><div><strong>{tool.title}</strong><small>{tool.value}</small></div><i><LuupiIcon name="arrow-up-right" size={16} /></i></article>)}</div></Shell>
}

function ScoreSlide({ summary }: { summary: DaySummary }) {
  const result = calcDayScore(summary)
  const score = result.score ?? 0
  return <Shell eyebrow="GÜN RİTMİ" title={result.score === null ? 'Ritmin oluşmaya hazır.' : result.label}><div className="summary-story__score" style={{ '--score': `${score * 10}%` } as CSSProperties}><div><strong>{result.score?.toLocaleString('tr-TR') ?? '—'}</strong><span>/ 10</span></div></div><p className="summary-story__score-copy">{result.score === null ? 'İlk kayıtla birlikte hikâyen burada büyüyecek.' : 'Habitlerin, hedeflerin ve araç momentumun birlikte değerlendirildi.'}</p>{score >= 7.5 && <div className="summary-story__particles" aria-hidden>{Array.from({ length: 14 }, (_, index) => <i key={index} style={{ '--particle': index } as CSSProperties} />)}</div>}</Shell>
}
