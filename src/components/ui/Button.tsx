import type { ButtonHTMLAttributes, ReactNode } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'success'
  size?: 'sm' | 'md'
  children: ReactNode
}

const variants = {
  primary:
    'bg-emerald-500 text-black hover:bg-emerald-400 font-semibold shadow-md shadow-emerald-500/15',
  secondary:
    'bg-white/5 text-slate-200 hover:bg-white/10 border border-white/10',
  ghost: 'text-slate-400 hover:text-emerald-400 hover:bg-white/5',
  success:
    'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/25',
}

const sizes = {
  sm: 'min-h-9 px-3 py-1.5 text-xs rounded-2xl',
  md: 'min-h-11 px-4 py-2.5 text-sm rounded-2xl',
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