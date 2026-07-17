import { Capacitor } from '@capacitor/core'
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics'

export type HapticImpact = 'light' | 'medium'
export type HapticFeedback = HapticImpact | 'success' | 'warning' | 'error' | 'selection'
export type HapticEvent =
  | 'selection'
  | 'control'
  | 'featured'
  | 'long-press'
  | 'gesture-threshold'
  | 'success'
  | 'skip'
  | 'error'
  | 'reward'
export type HapticCue = HapticFeedback | HapticEvent

async function onNative(action: () => Promise<void>): Promise<void> {
  if (!Capacitor.isNativePlatform()) return
  try {
    await action()
  } catch {
    // Haptics are supportive feedback; they must never block the user action.
  }
}

export function hapticImpact(style: HapticImpact = 'light'): Promise<void> {
  return onNative(() => Haptics.impact({ style: style === 'medium' ? ImpactStyle.Medium : ImpactStyle.Light }))
}

export function hapticSelection(): Promise<void> {
  return onNative(async () => {
    await Haptics.selectionStart()
    await Haptics.selectionChanged()
    await Haptics.selectionEnd()
  })
}

export function hapticNotification(type: 'success' | 'warning' | 'error'): Promise<void> {
  const notificationType = type === 'success'
    ? NotificationType.Success
    : type === 'warning'
      ? NotificationType.Warning
      : NotificationType.Error
  return onNative(() => Haptics.notification({ type: notificationType }))
}

export function runHaptic(feedback: HapticFeedback): Promise<void> {
  if (feedback === 'light' || feedback === 'medium') return hapticImpact(feedback)
  if (feedback === 'selection') return hapticSelection()
  return hapticNotification(feedback)
}

const eventFeedback: Record<HapticEvent, HapticFeedback> = {
  selection: 'selection',
  control: 'light',
  featured: 'medium',
  'long-press': 'medium',
  'gesture-threshold': 'medium',
  success: 'success',
  skip: 'warning',
  error: 'error',
  reward: 'success',
}

export function feedbackForHapticEvent(event: HapticEvent): HapticFeedback {
  return eventFeedback[event]
}

export function hapticEvent(event: HapticEvent): Promise<void> {
  return runHaptic(feedbackForHapticEvent(event))
}

export function runHapticCue(cue: HapticCue): Promise<void> {
  if (cue === 'control' || cue === 'featured' || cue === 'long-press' || cue === 'gesture-threshold' || cue === 'skip' || cue === 'reward') {
    return hapticEvent(cue)
  }
  return runHaptic(cue)
}
