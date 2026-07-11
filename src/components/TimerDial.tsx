import type { ReactNode } from 'react'

/* ════════════════════════════════════════════════
   TİKLİ KADRAN — Pomodoro ve Just Start'ın ortak
   saat yüzü. 60 tik; geçilenler vurgu rengine boyanır.
   İlerleme yayı + parlak uç noktası + saniye uydusu.
   Merkez içeriği children ile verilir.
   ════════════════════════════════════════════════ */

const SIZE = 264
const CX = SIZE / 2
const R_ARC = 112     // ilerleme yayı
const R_TICK_IN = 122 // tik içi
const R_TICK_OUT = 129

function rgba(hex: string, a: number): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r},${g},${b},${a})`
}

export default function TimerDial({ progress, accent, showArc, ticking, children }: {
  progress: number   // 0..1
  accent: string     // hex, ör. '#f97316'
  showArc: boolean   // yay + uç noktası çizilsin mi
  ticking: boolean   // saniye uydusu dönsün mü
  children: ReactNode
}) {
  const C = 2 * Math.PI * R_ARC
  const dash = C * (1 - progress)
  // Yay ucundaki ışıltılı nokta (-90°'den başlar)
  const headAngle = -Math.PI / 2 + progress * 2 * Math.PI
  const headX = CX + R_ARC * Math.cos(headAngle)
  const headY = CX + R_ARC * Math.sin(headAngle)

  return (
    <div className="relative" style={{ width: SIZE, height: SIZE }}>
      <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
        {/* 60 tik — her 5.'si uzun ve koyu */}
        {Array.from({ length: 60 }).map((_, i) => {
          const a = (i / 60) * 2 * Math.PI - Math.PI / 2
          const major = i % 5 === 0
          const rIn = major ? R_TICK_IN - 3 : R_TICK_IN
          const passed = showArc && i / 60 <= progress
          return (
            <line
              key={i}
              x1={CX + rIn * Math.cos(a)} y1={CX + rIn * Math.sin(a)}
              x2={CX + R_TICK_OUT * Math.cos(a)} y2={CX + R_TICK_OUT * Math.sin(a)}
              stroke={passed ? accent : major ? 'rgb(var(--ink) / 0.22)' : 'rgb(var(--ink) / 0.1)'}
              strokeWidth={major ? 2.5 : 1.5}
              strokeLinecap="round"
              style={{ transition: 'stroke 0.6s ease' }}
            />
          )
        })}

        {/* Ray */}
        <circle cx={CX} cy={CX} r={R_ARC} fill="none" stroke="rgb(var(--ink) / 0.06)" strokeWidth="8" />

        {/* İlerleme yayı */}
        {showArc && (
          <g style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }}>
            <circle
              cx={CX} cy={CX} r={R_ARC}
              fill="none"
              stroke={accent}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={C}
              strokeDashoffset={dash}
              style={{
                transition: 'stroke-dashoffset 1s linear, stroke 0.4s ease',
                filter: `drop-shadow(0 0 8px ${rgba(accent, 0.7)})`,
              }}
            />
          </g>
        )}

        {/* Yay ucu — parlak nokta */}
        {showArc && (
          <circle
            cx={headX} cy={headY} r="6.5"
            fill="#fff"
            stroke={accent}
            strokeWidth="3.5"
            style={{
              transition: 'cx 1s linear, cy 1s linear, stroke 0.4s ease',
              filter: `drop-shadow(0 0 6px ${rgba(accent, 0.9)})`,
            }}
          />
        )}
      </svg>

      {/* Saniye yörüngesi — kadranı canlı tutan minik uydu */}
      {ticking && (
        <div className="pom-orbit absolute inset-0 pointer-events-none">
          <span
            className="absolute rounded-full"
            style={{
              width: 5, height: 5, left: '50%', top: CX - R_ARC - 17,
              marginLeft: -2.5,
              background: accent, opacity: 0.75,
              boxShadow: `0 0 6px ${rgba(accent, 0.8)}`,
            }}
          />
        </div>
      )}

      {/* Merkez */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {children}
      </div>
    </div>
  )
}
