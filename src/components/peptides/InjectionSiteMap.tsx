import { format, startOfWeek } from 'date-fns'
import { useCallback, useEffect, useState } from 'react'

const SITES = [
  { id: 'abdomen-left', label: 'Abdomen Left', side: 'Left' },
  { id: 'abdomen-right', label: 'Abdomen Right', side: 'Right' },
  { id: 'thigh-left', label: 'Thigh Left', side: 'Left' },
  { id: 'thigh-right', label: 'Thigh Right', side: 'Right' },
  { id: 'arm-left', label: 'Deltoid Left', side: 'Left' },
  { id: 'arm-right', label: 'Deltoid Right', side: 'Right' },
] as const

const STORAGE_PREFIX = 'pepttrack-injection-sites:'

function getWeekKey() {
  return format(startOfWeek(new Date(), { weekStartsOn: 0 }), 'yyyy-MM-dd')
}

function loadUsedSites(): string[] {
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${getWeekKey()}`)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.filter((s) => typeof s === 'string') : []
  } catch {
    return []
  }
}

function saveUsedSites(sites: string[]) {
  try {
    localStorage.setItem(
      `${STORAGE_PREFIX}${getWeekKey()}`,
      JSON.stringify(sites)
    )
  } catch {
    // ignore quota errors
  }
}

export function InjectionSiteMap() {
  const [usedSites, setUsedSites] = useState<string[]>(loadUsedSites)

  useEffect(() => {
    saveUsedSites(usedSites)
  }, [usedSites])

  const toggleSite = useCallback((id: string) => {
    setUsedSites((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    )
  }, [])

  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
      <h3 className="mb-2 font-semibold">Injection Site Rotation</h3>
      <p className="mb-4 text-xs text-slate-400">Tap sites you used this week</p>

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