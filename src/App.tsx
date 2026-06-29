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

const ROUTE_ORDER = ['/', '/habits', '/history', '/profile', '/just-start']

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
      {/* Ambient drifting glow blobs — faint green atmosphere over near-black */}
      <div className="ambient">
        {/* Green — top right (hero accent) */}
        <div className="ambient-blob" style={{
          top: '-10%', right: '-8%', width: 580, height: 580,
          background: 'radial-gradient(circle, rgba(34,197,94,0.22) 0%, transparent 66%)',
          animation: 'blob-drift-1 17s ease-in-out infinite',
        }} />
        {/* Teal — top left */}
        <div className="ambient-blob" style={{
          top: '6%', left: '-12%', width: 500, height: 500,
          background: 'radial-gradient(circle, rgba(45,212,191,0.14) 0%, transparent 68%)',
          animation: 'blob-drift-2 21s ease-in-out infinite 1s',
        }} />
        {/* Deep green — bottom right */}
        <div className="ambient-blob" style={{
          bottom: '0%', right: '-14%', width: 620, height: 620,
          background: 'radial-gradient(circle, rgba(22,163,74,0.16) 0%, transparent 68%)',
          animation: 'blob-drift-3 24s ease-in-out infinite',
        }} />
        {/* Cool indigo — bottom left (subtle contrast) */}
        <div className="ambient-blob" style={{
          bottom: '14%', left: '-10%', width: 440, height: 440,
          background: 'radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 66%)',
          animation: 'blob-drift-1 19s ease-in-out infinite 3s',
        }} />
      </div>

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
            </Route>
          </Routes>
        </PomodoroProvider>
      </BrowserRouter>
    </AppProvider>
  )
}
