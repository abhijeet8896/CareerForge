interface ScoreRingProps {
  score: number
  size?: number
  label?: string
  strokeWidth?: number
}

export default function ScoreRing({ score, size = 120, label = 'Score', strokeWidth = 10 }: ScoreRingProps) {
  const r = size / 2 - strokeWidth - 2
  const circ = 2 * Math.PI * r
  const filled = Math.max(0, Math.min(score, 100))
  const dash = (filled / 100) * circ
  const color = filled >= 70 ? '#22c55e' : filled >= 50 ? '#f59e0b' : '#ef4444'

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#2d2d4a" strokeWidth={strokeWidth} />
          <circle
            cx={size/2} cy={size/2} r={r}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray={`${dash} ${circ - dash}`}
            strokeLinecap="round"
            style={{ transition: 'stroke-dasharray 1.2s cubic-bezier(0.4,0,0.2,1)' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-white" style={{ color }}>{Math.round(filled)}</span>
          <span className="text-xs text-slate-500">/100</span>
        </div>
      </div>
      <span className="text-xs text-slate-400 text-center max-w-[100px] leading-tight">{label}</span>
    </div>
  )
}
