import { useNavigate } from 'react-router-dom'

// Hub'dan açılan sayfalar (Just Start, Pomodoro, İstatistikler...) alt sekme
// çubuğunda yer almaz — bu çubuk onlara geri dönüş yolu verir.
export default function BackBar({ title }: { title?: string }) {
  const navigate = useNavigate()
  const goBack = () => {
    if (window.history.length > 1) navigate(-1)
    else navigate('/')
  }
  return (
    <div className="flex items-center gap-2 mb-4 -ml-1">
      <button
        onClick={goBack}
        aria-label="Geri"
        className="btn-press flex items-center gap-1 pl-2 pr-3.5 py-1.5 rounded-full text-[13px] font-semibold"
        style={{
          background: 'rgba(26,23,38,0.05)',
          border: '1px solid rgba(26,23,38,0.09)',
          color: 'rgba(26,23,38,0.6)',
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path d="M15 5l-7 7 7 7" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Geri
      </button>
      {title && (
        <span className="text-[13px] font-semibold" style={{ color: 'rgba(26,23,38,0.35)' }}>{title}</span>
      )}
    </div>
  )
}
