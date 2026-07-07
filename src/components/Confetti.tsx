import type { CSSProperties } from 'react'

/* ════════════════════════════════════════════════
   KONFETİ — kutlama anlarında bir kez yağar.
   Parçalar palet renklerinde; .js-confetti keyframe'i
   (index.css) düşüş + dönüş + yana savrulmayı verir.
   Just Start (gün tamam) ve To-do (liste bitti) paylaşır.
   ════════════════════════════════════════════════ */

const COLORS = ['#22c55e', '#f59e0b', '#f97316', '#38bdf8', '#a78bfa', '#f472b6']

const PIECES = Array.from({ length: 26 }).map((_, i) => ({
  left: (i * 37 + 13) % 100,
  delay: (i % 9) * 0.16,
  dur: 2.2 + ((i * 7) % 10) / 8,
  dx: ((i % 5) - 2) * 34,
  rot: 360 + (i % 4) * 180,
  w: 6 + (i % 3) * 2,
  h: 9 + ((i + 1) % 3) * 3,
  color: COLORS[i % COLORS.length],
}))

export default function Confetti() {
  return (
    <div className="fixed inset-0 pointer-events-none z-[60] overflow-hidden" aria-hidden>
      {PIECES.map((c, i) => (
        <span
          key={i}
          className="js-confetti"
          style={{
            left: `${c.left}%`, width: c.w, height: c.h,
            background: c.color, borderRadius: 2,
            '--dx': `${c.dx}px`, '--rot': `${c.rot}deg`,
            '--dur': `${c.dur}s`, '--delay': `${c.delay}s`,
          } as CSSProperties}
        />
      ))}
    </div>
  )
}
