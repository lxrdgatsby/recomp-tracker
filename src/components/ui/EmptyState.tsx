import type { ReactNode } from 'react'

interface EmptyStateProps {
  title: string
  description: string
  actionLabel?: string
  onAction?: () => void
  icon?: ReactNode
  className?: string
}

/** Consistent empty state for inventory, logs, check-ins, plan */
export function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
  icon,
  className = '',
}: EmptyStateProps) {
  return (
    <div
      className={`rounded-3xl border border-dashed border-white/15 bg-white/[0.02] px-5 py-8 text-center ${className}`}
    >
      {icon && (
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5 text-slate-500">
          {icon}
        </div>
      )}
      <h3 className="text-base font-medium text-white">{title}</h3>
      <p className="mx-auto mt-1.5 max-w-xs text-sm leading-relaxed text-slate-500">
        {description}
      </p>
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="mt-4 min-h-11 rounded-2xl bg-emerald-500 px-5 text-sm font-semibold text-black active:bg-emerald-400"
        >
          {actionLabel}
        </button>
      )}
    </div>
  )
}
