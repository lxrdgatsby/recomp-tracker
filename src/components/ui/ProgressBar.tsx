interface ProgressBarProps {
  value: number
  label?: string
}

export function ProgressBar({ value, label }: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, value))
  return (
    <div className="space-y-2">
      {label && (
        <div className="flex justify-between text-xs text-slate-400">
          <span>{label}</span>
          <span className="font-medium text-teal-400">{clamped}%</span>
        </div>
      )}
      <div className="h-2.5 overflow-hidden rounded-full bg-navy-800">
        <div
          className="h-full rounded-full bg-gradient-to-r from-teal-500 to-emerald-400 transition-all duration-500"
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  )
}