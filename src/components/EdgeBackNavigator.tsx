import {
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import {
  type Location,
  useLocation,
  useNavigate,
  useNavigationType,
} from 'react-router-dom'
import { hapticEvent } from '../utils/haptics'
import { MOTION, prefersReducedMotion } from '../utils/motion'
import {
  createAppRouteHistory,
  previousAppRoute,
  syncAppRouteHistory,
  type AppRouteHistoryState,
} from '../utils/appRouteHistory'
import {
  capturePointer,
  edgeBackResistance,
  isEdgeBackPointer,
  releasePointer,
  resolveGestureAxis,
  shouldCommitEdgeBack,
  type GestureAxis,
} from '../utils/pointerGesture'
import { AppBackNavigationContext } from './AppBackNavigationContext'

interface EdgeSession {
  pointerId: number
  startX: number
  startY: number
  lastX: number
  lastTime: number
  velocityX: number
  axis: GestureAxis
  target: HTMLElement
  canGoBack: boolean
}

type GesturePhase = 'idle' | 'dragging' | 'settling' | 'committing'

interface GestureVisual {
  phase: GesturePhase
  offset: number
  progress: number
  previewVisible: boolean
}

interface EdgeBackNavigatorProps {
  renderPage: (location: Location, preview: boolean) => ReactNode
}

const IDLE_VISUAL: GestureVisual = {
  phase: 'idle',
  offset: 0,
  progress: 0,
  previewVisible: false,
}

function hasBlockingOverlay(): boolean {
  return Boolean(document.querySelector(
    '[aria-modal="true"], .tools-hub-layer, .focus-overlay',
  ))
}

export default function EdgeBackNavigator({ renderPage }: EdgeBackNavigatorProps) {
  const location = useLocation()
  const navigationType = useNavigationType()
  const navigate = useNavigate()
  const historyRef = useRef<AppRouteHistoryState<Location>>(createAppRouteHistory(location))
  syncAppRouteHistory(historyRef.current, location, navigationType)

  const routeHistory = historyRef.current
  const previousLocation = previousAppRoute(routeHistory)
  const canGoBack = Boolean(previousLocation)

  const currentScrollRef = useRef<HTMLDivElement>(null)
  const previewScrollRef = useRef<HTMLDivElement>(null)
  const sessionRef = useRef<EdgeSession | null>(null)
  const timerRef = useRef<number | null>(null)
  const scrollPositionsRef = useRef(new Map<string, number>())
  const [visual, setVisual] = useState<GestureVisual>(IDLE_VISUAL)

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) window.clearTimeout(timerRef.current)
    timerRef.current = null
  }, [])

  const resetGesture = useCallback(() => {
    clearTimer()
    const session = sessionRef.current
    sessionRef.current = null
    if (session) releasePointer(session.target, session.pointerId)
    setVisual(IDLE_VISUAL)
  }, [clearTimer])

  const goBack = useCallback((fallback = '/') => {
    if (historyRef.current.cursor > 0) navigate(-1)
    else if (location.pathname !== fallback) navigate(fallback)
  }, [location.pathname, navigate])

  const contextValue = useMemo(
    () => ({ canGoBack, goBack }),
    [canGoBack, goBack],
  )

  useLayoutEffect(() => {
    const scrollRoot = currentScrollRef.current
    if (!scrollRoot) return
    scrollRoot.scrollTop = scrollPositionsRef.current.get(location.key) ?? 0
  }, [location.key])

  useLayoutEffect(() => {
    if (!visual.previewVisible || !previousLocation || !previewScrollRef.current) return
    previewScrollRef.current.scrollTop = scrollPositionsRef.current.get(previousLocation.key) ?? 0
  }, [previousLocation, visual.previewVisible])

  useEffect(() => {
    resetGesture()
  }, [location.key, resetGesture])

  useEffect(() => {
    const cancelForViewportChange = () => resetGesture()
    window.addEventListener('orientationchange', cancelForViewportChange)
    return () => {
      window.removeEventListener('orientationchange', cancelForViewportChange)
      resetGesture()
    }
  }, [resetGesture])

  const settle = useCallback(() => {
    const duration = prefersReducedMotion() ? 0 : MOTION.standard
    const session = sessionRef.current
    sessionRef.current = null
    if (session) releasePointer(session.target, session.pointerId)
    setVisual((current) => ({ ...current, phase: 'settling', offset: 0, progress: 0 }))
    clearTimer()
    timerRef.current = window.setTimeout(() => {
      timerRef.current = null
      setVisual(IDLE_VISUAL)
    }, duration)
  }, [clearTimer])

  const commit = useCallback(() => {
    const duration = prefersReducedMotion() ? 0 : MOTION.navigation
    const session = sessionRef.current
    sessionRef.current = null
    if (session) releasePointer(session.target, session.pointerId)
    setVisual((current) => ({
      ...current,
      phase: 'committing',
      offset: window.innerWidth,
      progress: 1,
    }))
    void hapticEvent('selection')
    clearTimer()
    timerRef.current = window.setTimeout(() => {
      timerRef.current = null
      navigate(-1)
    }, duration)
  }, [clearTimer, navigate])

  const onPointerDownCapture = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (
      sessionRef.current
      || !isEdgeBackPointer(event.clientX, event.pointerType, event.isPrimary, event.button)
      || hasBlockingOverlay()
    ) return

    event.stopPropagation()
    sessionRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      lastX: event.clientX,
      lastTime: event.timeStamp,
      velocityX: 0,
      axis: 'pending',
      target: event.currentTarget,
      canGoBack,
    }
    setVisual({
      phase: 'dragging',
      offset: 0,
      progress: 0,
      previewVisible: canGoBack,
    })
  }

  const onPointerMoveCapture = (event: ReactPointerEvent<HTMLDivElement>) => {
    const session = sessionRef.current
    if (!session || session.pointerId !== event.pointerId) return
    event.stopPropagation()

    const deltaX = event.clientX - session.startX
    const deltaY = event.clientY - session.startY
    const nextAxis = resolveGestureAxis(deltaX, deltaY, session.axis)
    const elapsed = Math.max(1, event.timeStamp - session.lastTime)
    const instantaneousVelocity = (event.clientX - session.lastX) / elapsed
    session.velocityX = session.velocityX * 0.55 + instantaneousVelocity * 0.45
    session.lastX = event.clientX
    session.lastTime = event.timeStamp

    if (session.axis === 'pending' && nextAxis === 'vertical') {
      sessionRef.current = null
      setVisual(IDLE_VISUAL)
      return
    }
    if (session.axis === 'pending' && nextAxis === 'horizontal' && deltaX <= 0) {
      sessionRef.current = null
      setVisual(IDLE_VISUAL)
      return
    }
    session.axis = nextAxis
    if (session.axis !== 'horizontal') return

    event.preventDefault()
    capturePointer(session.target, session.pointerId)
    const width = Math.max(1, window.innerWidth)
    const offset = session.canGoBack
      ? Math.min(width, Math.max(0, deltaX))
      : edgeBackResistance(deltaX)
    setVisual({
      phase: 'dragging',
      offset,
      progress: session.canGoBack ? Math.min(1, offset / width) : 0,
      previewVisible: session.canGoBack,
    })
  }

  const onPointerUpCapture = (event: ReactPointerEvent<HTMLDivElement>) => {
    const session = sessionRef.current
    if (!session || session.pointerId !== event.pointerId) return
    event.stopPropagation()
    const deltaX = event.clientX - session.startX
    if (
      session.canGoBack
      && session.axis === 'horizontal'
      && shouldCommitEdgeBack(deltaX, session.velocityX, window.innerWidth)
    ) commit()
    else settle()
  }

  const onPointerCancelCapture = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (sessionRef.current?.pointerId !== event.pointerId) return
    settle()
  }

  const onLostPointerCapture = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (sessionRef.current?.pointerId !== event.pointerId) return
    settle()
  }

  const style = {
    '--edge-back-x': `${visual.offset}px`,
    '--edge-back-progress': visual.progress,
    '--edge-back-preview-x': `${-24 * (1 - visual.progress)}%`,
    '--edge-back-scrim-opacity': Math.max(0, 0.18 * (1 - visual.progress)),
  } as CSSProperties

  return (
    <AppBackNavigationContext.Provider value={contextValue}>
      <div
        className={`edge-back-stage edge-back-stage--${visual.phase}`}
        style={style}
        onPointerDownCapture={onPointerDownCapture}
        onPointerMoveCapture={onPointerMoveCapture}
        onPointerUpCapture={onPointerUpCapture}
        onPointerCancelCapture={onPointerCancelCapture}
        onLostPointerCapture={onLostPointerCapture}
      >
        {visual.previewVisible && previousLocation && (
          <div className="edge-back-layer edge-back-layer--preview" aria-hidden="true" inert>
            <div
              ref={previewScrollRef}
              className="app-scroll app-content edge-back-scroll edge-back-scroll--preview"
            >
              {renderPage(previousLocation, true)}
            </div>
            <span className="edge-back-preview-scrim" aria-hidden />
          </div>
        )}
        <div className="edge-back-layer edge-back-layer--current">
          <div
            id="app-scroll"
            ref={currentScrollRef}
            className="app-scroll app-content edge-back-scroll"
            onScroll={(event) => {
              scrollPositionsRef.current.set(location.key, event.currentTarget.scrollTop)
            }}
          >
            {renderPage(location, false)}
          </div>
        </div>
      </div>
    </AppBackNavigationContext.Provider>
  )
}
