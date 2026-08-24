import { useEffect, useMemo, useState } from 'react'
import type { FamiliarityLevel } from '../../types/auth'
import type { Peptide } from '../../types'
import {
  VIAL_SIZE_OPTIONS_MG,
  formatVialSizeLabel,
  isVialSizeOption,
} from '../../constants/peptideCatalog'
import {
  PROTOCOL_PEPTIDE_OPTIONS,
  buildPeptideForNewVial,
  createInventoryVial,
  slugPeptideId,
  todayIsoDate,
  type InventoryVial,
} from '../../lib/vialInventory'

interface AddVialModalProps {
  open: boolean
  onClose: () => void
  familiarity?: FamiliarityLevel
  existingPeptides: Peptide[]
  onSave: (vial: InventoryVial, peptide: Peptide) => void
}

export function AddVialModal({
  open,
  onClose,
  familiarity = 'beginner',
  existingPeptides,
  onSave,
}: AddVialModalProps) {
  const [step, setStep] = useState<1 | 2>(1)
  const [selectedId, setSelectedId] = useState(PROTOCOL_PEPTIDE_OPTIONS[0]?.id ?? '')
  const [customName, setCustomName] = useState('')
  const [vialMg, setVialMg] = useState('')
  const [bacWaterMl, setBacWaterMl] = useState('')
  const [mixedDate, setMixedDate] = useState(todayIsoDate())
  const [notes, setNotes] = useState('')
  const [error, setError] = useState<string | null>(null)

  const isCustom = selectedId === 'custom'
  const preset = PROTOCOL_PEPTIDE_OPTIONS.find((p) => p.id === selectedId)

  useEffect(() => {
    if (!open) return
    setStep(1)
    setSelectedId(PROTOCOL_PEPTIDE_OPTIONS[0]?.id ?? 'custom')
    setCustomName('')
    setMixedDate(todayIsoDate())
    setNotes('')
    setError(null)
    const first = PROTOCOL_PEPTIDE_OPTIONS[0]
    setVialMg(first?.defaultVialMg ? String(first.defaultVialMg) : '')
    setBacWaterMl(first?.defaultBacMl ? String(first.defaultBacMl) : '')
  }, [open])

  useEffect(() => {
    if (!open || selectedId === 'custom') return
    const next = PROTOCOL_PEPTIDE_OPTIONS.find((p) => p.id === selectedId)
    if (!next) return
    setVialMg(next.defaultVialMg ? String(next.defaultVialMg) : '')
    setBacWaterMl(next.defaultBacMl ? String(next.defaultBacMl) : '')
    setNotes(next.notes)
  }, [selectedId, open])

  const compoundName = isCustom ? customName.trim() : (preset?.name ?? '')
  const vialMgNum = Number(vialMg)
  const bacMlNum = Number(bacWaterMl)
  const concentration =
    vialMgNum > 0 && bacMlNum > 0 ? vialMgNum / bacMlNum : 0

  const canContinue = isCustom ? customName.trim().length > 0 : Boolean(preset)
  const canSave =
    compoundName.length > 0 &&
    Number.isFinite(vialMgNum) &&
    vialMgNum > 0 &&
    Number.isFinite(bacMlNum) &&
    bacMlNum > 0

  const peptideId = useMemo(() => {
    if (!isCustom && preset) return preset.id
    const existing = existingPeptides.find(
      (p) => p.name.toLowerCase() === compoundName.toLowerCase()
    )
    return existing?.id ?? slugPeptideId(compoundName || 'custom')
  }, [isCustom, preset, existingPeptides, compoundName])

  if (!open) return null

  const handleSave = () => {
    if (!canSave) {
      setError('Enter peptide, vial mg, and BAC water mL greater than 0.')
      return
    }

    const vial = createInventoryVial({
      peptideId,
      compoundName,
      vialMg: vialMgNum,
      bacWaterMl: bacMlNum,
      mixedDate,
      notes,
    })

    const peptide = buildPeptideForNewVial({
      id: peptideId,
      name: compoundName,
      vialMg: vialMgNum,
      bacWaterMl: bacMlNum,
      targetDoseMg: preset?.targetDoseMg ?? 0,
      frequency: preset?.frequency ?? 'daily',
      timing: preset?.timing ?? 'As scheduled',
      notes: notes || preset?.notes || '',
      familiarity,
    })

    onSave(vial, peptide)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/60 p-0 sm:items-center sm:p-4">
      <div
        className="w-full max-w-md rounded-t-3xl border border-white/10 bg-[#0a0a0a] p-5 shadow-2xl sm:rounded-3xl"
        role="dialog"
        aria-labelledby="add-vial-title"
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold tracking-widest text-emerald-400 uppercase">
              {step === 1 ? 'Step 1 of 2' : 'Step 2 of 2'}
            </p>
            <h2 id="add-vial-title" className="text-lg font-semibold text-white">
              {step === 1 ? 'Choose peptide' : 'Vial details'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-2 py-1 text-sm text-slate-400 hover:text-white"
          >
            Cancel
          </button>
        </div>

        {step === 1 ? (
          <div className="max-h-[60vh] space-y-2 overflow-y-auto">
            {PROTOCOL_PEPTIDE_OPTIONS.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => setSelectedId(option.id)}
                className={`w-full rounded-2xl border px-4 py-3 text-left text-sm transition-colors ${
                  selectedId === option.id
                    ? 'border-emerald-500 bg-emerald-500/10 text-white'
                    : 'border-white/10 bg-white/5 text-slate-200 hover:bg-white/10'
                }`}
              >
                {option.name}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setSelectedId('custom')}
              className={`w-full rounded-2xl border px-4 py-3 text-left text-sm transition-colors ${
                isCustom
                  ? 'border-emerald-500 bg-emerald-500/10 text-white'
                  : 'border-white/10 bg-white/5 text-slate-200 hover:bg-white/10'
              }`}
            >
              Custom name
            </button>
            {isCustom && (
              <input
                type="text"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                placeholder="Peptide name"
                className="w-full rounded-2xl border border-zinc-700 bg-zinc-800 px-4 py-3 text-base text-white focus:border-emerald-500 focus:outline-none"
              />
            )}
            <button
              type="button"
              disabled={!canContinue}
              onClick={() => {
                setError(null)
                setStep(2)
              }}
              className="mt-3 w-full rounded-2xl bg-emerald-500 py-3 text-sm font-semibold text-black disabled:opacity-40"
            >
              Continue
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-emerald-400">{compoundName}</p>
            <label className="block space-y-1.5">
              <span className="text-xs font-medium tracking-wide text-slate-400 uppercase">
                Vial amount (mg)
              </span>
              <select
                value={vialMg}
                onChange={(e) => setVialMg(e.target.value)}
                className="w-full rounded-2xl border border-zinc-700 bg-zinc-800 px-4 py-3 text-base text-white focus:border-emerald-500 focus:outline-none"
              >
                {vialMg !== '' && !isVialSizeOption(Number(vialMg)) && (
                  <option value={vialMg}>{vialMg}mg</option>
                )}
                {VIAL_SIZE_OPTIONS_MG.map((size) => (
                  <option key={size} value={String(size)}>
                    {formatVialSizeLabel(size)}
                  </option>
                ))}
              </select>
            </label>
            <label className="block space-y-1.5">
              <span className="text-xs font-medium tracking-wide text-slate-400 uppercase">
                BAC water (mL)
              </span>
              <input
                type="number"
                min={0}
                step="any"
                value={bacWaterMl}
                onChange={(e) => setBacWaterMl(e.target.value)}
                className="w-full rounded-2xl border border-zinc-700 bg-zinc-800 px-4 py-3 text-base text-white focus:border-emerald-500 focus:outline-none"
              />
            </label>
            <label className="block space-y-1.5">
              <span className="text-xs font-medium tracking-wide text-slate-400 uppercase">
                Mixed date
              </span>
              <input
                type="date"
                value={mixedDate}
                onChange={(e) => setMixedDate(e.target.value)}
                className="w-full rounded-2xl border border-zinc-700 bg-zinc-800 px-4 py-3 text-base text-white focus:border-emerald-500 focus:outline-none"
              />
            </label>
            <label className="block space-y-1.5">
              <span className="text-xs font-medium tracking-wide text-slate-400 uppercase">
                Notes (optional)
              </span>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                className="w-full rounded-2xl border border-zinc-700 bg-zinc-800 px-4 py-3 text-base text-white focus:border-emerald-500 focus:outline-none"
              />
            </label>
            <p className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-emerald-400">
              Concentration:{' '}
              {concentration > 0 ? `${Number(concentration.toFixed(2))} mg/mL` : '—'}
            </p>
            {error && <p className="text-sm text-red-400">{error}</p>}
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="flex-1 rounded-2xl border border-white/10 py-3 text-sm text-slate-300"
              >
                Back
              </button>
              <button
                type="button"
                disabled={!canSave}
                onClick={handleSave}
                className="flex-1 rounded-2xl bg-emerald-500 py-3 text-sm font-semibold text-black disabled:opacity-40"
              >
                Add Vial
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
