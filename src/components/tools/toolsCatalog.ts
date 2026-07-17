export type ToolId = 'pomodoro' | 'just-start' | 'todo' | 'water' | 'wake' | 'stats' | 'no-rush'

export type ToolAccent = 'lime' | 'energy' | 'list' | 'water' | 'wake' | 'insight' | 'calm'

export interface ToolDefinition {
  id: ToolId
  title: string
  path: string
  icon: ToolId
  accent: ToolAccent
  available: boolean
}

export const FEATURED_TOOLS: readonly ToolDefinition[] = [
  { id: 'pomodoro', title: 'Pomodoro', path: '/pomodoro', icon: 'pomodoro', accent: 'lime', available: true },
  { id: 'just-start', title: 'Just Start', path: '/just-start', icon: 'just-start', accent: 'energy', available: true },
]

export const SUPPORT_TOOLS: readonly ToolDefinition[] = [
  { id: 'todo', title: 'To-do', path: '/todo', icon: 'todo', accent: 'list', available: true },
  { id: 'water', title: 'Su Takibi', path: '/su-takibi', icon: 'water', accent: 'water', available: true },
  { id: 'wake', title: 'Uyandım', path: '/uyandim', icon: 'wake', accent: 'wake', available: true },
  { id: 'stats', title: 'İstatistikler', path: '/stats', icon: 'stats', accent: 'insight', available: true },
  { id: 'no-rush', title: 'Acele Yok', path: '/acele-yok', icon: 'no-rush', accent: 'calm', available: false },
]

export const ALL_TOOLS: readonly ToolDefinition[] = [...FEATURED_TOOLS, ...SUPPORT_TOOLS]

export function findToolByPath(path: string | null): ToolDefinition | null {
  if (!path) return null
  return ALL_TOOLS.find((tool) => tool.path === path) ?? null
}
