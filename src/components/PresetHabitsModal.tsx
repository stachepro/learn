import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useApp } from '../context/AppContext'
import { getCategoryColor } from '../utils/categories'

export interface PresetHabit {
  emoji: string
  name: string
  categoryId: string
}

// Static curated list — name + category + emoji per item
const PRESET_HABITS: PresetHabit[] = [
  { emoji: '🌍', name: 'Dil öğrenin', categoryId: 'egitim' },
  { emoji: '📖', name: 'Kitap okuyun', categoryId: 'egitim' },
  { emoji: '💧', name: 'Su için', categoryId: 'saglik' },
  { emoji: '💪', name: 'Egzersiz yapın', categoryId: 'fitness' },
  { emoji: '🪥', name: 'Diş temizliği', categoryId: 'saglik' },
  { emoji: '🧘', name: 'Meditasyon', categoryId: 'zihin' },
  { emoji: '🥗', name: 'Sağlıklı yemek yeyin', categoryId: 'saglik' },
  { emoji: '🚶', name: 'Yürüyüşe çıkın', categoryId: 'fitness' },
  { emoji: '🛏️', name: 'Yatağınızı toplayın', categoryId: 'gelisim' },
  { emoji: '😴', name: 'İyi uyku', categoryId: 'saglik' },
  { emoji: '🗓️', name: 'Yarının planını yapın', categoryId: 'uretkenlik' },
  { emoji: '📥', name: 'Gelen kutunuzu okuyun', categoryId: 'uretkenlik' },
  { emoji: '✍️', name: 'Günlük tutun', categoryId: 'zihin' },
  { emoji: '💊', name: 'Vitamin alın', categoryId: 'saglik' },
  { emoji: '🏋️', name: 'Spor salonuna gidin', categoryId: 'fitness' },
  { emoji: '🤸', name: 'Esneyin', categoryId: 'fitness' },
  { emoji: '🧾', name: 'Fatura ödeyin', categoryId: 'finans' },
  { emoji: '🛒', name: 'Alışveriş yapın', categoryId: 'gelisim' },
  { emoji: '🧽', name: 'Temizlik yapın', categoryId: 'gelisim' },
  { emoji: '🧹', name: 'Evi süpürün', categoryId: 'gelisim' },
  { emoji: '🧺', name: 'Çamaşır yıkayın', categoryId: 'gelisim' },
  { emoji: '🗑️', name: 'Çöpü çıkarın', categoryId: 'gelisim' },
  { emoji: '🏠', name: 'Evi toplayın', categoryId: 'gelisim' },
  { emoji: '🦴', name: 'Evcil dostunuza mama verin', categoryId: 'sosyal' },
  { emoji: '🐾', name: 'Evcil dostunuza su verin', categoryId: 'sosyal' },
  { emoji: '🐕', name: 'Köpeğinizi gezdirin', categoryId: 'sosyal' },
]

interface Props {
  onClose: () => void
  onBack: () => void
  onSelect: (preset: PresetHabit) => void
}

export default function PresetHabitsModal({ onClose, onBack, onSelect }: Props) {
  const { categories } = useApp()
  // Single selection — tapping a row selects it; "Seç" confirms
  const [selected, setSelected] = useState<string | null>(null)

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => {
      document.body.style.overflow = ''
      document.removeEventListener('keydown', handler)
    }
  }, [onClose])

  const handleConfirm = () => {
    const p = PRESET_HABITS.find((h) => h.name === selected)
    if (p) onSelect(p)
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 animate-fade-in"
        style={{ background: 'rgba(0,0,0,0.66)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)' }}
        onClick={onClose}
      />

      {/* Card */}
      <div className="glass g-neutral relative w-full max-w-md animate-fade-up flex flex-col" style={{ borderRadius: 28, maxHeight: '85vh' }}>
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4" style={{ borderBottom: '1px solid rgba(26,23,38,0.08)' }}>
          <button
            onClick={onBack}
            aria-label="Geri"
            className="ctrl btn-press w-8 h-8 rounded-full flex items-center justify-center text-sm flex-shrink-0"
          >
            ←
          </button>
          <div className="flex-1 min-w-0">
            <h2 className="display text-lg font-bold" style={{ color: '#1a1726' }}>Hazır Alışkanlıklar</h2>
            <p className="text-xs mt-0.5" style={{ color: 'rgba(26,23,38,0.45)' }}>Bir alışkanlık seç, ardından "Seç"e bas</p>
          </div>
          <button
            onClick={onClose}
            aria-label="Kapat"
            className="ctrl btn-press w-8 h-8 rounded-full flex items-center justify-center text-sm flex-shrink-0"
          >
            ✕
          </button>
        </div>

        {/* List */}
        <div className="p-4 overflow-y-auto space-y-2">
          {PRESET_HABITS.map((p) => {
            const cat = categories.find((c) => c.id === p.categoryId)
            const colors = getCategoryColor(cat?.color ?? '#6b7280')
            const isSelected = selected === p.name
            return (
              <button
                key={p.name}
                onClick={() => setSelected(p.name)}
                aria-pressed={isSelected}
                className="btn-press w-full flex items-center gap-3 px-3.5 py-3 rounded-2xl text-left transition-all"
                style={{
                  background: isSelected ? 'rgba(34,197,94,0.14)' : 'rgba(26,23,38,0.04)',
                  border: `1.5px solid ${isSelected ? 'rgba(34,197,94,0.6)' : 'rgba(26,23,38,0.08)'}`,
                }}
              >
                <span className="text-xl flex-shrink-0">{p.emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate" style={{ color: '#1a1726' }}>{p.name}</p>
                  {cat && (
                    <p className="text-[11px] font-semibold" style={{ color: colors.text }}>
                      {cat.emoji} {cat.name}
                    </p>
                  )}
                </div>
                {isSelected && (
                  <span className="text-base flex-shrink-0" style={{ color: '#16a34a' }}>✓</span>
                )}
              </button>
            )
          })}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 space-y-2" style={{ borderTop: '1px solid rgba(26,23,38,0.08)' }}>
          <button
            onClick={handleConfirm}
            disabled={!selected}
            className="btn-ink btn-press w-full py-3 text-sm"
            style={!selected ? { opacity: 0.45 } : undefined}
          >
            Seç
          </button>
          <button onClick={onClose} className="chip btn-press w-full py-3 text-sm">
            Kapat
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
