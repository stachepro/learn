import { useState, useEffect } from 'react'
import { useApp } from '../context/AppContext'
import { getCategoryColor } from '../utils/categories'
import AddHabitModal from '../components/AddHabitModal'
import type { Habit } from '../types'

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

      <div className={`max-w-3xl mx-auto px-4 py-6 pb-40 sm:pb-8 space-y-6 ${mounted ? 'page-enter' : 'opacity-0'}`}>
        {/* Header */}
        <div className="flex items-end justify-between">
          <div>
            <h1 className="display text-3xl font-extrabold" style={{ color: '#1a1726' }}>Alışkanlıklar</h1>
            <p className="text-sm mt-1" style={{ color: 'rgba(26,23,38,0.55)' }}>
              {habits.length} alışkanlık tanımlı
            </p>
          </div>
          <button onClick={() => setShowAdd(true)} className="btn-ink btn-press px-5 py-2.5 text-sm">
            + Yeni Alışkanlık
          </button>
        </div>

        {/* List */}
        {habits.length === 0 ? (
          <button
            onClick={() => setShowAdd(true)}
            className="glass g-neutral glass-lift btn-press w-full p-12 text-center"
            style={{ borderRadius: 24 }}
          >
            <p className="text-4xl mb-3">🌱</p>
            <p className="display text-base font-bold">Henüz alışkanlık yok</p>
            <p className="text-xs mt-1 ink-60">İlk alışkanlığını oluşturmak için tıkla</p>
          </button>
        ) : (
          <div className="space-y-2.5">
            {habits.map((h, i) => {
              const cat = categories.find((c) => c.id === h.categoryId)
              const colors = getCategoryColor(cat?.color ?? '#6b7280')
              const isDel = confirmDelete === h.id
              return (
                <div key={h.id} className="glass g-neutral flex items-center gap-3 pl-4 pr-4 py-3.5 animate-pop" style={{ borderRadius: 20, animationDelay: `${Math.min(i * 50, 300)}ms` }}>
                  <div
                    className="absolute left-0 top-0 bottom-0 w-1.5 z-[1]"
                    style={{ background: colors.text, opacity: 0.85 }}
                  />
                  <span className="text-xl">{h.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{h.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {cat && (
                        <span className="text-[11px] font-semibold" style={{ color: colors.text }}>
                          {cat.emoji} {cat.name}
                        </span>
                      )}
                      <span className="text-[11px] ink-35">·</span>
                      <span className="text-[11px] ink-45">
                        {new Date(h.createdAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' })}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => setEditHabit(h)}
                      className="chip btn-press text-xs px-3 py-1.5"
                    >
                      Düzenle
                    </button>
                    <button
                      onClick={() => handleDelete(h.id)}
                      className="btn-press text-xs px-3 py-1.5 rounded-full font-semibold soft-trans"
                      style={isDel
                        ? { background: '#e2503f', color: '#fff5f2' }
                        : { background: 'rgba(26,23,38,0.05)', color: 'rgba(204,60,40,0.9)', border: '1px solid rgba(26,23,38,0.08)' }}
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
            <p className="display text-sm font-bold mb-3" style={{ color: '#1a1726' }}>
              Özel Kategoriler
            </p>
            <div className="space-y-2.5">
              {customCats.map((cat) => {
                const colors = getCategoryColor(cat.color)
                return (
                  <div key={cat.id} className="glass g-neutral flex items-center gap-3 px-4 py-3" style={{ borderRadius: 18 }}>
                    <span className="text-lg">{cat.emoji}</span>
                    <span className="flex-1 text-sm font-semibold" style={{ color: colors.text }}>{cat.name}</span>
                    <button
                      onClick={() => deleteCustomCategory(cat.id)}
                      className="chip btn-press text-xs px-3 py-1.5"
                      style={{ color: 'rgba(204,60,40,0.9)' }}
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
