import type { ReactNode } from 'react'

interface Props {
  title: string
  subtitle?: string
  action?: ReactNode
}

export default function SectionHeader({ title, subtitle, action }: Props) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <h2 className="type-section-title" style={{ color: 'rgb(var(--text-primary))' }}>
          {title}
        </h2>
        {subtitle && (
          <p className="type-caption mt-1" style={{ color: 'rgb(var(--text-tertiary))' }}>
            {subtitle}
          </p>
        )}
      </div>
      {action}
    </div>
  )
}
