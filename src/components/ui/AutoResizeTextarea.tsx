import { useCallback, useEffect, useRef } from 'react'
import type { TextareaHTMLAttributes } from 'react'

interface AutoResizeTextareaProps
  extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'rows'> {
  label?: string
  minRows?: number
}

export function AutoResizeTextarea({
  label,
  minRows = 3,
  className = '',
  id,
  value,
  onChange,
  ...props
}: AutoResizeTextareaProps) {
  const textareaId = id ?? label?.toLowerCase().replace(/\s+/g, '-')
  const ref = useRef<HTMLTextAreaElement>(null)

  const resize = useCallback(() => {
    const el = ref.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.max(el.scrollHeight, el.dataset.minHeight ? Number(el.dataset.minHeight) : 0)}px`
  }, [])

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const lineHeight = parseFloat(getComputedStyle(el).lineHeight) || 24
    const padding =
      parseFloat(getComputedStyle(el).paddingTop) +
      parseFloat(getComputedStyle(el).paddingBottom)
    el.dataset.minHeight = String(lineHeight * minRows + padding)
    resize()
  }, [value, minRows, resize])

  return (
    <label className="block space-y-1.5" htmlFor={textareaId}>
      {label && (
        <span className="text-xs font-medium tracking-wide text-slate-400 uppercase">
          {label}
        </span>
      )}
      <textarea
        ref={ref}
        id={textareaId}
        rows={minRows}
        value={value}
        onChange={(e) => {
          onChange?.(e)
          resize()
        }}
        className={`w-full resize-none overflow-hidden rounded-lg border border-slate-700 bg-navy-950 px-3 py-2.5 text-base leading-relaxed text-slate-100 placeholder:text-slate-600 focus:border-teal-500/60 focus:outline-none focus:ring-1 focus:ring-teal-500/40 ${className}`}
        {...props}
      />
    </label>
  )
}