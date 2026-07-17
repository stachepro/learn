import { createContext, useContext, type ReactNode } from 'react'
import type { HapticFeedback } from './haptics'

export type ToastTone = 'success' | 'info' | 'warning' | 'reward' | 'error'

export interface ToastAction {
  label: string
  onPress: () => void
}

export interface ToastOptions {
  id?: string
  tone?: ToastTone
  title: string
  message?: string
  contextIcon?: ReactNode
  // Legacy callers may keep using icon while they migrate; it is rendered as context, not semantics.
  icon?: ReactNode
  duration?: number
  haptic?: HapticFeedback | 'none'
  action?: ToastAction
  dedupeKey?: string
}

export interface ToastQueueItem extends ToastOptions {
  id: string
  tone: ToastTone
  duration: number
  createdAt: number
  dedupeKey: string
}

export const TOAST_QUEUE_LIMIT = 4
export const TOAST_STALE_AFTER = 12_000

export function toastPriority(tone: ToastTone): number {
  if (tone === 'error') return 5
  if (tone === 'reward') return 4
  if (tone === 'warning') return 3
  if (tone === 'success') return 2
  return 1
}

export function resolveToastDuration(options: ToastOptions): number {
  if (options.duration !== undefined) return options.duration
  if (options.action) return 6000
  if (options.tone === 'error' || options.tone === 'reward') return 4500
  if (options.message) return 3800
  return 2800
}

export function enqueueToast(existing: ToastQueueItem[], item: ToastQueueItem, now = Date.now()): ToastQueueItem[] {
  if (existing.length === 0) return [item]

  const current = existing[0]
  const pending = existing.slice(1).filter((toast) => now - toast.createdAt <= TOAST_STALE_AFTER)
  const fresh = [current, ...pending]
  if (fresh.some((toast) => toast.id === item.id || toast.dedupeKey === item.dedupeKey)) return fresh
  pending.push(item)
  pending.sort((a, b) => toastPriority(b.tone) - toastPriority(a.tone) || a.createdAt - b.createdAt)
  return [current, ...pending.slice(0, TOAST_QUEUE_LIMIT - 1)]
}

export interface ToastContextValue {
  showToast: (options: ToastOptions) => void
}

export const ToastContext = createContext<ToastContextValue | null>(null)

export function showToast(options: ToastOptions): void {
  window.dispatchEvent(new CustomEvent<ToastOptions>('luupi-toast', { detail: options }))
}

export function useToast(): ToastContextValue {
  const value = useContext(ToastContext)
  if (!value) throw new Error('useToast must be used inside ToastProvider')
  return value
}
