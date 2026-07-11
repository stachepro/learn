import { BrowserRouter, Routes, Route, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useEffect, useRef } from 'react'
import { Capacitor } from '@capacitor/core'
import { LocalNotifications } from '@capacitor/local-notifications'
import { AppProvider } from './context/AppContext'
import { PomodoroProvider } from './context/PomodoroContext'
import ErrorBoundary from './components/ErrorBoundary'
import Nav from './components/Nav'
import AchievementToast from './components/AchievementToast'
import StreakToast from './components/StreakToast'
import PomodoroBar from './components/PomodoroBar'
import PomodoroAmbience from './components/PomodoroAmbience'
import FocusMode from './components/FocusMode'
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

const ROUTE_ORDER = ['/', '/habits', '/ozet', '/profile', '/settings', '/just-start', '/stats', '/pomodoro', '/acele-yok', '/todo', '/uyandim', '/su-takibi', '/history']

function AnimatedOutlet() {
  const location = useLocation()
  const dirRef = useRef({ prevPath: location.pathname, cls: 'page-slide-right' })

  if (dirRef.current.prevPath !== location.pathname) {
    const prevIdx = ROUTE_ORDER.indexOf(dirRef.current.prevPath)
    const nextIdx = ROUTE_ORDER.indexOf(location.pathname)
    dirRef.current.cls = nextIdx >= prevIdx ? 'page-slide-right' : 'page-slide-left'
    dirRef.current.prevPath = location.pathname
  }

  useEffect(() => {
    document.getElementById('app-scroll')?.scrollTo(0, 0)
  }, [location.pathname])

  return (
    <main key={location.key} className={dirRef.current.cls}>
      <Outlet />
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
      if (route) navigate(route)
    })
    return () => { void sub.then((s) => s.remove()) }
  }, [navigate])
  return null
}

function Layout() {
  return (
    <div className="h-full relative">
      <PomodoroAmbience />
      <div className="relative z-10 flex flex-col h-full">
        <NotificationRouter />
        <AchievementToast />
        <StreakToast />
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
        <div id="app-scroll" className="app-scroll flex-1">
          <AnimatedOutlet />
        </div>
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
            <Routes>
              <Route element={<Layout />}>
                <Route index element={<Dashboard />} />
                <Route path="habits" element={<Habits />} />
                <Route path="ozet" element={<DailySummary />} />
                <Route path="history" element={<History />} />
                <Route path="profile" element={<Profile />} />
                <Route path="settings" element={<Settings />} />
                <Route path="just-start" element={<JustStart />} />
                <Route path="stats" element={<Stats />} />
                <Route path="pomodoro" element={<Pomodoro />} />
                <Route path="acele-yok" element={<NoRush />} />
                <Route path="todo" element={<Todo />} />
                <Route path="uyandim" element={<WakeUp />} />
                <Route path="su-takibi" element={<WaterTracker />} />
                <Route path="habit/:id/stats" element={<HabitStats />} />
              </Route>
            </Routes>
          </PomodoroProvider>
        </BrowserRouter>
      </AppProvider>
    </ErrorBoundary>
  )
}
