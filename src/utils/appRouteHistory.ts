export interface KeyedRoute {
  key: string
}

export interface AppRouteHistoryState<T extends KeyedRoute> {
  entries: T[]
  cursor: number
  locationKey: string
}

export type AppNavigationType = 'POP' | 'PUSH' | 'REPLACE'

export function createAppRouteHistory<T extends KeyedRoute>(location: T): AppRouteHistoryState<T> {
  return {
    entries: [location],
    cursor: 0,
    locationKey: location.key,
  }
}

export function syncAppRouteHistory<T extends KeyedRoute>(
  state: AppRouteHistoryState<T>,
  location: T,
  navigationType: AppNavigationType,
): void {
  if (state.locationKey === location.key) return

  const knownIndex = state.entries.findIndex((entry) => entry.key === location.key)
  if (navigationType === 'POP' && knownIndex >= 0) {
    state.cursor = knownIndex
  } else if (navigationType === 'REPLACE') {
    state.entries[state.cursor] = location
  } else {
    state.entries = [...state.entries.slice(0, state.cursor + 1), location]
    state.cursor = state.entries.length - 1
  }
  state.locationKey = location.key
}

export function previousAppRoute<T extends KeyedRoute>(
  state: AppRouteHistoryState<T>,
): T | null {
  return state.cursor > 0 ? state.entries[state.cursor - 1] : null
}
