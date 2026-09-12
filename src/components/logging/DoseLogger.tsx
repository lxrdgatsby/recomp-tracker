import { X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import type { Peptide } from '../../types'
import type { Vial } from '../../types/v2'
import { InjectionSiteMap } from '../peptides/InjectionSiteMap'
import { useToast } from '../ui/Toast'
import { addDoseLog, getActiveVials } from '../../utils/inventoryStorage'
import { doseMgToUnits, formatMg } from '../../utils/vialMath'

const SITES = [
  'Abdomen Left',
  'Abdomen Right',
  'Thigh Left',
  'Thigh Right',
  'Deltoid Left',
  'Deltoid Right',
]

export interface DoseLoggerProps {
  open: boolean
  onClose: () => void
  peptides?: Peptide[]
  initialCompoundName?: string
  initialDoseMg?: number
  onLogged?: () => void
}

/**
 * Fast mobile-first dose logging modal.
 * Optionally deducts from a selected vial when marked Taken.
 */
export function DoseLogger({
  open,
  onClose,
  peptides = [],
  initialCompoundName,
  initialDoseMg,
  onLogged,
}: DoseLoggerProps) {
  const { toast } = useToast()
  const [vials, setVials] = useState<Vial[]>([])
  const [compoundName, setCompoundName] = useState('')
  const [custom, setCustom] = useState(false)
  const [doseMg, setDoseMg] = useState('0.5')
  const [vialId, setVialId] = useState('')
  const [site, setSite] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)

  const compoundOptions = useMemo(() => {
    const names = new Set<string>()
    peptides.forEach((p) => names.add(p.name))
    vials.forEach((v) => names.add(v.compoundName))
    return [...names]
  }, [peptides, vials])

  useEffect(() => {
    if (!open) return
    const active = getActiveVials()
    setVials(active)
    const name =
      initialCompoundName ||
      peptides[0]?.name ||
      active[0]?.compoundName ||
      ''
    setCompoundName(name)
    setCustom(false)
    setDoseMg(
      initialDoseMg != null
        ? String(initialDoseMg)
        : peptides.find((p) => p.name === name)?.protocol?.startingDoseMg?.toString() ||
            '0.5'
    )
    setVialId('')
    setSite('')
    setNotes('')
  }, [open, initialCompoundName, initialDoseMg, peptides])

  const matchingVials = useMemo(
    () =>
      vials.filter(
        (v) =>
          !compoundName ||
          v.compoundName.toLowerCase() === compoundName.toLowerCase()
      ),
    [vials, compoundName]
  )

  const selectedVial = matchingVials.find((v) => v.id === vialId) ||
    vials.find((v) => v.id === vialId)

  const units = useMemo(() => {
    const mg = parseFloat(doseMg) || 0
    if (
      selectedVial &&
      !selectedVial.isPowder &&
      selectedVial.concentrationMgPerMl > 0
    ) {
      return doseMgToUnits(mg, selectedVial.concentrationMgPerMl)
    }
    const peptide = peptides.find(
      (p) => p.name.toLowerCase() === compoundName.toLowerCase()
    )
    const conc = peptide?.protocol?.concentrationMgPerMl
    if (conc) return doseMgToUnits(mg, conc)
    return peptide?.protocol?.startingSyringeUnits ?? 0
  }, [doseMg, selectedVial, peptides, compoundName])

  if (!open) return null

  const submit = (taken: boolean) => {
    const name = compoundName.trim()
    const mg = parseFloat(doseMg) || 0
    if (!name) return
    setSaving(true)
    try {
      addDoseLog({
        compoundName: name,
        doseMg: mg,
        units,
        vialId: taken && vialId ? vialId : undefined,
        injectionSite: site || undefined,
        notes: notes.trim() || undefined,
        taken,
      })
      toast(
        taken
          ? vialId
            ? `Logged ${name} · vial updated`
            : `Logged ${name} as taken`
          : `Logged ${name} as missed`,
        taken ? 'success' : 'info'
      )
      // Refresh plan health cache so coach + dashboard stay in sync
      try {
        // Tracker state may not be in scope; coach/dashboard re-evaluate on next load
        window.dispatchEvent(new CustomEvent('pt-data-updated', { detail: 'dose' }))
      } catch {
        /* ignore */
      }
      onLogged?.()
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/70 sm:items-center sm:p-4">
      <div
        className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-3xl border border-white/10 bg-[#0a0a0a] sm:rounded-3xl"
        role="dialog"
        aria-labelledby="dose-logger-title"
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-white/10 bg-[#0a0a0a]/95 px-5 py-4 backdrop-blur">
          <h2 id="dose-logger-title" className="text-lg font-semibold text-white">
            Log Dose
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2.5 text-slate-400 hover:bg-white/10"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <div className="space-y-4 px-5 py-4 pb-10">
          <label className="block text-xs text-slate-400">
            Compound
            {!custom ? (
              <select
                value={
                  compoundOptions.includes(compoundName)
                    ? compoundName
                    : compoundOptions[0] || ''
                }
                onChange={(e) => {
                  if (e.target.value === '__custom') {
                    setCustom(true)
                    setCompoundName('')
                  } else setCompoundName(e.target.value)
                }}
                className="mt-1 w-full rounded-2xl border border-white/15 bg-white/5 px-3 py-3.5 text-base text-white"
              >
                {compoundOptions.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
                <option value="__custom">Type custom…</option>
              </select>
            ) : (
              <input
                autoFocus
                value={compoundName}
                onChange={(e) => setCompoundName(e.target.value)}
                placeholder="Compound name"
                className="mt-1 w-full rounded-2xl border border-white/15 bg-white/5 px-3 py-3.5 text-base text-white"
              />
            )}
          </label>

          <label className="block text-xs text-slate-400">
            Dose (mg)
            <input
              type="number"
              inputMode="decimal"
              value={doseMg}
              onChange={(e) => setDoseMg(e.target.value)}
              className="mt-1 w-full rounded-2xl border border-white/15 bg-white/5 px-3 py-3.5 text-lg text-white"
            />
          </label>

          <label className="block text-xs text-slate-400">
            Draw from vial (optional)
            <select
              value={vialId}
              onChange={(e) => setVialId(e.target.value)}
              className="mt-1 w-full rounded-2xl border border-white/15 bg-white/5 px-3 py-3.5 text-base text-white"
            >
              <option value="">No vial deduction</option>
              {(matchingVials.length ? matchingVials : vials).map((v) => (
                <option key={v.id} value={v.id}>
                  {v.compoundName} · {formatMg(v.remainingMg)} left
                  {v.isPowder
                    ? ' (powder)'
                    : ` · ${v.concentrationMgPerMl} mg/mL`}
                </option>
              ))}
            </select>
          </label>

          <div className="rounded-2xl bg-emerald-500/10 px-4 py-3.5">
            <div className="text-xs text-emerald-400/80">Syringe units (U-100)</div>
            <div className="text-2xl font-semibold text-emerald-400">
              {units || '—'}
            </div>
            {selectedVial?.isPowder && (
              <p className="mt-1 text-xs text-amber-400">
                Vial is still powder — reconstitute before drawing.
              </p>
            )}
          </div>

          <div>
            <div className="mb-2 text-xs text-slate-400">Injection site</div>
            <div className="grid grid-cols-2 gap-2">
              {SITES.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSite(s)}
                  className={`min-h-12 rounded-2xl px-3 text-left text-sm transition-colors ${
                    site === s
                      ? 'border border-emerald-500/40 bg-emerald-500/15 text-emerald-400'
                      : 'border border-white/10 bg-white/5 text-slate-300'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
            <div className="mt-3">
              <InjectionSiteMap
                embedded
                onSiteSelect={(id) => {
                  const label = id
                    .split('-')
                    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                    .join(' ')
                  setSite(label)
                }}
              />
            </div>
          </div>

          <label className="block text-xs text-slate-400">
            Notes (optional)
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="mt-1 w-full rounded-2xl border border-white/15 bg-white/5 px-3 py-3 text-base text-white"
            />
          </label>

          <div className="grid grid-cols-2 gap-3 pt-1">
            <button
              type="button"
              disabled={saving || !compoundName.trim()}
              onClick={() => submit(false)}
              className="min-h-14 rounded-2xl border border-white/15 bg-white/5 text-sm font-medium text-slate-300 disabled:opacity-40"
            >
              Missed
            </button>
            <button
              type="button"
              disabled={saving || !compoundName.trim()}
              onClick={() => submit(true)}
              className="min-h-14 rounded-2xl bg-emerald-500 text-sm font-semibold text-black disabled:opacity-40"
            >
              Taken
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

/** @deprecated alias */
export const LogDoseModal = DoseLogger
export default DoseLogger
