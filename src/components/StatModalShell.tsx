import { useEffect, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

/* Ana sayfa istatistik kutularının (seri / seviye / bugün) ortak pencere kabuğu:
   karartılmış bulanık arka plan, üstte başlık + kapat, içerik kaydırılabilir. */

interface Props {
  title: string
  subtitle?: string
  onClose: () => void
  children: ReactNode
  headerIcon?: ReactNode
}

export default function StatModalShell({ title, subtitle, onClose, children, headerIcon }: Props) {
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
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4">
      <div
        className="fixed inset-0 animate-fade-in"
        style={{ background: 'rgba(0,0,0,0.66)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)' }}
        onClick={onClose}
      />

      <div
        className="glass g-neutral stat-modal-card relative w-full max-w-md animate-fade-up flex flex-col"
        style={{ maxHeight: 'calc(100dvh - env(safe-area-inset-top) - 40px)' }}
      >
        <div className="flex items-center justify-between px-5 py-4 flex-shrink-0" style={{ borderBottom: '1px solid rgba(26,23,38,0.08)' }}>
          <div className="flex items-center gap-2.5 min-w-0">
            {headerIcon}
            <div className="min-w-0">
              <h2 className="display text-lg font-bold truncate" style={{ color: '#1a1726' }}>{title}</h2>
              {subtitle && <p className="text-xs mt-0.5 truncate" style={{ color: 'rgba(26,23,38,0.45)' }}>{subtitle}</p>}
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Kapat"
            className="ctrl btn-press w-8 h-8 rounded-full flex items-center justify-center text-sm flex-shrink-0"
          >
            ✕
          </button>
        </div>

        <div className="overflow-y-auto px-5 py-5 space-y-5" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 20px)' }}>
          {children}
        </div>
      </div>
    </div>,
    document.body,
  )
}
