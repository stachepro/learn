import type { ReactNode } from 'react'
import { hapticEvent } from '../../utils/haptics'
import SurfaceCard from '../ui/SurfaceCard'

export function SettingsSection({ eyebrow, title, children, tone = 'neutral' }: {
  eyebrow: string
  title: string
  children: ReactNode
  tone?: 'neutral' | 'lime' | 'info' | 'amber'
}) {
  return (
    <section className={`settings-section settings-section--${tone}`}>
      <header><span>{eyebrow}</span><h2>{title}</h2></header>
      <SurfaceCard variant="base" className="settings-section__surface">{children}</SurfaceCard>
    </section>
  )
}

export function SettingsRow({ icon, title, description, value, children, onClick, disabled, tone = 'default' }: {
  icon: ReactNode
  title: string
  description?: string
  value?: string
  children?: ReactNode
  onClick?: () => void
  disabled?: boolean
  tone?: 'default' | 'danger'
}) {
  const content = (
    <>
      <span className="settings-row__icon" aria-hidden>{icon}</span>
      <span className="settings-row__copy"><strong>{title}</strong>{description && <small>{description}</small>}</span>
      {value && <span className="settings-row__value">{value}</span>}
      {children}
      {onClick && <span className="settings-row__chevron" aria-hidden>›</span>}
    </>
  )

  if (onClick) {
    return <button type="button" className={`settings-row settings-row--interactive settings-row--${tone}`} onClick={() => { void hapticEvent('selection'); onClick() }} disabled={disabled}>{content}</button>
  }
  return <div className={`settings-row settings-row--${tone} ${disabled ? 'is-disabled' : ''}`}>{content}</div>
}

export function SettingsToggle({ checked, onChange, label, disabled }: {
  checked: boolean
  onChange: (checked: boolean) => void
  label: string
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      className={`settings-toggle ${checked ? 'is-on' : ''}`}
      onClick={() => { void hapticEvent('selection'); onChange(!checked) }}
    >
      <span />
    </button>
  )
}

export function SettingsSegmented<T extends string | number>({ value, options, onChange, label }: {
  value: T
  options: readonly { value: T; label: string; icon?: ReactNode }[]
  onChange: (value: T) => void
  label: string
}) {
  return (
    <div className="settings-segmented" role="radiogroup" aria-label={label}>
      {options.map((option) => (
        <button
          type="button"
          role="radio"
          aria-checked={value === option.value}
          className={value === option.value ? 'is-active' : ''}
          key={option.value}
          onClick={() => { void hapticEvent('selection'); onChange(option.value) }}
        >
          {option.icon && <span aria-hidden>{option.icon}</span>}
          <strong>{option.label}</strong>
        </button>
      ))}
    </div>
  )
}
