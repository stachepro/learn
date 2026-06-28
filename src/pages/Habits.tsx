import { useState, useEffect } from 'react'
import { useApp } from '../context/AppContext'
import { getCategoryColor } from '../utils/categories'
import AddHabitModal from '../components/AddHabitModal'
import type { Habit } from '../types'

const glassCard = {
  background: 'rgba(10, 28, 92, 0.52)',
  backdropFilter: 'blur(28px) saturate(190%)',
  WebkitBackdropFilter: 'blur(28px) saturate(190%)',
  border: '1px solid rgba(70, 135, 255, 0.28)',
  boxShadow: [
    '0 16px 45px rgba(0,8,70,0.5)',
    '0 4px 14px rgba(0,15,90,0.3)',
    'inset 0 2px 0 rgba(120,185,255,0.2)',
    'inset 0 -2px 0 rgba(0,0,65,0.42)',
  ].join(', '),
}

export default function Habits() {
  const { habits, deleteHabit, categories, deleteCustomCategory } = useApp()
  const [showAdd, setShowAdd] = useState(false)
  const [editHabit, setEditHabit] = useState<Habit | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)
  const delTimers = useState<Record<string, ReturnType<typeof setTimeout>>>(() => ({}))[0]

  useEffect(() => { setMounted(true) }, [])

  const customCats = categories.filter((c) => c.isCustom)

  const handleDelete = (id: string) => {
    if (confirmDelete === id) {
      if (delTimers[id]) clearTimeout(delTimers[id])
      deleteHabit(id)
      setConfirmDelete(null)
    } else {
      if (delTimers[id]) clearTimeout(delTimers[id])
      setConfirmDelete(id)
      delTimers[id] = setTimeout(() => setConfirmDelete(null), 3000)
    }
  }

  return (
    <>
      {showAdd && <AddHabitModal onClose={() => setShowAdd(false)} />}
      {editHabit && <AddHabitModal onClose={() => setEditHabit(null)} editHabit={editHabit} />}

      <div className={`max-w-3xl mx-auto px-4 py-6 pb-32 sm:pb-8 space-y-6 ${mounted ? 'page-enter' : 'opacity-0'}`}>
        {/* Header */}
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-2xl font-bold text-txt">Alışkanlıklar</h1>
            <p className="text-sm mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>
              {habits.length} alışkanlık tanımlı
            </p>
          </div>
          <button
            onClick={() => setShowAdd(true)}
            className="pill-btn btn-press px-5 py-2.5 text-sm text-white"
            style={{
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              boxShadow: '0 4px 20px rgba(99,102,241,0.35)',
            }}
          >
            + Yeni Alışkanlık
          </button>
        </div>

        {/* List */}
        {habits.length === 0 ? (
          <button
            onClick={() => setShowAdd(true)}
            className="btn-press w-full rounded-3xl p-12 text-center transition-all"
            style={{ ...glassCard, border: '1px dashed rgba(255,255,255,0.1)' }}
          >
            <p className="text-4xl mb-3">🌱</p>
            <p className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.45)' }}>Henüz alışkanlık yok</p>
            <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.2)' }}>
              İlk alışkanlığını oluşturmak için tıkla
            </p>
          </button>
        ) : (
          <div className="space-y-2">
            {habits.map((h) => {
              const cat = categories.find((c) => c.id === h.categoryId)
              const colors = getCategoryColor(cat?.color ?? '#6b7280')
              const isDel = confirmDelete === h.id
              return (
                <div
                  key={h.id}
                  className="flex items-center gap-3 rounded-2xl px-4 py-3.5 transition-all"
                  style={{
                    ...glassCard,
                    borderLeftWidth: 3,
                    borderLeftColor: colors.border,
                  }}
                >
                  <span className="text-xl">{h.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-txt truncate">{h.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {cat && (
                        <span className="text-[11px] font-medium" style={{ color: colors.text }}>
                          {cat.emoji} {cat.name}
                        </span>
                      )}
                      <span className="text-[11px]" style={{ color: 'rgba(255,255,255,0.2)' }}>·</span>
                      <span className="text-[11px]" style={{ color: 'rgba(255,255,255,0.25)' }}>
                        {new Date(h.createdAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' })}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => setEditHabit(h)}
                      className="btn-press text-xs px-3 py-1.5 rounded-xl transition-all font-medium"
                      style={{
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        color: 'rgba(255,255,255,0.5)',
                      }}
                    >
                      Düzenle
                    </button>
                    <button
                      onClick={() => handleDelete(h.id)}
                      className="btn-press text-xs px-3 py-1.5 rounded-xl transition-all font-medium"
                      style={isDel ? {
                        background: 'rgba(239,68,68,0.15)',
                        border: '1px solid rgba(239,68,68,0.35)',
                        color: '#fca5a5',
                      } : {
                        background: 'rgba(255,255,255,0.04)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        color: 'rgba(239,68,68,0.5)',
                      }}
                    >
                      {isDel ? 'Eminim →' : 'Sil'}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Custom categories */}
        {customCats.length > 0 && (
          <div>
            <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: 'rgba(255,255,255,0.3)' }}>
              Özel Kategoriler
            </p>
            <div className="space-y-2">
              {customCats.map((cat) => {
                const colors = getCategoryColor(cat.color)
                return (
                  <div
                    key={cat.id}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl"
                    style={glassCard}
                  >
                    <span className="text-lg">{cat.emoji}</span>
                    <span className="flex-1 text-sm font-medium" style={{ color: colors.text }}>{cat.name}</span>
                    <button
                      onClick={() => deleteCustomCategory(cat.id)}
                      className="text-xs transition-colors"
                      style={{ color: 'rgba(239,68,68,0.4)' }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = '#ef4444')}
                      onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(239,68,68,0.4)')}
                    >
                      Sil
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </>
  )
}
