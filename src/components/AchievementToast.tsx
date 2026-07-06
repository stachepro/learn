import { useEffect, useRef, useState } from 'react'
import { ALL_BADGES } from '../utils/badges'
import type { Badge } from '../types'

/* Ekranın üstünden inen "Başarım Kazanıldı" bildirimi.
   'luupi-badge' penceresi olaylarını dinler; birden fazla rozet
   aynı anda kazanılırsa sırayla gösterir. */
export default function AchievementToast() {
  const [current, setCurrent] = useState<Badge | null>(null)
  const [leaving, setLeaving] = useState(false)
  const queueRef = useRef<Badge[]>([])
  const shownRef = useRef<Set<string>>(new Set())
  const busyRef = useRef(false)
  const timersRef = useRef<number[]>([])

  useEffect(() => {
    const showNext = () => {
      const next = queueRef.current.shift()
      if (!next) {
        busyRef.current = false
        return
      }
      busyRef.current = true
      setLeaving(false)
      setCurrent(next)
      timersRef.current.push(window.setTimeout(() => setLeaving(true), 3400))
      timersRef.current.push(window.setTimeout(() => { setCurrent(null); showNext() }, 3800))
    }

    const onBadge = (e: Event) => {
      const id = (e as CustomEvent<string>).detail
      // Aynı rozet farklı yollardan iki kez duyurulursa tek bildirim göster
      if (shownRef.current.has(id)) return
      shownRef.current.add(id)
      const def = ALL_BADGES.find((b) => b.id === id)
      if (!def) return
      queueRef.current.push(def)
      if (!busyRef.current) showNext()
    }

    window.addEventListener('luupi-badge', onBadge)
    return () => {
      window.removeEventListener('luupi-badge', onBadge)
      timersRef.current.forEach((t) => window.clearTimeout(t))
    }
  }, [])

  if (!current) return null

  return (
    <div
      className="fixed inset-x-0 z-[70] flex justify-center pointer-events-none px-4"
      style={{ top: 'calc(env(safe-area-inset-top) + 10px)' }}
      role="status"
      aria-live="polite"
    >
      <div
        className={`flex items-center gap-3 pl-3 pr-5 py-3 ${leaving ? 'ach-out' : 'ach-in'}`}
        style={{
          borderRadius: 20,
          background: '#1a1726',
          color: '#fbf7f0',
          boxShadow: '0 14px 34px -12px rgba(26,23,38,0.65), 0 0 0 1px rgba(251,191,36,0.4)',
          maxWidth: 360,
        }}
      >
        <span
          className="w-11 h-11 rounded-2xl flex items-center justify-center text-xl flex-shrink-0"
          style={{ background: 'linear-gradient(150deg, #fbbf24, #f97316)', boxShadow: '0 6px 14px -6px rgba(249,115,22,0.6)' }}
        >
          {current.emoji}
        </span>
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#fbbf24' }}>
            Başarım Kazanıldı!
          </p>
          <p className="display text-sm font-bold truncate">{current.name}</p>
          <p className="text-[11px] truncate" style={{ color: 'rgba(251,247,240,0.6)' }}>{current.description}</p>
        </div>
      </div>
    </div>
  )
}
