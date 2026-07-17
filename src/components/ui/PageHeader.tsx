import type { ReactNode } from 'react'

interface Props {
  title: string
  subtitle?: string
  action?: ReactNode
}

export default function PageHeader({ title, subtitle, action }: Props) {
  return (
    <div className="flex items-end justify-between gap-4 pt-1">
      <div className="min-w-0">
        <h1 className="type-page-title sm:text-[38px]" style={{ color: 'rgb(var(--text-primary))' }}>
          {title}
        </h1>
        {subtitle && (
          <p className="type-body mt-2 max-w-[32ch]" style={{ color: 'rgb(var(--text-secondary))' }}>
            {subtitle}
          </p>
        )}
      </div>
      {action}
    </div>
  )
}
