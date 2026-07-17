import { describe, expect, it, vi } from 'vitest'
import {
  enqueueToast,
  resolveToastDuration,
  TOAST_QUEUE_LIMIT,
  type ToastQueueItem,
  type ToastTone,
} from './toast'

function item(id: string, tone: ToastTone, createdAt = 1000, dedupeKey = id): ToastQueueItem {
  return { id, tone, title: id, duration: 3000, createdAt, dedupeKey }
}

describe('resolveToastDuration', () => {
  it('açık süreyi korur', () => {
    expect(resolveToastDuration({ title: 'Test', duration: 1234 })).toBe(1234)
  })

  it('aksiyonlu feedback için daha uzun süre verir', () => {
    expect(resolveToastDuration({ title: 'Kaydedildi', action: { label: 'Geri Al', onPress: vi.fn() } })).toBe(6000)
  })

  it('hata ve ödülü standart mesajdan daha uzun tutar', () => {
    expect(resolveToastDuration({ tone: 'error', title: 'Olmadı' })).toBe(4500)
    expect(resolveToastDuration({ tone: 'reward', title: 'Rozet' })).toBe(4500)
    expect(resolveToastDuration({ title: 'Bilgi', message: 'Açıklama' })).toBe(3800)
    expect(resolveToastDuration({ title: 'Kısa' })).toBe(2800)
  })
})

describe('enqueueToast', () => {
  it('aktif toastı yerinde tutup bekleyenleri önceliğe göre dizer', () => {
    const active = item('active', 'info')
    const success = item('success', 'success', 1001)
    const error = item('error', 'error', 1002)
    const queue = enqueueToast(enqueueToast([active], success, 1001), error, 1002)
    expect(queue.map((toast) => toast.id)).toEqual(['active', 'error', 'success'])
  })

  it('aynı dedupe anahtarını ikinci kez kuyruğa almaz', () => {
    const first = item('first', 'info', 1000, 'settings-theme')
    const duplicate = item('second', 'info', 1001, 'settings-theme')
    expect(enqueueToast([first], duplicate, 1001)).toEqual([first])
  })

  it('eski bekleyen feedback yerine yeni sonucu kabul eder', () => {
    const active = item('active', 'success', 20_000)
    const stale = item('stale', 'info', 1)
    const fresh = item('fresh', 'warning', 20_001)
    expect(enqueueToast([active, stale], fresh, 20_001).map((toast) => toast.id)).toEqual(['active', 'fresh'])
  })

  it('kuyruğu belirlenen sınırda tutar', () => {
    let queue = [item('active', 'info')]
    for (let index = 0; index < 8; index += 1) {
      queue = enqueueToast(queue, item(`item-${index}`, index % 2 ? 'success' : 'info', 1001 + index), 1001 + index)
    }
    expect(queue).toHaveLength(TOAST_QUEUE_LIMIT)
  })
})
