import type { ButtonHTMLAttributes, ReactNode } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'success'
  size?: 'sm' | 'md'
  children: ReactNode
}

const variants = {
  primary:
    'bg-teal-500 text-navy-950 hover:bg-teal-400 font-semibold shadow-md shadow-teal-500/20',
  secondary:
    'bg-navy-800 text-slate-200 hover:bg-navy-700 border border-slate-700',
  ghost: 'text-slate-400 hover:text-teal-400 hover:bg-navy-800/60',
  success:
    'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/25',
}

const sizes = {
  sm: 'px-3 py-1.5 text-xs rounded-lg',
  md: 'px-4 py-2 text-sm rounded-lg',
}

export function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}