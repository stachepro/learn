import { useEffect, useState } from 'react'
import BackBar from '../components/BackBar'
import AppButton from '../components/ui/AppButton'
import WaterHero from '../components/water/WaterHero'
import WaterRhythm from '../components/water/WaterRhythm'
import {
  WaterAmountSheet,
  WaterDeleteDialog,
  WaterGoalSheet,
  WaterHistorySheet,
  WaterInsightsSheet,
} from '../components/water/WaterSheets'
import type { WaterEntry } from '../types'
import { awardStandaloneBadges } from '../utils/badges'
import { todayStr } from '../utils/date'
import { storage } from '../utils/storage'
import { showToast } from '../utils/toast'
import { useLongPressGesture } from '../utils/useLongPressGesture'
import { dayTotalMl, entriesForDate, formatWaterAmount } from '../utils/water'
import LuupiIcon from '../components/ui/LuupiIcon'

type WaterSheet = 'bottle' | 'custom' | 'goal' | 'history' | 'insights' | null

const QUICK_AMOUNTS = [250, 500, 750]

export default function WaterTracker() {
  const [entries, setEntries] = useState<WaterEntry[]>(() => storage.getWaterEntries())
  const [bottleMl, setBottleMl] = useState(() => storage.getWaterBottleMl())
  const [goalMl, setGoalMl] = useState(() => storage.getWaterGoalMl())
  const [sheet, setSheet] = useState<WaterSheet>(null)
  const [deleteTarget, setDeleteTarget] = useState<WaterEntry | null>(null)
  const [pulseKey, setPulseKey] = useState(0)
  const bottleLongPress = useLongPressGesture({ onLongPress: () => setSheet('bottle') })

  useEffect(() => {
    const sync = () => {
      setEntries(storage.getWaterEntries())
      setBottleMl(storage.getWaterBottleMl())
      setGoalMl(storage.getWaterGoalMl())
    }
    window.addEventListener('focus', sync)
    return () => {
      window.removeEventListener('focus', sync)
    }
  }, [])

  const today = todayStr()
  const todayEntries = entriesForDate(entries, today)
  const todayTotal = dayTotalMl(entries, today)
  const remaining = Math.max(0, goalMl - todayTotal)

  const deleteEntry = (id: string, feedback = true) => {
    storage.deleteWaterEntry(id)
    setEntries(storage.getWaterEntries())
    if (feedback) showToast({ tone: 'info', icon: '↺', title: 'Su kaydı kaldırıldı', message: 'Günlük toplamın güncellendi.', haptic: 'light' })
  }

  const addWater = (ml: number) => {
    if (!storage.hasWaterGoal()) storage.setWaterGoalMl(goalMl, today)
    const now = new Date()
    const entry: WaterEntry = {
      id: crypto.randomUUID(),
      date: today,
      time: `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`,
      ml,
      timestamp: now.toISOString(),
    }
    const crossedGoal = todayTotal < goalMl && todayTotal + ml >= goalMl
    storage.addWaterEntry(entry)
    setEntries(storage.getWaterEntries())
    setPulseKey((value) => value + 1)
    awardStandaloneBadges()
    showToast({
      id: `water-${entry.id}`,
      tone: 'success',
      contextIcon: <LuupiIcon name={crossedGoal ? 'sparkles' : 'water'} size={16} />,
      title: crossedGoal ? 'Günlük hedef tamamlandı' : `${formatWaterAmount(ml)} eklendi`,
      message: crossedGoal ? 'Bugünün su ritmi tamam.' : `${formatWaterAmount(todayTotal + ml)} seviyesine ulaştın.`,
      haptic: crossedGoal ? 'success' : 'light',
      action: { label: 'Geri Al', onPress: () => deleteEntry(entry.id, false) },
    })
  }

  const saveBottle = (ml: number) => {
    storage.setWaterBottleMl(ml)
    setBottleMl(ml)
    setSheet(null)
    showToast({ tone: 'info', contextIcon: <LuupiIcon name="water" size={16} />, title: 'Hızlı ekleme güncellendi', message: `Yeni miktar ${formatWaterAmount(ml)}.`, haptic: 'light' })
  }

  const saveGoal = (ml: number) => {
    storage.setWaterGoalMl(ml, today)
    setGoalMl(storage.getWaterGoalMl())
    setSheet(null)
    showToast({ tone: 'success', icon: '◎', title: 'Günlük hedef güncellendi', message: `${formatWaterAmount(ml)} bugünden itibaren geçerli.`, haptic: 'success' })
  }

  const requestDelete = (entry: WaterEntry) => {
    setSheet(null)
    window.setTimeout(() => setDeleteTarget(entry), 310)
  }

  return (
    <main className="water-page">
      <div className="water-page__ambient" aria-hidden />
      <div className="water-page__content">
        <BackBar title="Su Takibi" />

        <div className="water-page__intro">
          <div><span>SU RİTMİ</span><h1>Bugün akışta kal.</h1></div>
        <button type="button" onClick={() => setSheet('insights')} aria-label="Su içgörülerini aç"><span aria-hidden><LuupiIcon name="chart-line" size={16} /></span> Ritmi Gör</button>
        </div>

        <WaterHero total={todayTotal} goal={goalMl} pulseKey={pulseKey} onGoal={() => setSheet('goal')} />

        <section className="water-add" aria-labelledby="water-add-title">
          <div className="water-add__heading"><div><span>HIZLI KAYIT</span><h2 id="water-add-title">Bir şişe ekle</h2></div><small>{remaining > 0 ? `${formatWaterAmount(remaining)} kaldı` : 'Hedef tamam'}</small></div>
          <div className="water-add__hold-surface long-press-surface" data-long-pressing={bottleLongPress.isPressing}>
            <AppButton
              className="water-add__primary"
              tone="primary"
              size="lg"
              block
              haptic="none"
              onPointerDown={bottleLongPress.start}
              onPointerMove={bottleLongPress.move}
              onPointerUp={bottleLongPress.end}
              onPointerCancel={bottleLongPress.cancel}
              onLostPointerCapture={bottleLongPress.lostCapture}
              onPointerLeave={(event) => { if (event.pointerType === 'mouse') bottleLongPress.cancel() }}
              onContextMenu={(event) => { event.preventDefault(); bottleLongPress.trigger(false) }}
              onKeyDown={(event) => {
                if ((event.shiftKey && event.key === 'F10') || event.key === 'ContextMenu') {
                  event.preventDefault()
                  bottleLongPress.trigger(false)
                }
              }}
              onClick={() => { if (!bottleLongPress.consumeClick()) addWater(bottleMl) }}
              aria-describedby="water-bottle-hold-hint"
              aria-haspopup="dialog"
              aria-keyshortcuts="Shift+F10"
              leadingIcon={<span className="water-add__drop" aria-hidden>◆</span>}
            >
              + {formatWaterAmount(bottleMl)} Ekle
            </AppButton>
            <span className="long-press-progress" aria-hidden />
          </div>
          <p id="water-bottle-hold-hint" className="water-add__hold-hint">Miktarı değiştirmek için basılı tut</p>
          <div className="water-add__quick">
            {QUICK_AMOUNTS.map((amount) => <button type="button" key={amount} onClick={() => addWater(amount)}><strong>+{formatWaterAmount(amount)}</strong><span>{amount === 250 ? 'Bardak' : amount === 500 ? 'Şişe' : 'Büyük'}</span></button>)}
            <button type="button" onClick={() => setSheet('custom')}><strong>+</strong><span>Özel</span></button>
          </div>
        </section>

        <WaterRhythm entries={todayEntries} historyCount={entries.length} onOpenHistory={() => setSheet('history')} />

        {todayEntries.length > 0 && (
          <section className="water-recent" aria-labelledby="water-recent-title">
            <header><div><span>SON KAYITLAR</span><h2 id="water-recent-title">Bugün içtiklerin</h2></div><button type="button" onClick={() => setSheet('history')}>Tümü <span aria-hidden>›</span></button></header>
            <div>{[...todayEntries].reverse().slice(0, 3).map((entry) => <article key={entry.id}><span aria-hidden>◆</span><div><strong>{formatWaterAmount(entry.ml)}</strong><small>{entry.time}</small></div><i>{Math.round(entry.ml / goalMl * 100)}%</i></article>)}</div>
          </section>
        )}
      </div>

      {sheet === 'bottle' && <WaterAmountSheet mode="bottle" initialValue={bottleMl} onClose={() => setSheet(null)} onConfirm={saveBottle} />}
      {sheet === 'custom' && <WaterAmountSheet mode="custom" initialValue={250} onClose={() => setSheet(null)} onConfirm={(ml) => { setSheet(null); addWater(ml) }} />}
      {sheet === 'goal' && <WaterGoalSheet initialValue={goalMl} onClose={() => setSheet(null)} onConfirm={saveGoal} />}
      {sheet === 'history' && <WaterHistorySheet entries={entries} total={entries.reduce((sum, entry) => sum + entry.ml, 0)} onClose={() => setSheet(null)} onManage={requestDelete} />}
      {sheet === 'insights' && <WaterInsightsSheet entries={entries} goal={(date) => storage.getWaterGoalForDate(date)} onClose={() => setSheet(null)} />}
      {deleteTarget && <WaterDeleteDialog entry={deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={() => { deleteEntry(deleteTarget.id); setDeleteTarget(null) }} />}
    </main>
  )
}
