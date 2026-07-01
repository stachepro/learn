import { BrowserRouter, Routes, Route, Outlet, useLocation } from 'react-router-dom'
import { useRef } from 'react'
import { AppProvider } from './context/AppContext'
import { PomodoroProvider } from './context/PomodoroContext'
import Nav from './components/Nav'
import PomodoroBar from './components/PomodoroBar'
import PomodoroAmbience from './components/PomodoroAmbience'
import Dashboard from './pages/Dashboard'
import Habits from './pages/Habits'
import History from './pages/History'
import Profile from './pages/Profile'
import JustStart from './pages/JustStart'
import Stats from './pages/Stats'
import Pomodoro from './pages/Pomodoro'
import HabitStats from './pages/HabitStats'
import NoRush from './pages/NoRush'

const ROUTE_ORDER = ['/', '/habits', '/history', '/profile', '/just-start', '/stats', '/pomodoro', '/acele-yok']

function AnimatedOutlet() {
  const location = useLocation()
  const dirRef = useRef({ prevPath: location.pathname, cls: 'page-slide-right' })

  if (dirRef.current.prevPath !== location.pathname) {
    const prevIdx = ROUTE_ORDER.indexOf(dirRef.current.prevPath)
    const nextIdx = ROUTE_ORDER.indexOf(location.pathname)
    dirRef.current.cls = nextIdx >= prevIdx ? 'page-slide-right' : 'page-slide-left'
    dirRef.current.prevPath = location.pathname
  }

  return (
    <main key={location.key} className={dirRef.current.cls}>
      <Outlet />
    </main>
  )
}

function Layout() {
  return (
    <div className="min-h-screen relative">
      <PomodoroAmbience />
      <div className="relative z-10">
        <Nav />
        <AnimatedOutlet />
        <PomodoroBar />
      </div>
    </div>
  )
}

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter basename={import.meta.env.BASE_URL}>
        <PomodoroProvider>
          <Routes>
            <Route element={<Layout />}>
              <Route index element={<Dashboard />} />
              <Route path="habits" element={<Habits />} />
              <Route path="history" element={<History />} />
              <Route path="profile" element={<Profile />} />
              <Route path="just-start" element={<JustStart />} />
              <Route path="stats" element={<Stats />} />
              <Route path="pomodoro" element={<Pomodoro />} />
              <Route path="acele-yok" element={<NoRush />} />
              <Route path="habit/:id/stats" element={<HabitStats />} />
            </Route>
          </Routes>
        </PomodoroProvider>
      </BrowserRouter>
    </AppProvider>
  )
}
