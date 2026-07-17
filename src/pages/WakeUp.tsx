import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import BackBar from '../components/BackBar'
import AppButton from '../components/ui/AppButton'
import WakeHero from '../components/wake/WakeHero'
import {
  WakeDeleteDialog,
  WakeGoalSheet,
  WakeInsightsSheet,
  WakeRecordActionsSheet,
  WakeRecordSheet,
} from '../components/wake/WakeSheets'
import WakeWeek from '../components/wake/WakeWeek'
import type { WakeRecord } from '../types'
import { awardStandaloneBadges } from '../utils/badges'
import { todayStr } from '../utils/date'
import { scheduleAfterMotion } from '../utils/motion'
import { scheduleWakeGoalReminder } from '../utils/reminderNotifications'
import { storage } from '../utils/storage'
import { showToast } from '../utils/toast'
import { wakeRhythmStreak } from '../utils/wake'
import LuupiIcon from '../components/ui/LuupiIcon'

type WakeSheet = 'goal' | 'insights' | 'record-actions' | 'record-edit' | null
type DeleteTarget = { kind: 'record'; record: WakeRecord } | { kind: 'all' } | null

function currentTime(date = new Date()): string {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

export default function WakeUp() {
  const navigate = useNavigate()
  const [records, setRecords] = useState<WakeRecord[]>(() => storage.getWakeRecords())
  const [goal, setGoal] = useState<string | null>(() => storage.getWakeGoal())
  const [nowTime, setNowTime] = useState(() => currentTime())
  const [sheet, setSheet] = useState<WakeSheet>(null)
  const [selectedRecord, setSelectedRecord] = useState<WakeRecord | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget>(null)
  const [celebrating, setCelebrating] = useState(false)

  useEffect(() => {
    const tick = () => setNowTime(currentTime())
    const id = window.setInterval(tick, 30_000)
    window.addEventListener('focus', tick)
    return () => { window.clearInterval(id); window.removeEventListener('focus', tick) }
  }, [])

  useEffect(() => { void scheduleWakeGoalReminder(goal) }, [goal])

  const today = todayStr()
  const todayRecord = records.find((record) => record.date === today)
  const streak = wakeRhythmStreak(records, today)

  const syncRecords = () => setRecords(storage.getWakeRecords())

  const wakeUp = () => {
    if (todayRecord) return
    const time = currentTime()
    const record: WakeRecord = { date: today, time, goal }
    storage.addWakeRecord(record)
    syncRecords()
    setCelebrating(true)
    window.setTimeout(() => setCelebrating(false), 760)
    const freshBadges = awardStandaloneBadges()
    showToast({
      tone: 'success',
      contextIcon: <LuupiIcon name="sunrise" size={16} />,
      title: `Gün başladı · ${time}`,
      message: goal ? 'Sabah ritmin kaydedildi.' : 'Bugünün başlangıç saati kaydedildi.',
      haptic: freshBadges.length > 0 ? 'none' : 'success',
    })
  }

  const saveGoal = (value: string) => {
    storage.setWakeGoal(value)
    setGoal(value)
    setSheet(null)
    showToast({ tone: 'info', icon: '◎', title: 'Sabah hedefi güncellendi', message: `Yeni hedefin ${value}.`, haptic: 'selection' })
  }

  const openRecordActions = (record: WakeRecord) => {
    setSelectedRecord(record)
    setSheet('record-actions')
  }

  const openRecordFromInsights = (record: WakeRecord) => {
    setSheet(null)
    scheduleAfterMotion(() => openRecordActions(record))
  }

  const saveRecord = (record: WakeRecord) => {
    storage.addWakeRecord(record)
    syncRecords()
    setSelectedRecord(record)
    setSheet(null)
    showToast({ tone: 'info', icon: '↺', title: 'Uyanma saati düzeltildi', message: `${record.time} olarak kaydedildi.`, haptic: 'light' })
  }

  const requestRecordDelete = (record: WakeRecord) => {
    setSheet(null)
    setDeleteTarget({ kind: 'record', record })
  }

  const requestReset = () => {
    setSheet(null)
    scheduleAfterMotion(() => setDeleteTarget({ kind: 'all' }))
  }

  const confirmDelete = () => {
    if (!deleteTarget) return
    if (deleteTarget.kind === 'all') {
      storage.clearWakeRecords()
      setRecords([])
      showToast({ tone: 'warning', title: 'Uyanma geçmişi silindi', message: 'Yeni ritmin ilk kayıtla başlayacak.', haptic: 'warning' })
    } else {
      storage.deleteWakeRecord(deleteTarget.record.date)
      syncRecords()
      showToast({ tone: 'info', icon: '↺', title: 'Uyanma kaydı kaldırıldı', message: 'Sabah ritmin güncellendi.', haptic: 'light' })
    }
    setDeleteTarget(null)
    setSelectedRecord(null)
  }

  return (
    <main className="wake-page">
      <div className="wake-page__ambient" aria-hidden />
      <div className="wake-page__content">
        <BackBar title="Araçlar" />

        <header className="wake-page__intro">
          <div><span>SABAH CHECK-IN</span><h1>Uyandım</h1><p>Güne merhaba demenin en kısa yolu.</p></div>
        <button type="button" onClick={() => setSheet('insights')} aria-label="Sabah içgörülerini aç"><span aria-hidden><LuupiIcon name="chart-line" size={16} /></span> İçgörüler</button>
        </header>

        <button type="button" className="wake-goal-chip" onClick={() => setSheet('goal')}>
          <span aria-hidden>◎</span><span>{goal ? 'Sabah hedefin' : 'Hedef belirle'}</span><strong>{goal ?? 'Başla'}</strong><i aria-hidden>›</i>
        </button>

        <WakeHero
          nowTime={nowTime}
          record={todayRecord}
          goal={goal}
          streak={streak}
          celebrating={celebrating}
          onWake={wakeUp}
          onManage={() => todayRecord && openRecordActions(todayRecord)}
        />

        {todayRecord && <AppButton className="wake-dashboard-cta" tone="secondary" size="lg" block haptic="light" onClick={() => navigate('/')}>Bugüne Dön</AppButton>}

        <WakeWeek records={records} today={today} goal={goal} />
      </div>

      {sheet === 'goal' && <WakeGoalSheet goal={goal} onClose={() => setSheet(null)} onSave={saveGoal} />}
      {sheet === 'insights' && <WakeInsightsSheet records={records} today={today} goal={goal} onClose={() => setSheet(null)} onManage={openRecordFromInsights} onReset={requestReset} />}
      {sheet === 'record-actions' && selectedRecord && <WakeRecordActionsSheet record={selectedRecord} currentGoal={goal} onClose={() => setSheet(null)} onEdit={() => setSheet('record-edit')} onDelete={() => requestRecordDelete(selectedRecord)} />}
      {sheet === 'record-edit' && selectedRecord && <WakeRecordSheet record={selectedRecord} currentGoal={goal} onClose={() => setSheet(null)} onSave={saveRecord} />}
      {deleteTarget && <WakeDeleteDialog record={deleteTarget.kind === 'record' ? deleteTarget.record : undefined} all={deleteTarget.kind === 'all'} onClose={() => setDeleteTarget(null)} onConfirm={confirmDelete} />}
    </main>
  )
}
