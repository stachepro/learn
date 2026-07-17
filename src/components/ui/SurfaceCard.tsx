import type { CSSProperties, HTMLAttributes, ReactNode } from 'react'

type CoreVariant = 'base' | 'raised' | 'tinted' | 'hero'
type LegacyVariant = 'g-neutral' | 'g-lime' | 'g-teal' | 'g-cream' | 'g-amber' | 'g-sky' | 'g-navy' | 'g-rust' | 'g-flame'
export type SurfaceCardVariant = CoreVariant | LegacyVariant

interface Props extends HTMLAttributes<HTMLElement> {
  children: ReactNode
  variant?: SurfaceCardVariant
  style?: CSSProperties
  interactive?: boolean
}

const legacyVariants = new Set<SurfaceCardVariant>([
  'g-neutral', 'g-lime', 'g-teal', 'g-cream', 'g-amber', 'g-sky', 'g-navy', 'g-rust', 'g-flame',
])

export default function SurfaceCard({ children, variant = 'base', interactive, className = '', onClick, ...props }: Props) {
  const isLegacy = legacyVariants.has(variant)
  const isInteractive = interactive ?? Boolean(onClick)
  const classes = isLegacy
    ? `glass ${variant} ${isInteractive ? 'surface-card--interactive' : ''} ${className}`
    : `surface-card surface-card--${variant} ${isInteractive ? 'surface-card--interactive' : ''} ${className}`

  if (isInteractive) {
    return (
      <button
        {...props as HTMLAttributes<HTMLButtonElement>}
        type="button"
        onClick={onClick}
        className={classes.trim()}
      >
        {children}
      </button>
    )
  }

  return <div {...props as HTMLAttributes<HTMLDivElement>} className={classes.trim()}>{children}</div>
}
