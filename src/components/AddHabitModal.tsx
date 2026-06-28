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

  const rawSlice = EMOJI_LIST.slice(emojiPage * EMOJIS_PER_PAGE, (emojiPage + 1) * EMOJIS_PER_PAGE)
  const pageEmojis: (string | null)[] = [...rawSlice]
  while (pageEmojis.length < EMOJIS_PER_PAGE) pageEmojis.push(null)

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

  const label = 'text-[11px] font-bold uppercase tracking-[0.16em] ink-45 mb-2'

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 animate-fade-in"
        style={{ background: 'rgba(0,0,0,0.66)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)' }}
      />

      {/* Modal card — dark obsidian tile */}
      <div className="glass g-neutral relative w-full max-w-md animate-fade-up" style={{ borderRadius: 28 }}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <h2 className="display text-lg font-bold">
            {editHabit ? 'Alışkanlığı Düzenle' : 'Yeni Alışkanlık'}
          </h2>
          <button
            onClick={onClose}
            aria-label="Kapat"
            className="ctrl btn-press w-8 h-8 rounded-full flex items-center justify-center text-sm"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-5 overflow-y-auto max-h-[80vh]">
          {/* Emoji preview + picker */}
          <div>
            <p className={label}>Emoji</p>
            <div className="flex items-center gap-3 mb-3">
              <div className="glass g-cream w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0">
                {emoji}
              </div>
              <div className="flex gap-1.5">
                {Array.from({ length: TOTAL_PAGES }).map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setEmojiPage(i)}
                    aria-label={`Emoji sayfası ${i + 1}`}
                    className="btn-press h-1.5 rounded-full transition-all"
                    style={{
                      width: i === emojiPage ? 22 : 6,
                      background: i === emojiPage ? 'rgb(34,197,94)' : 'rgba(255,255,255,0.18)',
                    }}
                  />
                ))}
              </div>
            </div>

            <div className="well grid grid-cols-10 gap-1 rounded-2xl p-2" style={{ minHeight: '188px' }}>
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
              <button
                type="button"
                onClick={() => setShowNewCat(true)}
                className="btn-press flex items-center gap-1.5 px-2.5 py-2 rounded-xl text-xs font-semibold transition-all"
                style={{ border: '1px dashed rgba(255,255,255,0.22)', color: 'rgba(232,237,238,0.5)' }}
              >
                + Yeni
              </button>
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

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="chip btn-press flex-1 py-3 text-sm">
              İptal
            </button>
            <button type="submit" disabled={!name.trim()} className="btn-ink btn-press flex-1 py-3 text-sm">
              {editHabit ? 'Kaydet' : 'Oluştur'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
