import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useApp } from '../context/AppContext'
import { EMOJI_LIST, getCategoryColor, POMODORO_CATEGORY_IDS } from '../utils/categories'
import type { Habit, CompletionMode, RecurrenceType } from '../types'
import { getHabitMode, getHabitGoal } from '../types'
import { WEEKDAY_NAMES, WEEKDAY_FULL } from '../utils/habitSchedule'

const EMOJIS_PER_PAGE = 50  // 5 rows × 10 cols — fixed grid, no size change
const TOTAL_PAGES = Math.ceil(EMOJI_LIST.length / EMOJIS_PER_PAGE)

interface Props {
  onClose: () => void
  editHabit?: Habit
}

export default function AddHabitModal({ onClose, editHabit }: Props) {
  const { addHabit, editHabit: saveEdit, categories, addCustomCategory } = useApp()
  const [isExiting, setIsExiting] = useState(false)
  const [name, setName] = useState(editHabit?.name ?? '')
  const [emoji, setEmoji] = useState(editHabit?.emoji ?? '⭐')
  const [categoryId, setCategoryId] = useState(editHabit?.categoryId ?? 'diger')
  const [newCatName, setNewCatName] = useState('')
  const [newCatEmoji, setNewCatEmoji] = useState('🌟')
  const [showNewCat, setShowNewCat] = useState(false)
  const [emojiPage, setEmojiPage] = useState(0)
  const touchStartX = useRef(0)
  const [completionMode, setCompletionMode] = useState<CompletionMode>(
    editHabit ? getHabitMode(editHabit) : 'single'
  )
  const [completionGoal, setCompletionGoal] = useState(
    editHabit ? (getHabitGoal(editHabit) || 4) : 4
  )
  const [recurrence, setRecurrence] = useState<RecurrenceType>(
    editHabit?.recurrence ?? 'daily'
  )
  const [recurrenceDays, setRecurrenceDays] = useState<number[]>(
    editHabit?.recurrenceDays ?? []
  )
  const [useTimeWindow, setUseTimeWindow] = useState(!!editHabit?.timeWindow)
  const [windowStart, setWindowStart] = useState(editHabit?.timeWindow?.start ?? '09:00')
  const [windowEnd, setWindowEnd] = useState(editHabit?.timeWindow?.end ?? '22:00')

  // The weekday on which a 'weekly' habit will repeat (based on today for new, or createdDate for edit)
  const weeklyDay = editHabit?.createdDate
    ? new Date(editHabit.createdDate + 'T12:00:00').getDay()
    : new Date().getDay()

  const toggleRecurrenceDay = (day: number) => {
    setRecurrenceDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    )
  }

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
  }, [onClose, isExiting])

  const rawSlice = EMOJI_LIST.slice(emojiPage * EMOJIS_PER_PAGE, (emojiPage + 1) * EMOJIS_PER_PAGE)
  const pageEmojis: (string | null)[] = [...rawSlice]
  while (pageEmojis.length < EMOJIS_PER_PAGE) pageEmojis.push(null)

  const supportsPomodoro = POMODORO_CATEGORY_IDS.has(categoryId)

  // Reset pomodoro mode if category no longer supports it
  useEffect(() => {
    if (!supportsPomodoro && completionMode === 'pomodoro') setCompletionMode('single')
  }, [supportsPomodoro, completionMode])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    const effectiveMode: CompletionMode = completionMode === 'pomodoro' && !supportsPomodoro ? 'single' : completionMode
    const goal = effectiveMode !== 'single' ? Math.max(1, completionGoal) : undefined
    const schedule = {
      recurrence,
      recurrenceDays: recurrence === 'custom' ? recurrenceDays : undefined,
      timeWindow: useTimeWindow ? { start: windowStart, end: windowEnd } : undefined,
    }
    if (editHabit) saveEdit(editHabit.id, name, emoji, categoryId, effectiveMode, goal, schedule)
    else addHabit(name, emoji, categoryId, effectiveMode, goal, schedule)
    handleClose()
  }

  const handleAddCategory = () => {
    if (!newCatName.trim()) return
    addCustomCategory({
      id: `custom_${Date.now()}`,
      name: newCatName.trim(),
      emoji: newCatEmoji,
      color: '#8b5cf6',
      isCustom: true,
    })
    setShowNewCat(false)
    setNewCatName('')
  }

  const label = 'text-[11px] font-bold uppercase tracking-[0.16em] ink-45 mb-2'

  return createPortal(
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop — fixed so it doesn't scroll with the overlay */}
      <div
        className={`fixed inset-0 ${isExiting ? 'animate-fade-out' : 'animate-fade-in'}`}
        style={{ background: 'rgba(0,0,0,0.66)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)' }}
        onClick={handleClose}
      />

      {/* Centering wrapper — scrolls when card is taller than viewport */}
      <div
        className="relative flex min-h-full items-center justify-center p-4"
        onClick={(e) => e.target === e.currentTarget && handleClose()}
      >
        {/* Modal card — dark obsidian tile */}
        <div
          className={`glass g-neutral w-full max-w-md ${isExiting ? 'animate-fade-down' : 'animate-fade-up'}`}
          style={{ borderRadius: 28 }}
        >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <h2 className="display text-lg font-bold">
            {editHabit ? 'Alışkanlığı Düzenle' : 'Yeni Alışkanlık'}
          </h2>
          <button
            onClick={handleClose}
            aria-label="Kapat"
            className="ctrl btn-press w-8 h-8 rounded-full flex items-center justify-center text-sm"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-5">
          {/* Emoji preview + picker */}
          <div>
            <p className={label}>Emoji</p>
            {/* Emoji preview */}
            <div className="glass g-cream w-12 h-12 rounded-2xl flex items-center justify-center text-2xl mb-3">
              {emoji}
            </div>

            {/* Page navigation */}
            <div className="flex items-center justify-between mb-2">
              <button
                type="button"
                onClick={() => setEmojiPage(p => Math.max(0, p - 1))}
                disabled={emojiPage === 0}
                className="btn-press flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-semibold"
                style={{
                  background: emojiPage === 0 ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.10)',
                  color: emojiPage === 0 ? 'rgba(255,255,255,0.2)' : 'rgba(241,245,245,0.85)',
                }}
              >
                ← Geri
              </button>

              <div className="flex items-center gap-1.5">
                {Array.from({ length: TOTAL_PAGES }).map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setEmojiPage(i)}
                    aria-label={`Emoji sayfası ${i + 1}`}
                    className="rounded-full transition-all"
                    style={{
                      width: i === emojiPage ? 22 : 7,
                      height: 7,
                      background: i === emojiPage ? 'rgb(34,197,94)' : 'rgba(255,255,255,0.2)',
                      boxShadow: i === emojiPage ? '0 0 8px rgba(34,197,94,0.6)' : 'none',
                    }}
                  />
                ))}
              </div>

              <button
                type="button"
                onClick={() => setEmojiPage(p => Math.min(TOTAL_PAGES - 1, p + 1))}
                disabled={emojiPage === TOTAL_PAGES - 1}
                className="btn-press flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-semibold"
                style={{
                  background: emojiPage === TOTAL_PAGES - 1 ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.10)',
                  color: emojiPage === TOTAL_PAGES - 1 ? 'rgba(255,255,255,0.2)' : 'rgba(241,245,245,0.85)',
                }}
              >
                İleri →
              </button>
            </div>

            {/* Emoji grid — swipe on mobile */}
            <div
              className="well grid grid-cols-10 gap-1 rounded-2xl p-2"
              style={{ minHeight: '188px', touchAction: 'pan-y' }}
              onTouchStart={(e) => { touchStartX.current = e.touches[0].clientX }}
              onTouchEnd={(e) => {
                const dx = e.changedTouches[0].clientX - touchStartX.current
                if (dx < -50) setEmojiPage(p => Math.min(TOTAL_PAGES - 1, p + 1))
                else if (dx > 50) setEmojiPage(p => Math.max(0, p - 1))
              }}
            >
              {pageEmojis.map((e, idx) =>
                e ? (
                  <button
                    key={`${emojiPage}-${idx}`}
                    type="button"
                    onClick={() => setEmoji(e)}
                    className="btn-press w-8 h-8 flex items-center justify-center text-[18px] rounded-xl transition-all"
                    style={emoji === e ? { background: 'rgba(34,197,94,0.22)', boxShadow: '0 0 0 1.5px rgba(34,197,94,0.7)' } : undefined}
                  >
                    {e}
                  </button>
                ) : (
                  <div key={`empty-${idx}`} className="w-8 h-8" />
                ),
              )}
            </div>
          </div>

          {/* Name input */}
          <div>
            <p className={label}>Ad</p>
            <input
              autoFocus={!editHabit}
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Örn: Sabah koşusu"
              className="frost-input"
            />
          </div>

          {/* Category */}
          <div>
            <p className={label}>Kategori</p>
            <div className="grid grid-cols-3 gap-2">
              {categories.map((cat) => {
                const c = getCategoryColor(cat.color)
                const sel = categoryId === cat.id
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategoryId(cat.id)}
                    className="btn-press flex items-center gap-1.5 px-2.5 py-2 rounded-xl text-xs font-semibold transition-all text-left"
                    style={{
                      background: sel ? `${c.text}22` : 'rgba(255,255,255,0.05)',
                      boxShadow: sel ? `inset 0 0 0 1.5px ${c.text}` : 'inset 0 0 0 1px rgba(255,255,255,0.08)',
                      color: sel ? c.text : 'rgba(232,237,238,0.6)',
                    }}
                  >
                    <span>{cat.emoji}</span>
                    <span className="truncate">{cat.name}</span>
                  </button>
                )
              })}
            </div>

            {showNewCat && (
              <div className="well mt-3 p-3 rounded-2xl space-y-2 animate-fade-up">
                <p className="text-xs font-bold ink-60">Yeni kategori</p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newCatEmoji}
                    onChange={(e) => setNewCatEmoji(e.target.value)}
                    className="frost-input text-center"
                    style={{ width: 48, flexShrink: 0 }}
                    maxLength={2}
                  />
                  <input
                    type="text"
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                    placeholder="Kategori adı"
                    className="frost-input flex-1"
                  />
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={handleAddCategory} className="btn-ink btn-press flex-1 py-2 rounded-xl text-xs">
                    Ekle
                  </button>
                  <button type="button" onClick={() => setShowNewCat(false)} className="chip btn-press flex-1 py-2 text-xs">
                    İptal
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Completion Mode */}
          <div>
            <p className={label}>Tamamlama Modu</p>
            <div className={`grid gap-2 ${supportsPomodoro ? 'grid-cols-3' : 'grid-cols-2'}`}>
              {([
                { id: 'single' as CompletionMode, icon: '✓', label: 'Tek', desc: 'Bir kez tamamla' },
                { id: 'multi' as CompletionMode, icon: '🔁', label: 'Sayaç', desc: 'Hedef say' },
                ...(supportsPomodoro ? [{ id: 'pomodoro' as CompletionMode, icon: '🍅', label: 'Pomodoro', desc: 'Odak seansı' }] : []),
              ]).map(({ id, icon, label: mLabel, desc }) => {
                const sel = completionMode === id
                const colors = id === 'pomodoro'
                  ? { bg: 'rgba(225,90,60,0.18)', border: 'rgba(225,90,60,0.55)', text: '#f08a6a' }
                  : id === 'multi'
                    ? { bg: 'rgba(59,130,246,0.18)', border: 'rgba(59,130,246,0.55)', text: '#93c5fd' }
                    : { bg: 'rgba(34,197,94,0.18)', border: 'rgba(34,197,94,0.55)', text: '#6ee79f' }
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setCompletionMode(id)}
                    className="btn-press flex flex-col items-center gap-1 py-3 px-2 rounded-2xl text-center transition-all"
                    style={{
                      background: sel ? colors.bg : 'rgba(255,255,255,0.04)',
                      border: `1.5px solid ${sel ? colors.border : 'rgba(255,255,255,0.08)'}`,
                    }}
                  >
                    <span className="text-xl leading-none">{icon}</span>
                    <span className="text-xs font-bold" style={{ color: sel ? colors.text : 'rgba(232,237,238,0.75)' }}>{mLabel}</span>
                    <span className="text-[10px]" style={{ color: 'rgba(232,237,238,0.38)' }}>{desc}</span>
                  </button>
                )
              })}
            </div>

            {/* Goal input for multi or pomodoro */}
            {completionMode !== 'single' && (
              <div className="mt-3 animate-fade-up">
                <p className="text-[11px] font-bold uppercase tracking-[0.16em] ink-45 mb-2">
                  {completionMode === 'pomodoro' ? 'Hedef Pomodoro Sayısı' : 'Hedef Tamamlama Sayısı'}
                </p>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setCompletionGoal((v) => Math.max(1, v - 1))}
                    className="btn-press w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold ctrl"
                  >−</button>
                  <div
                    className="flex-1 text-center text-xl font-bold py-2 rounded-xl"
                    style={completionMode === 'pomodoro'
                      ? { background: 'rgba(225,90,60,0.12)', color: '#f08a6a' }
                      : { background: 'rgba(59,130,246,0.12)', color: '#93c5fd' }}
                  >
                    {completionGoal}
                    <span className="text-sm font-medium opacity-70 ml-1">
                      {completionMode === 'pomodoro' ? 'pomodoro' : 'kez'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setCompletionGoal((v) => Math.min(20, v + 1))}
                    className="btn-press w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold ctrl"
                  >+</button>
                </div>
                <p className="text-[11px] ink-45 mt-2 text-center">
                  {completionMode === 'pomodoro'
                    ? 'Hedefe ulaşınca otomatik tamamlanır · Fazlası 1.5× XP'
                    : `Hedefe ulaşınca tamamlanır · Maks. ${completionGoal * 2} kez`}
                </p>
              </div>
            )}
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
              ] as { id: RecurrenceType; icon: string; label: string }[]).map(({ id, icon, label: rLabel }) => {
                const sel = recurrence === id
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setRecurrence(id)}
                    className="btn-press flex items-center gap-2 px-3 py-2.5 rounded-2xl text-left transition-all"
                    style={{
                      background: sel ? 'rgba(34,197,94,0.18)' : 'rgba(255,255,255,0.04)',
                      border: `1.5px solid ${sel ? 'rgba(34,197,94,0.55)' : 'rgba(255,255,255,0.08)'}`,
                    }}
                  >
                    <span className="text-base leading-none">{icon}</span>
                    <span className="text-xs font-semibold" style={{ color: sel ? '#6ee79f' : 'rgba(232,237,238,0.75)' }}>{rLabel}</span>
                  </button>
                )
              })}
            </div>

            {/* Weekly: show which day */}
            {recurrence === 'weekly' && (
              <p className="mt-2 text-[11px] ink-45 text-center animate-fade-up">
                Her <span style={{ color: '#6ee79f', fontWeight: 700 }}>{WEEKDAY_FULL[weeklyDay]}</span> tekrarlanacak
              </p>
            )}

            {/* Custom: day picker */}
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
                          background: sel ? 'rgba(34,197,94,0.22)' : 'rgba(255,255,255,0.05)',
                          border: `1.5px solid ${sel ? 'rgba(34,197,94,0.6)' : 'rgba(255,255,255,0.1)'}`,
                          color: sel ? '#6ee79f' : 'rgba(232,237,238,0.5)',
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

          {/* Time window */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className={label} style={{ marginBottom: 0 }}>Saat aralığı</p>
              <button
                type="button"
                onClick={() => setUseTimeWindow((v) => !v)}
                className="btn-press flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
                style={{
                  background: useTimeWindow ? 'rgba(34,197,94,0.18)' : 'rgba(255,255,255,0.06)',
                  border: `1px solid ${useTimeWindow ? 'rgba(34,197,94,0.45)' : 'rgba(255,255,255,0.1)'}`,
                  color: useTimeWindow ? '#6ee79f' : 'rgba(232,237,238,0.5)',
                }}
              >
                <span
                  className="w-3.5 h-3.5 rounded-full transition-all flex-shrink-0"
                  style={{ background: useTimeWindow ? 'rgb(34,197,94)' : 'rgba(255,255,255,0.2)' }}
                />
                {useTimeWindow ? 'Açık' : 'Kapalı'}
              </button>
            </div>

            {useTimeWindow && (
              <div className="animate-fade-up">
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <p className="text-[10px] font-bold uppercase tracking-wider ink-45 mb-1.5">Başlangıç</p>
                    <input
                      type="time"
                      value={windowStart}
                      onChange={(e) => setWindowStart(e.target.value)}
                      className="frost-input text-center font-mono"
                    />
                  </div>
                  <span className="text-lg ink-45 mt-4 flex-shrink-0">→</span>
                  <div className="flex-1">
                    <p className="text-[10px] font-bold uppercase tracking-wider ink-45 mb-1.5">Bitiş</p>
                    <input
                      type="time"
                      value={windowEnd}
                      onChange={(e) => setWindowEnd(e.target.value)}
                      className="frost-input text-center font-mono"
                    />
                  </div>
                </div>
                <p className="text-[11px] ink-45 mt-2 text-center">
                  Bitiş saati geçince tamamlanmamış alışkanlık "Yapılmamış" bölümüne taşınır
                </p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={handleClose} className="chip btn-press flex-1 py-3 text-sm">
              İptal
            </button>
            <button type="submit" disabled={!name.trim()} className="btn-ink btn-press flex-1 py-3 text-sm">
              {editHabit ? 'Kaydet' : 'Oluştur'}
            </button>
          </div>
        </form>
        </div>
      </div>
    </div>,
    document.body,
  )
}
