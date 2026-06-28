import { expProgressInCurrentLevel } from '../utils/exp'

interface Props {
  totalExp: number
  level: number
  compact?: boolean
}

export default function ExpBar({ totalExp, level, compact }: Props) {
  const { current, needed, percentage } = expProgressInCurrentLevel(totalExp)

  if (compact) {
    return (
      <div className="space-y-1">
        <div className="h-1.5 bg-surface3 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{ width: `${percentage}%`, background: 'linear-gradient(90deg, #818cf8, #8b5cf6)' }}
          />
        </div>
        <div className="flex justify-between text-[11px] text-subtle">
          <span>Seviye {level}</span>
          <span>{current}/{needed} EXP</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs">
        <span style={{ color: '#818cf8' }} className="font-semibold">Seviye {level}</span>
        <span className="text-subtle">{current} / {needed} EXP</span>
      </div>
      <div className="h-2 bg-surface3 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${percentage}%`, background: 'linear-gradient(90deg, #818cf8, #8b5cf6)' }}
        />
      </div>
    </div>
  )
}
