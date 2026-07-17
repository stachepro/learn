import { describe, expect, it } from 'vitest'
import { defaultHabitLog, migrateHabitLog } from './habitLog'

describe('habit day status migration', () => {
  it('old logs remain pending by default', () => {
    expect(defaultHabitLog().skippedAt).toBeUndefined()
    expect(migrateHabitLog({}).skippedAt).toBeUndefined()
  })

  it('keeps an explicit skipped timestamp', () => {
    expect(migrateHabitLog({ skippedAt: '2026-07-15T10:00:00.000Z' }).skippedAt)
      .toBe('2026-07-15T10:00:00.000Z')
  })

  it('completed wins over stale skipped data', () => {
    expect(migrateHabitLog({ completed: true, skippedAt: '2026-07-15T10:00:00.000Z' }).skippedAt)
      .toBeUndefined()
  })
})
