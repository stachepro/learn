import { describe, expect, it } from 'vitest'
import {
  createAppRouteHistory,
  previousAppRoute,
  syncAppRouteHistory,
} from './appRouteHistory'

interface TestRoute {
  key: string
  pathname: string
}

const route = (key: string): TestRoute => ({ key, pathname: `/${key}` })

describe('app route history', () => {
  it('tracks pushed routes and exposes the immediate previous page', () => {
    const history = createAppRouteHistory(route('today'))
    syncAppRouteHistory(history, route('habits'), 'PUSH')
    syncAppRouteHistory(history, route('detail'), 'PUSH')

    expect(history.cursor).toBe(2)
    expect(previousAppRoute(history)?.key).toBe('habits')
  })

  it('moves through known entries on browser pop without duplicating them', () => {
    const today = route('today')
    const habits = route('habits')
    const history = createAppRouteHistory(today)
    syncAppRouteHistory(history, habits, 'PUSH')
    syncAppRouteHistory(history, today, 'POP')
    syncAppRouteHistory(history, habits, 'POP')

    expect(history.entries.map((entry) => entry.key)).toEqual(['today', 'habits'])
    expect(history.cursor).toBe(1)
  })

  it('replaces in place and truncates forward entries after a new push', () => {
    const today = route('today')
    const habits = route('habits')
    const history = createAppRouteHistory(today)
    syncAppRouteHistory(history, habits, 'PUSH')
    syncAppRouteHistory(history, route('habits-filtered'), 'REPLACE')
    syncAppRouteHistory(history, today, 'POP')
    syncAppRouteHistory(history, route('profile'), 'PUSH')

    expect(history.entries.map((entry) => entry.key)).toEqual(['today', 'profile'])
    expect(previousAppRoute(history)?.key).toBe('today')
  })
})
