import { createContext, useContext } from 'react'

export interface AppBackNavigation {
  canGoBack: boolean
  goBack: (fallback?: string) => void
}

export const AppBackNavigationContext = createContext<AppBackNavigation | null>(null)

export function useAppBackNavigation(): AppBackNavigation | null {
  return useContext(AppBackNavigationContext)
}
