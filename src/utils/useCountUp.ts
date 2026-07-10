import { useEffect, useRef, useState } from 'react'

/* Sayının 0'dan hedefe yumuşak tırmanışı — pencere açılış animasyonları için.
   ease-out cubic: başta hızlı, sona yaklaşırken yavaşlar. */
export function useCountUp(target: number, durationMs = 700): number {
  const [value, setValue] = useState(0)
  const rafRef = useRef<number>(0)

  useEffect(() => {
    if (target <= 0) { setValue(target); return }
    const start = performance.now()
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs)
      const eased = 1 - Math.pow(1 - t, 3)
      setValue(Math.round(target * eased))
      if (t < 1) rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [target, durationMs])

  return value
}
