import { forwardRef, type ButtonHTMLAttributes, type MouseEvent, type ReactNode } from 'react'
import { runHapticCue, type HapticCue } from '../../utils/haptics'

export type ButtonTone = 'primary' | 'secondary' | 'tonal' | 'quiet' | 'destructive'
export type ButtonSize = 'sm' | 'md' | 'lg'

interface AppButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  tone?: ButtonTone
  children: ReactNode
  block?: boolean
  size?: ButtonSize
  loading?: boolean
  leadingIcon?: ReactNode
  trailingIcon?: ReactNode
  haptic?: 'none' | HapticCue
}

const AppButton = forwardRef<HTMLButtonElement, AppButtonProps>(function AppButton({
  tone = 'primary',
  size = 'md',
  children,
  block,
  loading = false,
  leadingIcon,
  trailingIcon,
  haptic = 'none',
  className = '',
  disabled,
  onClick,
  type = 'button',
  ...props
}, ref) {
  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    if (haptic !== 'none') void runHapticCue(haptic)
    onClick?.(event)
  }

  return (
    <button
      ref={ref}
      {...props}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      onClick={handleClick}
      className={`app-button app-button--${tone} app-button--${size} ${block ? 'app-button--block' : ''} ${className}`.trim()}
    >
      {loading ? <span className="app-button__spinner" aria-hidden /> : leadingIcon}
      <span>{children}</span>
      {!loading && trailingIcon}
    </button>
  )
})

export default AppButton
