import { useEffect, useState } from 'react'
import type { Peptide } from '../../types'

const SITES = [
  { id: 'abdomen-left', label: 'Abdomen Left', side: 'Left' },
  { id: 'abdomen-right', label: 'Abdomen Right', side: 'Right' },
  { id: 'thigh-left', label: 'Thigh Left', side: 'Left' },
  { id: 'thigh-right', label: 'Thigh Right', side: 'Right' },
  { id: 'arm-left', label: 'Deltoid Left', side: 'Left' },
  { id: 'arm-right', label: 'Deltoid Right', side: 'Right' },
] as const

const STORAGE_KEY = 'injectionSites'

interface InjectionSiteMapProps {
  selectedPeptide?: Peptide
  onSiteSelect?: (site: string) => void
  embedded?: boolean
}

export function InjectionSiteMap({
  selectedPeptide,
  onSiteSelect,
  embedded = false,
}: InjectionSiteMapProps) {
  const isEmbedded = embedded || Boolean(selectedPeptide)
  const [usedSites, setUsedSites] = useState<string[]>([])

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (!saved) return
    try {
      const parsed = JSON.parse(saved)
      if (Array.isArray(parsed)) {
        setUsedSites(parsed.filter((s) => typeof s === 'string'))
      }
    } catch {
      // ignore invalid storage
    }
  }, [])

  const toggleSite = (id: string) => {
    const isUsed = usedSites.includes(id)
    const updated = isUsed
      ? usedSites.filter((s) => s !== id)
      : [...usedSites, id]

    setUsedSites(updated)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
    onSiteSelect?.(id)
  }

  const containerClass = isEmbedded
    ? 'rounded-2xl border border-zinc-700 bg-zinc-900 p-4'
    : 'rounded-3xl border border-white/10 bg-white/5 p-6'

  return (
    <div className={containerClass}>
      {!isEmbedded && (
        <>
          <h3 className="mb-2 font-semibold">Injection Site Rotation</h3>
          <p className="mb-4 text-xs text-slate-400">
            Tap sites you used this week
            {selectedPeptide ? ` for ${selectedPeptide.name}` : ''}
          </p>
        </>
      )}
      {isEmbedded && (
        <p className="mb-3 text-xs text-zinc-400">
          Tap sites you used this week
          {selectedPeptide ? ` for ${selectedPeptide.name}` : ''}
        </p>
      )}

      <div className="grid grid-cols-2 gap-3">
        {SITES.map((site) => {
          const isUsed = usedSites.includes(site.id)
          return (
            <button
              key={site.id}
              type="button"
              onClick={() => toggleSite(site.id)}
              className={`rounded-2xl border p-4 text-left transition-all ${
                isUsed
                  ? 'border-emerald-500 bg-emerald-500/10'
                  : isEmbedded
                    ? 'border-zinc-600 hover:border-zinc-500'
                    : 'border-white/20 hover:border-white/40'
              }`}
            >
              <div className="flex justify-between">
                <div>
                  <div className="font-medium">{site.label}</div>
                  <div className="text-xs text-slate-400">{site.side} side</div>
                </div>
                {isUsed && <div className="text-emerald-400">✓</div>}
              </div>
            </button>
          )
        })}
      </div>

      <div className="mt-4 text-center text-xs text-slate-500">
        Rotate sides weekly to prevent lipohypertrophy
      </div>
    </div>
  )
}

export default InjectionSiteMap