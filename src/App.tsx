import { BrowserRouter, Routes, Route, Outlet } from 'react-router-dom'
import { AppProvider } from './context/AppContext'
import { PomodoroProvider } from './context/PomodoroContext'
import Nav from './components/Nav'
import PomodoroBar from './components/PomodoroBar'
import Dashboard from './pages/Dashboard'
import Habits from './pages/Habits'
import History from './pages/History'
import Profile from './pages/Profile'

function Layout() {
  return (
    <div className="min-h-screen relative" style={{ background: '#030e08' }}>
      {/* Ambient green glow blobs */}
      <div className="ambient">
        {/* Large emerald — top area */}
        <div
          className="ambient-blob"
          style={{
            top: '-10%', left: '20%',
            width: 650, height: 650,
            background: 'radial-gradient(circle, rgba(16,185,129,0.13) 0%, rgba(5,150,105,0.06) 55%, transparent 70%)',
            animation: 'blob-drift-1 14s ease-in-out infinite',
          }}
        />
        {/* Deep forest green — bottom right */}
        <div
          className="ambient-blob"
          style={{
            bottom: '5%', right: '-12%',
            width: 580, height: 580,
            background: 'radial-gradient(circle, rgba(5,150,105,0.11) 0%, rgba(4,120,87,0.05) 55%, transparent 70%)',
            animation: 'blob-drift-2 18s ease-in-out infinite',
          }}
        />
        {/* Mint accent — mid left */}
        <div
          className="ambient-blob"
          style={{
            top: '45%', left: '-8%',
            width: 420, height: 420,
            background: 'radial-gradient(circle, rgba(52,211,153,0.09) 0%, transparent 65%)',
            animation: 'blob-drift-3 11s ease-in-out infinite',
          }}
        />
        {/* Light lime — bottom center */}
        <div
          className="ambient-blob"
          style={{
            bottom: '-5%', left: '40%',
            width: 350, height: 350,
            background: 'radial-gradient(circle, rgba(74,222,128,0.07) 0%, transparent 65%)',
            animation: 'blob-drift-1 22s ease-in-out infinite 3s',
          }}
        />
      </div>

      <div className="relative z-10">
        <Nav />
        <main><Outlet /></main>
        <PomodoroBar />
      </div>
    </div>
  )
}

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <PomodoroProvider>
          <Routes>
            <Route element={<Layout />}>
              <Route index element={<Dashboard />} />
              <Route path="habits" element={<Habits />} />
              <Route path="history" element={<History />} />
              <Route path="profile" element={<Profile />} />
            </Route>
          </Routes>
        </PomodoroProvider>
      </BrowserRouter>
    </AppProvider>
  )
}
