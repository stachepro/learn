import { useState, useEffect } from 'react'
import { useApp } from '../context/AppContext'
import { EMOJI_LIST, getCategoryColor } from '../utils/categories'
import type { Habit } from '../types'

const EMOJIS_PER_PAGE = 50  // 5 rows × 10 cols — fixed grid, no size change
const TOTAL_PAGES = Math.ceil(EMOJI_LIST.length / EMOJIS_PER_PAGE)

interface Props {
  onClose: () => void
  editHabit?: Habit
}

export default function AddHabitModal({ onClose, editHabit }: Props) {
  const { addHabit, editHabit: saveEdit, categories, addCustomCategory } = useApp()
  const [name, setName] = useState(editHabit?.name ?? '')
  const [emoji, setEmoji] = useState(editHabit?.emoji ?? '⭐')
  const [categoryId, setCategoryId] = useState(editHabit?.categoryId ?? 'diger')
  const [newCatName, setNewCatName] = useState('')
  const [newCatEmoji, setNewCatEmoji] = useState('🌟')
  const [showNewCat, setShowNewCat] = useState(false)
  const [emojiPage, setEmojiPage] = useState(0)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  // Always fill to EMOJIS_PER_PAGE so grid height never changes
  const rawSlice = EMOJI_LIST.slice(emojiPage * EMOJIS_PER_PAGE, (emojiPage + 1) * EMOJIS_PER_PAGE)
  const pageEmojis: (string | null)[] = [...rawSlice]
  while (pageEmojis.length < EMOJIS_PER_PAGE) pageEmojis.push(null) // padding

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    if (editHabit) saveEdit(editHabit.id, name, emoji, categoryId)
    else addHabit(name, emoji, categoryId)
    onClose()
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

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0"
        style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}
      />

      {/* Modal card */}
      <div
        className="relative w-full max-w-md rounded-3xl animate-fade-up overflow-hidden"
        style={{
          background: 'rgba(8, 20, 78, 0.90)',
          backdropFilter: 'blur(36px) saturate(200%)',
          WebkitBackdropFilter: 'blur(36px) saturate(200%)',
          border: '1px solid rgba(70,135,255,0.32)',
          boxShadow: [
            '0 32px 80px rgba(0,8,70,0.65)',
            '0 8px 24px rgba(0,15,90,0.45)',
            'inset 0 2px 0 rgba(130,190,255,0.25)',
            'inset 0 -2px 0 rgba(0,0,70,0.5)',
          ].join(', '),
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}
        >
          <h2 className="text-[15px] font-semibold text-txt">
            {editHabit ? 'Alışkanlığı Düzenle' : 'Yeni Alışkanlık'}
          </h2>
          <button
            onClick={onClose}
            className="btn-press w-7 h-7 rounded-full flex items-center justify-center text-subtle hover:text-txt transition-colors text-sm"
            style={{ background: 'rgba(255,255,255,0.07)' }}
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-5 overflow-y-auto max-h-[80vh]">
          {/* Emoji preview + picker */}
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest mb-3" style={{ color: 'rgba(255,255,255,0.35)' }}>
              Emoji
            </p>
            <div className="flex items-center gap-3 mb-3">
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
                style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}
              >
                {emoji}
              </div>
              <div className="flex gap-1.5">
                {Array.from({ length: TOTAL_PAGES }).map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setEmojiPage(i)}
                    className="btn-press h-1.5 rounded-full transition-all"
                    style={{
                      width: i === emojiPage ? 20 : 6,
                      background: i === emojiPage ? '#6366f1' : 'rgba(255,255,255,0.2)',
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Fixed-size grid — never changes height */}
            <div
              className="grid grid-cols-10 gap-1 rounded-2xl p-2"
              style={{ background: 'rgba(255,255,255,0.04)', minHeight: '188px' }}
            >
              {pageEmojis.map((e, idx) =>
                e ? (
                  <button
                    key={`${emojiPage}-${idx}`}
                    type="button"
                    onClick={() => setEmoji(e)}
                    className="btn-press w-8 h-8 flex items-center justify-center text-[18px] rounded-xl transition-all"
                    style={emoji === e ? {
                      background: 'rgba(99,102,241,0.3)',
                      boxShadow: '0 0 0 1px rgba(99,102,241,0.6)',
                    } : {}}
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
            <p className="text-[11px] font-semibold uppercase tracking-widest mb-2" style={{ color: 'rgba(255,255,255,0.35)' }}>
              Ad
            </p>
            <input
              autoFocus={!editHabit}
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Örn: Sabah koşusu"
              className="glass-input"
            />
          </div>

          {/* Category */}
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest mb-2" style={{ color: 'rgba(255,255,255,0.35)' }}>
              Kategori
            </p>
            <div className="grid grid-cols-3 gap-2">
              {categories.map((cat) => {
                const c = getCategoryColor(cat.color)
                const sel = categoryId === cat.id
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategoryId(cat.id)}
                    className="btn-press flex items-center gap-1.5 px-2.5 py-2 rounded-xl text-xs font-medium transition-all text-left"
                    style={{
                      background: sel ? c.bg : 'rgba(255,255,255,0.04)',
                      border: `1px solid ${sel ? c.border : 'rgba(255,255,255,0.08)'}`,
                      color: sel ? c.text : 'rgba(255,255,255,0.45)',
                      boxShadow: sel ? `0 0 12px ${c.bg}` : 'none',
                    }}
                  >
                    <span>{cat.emoji}</span>
                    <span className="truncate">{cat.name}</span>
                  </button>
                )
              })}
              <button
                type="button"
                onClick={() => setShowNewCat(true)}
                className="btn-press flex items-center gap-1.5 px-2.5 py-2 rounded-xl text-xs transition-all"
                style={{ border: '1px dashed rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.3)' }}
              >
                + Yeni
              </button>
            </div>

            {showNewCat && (
              <div
                className="mt-3 p-3 rounded-2xl space-y-2 animate-fade-up"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
              >
                <p className="text-xs font-semibold" style={{ color: 'rgba(255,255,255,0.4)' }}>Yeni kategori</p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newCatEmoji}
                    onChange={(e) => setNewCatEmoji(e.target.value)}
                    className="glass-input text-center"
                    style={{ width: 48, flexShrink: 0 }}
                    maxLength={2}
                  />
                  <input
                    type="text"
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                    placeholder="Kategori adı"
                    className="glass-input flex-1"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleAddCategory}
                    className="btn-press flex-1 py-2 rounded-xl text-xs font-semibold transition-colors"
                    style={{ background: 'rgba(99,102,241,0.2)', color: '#a5b4fc', border: '1px solid rgba(99,102,241,0.3)' }}
                  >
                    Ekle
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowNewCat(false)}
                    className="btn-press flex-1 py-2 rounded-xl text-xs transition-colors"
                    style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.4)' }}
                  >
                    İptal
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="btn-press flex-1 py-3 rounded-2xl text-sm font-medium transition-all"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)' }}
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={!name.trim()}
              className="pill-btn btn-press flex-1 py-3 text-sm text-white disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', boxShadow: '0 4px 20px rgba(99,102,241,0.4)' }}
            >
              {editHabit ? 'Kaydet' : 'Oluştur'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
