import type { InputHTMLAttributes } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
}

export function Input({ label, className = '', id, ...props }: InputProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')
  return (
    <label className="block space-y-1.5" htmlFor={inputId}>
      {label && (
        <span className="text-xs font-medium tracking-wide text-slate-400 uppercase">
          {label}
        </span>
      )}
      <input
        id={inputId}
        className={`w-full rounded-lg border border-slate-700 bg-navy-950 px-3 py-2.5 text-base text-slate-100 placeholder:text-slate-600 focus:border-teal-500/60 focus:outline-none focus:ring-1 focus:ring-teal-500/40 ${className}`}
        {...props}
      />
    </label>
  )
}