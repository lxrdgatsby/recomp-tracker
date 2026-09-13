import { Check, FlaskConical, Package, Pencil, Plus, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import type { Vial } from '../../types/v2'
import { EmptyState } from '../ui/EmptyState'
import { useToast } from '../ui/Toast'
import {
  addVial,
  getActiveVials,
  getFinishedVials,
  loadVials,
  markVialFinished,
  updateVial,
} from '../../utils/inventoryStorage'
import {
  calcConcentrationMgPerMl,
  estimatedDosesLeft,
  formatMg,
} from '../../utils/vialMath'

const PRESETS = [
  'Retatrutide',
  'Tesamorelin',
  'AOD9604',
  'BPC-157',
  'Tirzepatide',
  'Semaglutide',
  'CJC-1295',
  'Ipamorelin',
]

interface VialInventoryProps {
  /** Typical dose (mg) by compound name for “doses left” estimate */
  typicalDoseMg?: number
  defaultDoseByName?: Record<string, number>
  onChange?: () => void
}

export function VialInventory({
  typicalDoseMg = 0.5,
  defaultDoseByName = {},
  onChange,
}: VialInventoryProps) {
  const { toast } = useToast()
  const [vials, setVials] = useState<Vial[]>(() => loadVials())
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  // form state
  const [compoundName, setCompoundName] = useState(PRESETS[0])
  const [customCompound, setCustomCompound] = useState(false)
  const [vialMg, setVialMg] = useState('10')
  const [bacMl, setBacMl] = useState('2')
  const [isPowder, setIsPowder] = useState(true)
  const [mixedDate, setMixedDate] = useState(() =>
    new Date().toISOString().slice(0, 10)
  )
  const [notes, setNotes] = useState('')
  const [estDose, setEstDose] = useState(String(typicalDoseMg))

  const refresh = () => {
    setVials(loadVials())
    onChange?.()
  }

  const active = useMemo(() => getActiveVials(), [vials])
  const finished = useMemo(() => getFinishedVials(), [vials])

  const previewConc = useMemo(() => {
    if (isPowder) return 0
    const mg = parseFloat(vialMg)
    const ml = parseFloat(bacMl)
    if (!mg || !ml) return 0
    return calcConcentrationMgPerMl(mg, ml)
  }, [vialMg, bacMl, isPowder])

  const resetForm = () => {
    setEditingId(null)
    setCompoundName(PRESETS[0])
    setCustomCompound(false)
    setVialMg('10')
    setBacMl('2')
    setIsPowder(true)
    setMixedDate(new Date().toISOString().slice(0, 10))
    setNotes('')
    setEstDose(String(typicalDoseMg))
  }

  const openCreate = () => {
    resetForm()
    setShowForm(true)
  }

  const openEdit = (v: Vial) => {
    setEditingId(v.id)
    setCompoundName(v.compoundName)
    setCustomCompound(!PRESETS.includes(v.compoundName))
    setVialMg(String(v.vialMg))
    setBacMl(String(v.bacWaterMl || 2))
    setIsPowder(v.isPowder)
    setMixedDate(v.mixedDate.slice(0, 10))
    setNotes(v.notes || '')
    setShowForm(true)
  }

  const handleSave = () => {
    const name = compoundName.trim()
    const mg = parseFloat(vialMg)
    const ml = parseFloat(bacMl) || 0
    if (!name || !mg || mg <= 0) return

    if (editingId) {
      updateVial(editingId, {
        compoundName: name,
        vialMg: mg,
        bacWaterMl: isPowder ? 0 : ml,
        isPowder,
        mixedDate: new Date(mixedDate).toISOString(),
        notes: notes.trim() || undefined,
        concentrationMgPerMl: isPowder
          ? 0
          : calcConcentrationMgPerMl(mg, ml),
      })
      toast(`${name} vial updated`)
    } else {
      addVial({
        compoundName: name,
        vialMg: mg,
        bacWaterMl: isPowder ? 0 : ml,
        mixedDate: new Date(mixedDate).toISOString(),
        isPowder,
        notes: notes.trim() || undefined,
      })
      toast(`${name} vial added`)
    }
    setShowForm(false)
    resetForm()
    refresh()
    try {
      window.dispatchEvent(new CustomEvent('pt-data-updated', { detail: 'vial' }))
    } catch {
      /* ignore */
    }
  }

  const doseHintFor = (name: string) =>
    defaultDoseByName[name] ?? (parseFloat(estDose) || typicalDoseMg)

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-white">Vial Inventory</h2>
          <p className="mt-1 text-sm text-slate-400">
            Powder vs mixed · concentration · remaining doses
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex min-h-11 items-center gap-1.5 rounded-2xl bg-emerald-500/15 px-4 py-2 text-sm font-medium text-emerald-400 active:bg-emerald-500/25"
        >
          <Plus size={16} />
          Add
        </button>
      </div>

      {showForm && (
        <div className="space-y-3 rounded-3xl border border-emerald-500/20 bg-white/5 p-4">
          <div className="text-sm font-medium text-white">
            {editingId ? 'Edit vial' : 'New vial'}
          </div>

          <label className="block text-xs text-slate-400">
            Compound
            {!customCompound ? (
              <select
                value={PRESETS.includes(compoundName) ? compoundName : PRESETS[0]}
                onChange={(e) => {
                  if (e.target.value === '__custom') {
                    setCustomCompound(true)
                    setCompoundName('')
                  } else setCompoundName(e.target.value)
                }}
                className="mt-1 w-full rounded-2xl border border-white/15 bg-[#0a0a0a] px-3 py-3 text-base text-white"
              >
                {PRESETS.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
                <option value="__custom">Custom…</option>
              </select>
            ) : (
              <input
                value={compoundName}
                onChange={(e) => setCompoundName(e.target.value)}
                placeholder="Compound name"
                className="mt-1 w-full rounded-2xl border border-white/15 bg-[#0a0a0a] px-3 py-3 text-base text-white"
              />
            )}
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="block text-xs text-slate-400">
              Vial amount (mg)
              <input
                type="number"
                inputMode="decimal"
                value={vialMg}
                onChange={(e) => setVialMg(e.target.value)}
                className="mt-1 w-full rounded-2xl border border-white/15 bg-[#0a0a0a] px-3 py-3 text-base text-white"
              />
            </label>
            <label className="block text-xs text-slate-400">
              Est. dose (mg)
              <input
                type="number"
                inputMode="decimal"
                value={estDose}
                onChange={(e) => setEstDose(e.target.value)}
                className="mt-1 w-full rounded-2xl border border-white/15 bg-[#0a0a0a] px-3 py-3 text-base text-white"
              />
            </label>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setIsPowder(true)}
              className={`min-h-12 rounded-2xl text-sm font-medium ${
                isPowder
                  ? 'bg-amber-500/20 text-amber-300'
                  : 'bg-white/5 text-slate-400'
              }`}
            >
              Powder
            </button>
            <button
              type="button"
              onClick={() => setIsPowder(false)}
              className={`min-h-12 rounded-2xl text-sm font-medium ${
                !isPowder
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : 'bg-white/5 text-slate-400'
              }`}
            >
              Reconstituted
            </button>
          </div>

          {!isPowder && (
            <label className="block text-xs text-slate-400">
              BAC water (mL)
              <input
                type="number"
                inputMode="decimal"
                value={bacMl}
                onChange={(e) => setBacMl(e.target.value)}
                className="mt-1 w-full rounded-2xl border border-white/15 bg-[#0a0a0a] px-3 py-3 text-base text-white"
              />
              {previewConc > 0 && (
                <span className="mt-1.5 block text-sm text-emerald-400">
                  Concentration: {previewConc} mg/mL
                </span>
              )}
            </label>
          )}

          <label className="block text-xs text-slate-400">
            Mixed / received date
            <input
              type="date"
              value={mixedDate}
              onChange={(e) => setMixedDate(e.target.value)}
              className="mt-1 w-full rounded-2xl border border-white/15 bg-[#0a0a0a] px-3 py-3 text-base text-white"
            />
          </label>

          <input
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Notes (optional)"
            className="w-full rounded-2xl border border-white/15 bg-[#0a0a0a] px-3 py-3 text-base text-white"
          />

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                setShowForm(false)
                resetForm()
              }}
              className="min-h-12 rounded-2xl bg-white/5 text-sm text-slate-300"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="min-h-12 rounded-2xl bg-emerald-500 text-sm font-medium text-black"
            >
              {editingId ? 'Save changes' : 'Save vial'}
            </button>
          </div>
        </div>
      )}

      {/* Active vials */}
      <div className="space-y-3">
        {active.length === 0 && !showForm && (
          <EmptyState
            icon={<FlaskConical size={22} />}
            title="No vials yet"
            description="Track powder and reconstituted stock so remaining doses stay accurate."
            actionLabel="Add first vial"
            onAction={openCreate}
          />
        )}
        {active.map((vial) => {
          const hint = doseHintFor(vial.compoundName)
          const left = estimatedDosesLeft(vial, hint)
          return (
            <div
              key={vial.id}
              className="rounded-3xl border border-white/10 bg-white/5 p-4"
            >
              <div className="flex items-start gap-3">
                <div
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${
                    vial.isPowder ? 'bg-amber-500/15' : 'bg-emerald-500/15'
                  }`}
                >
                  {vial.isPowder ? (
                    <Package size={20} className="text-amber-400" />
                  ) : (
                    <FlaskConical size={20} className="text-emerald-400" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium text-white">
                      {vial.compoundName}
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                        vial.isPowder
                          ? 'bg-amber-500/15 text-amber-300'
                          : 'bg-emerald-500/15 text-emerald-400'
                      }`}
                    >
                      {vial.isPowder ? 'Powder' : 'Mixed'}
                    </span>
                  </div>
                  <div className="mt-0.5 text-xs text-slate-400">
                    {formatMg(vial.vialMg)} vial
                    {!vial.isPowder && (
                      <>
                        {' '}
                        · {vial.concentrationMgPerMl} mg/mL · {vial.bacWaterMl}{' '}
                        mL BAC
                      </>
                    )}
                  </div>
                  <div className="mt-2 text-sm text-white">
                    Remaining{' '}
                    <span className="font-semibold text-emerald-400">
                      {formatMg(vial.remainingMg)}
                    </span>
                    {hint > 0 && (
                      <span className="text-slate-500">
                        {' '}
                        · ~{left} doses @ {formatMg(hint)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {vial.isPowder && (
                  <button
                    type="button"
                    onClick={() => {
                      const ml = window.prompt('BAC water (mL)?', '2')
                      if (!ml) return
                      const bacWaterMl = parseFloat(ml)
                      if (!bacWaterMl) return
                      updateVial(vial.id, {
                        isPowder: false,
                        bacWaterMl,
                        mixedDate: new Date().toISOString(),
                        concentrationMgPerMl: calcConcentrationMgPerMl(
                          vial.vialMg,
                          bacWaterMl
                        ),
                      })
                      refresh()
                    }}
                    className="min-h-10 rounded-xl bg-emerald-500/15 px-3 text-xs text-emerald-400"
                  >
                    Mark mixed
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => openEdit(vial)}
                  className="inline-flex min-h-10 items-center gap-1 rounded-xl bg-white/10 px-3 text-xs text-white"
                >
                  <Pencil size={12} /> Edit
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (confirm('Mark this vial as finished?')) {
                      markVialFinished(vial.id)
                      refresh()
                    }
                  }}
                  className="inline-flex min-h-10 items-center gap-1 rounded-xl bg-red-500/10 px-3 text-xs text-red-400"
                >
                  <Check size={12} /> Finished
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {finished.length > 0 && (
        <details className="rounded-2xl border border-white/5 bg-white/[0.02] p-3">
          <summary className="cursor-pointer text-sm text-slate-500">
            Finished vials ({finished.length})
          </summary>
          <ul className="mt-3 space-y-2">
            {finished.map((v) => (
              <li
                key={v.id}
                className="flex items-center justify-between text-xs text-slate-500"
              >
                <span className="line-through opacity-70">
                  {v.compoundName} · {formatMg(v.vialMg)}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    if (confirm('Remove permanently?')) {
                      const next = loadVials().filter((x) => x.id !== v.id)
                      import('../../utils/inventoryStorage').then((m) => {
                        m.saveVials(next)
                        refresh()
                      })
                    }
                  }}
                  className="p-1 text-slate-600"
                  aria-label="Delete"
                >
                  <Trash2 size={12} />
                </button>
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  )
}

export default VialInventory
