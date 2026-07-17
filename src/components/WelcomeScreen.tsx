import { createPortal } from 'react-dom'

interface Props {
  onStart: () => void
  onAddHabit: () => void
}

export default function WelcomeScreen({ onStart, onAddHabit }: Props) {
  return createPortal(
    <div className="fixed inset-0 z-[70] overflow-y-auto" role="dialog" aria-modal="true" aria-label="Luupi karşılama">
      <div
        className="fixed inset-0"
        style={{
          background: 'radial-gradient(circle at top, rgba(251,191,36,0.24), transparent 34%), rgb(var(--canvas) / 0.98)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
        }}
      />

      <div className="relative min-h-full flex items-center justify-center p-5">
        <div
          className="w-full max-w-md rounded-[32px] px-6 py-8 text-center animate-fade-up"
          style={{
            background: 'rgb(var(--canvas) / 0.84)',
            border: '1px solid rgb(var(--ink) / 0.08)',
            boxShadow: '0 30px 80px -38px rgb(var(--ink) / 0.22), inset 0 1px 0 rgb(var(--canvas) / 0.42)',
          }}
        >
          <div
            className="w-16 h-16 rounded-[22px] mx-auto mb-5 flex items-center justify-center"
            style={{
              background: 'linear-gradient(150deg, #fbbf24, #f97316)',
              boxShadow: '0 16px 30px -16px rgba(249,115,22,0.55)',
            }}
          >
            <span className="display text-[30px] font-black" style={{ color: '#2a1402' }}>L</span>
          </div>

          <p className="text-[11px] font-bold uppercase tracking-[0.22em] mb-3" style={{ color: 'rgba(42,20,2,0.42)' }}>
            Luupi
          </p>
          <h1 className="display text-[34px] leading-[1.02] font-black tracking-tight" style={{ color: 'rgb(var(--ink))' }}>
            Gününü yönetmek
            <br />
            için tek uygulama
          </h1>
          <p className="text-sm leading-6 mt-4 mx-auto max-w-[30ch]" style={{ color: 'rgb(var(--ink) / 0.64)' }}>
            Alışkanlıklarını takip et, odağını koru ve gününü tek yerden toparla.
          </p>
          <p className="text-xs mt-3" style={{ color: 'rgb(var(--ink) / 0.46)' }}>
            Alışkanlıklar, odak, kısa araçlar ve günlük özet tek yerde.
          </p>

          <div className="mt-7 space-y-3">
            <button
              onClick={onStart}
              className="btn-press w-full rounded-2xl py-3.5 text-sm font-bold"
              style={{
                background: 'linear-gradient(135deg, #fbbf24, #f97316)',
                color: '#2a1402',
                boxShadow: '0 16px 28px -16px rgba(249,115,22,0.6)',
              }}
            >
              Başla
            </button>
            <button
              onClick={onAddHabit}
              className="btn-press w-full rounded-2xl py-3.5 text-sm font-semibold"
              style={{
                background: 'rgb(var(--ink) / 0.05)',
                color: 'rgb(var(--ink) / 0.78)',
                border: '1px solid rgb(var(--ink) / 0.08)',
              }}
            >
              İlk alışkanlığı ekle
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  )
}
