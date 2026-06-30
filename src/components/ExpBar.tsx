import { expProgressInCurrentLevel } from '../utils/exp'

interface Props {
  totalExp: number
  level: number
  compact?: boolean
}

export default function ExpBar({ totalExp, level, compact }: Props) {
  const { current, needed, percentage } = expProgressInCurrentLevel(totalExp)

  const Bar = ({ h }: { h: number }) => (
    <div className="well rounded-full overflow-hidden" style={{ height: h }}>
      <div
        className="h-full rounded-full progress-fill energy-fill"
        style={{ width: `${percentage}%` }}
      />
    </div>
  )

  if (compact) {
    return (
      <div className="space-y-1.5">
        <Bar h={7} />
        <div className="flex justify-between text-[11px] ink-60 font-medium">
          <span>Seviye {level}</span>
          <span className="tnum">{current}/{needed} XP</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs font-medium">
        <span className="font-semibold">Seviye {level}</span>
        <span className="ink-60 tnum">{current} / {needed} XP</span>
      </div>
      <Bar h={9} />
    </div>
  )
}
