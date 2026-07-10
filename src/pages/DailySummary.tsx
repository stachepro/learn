import { useState, useEffect } from 'react'

export default function DailySummary() {
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])

  return (
    <div className={`max-w-3xl mx-auto px-4 py-6 pb-40 sm:pb-8 space-y-5 ${mounted ? 'page-enter' : 'opacity-0'}`}>
      <div>
        <h1 className="display text-3xl font-extrabold" style={{ color: '#1a1726' }}>Özet</h1>
        <p className="text-sm mt-1" style={{ color: 'rgba(26,23,38,0.55)' }}>Günlük özet</p>
      </div>
    </div>
  )
}
