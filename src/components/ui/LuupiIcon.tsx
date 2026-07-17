import type { CSSProperties } from 'react'
import { ICON_REGISTRY, type IconName } from '../../utils/icons'

interface LuupiIconProps {
  name: IconName
  size?: 16 | 20 | 24 | 32 | 48 | number
  stroke?: number
  color?: string
  className?: string
  label?: string
  style?: CSSProperties
}

export default function LuupiIcon({
  name,
  size = 24,
  stroke = 1.9,
  color = 'currentColor',
  className,
  label,
  style,
}: LuupiIconProps) {
  const Icon = ICON_REGISTRY[name]
  return (
    <Icon
      className={className}
      size={size}
      stroke={stroke}
      color={color}
      aria-hidden={label ? undefined : true}
      aria-label={label}
      role={label ? 'img' : undefined}
      focusable="false"
      style={style}
    />
  )
}
