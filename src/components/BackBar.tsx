import { useNavigate } from 'react-router-dom'
import AppButton from './ui/AppButton'
import { useAppBackNavigation } from './AppBackNavigationContext'

// Hub'dan açılan sayfalar (Just Start, Pomodoro, İstatistikler...) alt sekme
// çubuğunda yer almaz — bu çubuk onlara geri dönüş yolu verir.
export default function BackBar({ title }: { title?: string }) {
  const navigate = useNavigate()
  const appBack = useAppBackNavigation()
  const goBack = () => {
    if (appBack) appBack.goBack('/')
    else if (window.history.length > 1) navigate(-1)
    else navigate('/')
  }
  return (
    <nav className="app-back-bar" aria-label="Sayfa navigasyonu">
      <AppButton
        onClick={goBack}
        aria-label="Geri"
        tone="quiet"
        size="sm"
        haptic="light"
        className="app-back-bar__button"
        leadingIcon={(
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M15 5l-7 7 7 7" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      >
        Geri
      </AppButton>
      {title && (
        <span className="app-back-bar__context type-label">{title}</span>
      )}
    </nav>
  )
}
