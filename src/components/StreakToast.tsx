import { useEffect, useRef, useState } from 'react'

/* Seri olayları bildirimi — 'luupi-streak' penceresi olaylarını dinler:
   - freeze-used:   kaçırılan gün(ler) dondurmayla kapatıldı (buz teması)
   - freeze-earned: 7 günlük istikrar +1 dondurma kazandırdı
   - streak-lost:   hak yetmedi, seri sıfırlandı
   AchievementToast ile aynı üstten inme davranışını paylaşır. */

interface StreakEvent {
  type: 'freeze-used' | 'freeze-earned' | 'streak-lost'
  count?: number
  left?: number
}

interface ToastContent {
  emoji: string
  title: string
  body: string
  accent: string       // vurgu rengi (başlık + çerçeve)
  iconBg: string
}

function contentFor(e: StreakEvent): ToastContent {
  switch (e.type) {
    case 'freeze-used':
      return {
        emoji: '🧊',
        title: 'Serin donduruldu!',
        body: `Kaçırdığın ${e.count === 1 ? 'gün' : `${e.count} gün`} buzla kapatıldı · Kalan hak: ${e.left}`,
        accent: '#7dd3fc',
        iconBg: 'linear-gradient(150deg, #7dd3fc, #0284c7)',
      }
    case 'freeze-earned':
      return {
        emoji: '❄️',
        title: 'Dondurma hakkı kazandın!',
        body: `7 günlük istikrar ödülü · Toplam hak: ${e.left}/3`,
        accent: '#7dd3fc',
        iconBg: 'linear-gradient(150deg, #7dd3fc, #0284c7)',
      }
    case 'streak-lost':
      return {
        emoji: '🌫️',
        title: 'Seri sıfırlandı',
        body: 'Bugün bir alışkanlık tamamla, alevi yeniden yak',
        accent: 'rgb(var(--canvas) / 0.5)',
        iconBg: 'linear-gradient(150deg, #6b7280, #374151)',
      }
  }
}

export default function StreakToast() {
  const [current, setCurrent] = useState<ToastContent | null>(null)
  const [leaving, setLeaving] = useState(false)
  const queueRef = useRef<ToastContent[]>([])
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
      timersRef.current.push(window.setTimeout(() => setLeaving(true), 3800))
      timersRef.current.push(window.setTimeout(() => { setCurrent(null); showNext() }, 4200))
    }

    const onEvent = (e: Event) => {
      const detail = (e as CustomEvent<StreakEvent>).detail
      if (!detail?.type) return
      queueRef.current.push(contentFor(detail))
      if (!busyRef.current) showNext()
    }

    window.addEventListener('luupi-streak', onEvent)
    return () => {
      window.removeEventListener('luupi-streak', onEvent)
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
          background: 'rgb(var(--ink))',
          color: 'rgb(var(--canvas))',
          boxShadow: `0 14px 34px -12px rgb(var(--ink) / 0.65), 0 0 0 1px ${current.accent}66`,
          maxWidth: 360,
        }}
      >
        <span
          className="w-11 h-11 rounded-2xl flex items-center justify-center text-xl flex-shrink-0"
          style={{ background: current.iconBg, boxShadow: '0 6px 14px -6px rgba(2,132,199,0.6)' }}
        >
          {current.emoji}
        </span>
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: current.accent }}>
            Seri
          </p>
          <p className="display text-sm font-bold truncate">{current.title}</p>
          <p className="text-[11px] truncate" style={{ color: 'rgb(var(--canvas) / 0.6)' }}>{current.body}</p>
        </div>
      </div>
    </div>
  )
}
