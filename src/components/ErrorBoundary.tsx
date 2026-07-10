import { Component, type ErrorInfo, type ReactNode } from 'react'
import { captureError, toCrashEntry, type CrashEntry } from '../utils/errorReporting'

interface Props { children: ReactNode }
interface State { entry: CrashEntry | null; copied: boolean }

/* Render sırasında bir hata olursa beyaz ekran yerine bu görünür.
   Hata cihaza kaydedilir; kullanıcı detayı kopyalayıp gönderebilir. */
export default class ErrorBoundary extends Component<Props, State> {
  state: State = { entry: null, copied: false }

  // Hata ekranına bu adımda geçilir. componentDidCatch'ten önce bir render daha
  // olur; entry burada dolmazsa çocuklar yeniden render edilip tekrar çöker.
  static getDerivedStateFromError(error: Error): State {
    return { entry: toCrashEntry(error, 'render'), copied: false }
  }

  // Kalıcı kayıt ve raporlama burada: componentStack yalnızca burada var.
  componentDidCatch(error: Error, info: ErrorInfo) {
    this.setState({ entry: captureError(error, 'render', info.componentStack ?? undefined) })
  }

  private retry = () => this.setState({ entry: null, copied: false })

  private restart = () => { window.location.href = import.meta.env.BASE_URL }

  private copy = async () => {
    const { entry } = this.state
    if (!entry) return
    const text = [
      `Luupi hata raporu`,
      `Zaman: ${entry.at}`,
      `Kaynak: ${entry.source}`,
      `Mesaj: ${entry.message}`,
      entry.stack ? `\nYığın:\n${entry.stack}` : '',
      entry.componentStack ? `\nBileşen:\n${entry.componentStack}` : '',
    ].join('\n')
    try {
      await navigator.clipboard.writeText(text)
      this.setState({ copied: true })
    } catch { /* pano yoksa sessizce geç */ }
  }

  render() {
    const { entry } = this.state
    if (!entry) return this.props.children

    return (
      <div style={{
        minHeight: '100dvh', background: '#fbf7f0', color: '#1a1726',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '24px', paddingTop: 'calc(24px + env(safe-area-inset-top))',
      }}>
        <div style={{ maxWidth: 420, width: '100%' }}>
          <p style={{ fontSize: 44, lineHeight: 1, marginBottom: 16 }}>🌧️</p>
          <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8 }}>Bir şeyler ters gitti</h1>
          <p style={{ fontSize: 15, lineHeight: 1.5, opacity: 0.75, marginBottom: 20 }}>
            Verilerin cihazında duruyor, kaybolmadı. Tekrar denemek işe yaramazsa
            uygulamayı yeniden başlat.
          </p>

          <pre style={{
            background: 'rgba(26,23,38,0.05)', border: '1px solid rgba(26,23,38,0.12)',
            borderRadius: 12, padding: 12, fontSize: 12, lineHeight: 1.4,
            overflowX: 'auto', marginBottom: 20, whiteSpace: 'pre-wrap', wordBreak: 'break-word',
          }}>{entry.message}</pre>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <button onClick={this.retry} style={btn('#1a1726', '#fbf7f0')}>Tekrar dene</button>
            <button onClick={this.restart} style={btn('transparent', '#1a1726', true)}>Uygulamayı yeniden başlat</button>
            <button onClick={this.copy} style={btn('transparent', '#1a1726', true)}>
              {this.state.copied ? 'Kopyalandı ✓' : 'Hata detayını kopyala'}
            </button>
          </div>
        </div>
      </div>
    )
  }
}

function btn(bg: string, fg: string, outlined = false): React.CSSProperties {
  return {
    width: '100%', padding: '13px 16px', borderRadius: 14,
    background: bg, color: fg, fontWeight: 700, fontSize: 15,
    border: outlined ? '1.5px solid rgba(26,23,38,0.18)' : 'none',
    cursor: 'pointer',
  }
}
