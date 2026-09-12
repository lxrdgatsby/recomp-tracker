import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { Check, X } from 'lucide-react'

type ToastKind = 'success' | 'info' | 'warn'

type ToastItem = {
  id: string
  message: string
  kind: ToastKind
}

type ToastContextValue = {
  toast: (message: string, kind?: ToastKind) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([])

  const toast = useCallback((message: string, kind: ToastKind = 'success') => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
    setItems((prev) => [...prev.slice(-3), { id, message, kind }])
    window.setTimeout(() => {
      setItems((prev) => prev.filter((t) => t.id !== id))
    }, 2600)
  }, [])

  const value = useMemo(() => ({ toast }), [toast])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="pointer-events-none fixed inset-x-0 top-[max(0.75rem,env(safe-area-inset-top))] z-[200] flex flex-col items-center gap-2 px-4"
        aria-live="polite"
      >
        {items.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto flex max-w-sm items-center gap-2 rounded-2xl border px-4 py-3 text-sm shadow-xl backdrop-blur-md ${
              t.kind === 'success'
                ? 'border-emerald-500/30 bg-[#0a0a0a]/95 text-emerald-300'
                : t.kind === 'warn'
                  ? 'border-amber-500/30 bg-[#0a0a0a]/95 text-amber-200'
                  : 'border-white/15 bg-[#0a0a0a]/95 text-slate-200'
            }`}
          >
            {t.kind === 'success' ? (
              <Check size={16} className="shrink-0 text-emerald-400" />
            ) : (
              <X size={16} className="shrink-0 opacity-50" />
            )}
            <span>{t.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext)
  if (!ctx) {
    return {
      toast: (message) => {
        // Fallback when provider missing
        console.info('[toast]', message)
      },
    }
  }
  return ctx
}
