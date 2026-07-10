import type { ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { useModalDismiss } from '../utils/useModalDismiss'

/* Ana sayfa istatistik kutularının (seri / seviye / bugün) ortak pencere kabuğu:
   karartılmış bulanık arka plan, üstte başlık + kapat, içerik kaydırılabilir.
   Mobilde ekranın altından gerçek bir "sheet" gibi kayarak açılır/kapanır. */

interface Props {
  title: string
  subtitle?: string
  onClose: () => void
  children: ReactNode
  headerIcon?: ReactNode
}

export default function StatModalShell({ title, subtitle, onClose, children, headerIcon }: Props) {
  const { isExiting, close } = useModalDismiss(onClose, 300)

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4">
      <div
        className={`fixed inset-0 ${isExiting ? 'animate-fade-out' : 'animate-fade-in'}`}
        style={{ background: 'rgba(0,0,0,0.66)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)' }}
        onClick={close}
      />

      <div
        className={`glass g-neutral stat-modal-card relative w-full max-w-md flex flex-col ${isExiting ? 'sheet-exit' : 'sheet-enter'}`}
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
            onClick={close}
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
