import { useEffect, useRef, useState } from 'react'
import { MOTION } from './motion'
import { useReducedMotion } from './useReducedMotion'

/* Görsel çıkış tamamlanmadan component'i kaldırmaz. Varsayılan süre ortak
   sheet-exit token'ıyla aynıdır; reduced motion durumunda bekleme yapılmaz. */
export function useModalDismiss(onClose: () => void, durationMs = MOTION.sheetExit) {
  const [isExiting, setIsExiting] = useState(false)
  const closingRef = useRef(false)
  const reducedMotion = useReducedMotion()
  const timerRef = useRef<number | null>(null)

  const close = () => {
    if (closingRef.current) return
    closingRef.current = true
    setIsExiting(true)
    timerRef.current = window.setTimeout(onClose, reducedMotion ? 0 : durationMs)
  }

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') close() }
    document.addEventListener('keydown', handler)
    return () => {
      document.body.style.overflow = ''
      document.removeEventListener('keydown', handler)
      if (timerRef.current !== null) window.clearTimeout(timerRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return { isExiting, close }
}
