import { useEffect, useMemo, useState } from 'react'
import BackBar from '../components/BackBar'
import { storage } from '../utils/storage'
import { todayStr, formatShortDate } from '../utils/date'
import type { WakeRecord } from '../types'

function timeToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

function minutesToTime(mins: number): string {
  const h = Math.floor(mins / 60) % 24
  const m = Math.round(mins % 60)
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

export function averageWakeTime(records: WakeRecord[]): string | null {
  if (records.length === 0) return null
  const avg = records.reduce((a, r) => a + timeToMinutes(r.time), 0) / records.length
  return minutesToTime(avg)
}

export function earliestWakeTime(records: WakeRecord[]): string | null {
  if (records.length === 0) return null
  return records.reduce((a, r) => (timeToMinutes(r.time) < timeToMinutes(a) ? r.time : a), records[0].time)
}

export function latestWakeTime(records: WakeRecord[]): string | null {
  if (records.length === 0) return null
  return records.reduce((a, r) => (timeToMinutes(r.time) > timeToMinutes(a) ? r.time : a), records[0].time)
}

/* ── Gece→gündüz geçiş animasyonu ── */
function SunriseOverlay() {
  const stars = useMemo(() =>
    Array.from({ length: 16 }, (_, i) => ({
      left: `${(i * 61) % 96 + 2}%`,
      top: `${(i * 37) % 42 + 3}%`,
      size: 2 + (i % 3),
      delay: `${(i % 5) * 0.12}s`,
    })), [])
  return (
    <div className="wake-overlay">
      {stars.map((s, i) => (
        <span key={i} className="wake-star" style={{ left: s.left, top: s.top, width: s.size, height: s.size, animationDelay: s.delay }} />
      ))}
      <div className="wake-sun" />
      <div className="wake-greet">
        <p className="display text-4xl font-black" style={{ color: '#fff8e7', textShadow: '0 2px 30px rgba(251,191,36,0.8)' }}>
          Günaydın ☀️
        </p>
        <p className="text-sm font-semibold mt-2" style={{ color: 'rgba(255,248,231,0.85)' }}>
          Yeni bir gün seni bekliyor
        </p>
      </div>
    </div>
  )
}

/* ── "Kaçta uyanıyorum?" istatistik modalı ── */
function WakeStatsModal({ records, goal, onClose, onReset }: { records: WakeRecord[]; goal: string | null; onClose: () => void; onReset: () => void }) {
  const [confirmReset, setConfirmReset] = useState(false)
  const sorted = [...records].sort((a, b) => b.date.localeCompare(a.date))
  const avg = averageWakeTime(records)
  const goalMins = goal ? timeToMinutes(goal) : null
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 animate-fade-in" style={{ background: 'rgba(26,23,38,0.45)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)' }} onClick={onClose} />
      <div className="relative min-h-full flex items-center justify-center p-4">
        <div className="glass g-neutral animate-pop w-full max-w-sm" style={{ borderRadius: 24 }}>
          <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid rgba(26,23,38,0.08)' }}>
            <p className="display text-base font-bold">Kaçta uyanıyorum?</p>
            <div className="flex items-center gap-2">
              {records.length > 0 && (
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
              <p className="text-sm font-semibold mb-3" style={{ color: '#1a1726' }}>
                İstatistiklerin sıfırlanacak, emin misin?
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => { onReset(); setConfirmReset(false) }}
                  className="btn-press flex-1 py-2 rounded-xl text-sm font-bold"
                  style={{ background: '#e2503f', color: '#fff5f2', boxShadow: '0 8px 18px -10px rgba(226,80,63,0.7)' }}
                >
                  Eminim, Sil
                </button>
                <button
                  onClick={() => setConfirmReset(false)}
                  className="ctrl btn-press flex-1 py-2 rounded-xl text-sm font-bold"
                >
                  Vazgeç
                </button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-3 px-5 py-4 text-center" style={{ borderBottom: '1px solid rgba(26,23,38,0.08)' }}>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider ink-45 mb-1">Ortalama</p>
              <p className="display text-lg font-bold tnum" style={{ color: '#b45309' }}>{avg ?? '--'}</p>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider ink-45 mb-1">En erken</p>
              <p className="display text-lg font-bold tnum" style={{ color: '#16803c' }}>{earliestWakeTime(records) ?? '--'}</p>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider ink-45 mb-1">En geç</p>
              <p className="display text-lg font-bold tnum" style={{ color: '#cc4322' }}>{latestWakeTime(records) ?? '--'}</p>
            </div>
          </div>

          <div className="px-5 py-4 max-h-64 overflow-y-auto">
            {sorted.length === 0 ? (
              <p className="text-sm text-center ink-45 py-4">Henüz kayıt yok — yarın sabah ilk "Uyandım"ına bas!</p>
            ) : (
              <div className="space-y-1.5">
                {sorted.slice(0, 14).map((r) => {
                  const diff = goalMins != null ? timeToMinutes(r.time) - goalMins : null
                  return (
                    <div key={r.date} className="flex items-center justify-between text-sm py-1">
                      <span className="ink-60 font-medium">{formatShortDate(new Date(r.date + 'T12:00:00'))}</span>
                      <span className="flex items-center gap-2">
                        <span className="display font-bold tnum">{r.time}</span>
                        {diff != null && (
                          <span className="text-[11px] font-bold tnum px-1.5 py-0.5 rounded-full" style={diff <= 0
                            ? { background: 'rgba(34,197,94,0.15)', color: '#16803c' }
                            : { background: 'rgba(239,68,68,0.12)', color: '#cc4322' }}>
                            {diff <= 0 ? `${Math.abs(diff)}dk erken` : `${diff}dk geç`}
                          </span>
                        )}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function WakeUp() {
  const [records, setRecords] = useState<WakeRecord[]>(() => storage.getWakeRecords())
  const [goal, setGoal] = useState<string | null>(() => storage.getWakeGoal())
  const [anim, setAnim] = useState(false)
  const [statsOpen, setStatsOpen] = useState(false)
  const [, setMinuteTick] = useState(0)

  // Gün değişince buton kendiliğinden tekrar aktifleşsin
  useEffect(() => {
    const id = setInterval(() => setMinuteTick((t) => t + 1), 60_000)
    return () => clearInterval(id)
  }, [])

  const today = todayStr()
  const todayRecord = records.find((r) => r.date === today)
  const avg = averageWakeTime(records)

  const wakeUp = () => {
    if (todayRecord) return
    const now = new Date()
    const record: WakeRecord = {
      date: today,
      time: `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`,
    }
    storage.addWakeRecord(record)
    setRecords(storage.getWakeRecords())
    setAnim(true)
    setTimeout(() => setAnim(false), 3600)
  }

  const changeGoal = (value: string) => {
    if (!value) return
    setGoal(value)
    storage.setWakeGoal(value)
  }

  return (
    <div className="max-w-sm mx-auto px-4 pt-6 pb-40">
      <BackBar />
      {anim && <SunriseOverlay />}
      {statsOpen && (
        <WakeStatsModal
          records={records}
          goal={goal}
          onClose={() => setStatsOpen(false)}
          onReset={() => { storage.clearWakeRecords(); setRecords([]) }}
        />
      )}

      {/* Header */}
      <div className="mb-8 text-center">
        <h1 className="display text-2xl font-extrabold tracking-tight" style={{ color: '#1a1726' }}>Uyandım</h1>
        <p className="text-xs mt-1" style={{ color: 'rgba(26,23,38,0.45)' }}>Güne merhaba demenin en kısa yolu</p>
      </div>

      {/* Büyük Uyandım butonu */}
      <div className="flex justify-center mb-8">
        <button
          onClick={wakeUp}
          disabled={!!todayRecord}
          className={`btn-press flex-shrink-0 flex flex-col items-center justify-center rounded-full ${todayRecord ? '' : 'flame-glow'}`}
          style={{
            width: 200,
            height: 200,
            background: todayRecord
              ? 'linear-gradient(160deg, #e7f4d8, #cfe7af)'
              : 'linear-gradient(160deg, #fbbf24, #f97316)',
            border: todayRecord ? '3px solid rgba(99,153,34,0.4)' : '3px solid rgba(255,255,255,0.5)',
            boxShadow: todayRecord
              ? '0 12px 30px -12px rgba(99,153,34,0.4)'
              : '0 18px 44px -14px rgba(249,115,22,0.65)',
            cursor: todayRecord ? 'default' : 'pointer',
          }}
        >
          {todayRecord ? (
            <>
              <span className="display text-lg font-black" style={{ color: '#3b6d11' }}>Uyandın!</span>
              <span className="display text-3xl font-black tnum mt-1" style={{ color: '#3b6d11' }}>{todayRecord.time}</span>
              <span className="text-[10px] font-bold mt-2" style={{ color: 'rgba(59,109,17,0.6)' }}>yarın tekrar görüşürüz</span>
            </>
          ) : (
            <span className="display text-3xl font-black" style={{ color: '#2a1402' }}>Uyandım</span>
          )}
        </button>
      </div>

      {/* Ortalama uyanma saati — süslü kutu */}
      <div
        className="relative overflow-hidden rounded-3xl px-5 py-4 mb-3 text-center"
        style={{
          background: 'linear-gradient(135deg, #fdf3dd 0%, #faecd6 55%, #fbe3c9 100%)',
          border: '1.5px solid #f3dcb0',
          boxShadow: '0 10px 26px -14px rgba(249,115,22,0.35), inset 0 1px 0 rgba(255,255,255,0.8)',
        }}
      >
        <span className="absolute text-lg" style={{ top: 8, left: 14, opacity: 0.55 }}>✨</span>
        <span className="absolute text-lg" style={{ bottom: 8, right: 14, opacity: 0.55 }}>✨</span>
        <p className="text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: '#b87520' }}>Ortalama uyanma saatin</p>
        <p className="display text-3xl font-black tnum mt-1" style={{ color: '#9a4d0a' }}>
          {avg ?? '--:--'}
        </p>
        {records.length > 0 && (
          <p className="text-[10px] font-semibold mt-0.5" style={{ color: 'rgba(184,117,32,0.75)' }}>{records.length} günlük kayda göre</p>
        )}
      </div>

      {/* Hedef uyanma saati */}
      <label
        className="flex items-center justify-between rounded-2xl px-4 py-3.5 mb-3 cursor-pointer"
        style={{ background: '#ffffff', border: '1px solid rgba(26,23,38,0.09)', boxShadow: '0 1px 2px rgba(26,23,38,0.04)' }}
      >
        <span className="flex items-center gap-2.5">
          <span className="text-lg">🎯</span>
          <span className="text-sm font-bold" style={{ color: '#1a1726' }}>Hedef uyanma saati</span>
        </span>
        <span className="relative flex items-center">
          {!goal && (
            <span
              className="text-xs font-bold px-3.5 py-1.5 rounded-full pointer-events-none"
              style={{ background: '#faecd6', color: '#9a4d0a', boxShadow: 'inset 0 0 0 1px rgba(245,158,11,0.35)' }}
            >
              Seç
            </span>
          )}
          <input
            type="time"
            value={goal ?? ''}
            onChange={(e) => changeGoal(e.target.value)}
            className={`display text-base font-bold tnum bg-transparent outline-none text-right ${goal ? '' : 'absolute inset-0 opacity-0 w-full cursor-pointer'}`}
            style={{ color: '#9a4d0a', border: 'none' }}
          />
        </span>
      </label>

      {/* Kaçta uyanıyorum? */}
      <button
        onClick={() => setStatsOpen(true)}
        className="btn-dark btn-press w-full py-3 text-sm flex items-center justify-center gap-2"
      >
        🕐 Kaçta uyanıyorum?
      </button>
    </div>
  )
}
