import { createPortal } from 'react-dom'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useSearchParams } from 'react-router-dom'
import SummaryStory from '../components/SummaryStory'
import AppButton from '../components/ui/AppButton'
import { useApp } from '../context/AppContext'
import { addDaysStr, formatDisplayDate, formatMinutes, todayStr } from '../utils/date'
import { calcDayScore, collectDaySummary, sessionLabel, summaryHasActivity, summaryHasAnything, type DaySummary } from '../utils/daySummary'
import { hapticEvent } from '../utils/haptics'
import { storage } from '../utils/storage'
import { useModalDismiss } from '../utils/useModalDismiss'
import { useSheetDragDismiss } from '../utils/useSheetDragDismiss'
import { formatWaterAmount } from '../utils/water'
import LuupiIcon from '../components/ui/LuupiIcon'
import type { IconName } from '../utils/icons'

type DetailKind = 'habits' | 'tools' | null

export default function DailySummary() {
  const { habits, logs, freeSessions } = useApp()
  const [searchParams, setSearchParams] = useSearchParams()
  const today = todayStr()
  const requestedDate = searchParams.get('date')
  const selectedDate = requestedDate && requestedDate <= today ? requestedDate : today
  const [storySummary, setStorySummary] = useState<DaySummary | null>(null)
  const [detail, setDetail] = useState<DetailKind>(null)
  const autoplayHandled = useRef(false)
  const summary = collectDaySummary(habits, logs[selectedDate] ?? { date: selectedDate, habits: {} }, freeSessions ?? [], selectedDate)
  const dateRail = Array.from({ length: 7 }, (_, index) => addDaysStr(today, index - 6))

  const openStory = () => setStorySummary(summary)
  const closeStory = () => {
    storage.setStorySeenDate(selectedDate)
    setStorySummary(null)
    const next = new URLSearchParams(searchParams)
    next.delete('story')
    setSearchParams(next, { replace: true })
  }

  useEffect(() => {
    if (autoplayHandled.current || searchParams.get('story') !== '1') return
    autoplayHandled.current = true
    if (storage.getStorySeenDate() !== selectedDate && summaryHasActivity(summary)) setStorySummary(summary)
    // Notification-provided autoplay is intentionally handled once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const selectDate = (date: string) => {
    void hapticEvent('selection')
    setStorySummary(null)
    setDetail(null)
    setSearchParams(date === today ? {} : { date })
  }

  return (
    <main className="daily-summary-page">
      <div className="daily-summary-page__ambient" aria-hidden />
      <div className="daily-summary-page__content">
        <header className="daily-summary-header">
          <div><span>GÜNÜN HİKÂYESİ</span><h1>Özet</h1><p>{formatDisplayDate(new Date(`${selectedDate}T12:00:00`))}</p></div>
        <AppButton tone="primary" size="sm" haptic="light" onClick={openStory} disabled={!summaryHasAnything(summary)} leadingIcon={<LuupiIcon name="play" size={16} />}>Hikâyeyi Oynat</AppButton>
        </header>

        <nav className="daily-summary-dates" aria-label="Özet tarihi">
          {dateRail.map((date) => <button type="button" key={date} className={date === selectedDate ? 'is-active' : ''} onClick={() => selectDate(date)}><span>{new Intl.DateTimeFormat('tr-TR', { weekday: 'short' }).format(new Date(`${date}T12:00:00`)).replace('.', '')}</span><strong>{Number(date.slice(8))}</strong>{date === today && <i />}</button>)}
        </nav>

        {!summaryHasAnything(summary) ? <SummaryEmpty onToday={() => selectDate(today)} isToday={selectedDate === today} /> : <SummaryDashboard summary={summary} isToday={selectedDate === today} onDetail={setDetail} />}
      </div>

      {storySummary && <SummaryStory summary={storySummary} onClose={closeStory} />}
      {detail && <SummaryDetailSheet kind={detail} summary={summary} habits={habits} onClose={() => setDetail(null)} />}
    </main>
  )
}

function SummaryEmpty({ isToday, onToday }: { isToday: boolean; onToday: () => void }) {
  return <section className="daily-summary-empty"><span aria-hidden>✦</span><h2>{isToday ? 'Bugünün hikâyesi oluşuyor.' : 'Bu güne ait kayıt yok.'}</h2><p>{isToday ? 'Habit ve araç sonuçların geldikçe özetin burada büyüyecek.' : 'Başka bir gün seçerek ritmine bakabilirsin.'}</p>{!isToday && <AppButton tone="secondary" onClick={onToday}>Bugüne Dön</AppButton>}</section>
}

function SummaryDashboard({ summary, isToday, onDetail }: { summary: DaySummary; isToday: boolean; onDetail: (kind: DetailKind) => void }) {
  const score = calcDayScore(summary)
  const decided = summary.doneCount + summary.skippedCount
  const targetDone = Number((summary.water?.actual ?? 0) >= (summary.water?.goal ?? Infinity)) + Number(summary.wake?.onTime ?? false)
  const targetCount = Number(Boolean(summary.water)) + Number(Boolean(summary.wake))
  const tools = toolModels(summary)

  return <div className="daily-summary-stack">
    <section className="daily-summary-hero">
      <div className="daily-summary-hero__copy"><span>{isToday ? 'CANLI GÜN RİTMİ' : 'GÜN RİTMİ'}</span><h2>{score.label}</h2><p>{isToday ? 'Gün devam ediyor; sonuçların geldikçe ritmin değişir.' : 'Habitlerin, hedeflerin ve araçların birlikte değerlendirildi.'}</p></div>
      <div className="daily-summary-score" style={{ '--summary-score': `${(score.score ?? 0) * 10}%` } as React.CSSProperties}><div><strong>{score.score?.toLocaleString('tr-TR') ?? '—'}</strong><span>/10</span></div></div>
      <div className="daily-summary-pulse"><div><strong>{decided}</strong><span>habit kararı</span></div><div><strong>{targetDone}/{targetCount}</strong><span>günlük hedef</span></div><div><strong>{tools.length}</strong><span>aktif araç</span></div></div>
    </section>

    {summary.habitEntries.length > 0 && <SummarySection eyebrow="HABİT KARARLARI" title="Bugünün alışkanlıkları" meta={`${summary.doneCount} tamam · ${summary.skippedCount} atlandı`} onOpen={() => onDetail('habits')}>
      <div className="daily-summary-habits">{summary.habitEntries.slice(0, 4).map(({ habit, status }) => <article key={habit.id} className={`is-${status}`}><span><LuupiIcon name={habit.icon} /></span><strong>{habit.name}</strong><i>{status === 'completed' ? '✓' : status === 'skipped' ? '×' : '○'}</i></article>)}</div>
    </SummarySection>}

    {(summary.water || summary.wake) && <SummarySection eyebrow="GÜNLÜK HEDEFLER" title="Beden ve sabah ritmi" meta={`${targetDone}/${targetCount} hedef`}>
      <div className="daily-summary-goals">{summary.water && <GoalCard icon="water" label="Su ritmi" value={formatWaterAmount(summary.water.actual)} detail={`Hedef ${formatWaterAmount(summary.water.goal)}`} progress={Math.min(100, summary.water.actual / summary.water.goal * 100)} met={summary.water.actual >= summary.water.goal} />}{summary.wake && <GoalCard icon="sunrise" label="Uyanma" value={summary.wake.actualTime ?? '—'} detail={`Hedef ${summary.wake.goal}`} progress={summary.wake.onTime ? 100 : summary.wake.actualTime ? 62 : 0} met={summary.wake.onTime} />}</div>
    </SummarySection>}

    {tools.length > 0 && <SummarySection eyebrow="ARAÇ MOMENTUMU" title="Niyetten aksiyona" meta={`${tools.length} araç`} onOpen={() => onDetail('tools')}>
      <div className="daily-summary-tools">{tools.map((tool) => <article key={tool.title}><span><LuupiIcon name={tool.icon} /></span><div><strong>{tool.title}</strong><small>{tool.value}</small></div><i><LuupiIcon name="arrow-up-right" size={16} /></i></article>)}</div>
    </SummarySection>}
  </div>
}

function SummarySection({ eyebrow, title, meta, onOpen, children }: { eyebrow: string; title: string; meta: string; onOpen?: () => void; children: ReactNode }) {
  return <section className="daily-summary-section"><header><div><span>{eyebrow}</span><h2>{title}</h2></div>{onOpen ? <button type="button" onClick={onOpen}>{meta} <span aria-hidden>›</span></button> : <small>{meta}</small>}</header>{children}</section>
}

function GoalCard({ icon, label, value, detail, progress, met }: { icon: IconName; label: string; value: string; detail: string; progress: number; met: boolean }) {
  return <article className={met ? 'is-met' : ''}><span><LuupiIcon name={icon} size={18} /> {label}</span><strong>{value}</strong><small>{detail}</small><i><b style={{ width: `${progress}%` }} /></i></article>
}

function toolModels(summary: DaySummary) {
  return [
    summary.sessions.length ? { icon: 'timer' as const, title: 'Pomodoro', value: `${summary.sessions.length} tur · ${formatMinutes(summary.totalPomMin)}` } : null,
    summary.justStartCount ? { icon: 'bolt' as const, title: 'Just Start', value: `${summary.justStartCount} yolculuk` } : null,
    summary.todos.length ? { icon: 'list-check' as const, title: 'To-do', value: `${summary.todos.length} görev tamam` } : null,
    summary.noRush.length ? { icon: 'coffee' as const, title: 'Acele Yok', value: `${summary.noRush.length} akış` } : null,
  ].filter(Boolean) as { icon: IconName; title: string; value: string }[]
}

function SummaryDetailSheet({ kind, summary, habits, onClose }: { kind: Exclude<DetailKind, null>; summary: DaySummary; habits: ReturnType<typeof useApp>['habits']; onClose: () => void }) {
  const { isExiting, close } = useModalDismiss(onClose)
  const sheetDrag = useSheetDragDismiss(close)
  const panelRef = useRef<HTMLElement>(null)
  useEffect(() => { panelRef.current?.querySelector<HTMLElement>('button')?.focus() }, [])
  return createPortal(
    <div className="summary-detail-layer" role="dialog" aria-modal="true" aria-labelledby="summary-detail-title">
      <button type="button" className="summary-detail__scrim" onClick={close} aria-label="Kapat" />
      <section ref={panelRef} style={sheetDrag.surfaceStyle} className={`summary-detail-sheet ${sheetDrag.surfaceClassName} ${isExiting ? 'summary-detail-sheet--exit' : 'summary-detail-sheet--enter'}`}>
        <span className="summary-detail__handle sheet-drag-handle" {...sheetDrag.handleProps} />
        <header>
          <div>
            <span>{kind === 'habits' ? 'HABİT KARARLARI' : 'ARAÇ MOMENTUMU'}</span>
            <h2 id="summary-detail-title">{kind === 'habits' ? 'Günün bütün kararları' : 'Tamamlanan araç sonuçları'}</h2>
          </div>
          <button type="button" onClick={close} aria-label="Kapat">×</button>
        </header>
        {kind === 'habits' ? (
          <div className="summary-detail-habits">
            {summary.habitEntries.map(({ habit, status }) => (
              <article key={habit.id} className={`is-${status}`}>
                <span><LuupiIcon name={habit.icon} /></span><strong>{habit.name}</strong><i>{status === 'completed' ? 'Tamamlandı' : status === 'skipped' ? 'Atlandı' : 'Bekliyor'}</i>
              </article>
            ))}
          </div>
        ) : (
          <div className="summary-detail-tools">
            {summary.sessions.map((session) => {
              const item = sessionLabel(session, habits)
              return <article key={session.id}><span><LuupiIcon name={item.icon} /></span><strong>{item.name}</strong><i>{formatMinutes(session.workDuration)}</i></article>
            })}
            {summary.justStartCount > 0 && <article><span><LuupiIcon name="bolt" /></span><strong>Just Start</strong><i>{summary.justStartCount} yolculuk</i></article>}
            {summary.todos.map((todo) => <article key={todo.id}><span>✓</span><strong>{todo.text}</strong><i>Tamamlandı</i></article>)}
            {summary.noRush.map((item) => <article key={item.id}><span><LuupiIcon name="coffee" /></span><strong>{item.title}</strong><i>{item.stageCount} aşama</i></article>)}
          </div>
        )}
      </section>
    </div>,
    document.body,
  )
}
