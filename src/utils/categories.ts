import type { Category } from '../types'

export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'fitness', name: 'Fitness', emoji: '🏃', color: '#f97316' },
  { id: 'saglik', name: 'Sağlık', emoji: '🧘', color: '#22c55e' },
  { id: 'egitim', name: 'Eğitim', emoji: '📚', color: '#3b82f6' },
  { id: 'zihin', name: 'Zihin', emoji: '💡', color: '#a78bfa' },
  { id: 'uretkenlik', name: 'Üretkenlik', emoji: '💼', color: '#f59e0b' },
  { id: 'yaraticilik', name: 'Yaratıcılık', emoji: '🎨', color: '#ec4899' },
  { id: 'sosyal', name: 'Sosyal', emoji: '👥', color: '#22d3ee' },
  { id: 'finans', name: 'Finans', emoji: '💰', color: '#10b981' },
  { id: 'gelisim', name: 'Gelişim', emoji: '🌱', color: '#84cc16' },
  { id: 'diger', name: 'Diğer', emoji: '⚙️', color: '#6b7280' },
]

export const EMOJI_LIST = [
  '🏃','🏋️','🧘','🚴','🏊','💪','🧗','🤸','⛹️','🤾',
  '📚','📖','✏️','🎓','💻','📝','🔬','🗺️','📐','🔭',
  '💡','🧠','🎯','🔍','💭','🌟','⚡','🎲','♟️','🎭',
  '📋','✅','📊','📈','💼','⏰','🗓️','📌','🔧','⚙️',
  '🎨','🎵','🎸','🎹','✍️','📷','🎬','🎙️','🖌️','🎻',
  '👥','💬','🤝','❤️','🫂','👋','🙏','🌍','🎉','🥳',
  '💰','💵','🏦','💳','🪙','💎','📊','💹','🏷️','🧾',
  '🌱','🌳','🌺','🦋','🌅','🌈','⭐','🏆','🎖️','🥇',
  '🥗','🥦','🍎','💊','🫀','🌿','☕','🍵','🥛','🍳',
  '😴','💤','🌙','🛌','🌌','🔥','✨','🦁','🐯','🦅',
]

export const POMODORO_CATEGORY_IDS = new Set(['egitim', 'zihin', 'uretkenlik', 'yaraticilik'])

export function getCategoryColor(color: string): {
  bg: string
  text: string
  border: string
  glow: string
} {
  return {
    bg: color + '18',
    text: color,
    border: color + '40',
    glow: color + '30',
  }
}

/* ── Light-theme card palette derived from a category/label hex ──
   Produces a soft filled card background, an icon chip, dark same-family
   text and a saturated accent for the complete button. */
function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '')
  const v = h.length === 3 ? h.split('').map((c) => c + c).join('') : h
  return [parseInt(v.slice(0, 2), 16), parseInt(v.slice(2, 4), 16), parseInt(v.slice(4, 6), 16)]
}
function mix([r, g, b]: [number, number, number], [r2, g2, b2]: [number, number, number], t: number): string {
  const m = (a: number, c: number) => Math.round(a + (c - a) * t)
  return `rgb(${m(r, r2)}, ${m(g, g2)}, ${m(b, b2)})`
}
const WHITE: [number, number, number] = [255, 255, 255]
const BLACK: [number, number, number] = [12, 10, 18]

export interface CardPalette {
  cardBg: string     // soft filled card background
  iconBg: string     // brighter chip behind the emoji/icon
  text: string       // dark, same-family — for the habit name
  textSoft: string   // lighter same-family — for the meta line
  accent: string     // saturated colour — complete button / progress
  border: string     // subtle same-family edge
}
export function getCardPalette(hex: string): CardPalette {
  const rgb = hexToRgb(hex)
  return {
    cardBg: mix(rgb, WHITE, 0.78),
    iconBg: mix(rgb, WHITE, 0.6),
    text: mix(rgb, BLACK, 0.62),
    textSoft: mix(rgb, BLACK, 0.4),
    accent: mix(rgb, BLACK, 0.12),
    border: mix(rgb, WHITE, 0.55),
  }
}
