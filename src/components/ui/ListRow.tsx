import type { ReactNode } from 'react'
import SurfaceCard from './SurfaceCard'

interface Props {
  title: string
  subtitle?: string
  leading: ReactNode
  trailing?: ReactNode
  onClick?: () => void
  tint?: string
}

export default function ListRow({ title, subtitle, leading, trailing, onClick, tint }: Props) {
  return (
    <SurfaceCard
      variant="base"
      interactive={Boolean(onClick)}
      onClick={onClick}
      className="w-full text-left"
      style={{
        background: tint ?? 'rgb(var(--surface-1))',
        padding: '14px 16px',
      }}
    >
      <div className="flex items-center gap-3">
        <div className="shrink-0">{leading}</div>
        <div className="min-w-0 flex-1">
          <p className="type-body font-bold tracking-tight" style={{ color: 'rgb(var(--text-primary))' }}>{title}</p>
          {subtitle && (
            <p className="type-caption mt-1 leading-5" style={{ color: 'rgb(var(--text-secondary))' }}>{subtitle}</p>
          )}
        </div>
        {trailing && <div className="shrink-0">{trailing}</div>}
      </div>
    </SurfaceCard>
  )
}
