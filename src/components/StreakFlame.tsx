import { useId } from 'react'
import type { FlameState } from '../utils/streak'

/* Ana sayfa ve seri penceresinde paylaşılan alev ikonu.
   - lit:     turuncu, yanıyor (hafif titrek alev animasyonu)
   - pending: gri, sönük — bugün henüz devam ettirilmedi
   - frozen:  buz mavisi + kar kristali — seri dondurmayla korundu
   - out:     yalnızca kontur — seri yok */

const FLAME_PATH =
  'M12 2c.5 3 2.5 4.5 4 6.5C17.5 10.5 18 12.3 18 14a6 6 0 1 1-12 0c0-1.8.7-3.3 1.8-4.5C8.5 8.8 9 7.8 9 6.5c1.2.8 2 2 2.2 3.3C12.2 8.4 12.5 5.7 12 2z'

interface Props {
  state: FlameState
  size?: number
  className?: string
}

export default function StreakFlame({ state, size = 24, className }: Props) {
  const uid = useId()
  const gradId = `flame-g-${uid}`
  const iceId = `flame-i-${uid}`

  if (state === 'out') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
        <path d={FLAME_PATH} stroke="rgb(var(--ink) / 0.3)" strokeWidth="1.6" strokeLinejoin="round" />
      </svg>
    )
  }

  if (state === 'pending') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
        <path d={FLAME_PATH} fill="rgb(var(--ink) / 0.22)" />
        {/* İç kor — sönmek üzere, yavaş nabız */}
        <circle cx="12" cy="15" r="2.4" fill="rgba(249,115,22,0.55)" className="ember-pulse" />
      </svg>
    )
  }

  if (state === 'frozen') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
        <defs>
          <linearGradient id={iceId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--sf-ice-br)" />
            <stop offset="55%" stopColor="#7dd3fc" />
            <stop offset="100%" stopColor="#0ea5e9" />
          </linearGradient>
        </defs>
        <path d={FLAME_PATH} fill={`url(#${iceId})`} />
        {/* Buz parlaması */}
        <path d="M9.2 9.5c-.9 1-1.6 2.2-1.7 3.6" stroke="rgba(255,255,255,0.85)" strokeWidth="1.1" strokeLinecap="round" className="frost-glint" />
        {/* Kar kristali */}
        <g stroke="#fff" strokeWidth="0.9" strokeLinecap="round" className="frost-spin" style={{ transformOrigin: '14.5px 13.5px' }}>
          <path d="M14.5 10.5v6" />
          <path d="M11.9 12l5.2 3" />
          <path d="M17.1 12l-5.2 3" />
        </g>
      </svg>
    )
  }

  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fbbf24" />
          <stop offset="100%" stopColor="#f97316" />
        </linearGradient>
      </defs>
      <g className="flame-flicker" style={{ transformOrigin: '12px 20px' }}>
        <path d={FLAME_PATH} fill={`url(#${gradId})`} />
        {/* İç alev — daha sıcak çekirdek */}
        <path
          d="M12 10.5c.3 1.4 1.3 2.2 1.9 3.1.5.8.7 1.5.7 2.2a2.6 2.6 0 1 1-5.2 0c0-.9.4-1.7 1-2.4.5-.6.9-1.2 1-2 .3.3.5.7.6 1.1z"
          fill="#fde68a"
          opacity="0.9"
        />
      </g>
    </svg>
  )
}
