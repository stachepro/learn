import { describe, expect, it } from 'vitest'
import { orderManagementActions } from './management'

describe('management action ordering', () => {
  it('keeps normal and state actions before destructive actions', () => {
    const actions = orderManagementActions([
      { id: 'delete', tone: 'destructive' },
      { id: 'edit', tone: 'secondary' },
      { id: 'pin', tone: 'tonal' },
    ])
    expect(actions.map((action) => action.id)).toEqual(['edit', 'pin', 'delete'])
  })

  it('preserves relative order inside each action group', () => {
    const actions = orderManagementActions([
      { id: 'archive' },
      { id: 'delete', tone: 'destructive' },
      { id: 'reset', tone: 'destructive' },
    ])
    expect(actions.map((action) => action.id)).toEqual(['archive', 'delete', 'reset'])
  })
})
