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
      {/* Ambient blobs — green base + blue accents for glass reflections */}
      <div className="ambient">
        {/* Emerald — top */}
        <div className="ambient-blob" style={{
          top: '-12%', left: '18%', width: 700, height: 700,
          background: 'radial-gradient(circle, rgba(16,185,129,0.12) 0%, rgba(5,150,105,0.05) 55%, transparent 70%)',
          animation: 'blob-drift-1 15s ease-in-out infinite',
        }} />
        {/* Blue/indigo — top right (feeds glass card reflections) */}
        <div className="ambient-blob" style={{
          top: '5%', right: '-5%', width: 550, height: 550,
          background: 'radial-gradient(circle, rgba(37,99,235,0.13) 0%, rgba(67,56,202,0.06) 55%, transparent 70%)',
          animation: 'blob-drift-2 19s ease-in-out infinite 1s',
        }} />
        {/* Deep forest green — bottom right */}
        <div className="ambient-blob" style={{
          bottom: '3%', right: '-10%', width: 580, height: 580,
          background: 'radial-gradient(circle, rgba(5,150,105,0.10) 0%, rgba(4,120,87,0.04) 55%, transparent 70%)',
          animation: 'blob-drift-3 20s ease-in-out infinite',
        }} />
        {/* Indigo — bottom left */}
        <div className="ambient-blob" style={{
          bottom: '15%', left: '-8%', width: 450, height: 450,
          background: 'radial-gradient(circle, rgba(55,65,220,0.10) 0%, transparent 65%)',
          animation: 'blob-drift-1 13s ease-in-out infinite 3s',
        }} />
        {/* Mint — mid center */}
        <div className="ambient-blob" style={{
          top: '45%', left: '35%', width: 380, height: 380,
          background: 'radial-gradient(circle, rgba(52,211,153,0.07) 0%, transparent 65%)',
          animation: 'blob-drift-2 25s ease-in-out infinite 5s',
        }} />
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
