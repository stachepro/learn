import type { ToolId } from './toolsCatalog'

interface Props {
  name: ToolId
  size?: number
  strokeWidth?: number
}

export default function ToolGlyph({ name, size = 24, strokeWidth = 1.9 }: Props) {
  const common = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
  }

  if (name === 'pomodoro') {
    return <svg {...common}><path d="M9 2h6" /><path d="m16 5 1.5-1.5" /><circle cx="12" cy="13" r="8" /><path d="m12 13 3-3" /></svg>
  }
  if (name === 'just-start') {
    return <svg {...common}><path d="m13 2-9 12h7l-1 8 10-13h-7z" /></svg>
  }
  if (name === 'todo') {
    return <svg {...common}><path d="M9 5h11M9 12h11M9 19h11" /><path d="m3 5 1 1 2-2M3 12l1 1 2-2M3 19l1 1 2-2" /></svg>
  }
  if (name === 'water') {
    return <svg {...common}><path d="M12 2.5 6.5 9.3a7 7 0 1 0 11 0z" /><path d="M9 15.5a3.5 3.5 0 0 0 2.2 2.3" /></svg>
  }
  if (name === 'wake') {
    return <svg {...common}><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></svg>
  }
  if (name === 'stats') {
    return <svg {...common}><path d="M4 20V10M10 20V4M16 20v-7M22 20H2" /></svg>
  }
  return <svg {...common}><path d="M17 8h1a4 4 0 0 1 0 8h-1" /><path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4z" /><path d="M7 3v2M11 3v2M15 3v2" /></svg>
}
