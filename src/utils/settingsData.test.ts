import { beforeEach, describe, expect, it, vi } from 'vitest'
import { applyImportPreview, exportData, inspectImportData, resetAllData, storage } from './storage'

describe('settings data safety', () => {
  beforeEach(() => {
    const values = new Map<string, string>()
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
      removeItem: (key: string) => values.delete(key),
      clear: () => values.clear(),
      key: (index: number) => [...values.keys()][index] ?? null,
      get length() { return values.size },
    })
  })

  it('previews a Luupi backup without writing it', () => {
    storage.setUserProfile({ username: 'Ada', streak: 2, longestStreak: 3, totalExp: 50, level: 1, badges: [], lastActiveDate: '' })
    const json = exportData()
    localStorage.clear()
    const preview = inspectImportData(json)
    expect(preview?.itemCount).toBeGreaterThan(0)
    expect(storage.getUserProfile().username).toBe('Luupi Kullanıcısı')
    expect(preview && applyImportPreview(preview)).toBe(true)
    expect(storage.getUserProfile().username).toBe('Ada')
  })

  it('rejects malformed known values', () => {
    expect(inspectImportData(JSON.stringify({
      app: 'luupi', version: 1, exportedAt: new Date().toISOString(), data: { luupi_habits: 'not-an-array' },
    }))).toBeNull()
  })

  it('rejects backups from a newer unsupported schema', () => {
    expect(inspectImportData(JSON.stringify({
      app: 'luupi', version: 999, exportedAt: new Date().toISOString(), data: { luupi_habits: [] },
    }))).toBeNull()
  })

  it('normalizes legacy emoji fields while importing an old backup', () => {
    const preview = inspectImportData(JSON.stringify({
      app: 'luupi',
      version: 3,
      exportedAt: new Date().toISOString(),
      data: {
        luupi_categories: [{ id: 'custom_water', name: 'Su', emoji: '💧', color: '#22c55e', isCustom: true }],
        luupi_habits: [{
          id: 'water',
          name: 'Su iç',
          emoji: '💧',
          categoryId: 'custom_water',
          createdAt: '2026-07-01T08:00:00.000Z',
        }],
      },
    }))
    expect(preview && applyImportPreview(preview)).toBe(true)
    expect(storage.getCustomCategories()[0]).toMatchObject({ icon: 'water' })
    expect(storage.getHabits()[0]).toMatchObject({ icon: 'water' })
    expect(JSON.parse(localStorage.getItem('luupi_habits') ?? '[]')[0]).not.toHaveProperty('emoji')
  })

  it('resets the theme preference with app data', async () => {
    localStorage.setItem('luupi_theme', 'dark')
    storage.setWelcomeSeen(true)
    await resetAllData()
    expect(localStorage.getItem('luupi_theme')).toBeNull()
    expect(storage.getWelcomeSeen()).toBe(false)
  })
})
