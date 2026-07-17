export type PomodoroPhase = 'idle' | 'work' | 'work-done' | 'break' | 'break-done'
export type PomodoroVisualState = 'idle' | 'focus' | 'paused' | 'work-complete' | 'break' | 'break-complete'

export function getPomodoroVisualState(phase: PomodoroPhase, isPaused: boolean): PomodoroVisualState {
  if (phase === 'idle') return 'idle'
  if (phase === 'work-done') return 'work-complete'
  if (phase === 'break-done') return 'break-complete'
  if (isPaused) return 'paused'
  return phase === 'break' ? 'break' : 'focus'
}

export const POMODORO_STATE_COPY: Record<PomodoroVisualState, { label: string; cue: string }> = {
  idle: { label: 'HAZIR', cue: 'Tek bir şeye yer aç.' },
  focus: { label: 'ODAK', cue: 'Ritmi koru, gerisini sessize al.' },
  paused: { label: 'DURAKLATILDI', cue: 'Hazır olduğunda kaldığın yerden devam et.' },
  'work-complete': { label: 'ODAK TAMAMLANDI', cue: 'İyi iş. Şimdi zihnine alan aç.' },
  break: { label: 'MOLA', cue: 'Ayağa kalk, nefes al, yenilen.' },
  'break-complete': { label: 'YENİ TURA HAZIR', cue: 'Enerjini topladın. Bir tur daha?' },
}

export function formatFocusTotal(seconds: number): string {
  if (seconds > 0 && seconds < 60) return '<1 dk'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes} dk`
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  return rest === 0 ? `${hours} sa` : `${hours} sa ${rest} dk`
}
