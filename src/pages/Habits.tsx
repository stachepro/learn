import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { createPortal } from 'react-dom'
import { useApp } from '../context/AppContext'
import { getCategoryColor } from '../utils/categories'
import AddHabitModal from '../components/AddHabitModal'
import HabitCreateChooser from '../components/HabitCreateChooser'
import PresetHabitsModal, { type PresetHabit } from '../components/PresetHabitsModal'
import PresetCustomizeModal from '../components/PresetCustomizeModal'
import type { Habit } from '../types'

// Creation flow: choose method → preset list (+ customize) or blank form
type CreateStep = 'chooser' | 'presets' | 'preset-customize' | 'form'

export default function Habits() {
  const { habits, deleteHabit, categories, deleteCustomCategory } = useApp()
  const navigate = useNavigate()
  const [createStep, setCreateStep] = useState<CreateStep | null>(null)
  const [presetInitial, setPresetInitial] = useState<PresetHabit | null>(null)
  const [editHabit, setEditHabit] = useState<Habit | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<Habit | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  const customCats = categories.filter((c) => c.isCustom)

  const handleConfirmDelete = () => {
    if (!confirmDelete) return
    deleteHabit(confirmDelete.id)
    setConfirmDelete(null)
  }

  return (
    <>
      {createStep === 'chooser' && (
        <HabitCreateChooser
          onClose={() => setCreateStep(null)}
          onPreset={() => setCreateStep('presets')}
          onCreate={() => { setPresetInitial(null); setCreateStep('form') }}
        />
      )}
      {createStep === 'presets' && (
        <PresetHabitsModal
          onClose={() => setCreateStep(null)}
          onBack={() => setCreateStep('chooser')}
          onSelect={(p) => { setPresetInitial(p); setCreateStep('preset-customize') }}
        />
      )}
      {createStep === 'preset-customize' && presetInitial && (
        <PresetCustomizeModal
          preset={presetInitial}
          onClose={() => { setCreateStep(null); setPresetInitial(null) }}
          onBack={() => setCreateStep('presets')}
        />
      )}
      {createStep === 'form' && <AddHabitModal onClose={() => setCreateStep(null)} />}
      {editHabit && <AddHabitModal onClose={() => setEditHabit(null)} editHabit={editHabit} />}

      {confirmDelete && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 animate-fade-in"
            style={{ background: 'rgba(0,0,0,0.66)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)' }}
            onClick={() => setConfirmDelete(null)}
          />
          <div className="glass g-neutral relative w-full max-w-sm animate-fade-up p-5" style={{ borderRadius: 24 }}>
            <div className="flex items-center gap-3 mb-3">
              <span className="text-2xl">{confirmDelete.emoji}</span>
              <h2 className="display text-lg font-bold" style={{ color: '#1a1726' }}>
                "{confirmDelete.name}" silinsin mi?
              </h2>
            </div>
            <p className="text-sm" style={{ color: 'rgba(26,23,38,0.6)' }}>
              Bu alışkanlığı silersen tüm istatistik geçmişi de kalıcı olarak silinecek. Devam etmek istiyor musun?
            </p>
            <div className="flex gap-3 mt-5">
              <button
                onClick={() => setConfirmDelete(null)}
                className="chip btn-press flex-1 py-3 text-sm"
              >
                Vazgeç
              </button>
              <button
                onClick={handleConfirmDelete}
                className="btn-press flex-1 py-3 rounded-full text-sm font-bold"
                style={{ background: '#e2503f', color: '#fff5f2' }}
              >
                Evet, Sil
              </button>
            </div>
          </div>
        </div>,
        document.body,
      )}

      <div className={`max-w-3xl mx-auto px-4 py-6 pb-40 sm:pb-8 space-y-6 ${mounted ? 'page-enter' : 'opacity-0'}`}>
        {/* Header */}
        <div className="flex items-end justify-between">
          <div>
            <h1 className="display text-3xl font-extrabold" style={{ color: '#1a1726' }}>Alışkanlıklar</h1>
            <p className="text-sm mt-1" style={{ color: 'rgba(26,23,38,0.55)' }}>
              {habits.length} alışkanlık tanımlı
            </p>
          </div>
          <button onClick={() => setCreateStep('chooser')} className="btn-ink btn-press px-5 py-2.5 text-sm">
            + Yeni Alışkanlık
          </button>
        </div>

        {/* List */}
        {habits.length === 0 ? (
          <button
            onClick={() => setCreateStep('chooser')}
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
                      onClick={() => navigate(`/habit/${h.id}/stats`)}
                      className="chip btn-press text-xs px-3 py-1.5"
                    >
                      İstatistik
                    </button>
                    <button
                      onClick={() => setEditHabit(h)}
                      className="chip btn-press text-xs px-3 py-1.5"
                    >
                      Düzenle
                    </button>
                    <button
                      onClick={() => setConfirmDelete(h)}
                      className="btn-press text-xs px-3 py-1.5 rounded-full font-semibold soft-trans"
                      style={{ background: 'rgba(26,23,38,0.05)', color: 'rgba(204,60,40,0.9)', border: '1px solid rgba(26,23,38,0.08)' }}
                    >
                      Sil
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
