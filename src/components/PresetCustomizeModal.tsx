import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useApp } from '../context/AppContext'
import { getCategoryColor } from '../utils/categories'
import { WEEKDAY_NAMES, WEEKDAY_FULL } from '../utils/habitSchedule'
import { LABEL_COLORS, TIME_OF_DAY_OPTS } from './AddHabitModal'
import type { PresetHabit } from './PresetHabitsModal'
import type { RecurrenceType, TimeOfDay } from '../types'

interface Props {
  preset: PresetHabit
  onClose: () => void
  onBack: () => void
}

// Slimmed-down create form for a preset habit — name/emoji/category are fixed
// (readonly); only Tekrar, Zaman Dilimi and Renk Etiketi can be adjusted.
export default function PresetCustomizeModal({ preset, onClose, onBack }: Props) {
  const { addHabit, categories } = useApp()
  const [isExiting, setIsExiting] = useState(false)
  const [recurrence, setRecurrence] = useState<RecurrenceType>('daily')
  const [recurrenceDays, setRecurrenceDays] = useState<number[]>([])
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>('any')
  // Default to a random palette color, picked once on mount
  const [labelColor, setLabelColor] = useState(() => LABEL_COLORS[Math.floor(Math.random() * LABEL_COLORS.length)].hex)

  const cat = categories.find((c) => c.id === preset.categoryId)
  const colors = getCategoryColor(cat?.color ?? '#6b7280')
  const weeklyDay = new Date().getDay()

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  const handleClose = () => {
    if (isExiting) return
    setIsExiting(true)
    setTimeout(onClose, 180)
  }

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') handleClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [isExiting])

  const toggleRecurrenceDay = (day: number) => {
    setRecurrenceDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    )
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const schedule = {
      recurrence,
      recurrenceDays: recurrence === 'custom' ? recurrenceDays : undefined,
      timeOfDay,
    }
    addHabit(preset.name, preset.emoji, preset.categoryId, 'single', undefined, schedule, labelColor || undefined)
    handleClose()
  }

  const label = 'text-[11px] font-bold uppercase tracking-[0.16em] ink-45 mb-2'

  return createPortal(
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className={`fixed inset-0 ${isExiting ? 'animate-fade-out' : 'animate-fade-in'}`}
        style={{ background: 'rgba(0,0,0,0.66)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)' }}
        onClick={handleClose}
      />

      <div
        className="relative flex min-h-full items-center justify-center p-4"
        onClick={(e) => e.target === e.currentTarget && handleClose()}
      >
        <div
          className={`glass g-neutral w-full max-w-md ${isExiting ? 'animate-fade-down' : 'animate-fade-up'}`}
          style={{ borderRadius: 28 }}
        >
          {/* Header */}
          <div className="flex items-center gap-3 px-5 py-4" style={{ borderBottom: '1px solid rgba(26,23,38,0.08)' }}>
            <button
              onClick={onBack}
              aria-label="Geri"
              className="ctrl btn-press w-8 h-8 rounded-full flex items-center justify-center text-sm flex-shrink-0"
            >
              ←
            </button>
            <h2 className="display text-lg font-bold flex-1" style={{ color: '#1a1726' }}>Alışkanlığı Özelleştir</h2>
            <button
              onClick={handleClose}
              aria-label="Kapat"
              className="ctrl btn-press w-8 h-8 rounded-full flex items-center justify-center text-sm flex-shrink-0"
            >
              ✕
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-5 space-y-5">
            {/* Read-only identity — emoji, name, category are fixed */}
            <div className="well rounded-2xl p-3.5 flex items-center gap-3">
              <span className="glass g-cream w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0">
                {preset.emoji}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold truncate" style={{ color: '#1a1726' }}>{preset.name}</p>
                {cat && (
                  <p className="text-[11px] font-semibold mt-0.5" style={{ color: colors.text }}>
                    {cat.emoji} {cat.name}
                  </p>
                )}
              </div>
              <span
                className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full flex-shrink-0"
                style={{ background: 'rgba(26,23,38,0.06)', color: 'rgba(26,23,38,0.45)' }}
              >
                Sabit
              </span>
            </div>

            {/* Recurrence */}
            <div>
              <p className={label}>Tekrar</p>
              <div className="grid grid-cols-2 gap-2">
                {([
                  { id: 'once'   as RecurrenceType, icon: '1️⃣', label: 'Sadece bugün' },
                  { id: 'daily'  as RecurrenceType, icon: '🔄', label: 'Günlük' },
                  { id: 'weekly' as RecurrenceType, icon: '📅', label: 'Haftalık' },
                  { id: 'custom' as RecurrenceType, icon: '🗓️', label: 'Belirli günler' },
                ]).map(({ id, icon, label: rLabel }) => {
                  const sel = recurrence === id
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setRecurrence(id)}
                      className="btn-press flex items-center gap-2 px-3 py-2.5 rounded-2xl text-left transition-all"
                      style={{
                        background: sel ? 'rgba(34,197,94,0.18)' : 'rgba(26,23,38,0.04)',
                        border: `1.5px solid ${sel ? 'rgba(34,197,94,0.55)' : 'rgba(26,23,38,0.08)'}`,
                      }}
                    >
                      <span className="text-base leading-none">{icon}</span>
                      <span className="text-xs font-semibold" style={{ color: sel ? '#16a34a' : 'rgba(26,23,38,0.72)' }}>{rLabel}</span>
                    </button>
                  )
                })}
              </div>

              {recurrence === 'weekly' && (
                <p className="mt-2 text-[11px] ink-45 text-center animate-fade-up">
                  Her <span style={{ color: '#16a34a', fontWeight: 700 }}>{WEEKDAY_FULL[weeklyDay]}</span> tekrarlanacak
                </p>
              )}

              {recurrence === 'custom' && (
                <div className="mt-3 animate-fade-up">
                  <div className="flex gap-1.5 flex-wrap">
                    {WEEKDAY_NAMES.map((name, idx) => {
                      const sel = recurrenceDays.includes(idx)
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => toggleRecurrenceDay(idx)}
                          className="btn-press flex-1 py-2 rounded-xl text-[11px] font-bold transition-all"
                          style={{
                            background: sel ? 'rgba(34,197,94,0.22)' : 'rgba(26,23,38,0.05)',
                            border: `1.5px solid ${sel ? 'rgba(34,197,94,0.6)' : 'rgba(26,23,38,0.1)'}`,
                            color: sel ? '#16a34a' : 'rgba(26,23,38,0.5)',
                            minWidth: 36,
                          }}
                        >
                          {name}
                        </button>
                      )
                    })}
                  </div>
                  {recurrenceDays.length === 0 && (
                    <p className="text-[11px] mt-1.5 text-center" style={{ color: 'rgba(239,122,90,0.8)' }}>
                      En az bir gün seç
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Time of day */}
            <div>
              <p className={label}>Zaman Dilimi</p>
              <div className="grid grid-cols-4 gap-2">
                {TIME_OF_DAY_OPTS.map(({ id, icon, label: tLabel }) => {
                  const sel = timeOfDay === id
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setTimeOfDay(id)}
                      className="btn-press flex flex-col items-center gap-1 py-2.5 px-1 rounded-2xl text-center transition-all"
                      style={{
                        background: sel ? 'rgba(245,158,11,0.16)' : 'rgba(26,23,38,0.04)',
                        border: `1.5px solid ${sel ? 'rgba(245,158,11,0.6)' : 'rgba(26,23,38,0.08)'}`,
                      }}
                    >
                      <span className="text-lg leading-none">{icon}</span>
                      <span className="text-[11px] font-bold" style={{ color: sel ? '#b45309' : 'rgba(26,23,38,0.6)' }}>{tLabel}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Label color */}
            <div>
              <p className={label}>Renk Etiketi</p>
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => setLabelColor('')}
                  className="btn-press w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                  title="Renksiz"
                  style={{
                    background: 'rgba(26,23,38,0.05)',
                    border: `2px solid ${!labelColor ? 'rgba(26,23,38,0.7)' : 'rgba(26,23,38,0.18)'}`,
                  }}
                >
                  <span style={{ fontSize: 14, color: 'rgba(26,23,38,0.4)' }}>✕</span>
                </button>
                {LABEL_COLORS.map(({ hex, name: cname }) => (
                  <button
                    key={hex}
                    type="button"
                    onClick={() => setLabelColor(hex)}
                    title={cname}
                    className="btn-press w-8 h-8 rounded-full flex-shrink-0"
                    style={{
                      background: hex,
                      border: `2.5px solid ${labelColor === hex ? '#fff' : 'transparent'}`,
                      boxShadow: labelColor === hex ? `0 0 0 1px rgba(0,0,0,0.4), 0 0 12px ${hex}88` : `0 0 8px ${hex}44`,
                      opacity: labelColor === hex ? 1 : 0.75,
                    }}
                  />
                ))}
              </div>
              {labelColor && (
                <p className="text-[11px] ink-45 mt-2">
                  Alışkanlık kutucuğu ortasından <span style={{ color: labelColor, fontWeight: 700 }}>{LABEL_COLORS.find(c => c.hex === labelColor)?.name ?? ''}</span> rengiyle parlayacak
                </p>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-1">
              <button type="button" onClick={handleClose} className="chip btn-press flex-1 py-3 text-sm">
                İptal
              </button>
              <button
                type="submit"
                disabled={recurrence === 'custom' && recurrenceDays.length === 0}
                className="btn-ink btn-press flex-1 py-3 text-sm"
              >
                Oluştur
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>,
    document.body,
  )
}
