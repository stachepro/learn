import { useEffect, useState } from 'react'
import { prefersReducedMotion } from './motion'

const QUERY = '(prefers-reduced-motion: reduce)'

export function useReducedMotion(): boolean {
  const [reducedMotion, setReducedMotion] = useState(prefersReducedMotion)

  useEffect(() => {
    const media = window.matchMedia(QUERY)
    const update = () => setReducedMotion(media.matches)
    update()
    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [])

  return reducedMotion
}
