import {
  BrowserRouter,
  type Location,
  type RouteObject,
  useNavigate,
  useRoutes,
} from 'react-router-dom'
import { useEffect, useRef, useState } from 'react'
import { Capacitor } from '@capacitor/core'
import { LocalNotifications } from '@capacitor/local-notifications'
import { AppProvider } from './context/AppContext'
import { PomodoroProvider } from './context/PomodoroContext'
import ErrorBoundary from './components/ErrorBoundary'
import Nav from './components/Nav'
import ToastProvider from './components/ui/ToastProvider'
import PomodoroBar from './components/PomodoroBar'
import PomodoroAmbience from './components/PomodoroAmbience'
import FocusMode from './components/FocusMode'
import WelcomeScreen from './components/WelcomeScreen'
import EdgeBackNavigator from './components/EdgeBackNavigator'
import Dashboard from './pages/Dashboard'
import Habits from './pages/Habits'
import History from './pages/History'
import Profile from './pages/Profile'
import JustStart from './pages/JustStart'
import Stats from './pages/Stats'
import Pomodoro from './pages/Pomodoro'
import HabitStats from './pages/HabitStats'
import NoRush from './pages/NoRush'
import Todo from './pages/Todo'
import WakeUp from './pages/WakeUp'
import WaterTracker from './pages/WaterTracker'
import DailySummary from './pages/DailySummary'
import Settings from './pages/Settings'
import { storage } from './utils/storage'
import { yesterdayStr } from './utils/date'

const TOOL_ROUTES = ['/just-start', '/stats', '/pomodoro', '/acele-yok', '/todo', '/uyandim', '/su-takibi']

const APP_ROUTES: RouteObject[] = [
  { path: '/', element: <Dashboard /> },
  { path: '/habits', element: <Habits /> },
  { path: '/ozet', element: <DailySummary /> },
  { path: '/history', element: <History /> },
  { path: '/profile', element: <Profile /> },
  { path: '/settings', element: <Settings /> },
  { path: '/just-start', element: <JustStart /> },
  { path: '/stats', element: <Stats /> },
  { path: '/pomodoro', element: <Pomodoro /> },
  { path: '/acele-yok', element: <NoRush /> },
  { path: '/todo', element: <Todo /> },
  { path: '/uyandim', element: <WakeUp /> },
  { path: '/su-takibi', element: <WaterTracker /> },
  { path: '/habit/:id/stats', element: <HabitStats /> },
]

function routePosition(pathname: string): number {
  if (pathname === '/') return 0
  if (pathname === '/habits' || pathname.startsWith('/habit/')) return 1
  if (TOOL_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`))) return 2
  if (pathname === '/ozet') return 3
  if (pathname === '/profile' || pathname === '/settings' || pathname === '/history') return 4
  return 0
}

function RoutePage({ routeLocation, preview }: { routeLocation: Location; preview: boolean }) {
  const element = useRoutes(APP_ROUTES, routeLocation)
  const dirRef = useRef({ prevPath: routeLocation.pathname, cls: 'app-page-forward' })

  if (dirRef.current.prevPath !== routeLocation.pathname) {
    const prevIdx = routePosition(dirRef.current.prevPath)
    const nextIdx = routePosition(routeLocation.pathname)
    dirRef.current.cls = nextIdx === prevIdx
      ? 'app-page-within'
      : nextIdx > prevIdx
        ? 'app-page-forward'
        : 'app-page-backward'
    dirRef.current.prevPath = routeLocation.pathname
  }

  return (
    <main
      key={routeLocation.key}
      className={`app-page ${preview ? 'app-page-preview' : dirRef.current.cls}`}
    >
      {element}
    </main>
  )
}

/* Bildirime dokununca hedef sayfaya götürür — gece 00:00 "günün özeti hazır"
   bildirimi extra.route = '/ozet' taşır. Router bağlamı gerektiği için Layout
   içinde görünmez bir bileşen olarak yaşar; web'de sessizce devre dışıdır. */
function NotificationRouter() {
  const navigate = useNavigate()
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return
    const sub = LocalNotifications.addListener('localNotificationActionPerformed', (action) => {
      const route = (action.notification.extra as { route?: string } | undefined)?.route
      if (route === '/ozet') navigate(`/ozet?date=${yesterdayStr()}&story=1`)
      else if (route) navigate(route)
    })
    return () => { void sub.then((s) => s.remove()) }
  }, [navigate])
  return null
}

function Layout() {
  const navigate = useNavigate()
  const [showWelcome, setShowWelcome] = useState(() => !storage.getWelcomeSeen())

  const dismissWelcome = () => {
    storage.setWelcomeSeen(true)
    setShowWelcome(false)
  }

  return (
    <div className="app-shell h-full relative">
      <PomodoroAmbience />
      <div className="relative z-10 flex flex-col h-full">
        {showWelcome && (
          <WelcomeScreen
            onStart={dismissWelcome}
            onAddHabit={() => {
              dismissWelcome()
              navigate('/habits?create=1')
            }}
          />
        )}
        <NotificationRouter />
        <Nav />
        {/* iOS çentik altı buzlu şerit — içerik kayarken durum çubuğu okunur kalır */}
        <div
          className="sm:hidden fixed top-0 inset-x-0 z-40 pointer-events-none"
          style={{
            height: 'env(safe-area-inset-top)',
            background: 'rgb(var(--canvas) / 0.82)',
            backdropFilter: 'blur(20px) saturate(140%)',
            WebkitBackdropFilter: 'blur(20px) saturate(140%)',
          }}
        />
        <EdgeBackNavigator
          renderPage={(routeLocation, preview) => (
            <RoutePage routeLocation={routeLocation} preview={preview} />
          )}
        />
        <PomodoroBar />
      </div>
      {/* Odak modu — masa saati; tüm arayüzün üstünü kaplar */}
      <FocusMode />
    </div>
  )
}

export default function App() {
  return (
    // En dışta: sağlayıcılardan biri açılışta çökerse de hata ekranı görünsün
    <ErrorBoundary>
      <AppProvider>
        <BrowserRouter basename={import.meta.env.BASE_URL}>
          <PomodoroProvider>
            <ToastProvider>
              <Layout />
            </ToastProvider>
          </PomodoroProvider>
        </BrowserRouter>
      </AppProvider>
    </ErrorBoundary>
  )
}
