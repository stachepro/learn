import { useEffect } from 'react'
import { createPortal } from 'react-dom'

/* ── Lucide-style inline icons ── */
function IconListPlus({ size = 26, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 12H3" />
      <path d="M16 6H3" />
      <path d="M16 18H3" />
      <path d="M18 9v6" />
      <path d="M21 12h-6" />
    </svg>
  )
}

function IconPlusCircle({ size = 26, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M8 12h8" />
      <path d="M12 8v8" />
    </svg>
  )
}

interface Props {
  onClose: () => void
  onPreset: () => void
  onCreate: () => void
}

export default function HabitCreateChooser({ onClose, onPreset, onCreate }: Props) {
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => {
      document.body.style.overflow = ''
      document.removeEventListener('keydown', handler)
    }
  }, [onClose])

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 animate-fade-in"
        style={{ background: 'rgba(0,0,0,0.66)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)' }}
        onClick={onClose}
      />

      {/* Card */}
      <div className="glass g-neutral relative w-full max-w-md animate-fade-up" style={{ borderRadius: 28 }}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid rgba(26,23,38,0.08)' }}>
          <div>
            <h2 className="display text-lg font-bold" style={{ color: '#1a1726' }}>Yeni Alışkanlık</h2>
            <p className="text-xs mt-0.5" style={{ color: 'rgba(26,23,38,0.45)' }}>Nasıl başlamak istersin?</p>
          </div>
          <button
            onClick={onClose}
            aria-label="Kapat"
            className="ctrl btn-press w-8 h-8 rounded-full flex items-center justify-center text-sm"
          >
            ✕
          </button>
        </div>

        {/* Two option cards */}
        <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Hazır Alışkanlıklar */}
          <button
            onClick={onPreset}
            className="btn-press tile-press flex flex-col items-center text-center gap-3 rounded-2xl px-4 py-6"
            style={{ background: '#e6f0fb', border: '1px solid #c5ddf6' }}
          >
            <span
              className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'linear-gradient(150deg, #60a5fa, #2563eb)', boxShadow: '0 8px 20px -6px rgba(37,99,235,0.55)' }}
            >
              <IconListPlus size={24} color="#fff" />
            </span>
            <div>
              <p className="text-sm font-bold" style={{ color: '#0c447c' }}>Hazır Alışkanlıklar</p>
              <p className="text-[11px] mt-1 leading-snug" style={{ color: '#3f7bc0' }}>
                Hazır listeden seçerek hızlıca ekle
              </p>
            </div>
          </button>

          {/* Alışkanlık Yarat */}
          <button
            onClick={onCreate}
            className="btn-press tile-press flex flex-col items-center text-center gap-3 rounded-2xl px-4 py-6"
            style={{ background: '#e9f9ee', border: '1px solid #c2ecd0' }}
          >
            <span
              className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'linear-gradient(150deg, #4ade80, #16a34a)', boxShadow: '0 8px 20px -6px rgba(22,163,74,0.55)' }}
            >
              <IconPlusCircle size={24} color="#fff" />
            </span>
            <div>
              <p className="text-sm font-bold" style={{ color: '#15803d' }}>Alışkanlık Yarat</p>
              <p className="text-[11px] mt-1 leading-snug" style={{ color: '#3f9d62' }}>
                Kendi alışkanlığını sıfırdan oluştur
              </p>
            </div>
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
