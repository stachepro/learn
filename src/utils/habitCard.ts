export const HABIT_CARD_SHAPES = ['pebble', 'arch', 'capsule', 'wedge', 'bloom'] as const

export type HabitCardShape = typeof HABIT_CARD_SHAPES[number]
export type SwipeDecision = 'completed' | 'skipped'

const FALLBACK_COLOR = '#84cc16'

export function normalizeHabitCardColor(value?: string): string {
  const candidate = value?.trim()
  if (!candidate) return FALLBACK_COLOR
  if (/^#[0-9a-f]{6}$/i.test(candidate)) return candidate.toLowerCase()
  if (/^#[0-9a-f]{3}$/i.test(candidate)) {
    const [r, g, b] = candidate.slice(1).split('')
    return `#${r}${r}${g}${g}${b}${b}`.toLowerCase()
  }
  return FALLBACK_COLOR
}

function stableHash(value: string): number {
  let hash = 2166136261
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

export function getHabitCardShape(identity: string): HabitCardShape {
  return HABIT_CARD_SHAPES[stableHash(identity) % HABIT_CARD_SHAPES.length]
}

export function getSwipeThreshold(cardWidth: number): number {
  return Math.min(116, Math.max(86, cardWidth * 0.28))
}

export function applySwipeResistance(distance: number, threshold: number, cardWidth: number): number {
  const direction = Math.sign(distance)
  const absolute = Math.abs(distance)
  if (absolute <= threshold) return distance
  const resisted = threshold + (absolute - threshold) * 0.34
  return direction * Math.min(cardWidth * 0.58, resisted)
}

export function resolveSwipeDecision(distance: number, velocity: number, threshold: number): SwipeDecision | null {
  const distanceDirection = Math.sign(distance)
  if (Math.abs(distance) >= threshold) return distanceDirection > 0 ? 'completed' : 'skipped'

  const isIntentionalFlick = Math.abs(distance) >= threshold * 0.38
    && Math.abs(velocity) >= 0.55
    && Math.sign(velocity) === distanceDirection
  if (!isIntentionalFlick) return null
  return velocity > 0 ? 'completed' : 'skipped'
}
