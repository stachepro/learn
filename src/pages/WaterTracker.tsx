import { useEffect, useRef, useState } from 'react'
import BackBar from '../components/BackBar'
import WaterFill from '../components/WaterFill'
import { storage } from '../utils/storage'
import { awardStandaloneBadges } from '../utils/badges'
import { todayStr, dateStr, getDaysInMonth, getFirstDayOfMonth, trMonthName, TR_DAY_SHORTS, formatShortDate } from '../utils/date'
import {
  formatLiters, formatMl, dayTotalMl, entriesForDate, totalsForMonth, totalsForYear,
  averageDailyMl, bestDay, daysGoalMet, yearsAvailable,
} from '../utils/water'
import type { WaterEntry } from '../types'

type StatsTab = 'day' | 'month' | 'year'

const NAVY = '#0c2a5c'
const NAVY_60 = 'rgba(12,42,92,0.6)'

function intensity(ml: number, goal: number): string {
  if (ml <= 0) return 'rgba(26,23,38,0.05)'
  const t = Math.min(ml / goal, 1)
  const alpha = 0.22 + t * 0.68
  return `rgba(37,99,235,${alpha.toFixed(2)})`
}

/* ── İstatistik penceresi: gün / ay / yıl sekmeleri ── */
function WaterStatsModal({ entries, goalMl, onClose, onReset, onDeleteEntry }: {
  entries: WaterEntry[]
  goalMl: number
  onClose: () => void
  onReset: () => void
  onDeleteEntry: (id: string) => void
}) {
  const [tab, setTab] = useState<StatsTab>('day')
  const [confirmReset, setConfirmReset] = useState(false)
  const [day, setDay] = useState(() => todayStr())
  const now = new Date()
  const [ym, setYm] = useState({ year: now.getFullYear(), month: now.getMonth() })
  const [year, setYear] = useState(now.getFullYear())

  const shiftDay = (delta: number) => {
    const d = new Date(`${day}T12:00:00`)
    d.setDate(d.getDate() + delta)
    setDay(dateStr(d))
  }
  const shiftMonth = (delta: number) => {
    let { year: y, month: m } = ym
    m += delta
    if (m < 0) { m = 11; y -= 1 } else if (m > 11) { m = 0; y += 1 }
    setYm({ year: y, month: m })
  }

  const dayEntries = entriesForDate(entries, day)
  const dayTotal = dayTotalMl(entries, day)

  const monthDays = totalsForMonth(entries, ym.year, ym.month)
  const monthMap = new Map(monthDays.map((d) => [d.date, d.ml]))
  const daysInMonth = getDaysInMonth(ym.year, ym.month)
  const firstDayCol = getFirstDayOfMonth(ym.year, ym.month)
  const monthTotal = monthDays.reduce((s, d) => s + d.ml, 0)
  const monthAvg = monthDays.length > 0 ? Math.round(monthTotal / daysInMonth) : 0
  const monthBest = monthDays.reduce((best, d) => (d.ml > (best?.ml ?? -1) ? d : best), monthDays[0] ?? null)

  const yearMonths = totalsForYear(entries, year)
  const yearTotal = yearMonths.reduce((s, m) => s + m.ml, 0)
  const maxMonthMl = Math.max(1, ...yearMonths.map((m) => m.ml))
  const years = yearsAvailable(entries)

  const globalAvg = averageDailyMl(entries)
  const globalBest = bestDay(entries)
  const goalDays = daysGoalMet(entries, goalMl)

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 animate-fade-in" style={{ background: 'rgba(26,23,38,0.45)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)' }} onClick={onClose} />
      <div className="relative min-h-full flex items-center justify-center p-4">
        <div className="glass g-neutral animate-pop w-full max-w-sm" style={{ borderRadius: 24 }}>
          <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid rgba(26,23,38,0.08)' }}>
            <p className="display text-base font-bold">💧 Su İstatistikleri</p>
            <div className="flex items-center gap-2">
              {entries.length > 0 && (
                <button
                  onClick={() => setConfirmReset(true)}
                  className="btn-press text-xs font-bold px-3 py-1.5 rounded-full"
                  style={{ background: 'rgba(239,68,68,0.1)', color: '#cc4322', border: '1px solid rgba(239,68,68,0.25)' }}
                >
                  Sıfırla
                </button>
              )}
              <button onClick={onClose} aria-label="Kapat" className="ctrl btn-press w-8 h-8 rounded-full flex items-center justify-center text-sm">✕</button>
            </div>
          </div>

          {confirmReset && (
            <div className="px-5 py-4 animate-fade-up" style={{ borderBottom: '1px solid rgba(26,23,38,0.08)', background: 'rgba(239,68,68,0.05)' }}>
              <p className="text-sm font-semibold mb-3" style={{ color: '#1a1726' }}>Tüm su geçmişin silinecek, emin misin?</p>
              <div className="flex gap-2">
                <button
                  onClick={() => { onReset(); setConfirmReset(false) }}
                  className="btn-press flex-1 py-2 rounded-xl text-sm font-bold"
                  style={{ background: '#e2503f', color: '#fff5f2', boxShadow: '0 8px 18px -10px rgba(226,80,63,0.7)' }}
                >
                  Eminim, Sil
                </button>
                <button onClick={() => setConfirmReset(false)} className="ctrl btn-press flex-1 py-2 rounded-xl text-sm font-bold">Vazgeç</button>
              </div>
            </div>
          )}

          {/* Genel özet */}
          <div className="grid grid-cols-3 px-5 py-4 text-center" style={{ borderBottom: '1px solid rgba(26,23,38,0.08)' }}>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider ink-45 mb-1">Günlük Ort.</p>
              <p className="display text-lg font-bold tnum" style={{ color: '#1d4ed8' }}>{formatMl(globalAvg)}</p>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider ink-45 mb-1">En İyi Gün</p>
              <p className="display text-lg font-bold tnum" style={{ color: '#16803c' }}>{globalBest ? formatMl(globalBest.ml) : '--'}</p>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider ink-45 mb-1">Hedef Günü</p>
              <p className="display text-lg font-bold tnum" style={{ color: '#9a4d0a' }}>{goalDays}</p>
            </div>
          </div>

          {/* Sekmeler */}
          <div className="flex gap-1.5 px-5 pt-3">
            {([['day', 'Gün'], ['month', 'Ay'], ['year', 'Yıl']] as [StatsTab, string][]).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className="btn-press flex-1 text-xs font-bold py-2 rounded-xl transition-all"
                style={tab === key
                  ? { background: '#1d4ed8', color: '#eaf1ff' }
                  : { background: 'rgba(26,23,38,0.05)', color: 'rgba(26,23,38,0.5)' }}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="px-5 py-4 max-h-80 overflow-y-auto">
            {tab === 'day' && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <button onClick={() => shiftDay(-1)} className="ctrl btn-press w-7 h-7 rounded-full flex items-center justify-center text-xs">‹</button>
                  <p className="text-sm font-bold tnum">{formatShortDate(new Date(`${day}T12:00:00`))}</p>
                  <button onClick={() => shiftDay(1)} disabled={day >= todayStr()} className="ctrl btn-press w-7 h-7 rounded-full flex items-center justify-center text-xs disabled:opacity-30">›</button>
                </div>
                <p className="text-center display text-2xl font-black tnum mb-1" style={{ color: '#1d4ed8' }}>{formatLiters(dayTotal)}</p>
                <p className="text-center text-[11px] font-semibold ink-45 mb-4">
                  {dayTotal >= goalMl ? '🎉 Hedefe ulaşıldı' : `Hedefin %${Math.round((dayTotal / goalMl) * 100)}'i`}
                </p>
                {dayEntries.length === 0 ? (
                  <p className="text-sm text-center ink-45 py-4">Bu gün hiç su içilmemiş</p>
                ) : (
                  <div className="space-y-1.5">
                    {dayEntries.map((e) => (
                      <div key={e.id} className="flex items-center gap-2 text-sm py-1.5 px-2 rounded-lg" style={{ background: 'rgba(37,99,235,0.05)' }}>
                        <span className="ink-60 font-medium tnum flex-1">{e.time}</span>
                        <span className="display font-bold tnum" style={{ color: '#1d4ed8' }}>{formatMl(e.ml)}</span>
                        <button
                          onClick={() => onDeleteEntry(e.id)}
                          aria-label="Sil"
                          className="btn-press w-6 h-6 rounded-full flex items-center justify-center text-[10px]"
                          style={{ background: 'rgba(239,68,68,0.08)', color: '#cc4322' }}
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {tab === 'month' && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <button onClick={() => shiftMonth(-1)} className="ctrl btn-press w-7 h-7 rounded-full flex items-center justify-center text-xs">‹</button>
                  <p className="text-sm font-bold">{trMonthName(ym.month)} {ym.year}</p>
                  <button onClick={() => shiftMonth(1)} className="ctrl btn-press w-7 h-7 rounded-full flex items-center justify-center text-xs">›</button>
                </div>

                <div className="grid grid-cols-7 gap-1 mb-1">
                  {TR_DAY_SHORTS.map((d) => (
                    <div key={d} className="text-center text-[9px] ink-45 py-0.5 font-semibold">{d}</div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-1 mb-4">
                  {Array.from({ length: firstDayCol }).map((_, i) => <div key={`e${i}`} className="aspect-square" />)}
                  {Array.from({ length: daysInMonth }).map((_, i) => {
                    const dNum = i + 1
                    const key = `${ym.year}-${String(ym.month + 1).padStart(2, '0')}-${String(dNum).padStart(2, '0')}`
                    const ml = monthMap.get(key) ?? 0
                    return (
                      <div
                        key={dNum}
                        title={`${dNum} ${trMonthName(ym.month)}: ${formatMl(ml)}`}
                        className="aspect-square rounded-lg flex items-center justify-center"
                        style={{ background: intensity(ml, goalMl), boxShadow: 'inset 0 0 0 1px rgba(26,23,38,0.06)' }}
                      >
                        <span className="text-[9px] font-bold tnum" style={{ color: ml > goalMl * 0.5 ? '#eaf1ff' : 'rgba(26,23,38,0.5)' }}>{dNum}</span>
                      </div>
                    )
                  })}
                </div>

                <div className="grid grid-cols-3 text-center">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider ink-45 mb-1">Toplam</p>
                    <p className="display text-base font-bold tnum" style={{ color: '#1d4ed8' }}>{formatLiters(monthTotal)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider ink-45 mb-1">Ortalama</p>
                    <p className="display text-base font-bold tnum" style={{ color: '#1d4ed8' }}>{formatMl(monthAvg)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider ink-45 mb-1">En İyi Gün</p>
                    <p className="display text-base font-bold tnum" style={{ color: '#16803c' }}>{monthBest ? formatMl(monthBest.ml) : '--'}</p>
                  </div>
                </div>
              </div>
            )}

            {tab === 'year' && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <button onClick={() => setYear((y) => y - 1)} className="ctrl btn-press w-7 h-7 rounded-full flex items-center justify-center text-xs">‹</button>
                  <select
                    value={year}
                    onChange={(e) => setYear(Number(e.target.value))}
                    className="text-sm font-bold bg-transparent outline-none text-center"
                  >
                    {years.map((y) => <option key={y} value={y}>{y}</option>)}
                  </select>
                  <button onClick={() => setYear((y) => y + 1)} className="ctrl btn-press w-7 h-7 rounded-full flex items-center justify-center text-xs">›</button>
                </div>

                <div className="flex items-end gap-1.5 mb-4" style={{ height: 110 }}>
                  {yearMonths.map((m) => (
                    <div key={m.month} className="flex-1 flex flex-col items-center justify-end gap-1 h-full">
                      <div
                        className="w-full rounded-t-md soft-trans"
                        style={{
                          height: `${Math.max(3, (m.ml / maxMonthMl) * 100)}%`,
                          background: m.ml > 0 ? 'linear-gradient(180deg, #60a5fa, #1d4ed8)' : 'rgba(26,23,38,0.06)',
                        }}
                        title={`${m.label}: ${formatMl(m.ml)}`}
                      />
                      <span className="text-[8px] font-semibold ink-45">{m.label.slice(0, 3)}</span>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-2 text-center">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider ink-45 mb-1">Yıl Toplamı</p>
                    <p className="display text-base font-bold tnum" style={{ color: '#1d4ed8' }}>{formatLiters(yearTotal)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider ink-45 mb-1">Aylık Ortalama</p>
                    <p className="display text-base font-bold tnum" style={{ color: '#1d4ed8' }}>{formatLiters(Math.round(yearTotal / 12))}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

const PRESETS = [
  { ml: 200, label: 'Bardak' },
  { ml: 300, label: 'Büyük Bardak' },
  { ml: 500, label: 'Şişe' },
  { ml: 1000, label: 'Büyük Şişe' },
]
const GOAL_PRESETS = [2000, 2500, 3000, 4000]
const CUSTOM_CHIPS = [150, 250, 400, 750]

export default function WaterTracker() {
  const [entries, setEntries] = useState<WaterEntry[]>(() => storage.getWaterEntries())
  const [bottleMl, setBottleMl] = useState<number>(() => storage.getWaterBottleMl())
  const [goalMl, setGoalMl] = useState<number>(() => storage.getWaterGoalMl())
  const [statsOpen, setStatsOpen] = useState(false)
  const [goalOpen, setGoalOpen] = useState(false)
  const [customOpen, setCustomOpen] = useState(false)
  const [customMl, setCustomMl] = useState(250)
  const [pulseKey, setPulseKey] = useState(0)
  const [undo, setUndo] = useState<{ id: string; ml: number } | null>(null)
  const undoTimer = useRef<number | null>(null)

  useEffect(() => {
    const sync = () => setBottleMl(storage.getWaterBottleMl())
    window.addEventListener('focus', sync)
    return () => {
      window.removeEventListener('focus', sync)
      if (undoTimer.current != null) window.clearTimeout(undoTimer.current)
    }
  }, [])

  const today = todayStr()
  const todayTotal = dayTotalMl(entries, today)
  const todayEntries = entriesForDate(entries, today)
  const goalPct = Math.round((todayTotal / goalMl) * 100)
  const goalMet = todayTotal >= goalMl

  const addWater = (ml: number) => {
    const now = new Date()
    const entry: WaterEntry = {
      id: crypto.randomUUID(),
      date: today,
      time: `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`,
      ml,
      timestamp: now.toISOString(),
    }
    storage.addWaterEntry(entry)
    setEntries(storage.getWaterEntries())
    awardStandaloneBadges()
    setPulseKey((k) => k + 1)
    setUndo({ id: entry.id, ml })
    if (undoTimer.current != null) window.clearTimeout(undoTimer.current)
    undoTimer.current = window.setTimeout(() => setUndo(null), 5000)
  }

  const deleteEntry = (id: string) => {
    storage.deleteWaterEntry(id)
    setEntries(storage.getWaterEntries())
    setUndo((u) => (u?.id === id ? null : u))
  }

  const undoLast = () => {
    if (!undo) return
    deleteEntry(undo.id)
  }

  const updateGoal = (ml: number) => {
    const clamped = Math.max(500, Math.min(6000, ml))
    setGoalMl(clamped)
    storage.setWaterGoalMl(clamped)
  }

  return (
    <div className="relative min-h-full">
      <WaterFill ml={todayTotal} goalMl={goalMl} />
      {statsOpen && (
        <WaterStatsModal
          entries={entries}
          goalMl={goalMl}
          onClose={() => setStatsOpen(false)}
          onReset={() => { storage.clearWaterEntries(); setEntries([]) }}
          onDeleteEntry={deleteEntry}
        />
      )}

      <div
        className="relative z-10 max-w-sm mx-auto px-4 pt-3 pb-24 flex flex-col"
        style={{ minHeight: 'calc(100dvh - env(safe-area-inset-top))' }}
      >
        <BackBar title="Su Takibi" />

        {/* Büyük litre göstergesi + hedef durumu */}
        <div className="text-center mb-3">
          <p key={pulseKey} className="display font-black tnum animate-value-pop" style={{ fontSize: 42, lineHeight: 1.1, color: NAVY, textShadow: '0 2px 20px rgba(255,255,255,0.7)' }}>
            {formatLiters(todayTotal)}
          </p>
          <div className="flex items-center justify-center gap-2 mt-1.5">
            <button
              onClick={() => setGoalOpen((o) => !o)}
              className="btn-press text-[11px] font-bold px-3 py-1.5 rounded-full"
              style={{
                background: 'rgba(255,255,255,0.75)',
                color: NAVY,
                border: goalOpen ? '1px solid rgba(29,78,216,0.5)' : '1px solid rgba(12,42,92,0.15)',
                boxShadow: '0 4px 12px -6px rgba(12,42,92,0.25)',
              }}
            >
              🎯 Hedef {formatMl(goalMl)}
            </button>
            <span
              className="text-[11px] font-bold px-3 py-1.5 rounded-full"
              style={goalMet
                ? { background: 'rgba(34,197,94,0.16)', color: '#16803c', border: '1px solid rgba(34,197,94,0.35)' }
                : { background: 'rgba(255,255,255,0.75)', color: NAVY_60, border: '1px solid rgba(12,42,92,0.15)' }}
            >
              {goalMet ? 'Hedef tamam! 🎉' : `%${goalPct}`}
            </span>
          </div>
        </div>

        {/* Hedef düzenleme paneli */}
        {goalOpen && (
          <div className="glass g-sky animate-fade-up p-3 mb-3" style={{ borderRadius: 20 }}>
            <p className="text-xs font-bold mb-2">Günlük Hedef</p>
            <div className="flex items-center justify-center gap-4 mb-2">
              <button onClick={() => updateGoal(goalMl - 250)} className="ctrl btn-press w-9 h-9 rounded-full text-lg font-bold flex items-center justify-center">−</button>
              <p className="display text-2xl font-black tnum w-28 text-center" style={{ color: '#1d4ed8' }}>{formatMl(goalMl)}</p>
              <button onClick={() => updateGoal(goalMl + 250)} className="ctrl btn-press w-9 h-9 rounded-full text-lg font-bold flex items-center justify-center">+</button>
            </div>
            <div className="flex gap-1.5">
              {GOAL_PRESETS.map((g) => (
                <button
                  key={g}
                  onClick={() => updateGoal(g)}
                  className="btn-press flex-1 text-[11px] font-bold py-1.5 rounded-full"
                  style={goalMl === g
                    ? { background: '#1d4ed8', color: '#eaf1ff' }
                    : { background: 'rgba(26,23,38,0.05)', color: 'rgba(26,23,38,0.55)' }}
                >
                  {formatMl(g)}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Sayaç + hedef üstte sabit; geri kalan her şey kalan alanda dikeyde ortalanır */}
        <div className="flex-1 flex flex-col justify-center">

        {/* Hızlı ekleme */}
        <div className="grid grid-cols-2 gap-2 mb-2">
          {PRESETS.map((b) => (
            <button
              key={b.ml}
              onClick={() => addWater(b.ml)}
              className="btn-press tile-press glass glass-lift g-sky flex flex-col items-center justify-center py-2.5"
              style={{ borderRadius: 18 }}
            >
              <span className="display text-lg font-black tnum" style={{ color: '#1d4ed8' }}>{b.ml >= 1000 ? formatLiters(b.ml) : `${b.ml} ml`}</span>
              <span className="text-[10px] ink-60 font-semibold">{b.label}</span>
            </button>
          ))}
        </div>

        {/* Suluk + özel miktar */}
        <div className="flex gap-2 mb-2">
          <button
            onClick={() => addWater(bottleMl)}
            className="btn-press tile-press glass glass-lift g-sky flex-1 flex items-center justify-center gap-2 py-3"
            style={{ borderRadius: 18 }}
          >
            <span className="text-base leading-none">💧</span>
            <span className="text-sm font-bold">Suluk</span>
            <span className="text-xs ink-60 font-semibold">({formatMl(bottleMl)})</span>
          </button>
          <button
            onClick={() => setCustomOpen((o) => !o)}
            className="btn-press tile-press glass g-sky px-5 py-3 text-sm font-bold"
            style={{ borderRadius: 18, ...(customOpen ? { boxShadow: 'inset 0 0 0 2px rgba(29,78,216,0.45)' } : {}) }}
          >
            Özel
          </button>
        </div>

        {/* Özel miktar paneli */}
        {customOpen && (
          <div className="glass g-sky animate-fade-up p-3 mb-2" style={{ borderRadius: 20 }}>
            <div className="flex items-center justify-center gap-4 mb-2">
              <button onClick={() => setCustomMl((v) => Math.max(50, v - 50))} className="ctrl btn-press w-9 h-9 rounded-full text-lg font-bold flex items-center justify-center">−</button>
              <p className="display text-2xl font-black tnum w-28 text-center" style={{ color: '#1d4ed8' }}>{customMl} ml</p>
              <button onClick={() => setCustomMl((v) => Math.min(3000, v + 50))} className="ctrl btn-press w-9 h-9 rounded-full text-lg font-bold flex items-center justify-center">+</button>
            </div>
            <div className="flex gap-1.5 mb-3">
              {CUSTOM_CHIPS.map((c) => (
                <button
                  key={c}
                  onClick={() => setCustomMl(c)}
                  className="btn-press flex-1 text-[11px] font-bold py-1.5 rounded-full"
                  style={customMl === c
                    ? { background: '#1d4ed8', color: '#eaf1ff' }
                    : { background: 'rgba(26,23,38,0.05)', color: 'rgba(26,23,38,0.55)' }}
                >
                  {c} ml
                </button>
              ))}
            </div>
            <button
              onClick={() => { addWater(customMl); setCustomOpen(false) }}
              className="btn-ink btn-press w-full py-2.5 text-sm"
            >
              Ekle
            </button>
          </div>
        )}

        <p className="text-[10px] font-semibold text-center w-full mb-3" style={{ color: 'rgba(12,42,92,0.55)' }}>
          Suluk boyutu Profil → Su Takibi Ayarları'ndan değiştirilir
        </p>

        {/* Bugünkü kayıtlar */}
        {todayEntries.length > 0 && (
          <div className="glass g-neutral mb-3" style={{ borderRadius: 18 }}>
            <div className="flex items-center justify-between px-4 py-2" style={{ borderBottom: '1px solid rgba(26,23,38,0.07)' }}>
              <p className="text-xs font-bold">Bugün İçtiklerin</p>
              <span className="text-[11px] font-bold tnum ink-45">{todayEntries.length} kez</span>
            </div>
            <div className="px-3 py-1.5 max-h-28 overflow-y-auto">
              {[...todayEntries].reverse().map((e) => (
                <div key={e.id} className="flex items-center gap-2 text-sm py-1 px-1.5 rounded-lg">
                  <span className="ink-60 font-medium tnum flex-1">{e.time}</span>
                  <span className="display font-bold tnum" style={{ color: '#1d4ed8' }}>{formatMl(e.ml)}</span>
                  <button
                    onClick={() => deleteEntry(e.id)}
                    aria-label="Sil"
                    className="btn-press w-6 h-6 rounded-full flex items-center justify-center text-[10px]"
                    style={{ background: 'rgba(239,68,68,0.08)', color: '#cc4322' }}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* İstatistik butonu */}
        <button
          onClick={() => setStatsOpen(true)}
          className="btn-dark btn-press w-full py-2.5 text-sm flex items-center justify-center gap-2"
        >
          📊 Su İstatistikleri
        </button>

        </div>
      </div>

      {/* Geri al bildirimi */}
      {undo && (
        <div className="fixed left-0 right-0 z-40 flex justify-center pointer-events-none" style={{ bottom: 'calc(env(safe-area-inset-bottom) + 96px)' }}>
          <div className="glass g-neutral animate-fade-up pointer-events-auto flex items-center gap-3 pl-4 pr-2 py-2" style={{ borderRadius: 999 }}>
            <span className="text-xs font-semibold whitespace-nowrap">✓ {formatMl(undo.ml)} eklendi</span>
            <button
              onClick={undoLast}
              className="btn-press text-xs font-bold px-3 py-1.5 rounded-full whitespace-nowrap"
              style={{ background: 'rgba(29,78,216,0.1)', color: '#1d4ed8' }}
            >
              Geri Al
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
