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
    <div className="min-h-screen relative">
      {/* Ambient blurred glass blobs — echo the tile palette behind the slate ground */}
      <div className="ambient">
        {/* Amber — top right */}
        <div className="ambient-blob" style={{
          top: '-8%', right: '-6%', width: 560, height: 560,
          background: 'radial-gradient(circle, rgba(224,150,60,0.30) 0%, transparent 68%)',
          animation: 'blob-drift-1 17s ease-in-out infinite',
        }} />
        {/* Teal — top left */}
        <div className="ambient-blob" style={{
          top: '4%', left: '-10%', width: 520, height: 520,
          background: 'radial-gradient(circle, rgba(120,170,162,0.30) 0%, transparent 68%)',
          animation: 'blob-drift-2 21s ease-in-out infinite 1s',
        }} />
        {/* Sky blue — bottom right */}
        <div className="ambient-blob" style={{
          bottom: '2%', right: '-12%', width: 600, height: 600,
          background: 'radial-gradient(circle, rgba(95,150,200,0.26) 0%, transparent 68%)',
          animation: 'blob-drift-3 24s ease-in-out infinite',
        }} />
        {/* Lime — bottom left */}
        <div className="ambient-blob" style={{
          bottom: '12%', left: '-8%', width: 440, height: 440,
          background: 'radial-gradient(circle, rgba(160,185,90,0.24) 0%, transparent 66%)',
          animation: 'blob-drift-1 19s ease-in-out infinite 3s',
        }} />
        {/* Cream — center */}
        <div className="ambient-blob" style={{
          top: '40%', left: '36%', width: 400, height: 400,
          background: 'radial-gradient(circle, rgba(220,205,140,0.20) 0%, transparent 66%)',
          animation: 'blob-drift-2 27s ease-in-out infinite 5s',
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
      <BrowserRouter basename={import.meta.env.BASE_URL}>
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
