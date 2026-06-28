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
