import { Download, Share, X } from 'lucide-react'
import { usePwaInstall } from '../../hooks/usePwaInstall'
import { Button } from '../ui/Button'

interface InstallAppButtonProps {
  className?: string
  fullWidth?: boolean
}

export function InstallAppButton({
  className = '',
  fullWidth = false,
}: InstallAppButtonProps) {
  const {
    canInstall,
    canShowIOSGuide,
    isInstalled,
    showIOSGuide,
    setShowIOSGuide,
    install,
  } = usePwaInstall()

  if (isInstalled) return null

  const visible = canInstall || canShowIOSGuide
  if (!visible) return null

  return (
    <>
      <Button
        variant="secondary"
        size="sm"
        className={`${fullWidth ? 'w-full' : ''} ${className}`}
        onClick={install}
      >
        <Download size={14} />
        Install App
      </Button>

      {showIOSGuide && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/60 p-4 sm:items-center">
          <div
            className="w-full max-w-sm rounded-xl border border-slate-700 bg-navy-900 p-5 shadow-2xl"
            role="dialog"
            aria-labelledby="ios-install-title"
          >
            <div className="mb-4 flex items-start justify-between">
              <h3 id="ios-install-title" className="font-semibold text-white">
                Install on iOS
              </h3>
              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="text-slate-500 hover:text-slate-300"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>
            <ol className="space-y-3 text-sm text-slate-400">
              <li className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-teal-500/15 text-xs font-bold text-teal-400">
                  1
                </span>
                <span>
                  Tap the <Share size={14} className="inline text-sky-400" />{' '}
                  Share button in Safari
                </span>
              </li>
              <li className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-teal-500/15 text-xs font-bold text-teal-400">
                  2
                </span>
                <span>Scroll down and tap &ldquo;Add to Home Screen&rdquo;</span>
              </li>
              <li className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-teal-500/15 text-xs font-bold text-teal-400">
                  3
                </span>
                <span>Tap &ldquo;Add&rdquo; to install Peptide Tracker</span>
              </li>
            </ol>
            <Button
              className="mt-5 w-full"
              variant="primary"
              onClick={() => setShowIOSGuide(false)}
            >
              Got it
            </Button>
          </div>
        </div>
      )}
    </>
  )
}