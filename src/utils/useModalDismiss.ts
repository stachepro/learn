import { useEffect, useRef, useState } from 'react'

/* Ortak "pencere kapatma" davranışı: state'i anında sıfırlayıp React'in
   bileşeni DOM'dan söküvermesini önler — önce çıkış animasyonu (className'i
   isExiting'e göre seçen çağıran taraf) oynar, süre dolunca gerçek onClose
   çağrılır. Aksi halde CSS'teki fade-out/fade-down/hub-close hiç görünmez:
   pencere "tak" diye kapanır. ESC tuşu ve body kaydırma kilidi de burada.

   durationMs, kullanılan çıkış animasyonunun süresine (+ küçük bir tampon)
   eşit olmalı — bkz. index.css'teki fade-out (170ms) / hub-close (200ms). */
export function useModalDismiss(onClose: () => void, durationMs = 190) {
  const [isExiting, setIsExiting] = useState(false)
  const closingRef = useRef(false)

  const close = () => {
    if (closingRef.current) return
    closingRef.current = true
    setIsExiting(true)
    setTimeout(onClose, durationMs)
  }

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') close() }
    document.addEventListener('keydown', handler)
    return () => {
      document.body.style.overflow = ''
      document.removeEventListener('keydown', handler)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return { isExiting, close }
}
