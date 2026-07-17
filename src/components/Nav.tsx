import { useLocation, useNavigate } from 'react-router-dom'
import { useEffect, useRef, useState, type CSSProperties } from 'react'
import ToolsHub from './tools/ToolsHub'
import { hapticEvent } from '../utils/haptics'

type IconProps = { size?: number; strokeWidth?: number; color?: string }

function IconCalendar({ size = 22, strokeWidth = 1.6, color = 'currentColor' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18M8 14h2M12 14h2M16 14h.01" />
    </svg>
  )
}

function IconListChecks({ size = 22, strokeWidth = 1.6, color = 'currentColor' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="m9 11 3 3L22 4M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
    </svg>
  )
}

function IconLayoutGrid({ size = 20, strokeWidth = 2, color = 'currentColor' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
    </svg>
  )
}

function IconBarChart({ size = 22, strokeWidth = 1.6, color = 'currentColor' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M18 20V10M12 20V4M6 20v-6M2 20h20" />
    </svg>
  )
}

function IconUser({ size = 22, strokeWidth = 1.6, color = 'currentColor' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
    </svg>
  )
}

const TOOL_ROUTES = ['/pomodoro', '/just-start', '/acele-yok', '/todo', '/uyandim', '/su-takibi', '/stats']

const navItems = [
  { to: '/', label: 'Bugün', Icon: IconCalendar },
  { to: '/habits', label: 'Alışkanlıklar', Icon: IconListChecks },
  { to: null, label: 'Araçlar', Icon: IconLayoutGrid, featured: true },
  { to: '/ozet', label: 'Özet', Icon: IconBarChart },
  { to: '/profile', label: 'Profil', Icon: IconUser },
] as const

function routeIndex(pathname: string): number {
  if (pathname === '/') return 0
  if (pathname === '/habits' || pathname.startsWith('/habit/')) return 1
  if (TOOL_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`))) return 2
  if (pathname === '/ozet') return 3
  if (pathname === '/profile' || pathname === '/settings' || pathname === '/history') return 4
  return 0
}

export default function Nav() {
  const [showHub, setShowHub] = useState(false)
  const toolsButtonRef = useRef<HTMLButtonElement>(null)
  const location = useLocation()
  const navigate = useNavigate()
  const activeIndex = showHub ? 2 : routeIndex(location.pathname)

  useEffect(() => setShowHub(false), [location.pathname])

  const selectItem = (index: number, path: string | null) => {
    if (index === 2) {
      if (showHub) {
        window.dispatchEvent(new Event('luupi-tools-close'))
        return
      }
      void hapticEvent('featured')
      setShowHub(true)
      return
    }
    void hapticEvent('selection')
    if (showHub && path) {
      window.dispatchEvent(new CustomEvent('luupi-tools-navigate', { detail: { path } }))
      return
    }
    setShowHub(false)
    if (path === location.pathname) {
      document.getElementById('app-scroll')?.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }
    if (path) navigate(path)
  }

  return (
    <>
      {showHub && <ToolsHub onClose={() => setShowHub(false)} returnFocusRef={toolsButtonRef} />}

      <div className="adaptive-nav-dock">
        <nav
          className="adaptive-nav"
          aria-label="Ana navigasyon"
          style={{ '--active-index': activeIndex } as CSSProperties}
        >
          <span className="adaptive-nav__notch" aria-hidden />
          {navItems.map(({ to, label, Icon, ...item }, index) => {
            const active = activeIndex === index
            const featured = 'featured' in item && item.featured
            return (
              <button
                ref={featured ? toolsButtonRef : undefined}
                key={label}
                type="button"
                className={`adaptive-nav__item ${active ? 'adaptive-nav__item--active' : ''} ${featured ? 'adaptive-nav__item--featured' : ''}`}
                onClick={() => selectItem(index, to)}
                aria-label={label}
                aria-current={active ? 'page' : undefined}
                aria-expanded={featured ? showHub : undefined}
                aria-haspopup={featured ? 'dialog' : undefined}
              >
                <span className="adaptive-nav__orb">
                  <Icon size={featured ? 23 : 21} strokeWidth={active ? 2.35 : featured ? 2.1 : 1.7} />
                  {featured && !active && <span className="adaptive-nav__featured-dot" aria-hidden />}
                </span>
                <span className="adaptive-nav__label">{label}</span>
              </button>
            )
          })}
        </nav>
      </div>
    </>
  )
}
