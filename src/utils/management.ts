interface ToneAwareAction {
  tone?: string
}

export function orderManagementActions<T extends ToneAwareAction>(actions: readonly T[]): T[] {
  return [
    ...actions.filter((action) => action.tone !== 'destructive'),
    ...actions.filter((action) => action.tone === 'destructive'),
  ]
}
