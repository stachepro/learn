/* Çökme kaydı. Uygulama native bir kabukta çalıştığı için kullanıcının konsolu
   yoktur: bir hata olduğunda geriye iz kalmazsa ne olduğunu asla öğrenemeyiz.
   Bu yüzden son çökmeler cihazda saklanır ve hata ekranından kopyalanabilir.

   Uzak raporlama (Sentry vb.) setRemoteReporter ile takılır; hiçbir şey
   takılmazsa modül sessizce yalnızca yerel kayıt tutar. */

const CRASH_KEY = 'luupi_crash_log'
const MAX_CRASHES = 10

export interface CrashEntry {
  id: string
  at: string            // ISO
  message: string
  stack?: string
  componentStack?: string
  source: 'render' | 'window' | 'promise' | 'manual'
}

// En yeni başta, en fazla `max` kayıt. Saf: test edilebilsin diye ayrı tutuldu.
export function appendCrash(existing: CrashEntry[], entry: CrashEntry, max = MAX_CRASHES): CrashEntry[] {
  return [entry, ...existing].slice(0, max)
}

export function toCrashEntry(
  error: unknown,
  source: CrashEntry['source'],
  componentStack?: string,
): CrashEntry {
  const err = error instanceof Error ? error : undefined
  return {
    id: crypto.randomUUID(),
    at: new Date().toISOString(),
    message: err?.message ?? String(error),
    ...(err?.stack && { stack: err.stack }),
    ...(componentStack && { componentStack }),
    source,
  }
}

export function readCrashes(): CrashEntry[] {
  try {
    const raw = localStorage.getItem(CRASH_KEY)
    return raw ? (JSON.parse(raw) as CrashEntry[]) : []
  } catch { return [] }
}

export function clearCrashes(): void {
  try { localStorage.removeItem(CRASH_KEY) } catch { /* ignore */ }
}

type RemoteReporter = (entry: CrashEntry, error: unknown) => void
let remoteReporter: RemoteReporter | null = null

// Sentry gibi bir servis bağlanacaksa buradan takılır (DSN gerektirir).
export function setRemoteReporter(fn: RemoteReporter | null): void {
  remoteReporter = fn
}

export function captureError(
  error: unknown,
  source: CrashEntry['source'] = 'manual',
  componentStack?: string,
): CrashEntry {
  const entry = toCrashEntry(error, source, componentStack)
  // storage.write kullanılmaz: kota hatasında o da buraya raporlar, sonsuz döngü olur
  try { localStorage.setItem(CRASH_KEY, JSON.stringify(appendCrash(readCrashes(), entry))) }
  catch { /* kayıt tutulamıyorsa da akış devam etmeli */ }
  try { remoteReporter?.(entry, error) } catch { /* raporlayıcı çökerse yutulur */ }
  console.error(`[luupi:${source}]`, error)
  return entry
}

let installed = false

// React'in yakalayamadığı hatalar: olay dinleyicileri, zamanlayıcılar, reddedilen promise'ler
export function installGlobalErrorHandlers(): void {
  if (installed) return
  installed = true
  window.addEventListener('error', (e) => { captureError(e.error ?? e.message, 'window') })
  window.addEventListener('unhandledrejection', (e) => { captureError(e.reason, 'promise') })
}
