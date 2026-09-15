import { AlertTriangle, Check, FlaskConical, Package, Pencil, Plus } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import type { Peptide } from '../../types'
import type { Vial } from '../../types/v2'
import { EmptyState } from '../ui/EmptyState'
import { useToast } from '../ui/Toast'
import {
  addVial,
  loadVials,
  markVialFinished,
  updateVial,
} from '../../utils/inventoryStorage'
import {
  calcConcentrationMgPerMl,
  formatMg,
} from '../../utils/vialMath'
import {
  doseMgForDate,
  getActiveVialForPeptide,
  isReplacedVial,
  peptideIdOf,
  remainingDosesForVial,
} from '../../utils/vialUsage'
import { formatUnits } from '../../utils/doseMath'

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
  peptides?: Peptide[]
  startDate?: string
  initialVials?: Vial[]
  onChange?: () => void
}

function formatOpened(iso?: string): string {
  if (!iso) return '—'
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number)
  return new Date(y, (m ?? 1) - 1, d ?? 1).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function VialInventory({
  typicalDoseMg = 0.5,
  defaultDoseByName = {},
  peptides = [],
  startDate,
  initialVials,
  onChange,
}: VialInventoryProps) {
  const { toast } = useToast()
  const [vials, setVials] = useState<Vial[]>(
    () => (initialVials && initialVials.length > 0 ? initialVials : loadVials())
  )
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

  useEffect(() => {
    if (initialVials && initialVials.length > 0) {
      setVials(initialVials)
      return
    }
    setVials(loadVials())
  }, [initialVials])

  useEffect(() => {
    const onData = () => {
      if (initialVials && initialVials.length > 0) {
        setVials(initialVials)
        return
      }
      setVials(loadVials())
    }
    window.addEventListener('pt-data-updated', onData)
    return () => window.removeEventListener('pt-data-updated', onData)
  }, [initialVials])

  const peptideById = useMemo(() => {
    const map = new Map<string, Peptide>()
    for (const p of peptides) map.set(p.id, p)
    return map
  }, [peptides])

  const active = useMemo(
    () =>
      vials.filter(
        (v) => v.compoundId === 'test-cyp' || v.remainingMg > 0.001
      ),
    [vials]
  )
  const finished = useMemo(
    () =>
      vials.filter(
        (v) => v.compoundId !== 'test-cyp' && v.remainingMg <= 0.001
      ),
    [vials]
  )

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
        compoundId: peptides.find(
          (p) => p.name.toLowerCase() === name.toLowerCase() || p.id === name
        )?.id,
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

  const now = new Date()
  const todayIso = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  const planStart = startDate || todayIso

  const openReplacement = (compoundName: string) => {
    resetForm()
    setCompoundName(compoundName)
    setCustomCompound(!PRESETS.includes(compoundName))
    setIsPowder(false)
    setShowForm(true)
  }

  const renderCard = (vial: Vial) => {
    const peptideId = peptideIdOf(vial)
    const peptide = peptideById.get(peptideId)
    const replaced = isReplacedVial(vial)
    const empty =
      peptideId !== 'test-cyp' && (replaced || vial.remainingMg <= 0.001)
    const dose = peptide
      ? doseMgForDate(peptide, todayIso, planStart)
      : { doseMg: doseHintFor(vial.compoundName), units: 0 }
    const left = peptide
      ? remainingDosesForVial(vial, peptide, planStart)
      : Math.max(0, Math.floor((vial.remainingMg || 0) / (dose.doseMg || 1)))
    const low = !empty && !replaced && peptideId !== 'test-cyp' && left <= 3
    const hasActive = Boolean(getActiveVialForPeptide(vials, peptideId))
    const status = replaced
      ? 'Replaced'
      : empty
        ? 'Empty'
        : vial.isPowder
          ? 'Powder'
          : 'Mixed'
    const statusClass = empty
      ? 'bg-red-500/15 text-red-300'
      : vial.isPowder
        ? 'bg-amber-500/15 text-amber-300'
        : 'bg-emerald-500/15 text-emerald-400'

    return (
      <div
        key={vial.id}
        className={`rounded-3xl border p-4 ${
          empty
            ? 'border-red-500/20 bg-red-500/5'
            : low
              ? 'border-amber-500/25 bg-amber-500/5'
              : 'border-white/10 bg-white/5'
        }`}
      >
        <div className="flex items-start gap-3">
          <div
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${
              empty
                ? 'bg-red-500/15'
                : vial.isPowder
                  ? 'bg-amber-500/15'
                  : 'bg-emerald-500/15'
            }`}
          >
            {vial.isPowder ? (
              <Package size={20} className="text-amber-400" />
            ) : (
              <FlaskConical
                size={20}
                className={empty ? 'text-red-300' : 'text-emerald-400'}
              />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-medium text-white">{vial.compoundName}</span>
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${statusClass}`}>
                {status}
              </span>
            </div>
            <div className="mt-0.5 text-xs text-slate-400">
              Opened {formatOpened(vial.mixedDate)}
              {replaced && vial.replacedAt
                ? ` · Replaced ${formatOpened(vial.replacedAt)}`
                : empty && vial.finishedAt
                  ? ` · Empty ${formatOpened(vial.finishedAt)}`
                  : ''}
            </div>
            <div className="mt-0.5 text-xs text-slate-400">
              {peptideId === 'test-cyp'
                ? 'Multi-use oil vial · 0.75 mL weekly'
                : (
                  <>
                    {formatMg(vial.vialMg)} vial
                    {!vial.isPowder && vial.bacWaterMl > 0 && (
                      <>
                        {' '}
                        · {vial.bacWaterMl} mL BAC · {vial.concentrationMgPerMl} mg/mL
                      </>
                    )}
                  </>
                )}
            </div>
            {peptideId === 'test-cyp' ? (
              <div className="mt-2 text-sm text-white">
                {vial.drawsUsed ?? 0} draws of 0.75 mL used
                {vial.startingMl != null && vial.remainingMl != null ? (
                  <span className="text-slate-500">
                    {' '}
                    · {vial.remainingMl} mL remaining of {vial.startingMl} mL
                  </span>
                ) : (
                  <span className="text-slate-500"> · set starting mL to track remaining</span>
                )}
              </div>
            ) : (
              <div className="mt-2 text-sm text-white">
                {dose.doseMg > 0 && (
                  <div className="text-xs text-slate-400">
                    Current dose {formatMg(dose.doseMg)}
                    {dose.units > 0 ? ` · ${formatUnits(dose.units)} units on U-100` : ''}
                  </div>
                )}
                Remaining{' '}
                <span className={`font-semibold ${empty ? 'text-red-300' : 'text-emerald-400'}`}>
                  {formatMg(vial.remainingMg)}
                </span>
                {!empty && (
                  <span className="text-slate-500">
                    {' '}
                    · {left} dose{left === 1 ? '' : 's'} left
                  </span>
                )}
              </div>
            )}
            {low && (
              <div className="mt-2 flex items-center gap-1.5 text-xs text-amber-300">
                <AlertTriangle size={12} />
                Low stock — {left} dose{left === 1 ? '' : 's'} remaining
              </div>
            )}
            {vial.notes && (
              <p className="mt-2 text-xs leading-relaxed text-slate-500">{vial.notes}</p>
            )}
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {empty && !hasActive && (
            <button
              type="button"
              onClick={() => openReplacement(vial.compoundName)}
              className="inline-flex min-h-10 items-center gap-1 rounded-xl bg-emerald-500/15 px-3 text-xs text-emerald-400"
            >
              <Plus size={12} /> Add replacement
            </button>
          )}
          {vial.isPowder && !empty && (
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
          {!empty && (
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
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-white">Vial Inventory</h2>
          <p className="mt-1 text-sm text-slate-400">
            Powder vs mixed · concentration · remaining doses
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Remaining is based on checked doses only. Missed days stay in the vial.
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

      <div className="space-y-3">
        {vials.length === 0 && !showForm && (
          <EmptyState
            icon={<FlaskConical size={22} />}
            title="No vials yet"
            description="Track powder and reconstituted stock so remaining doses stay accurate."
            actionLabel="Add first vial"
            onAction={openCreate}
          />
        )}
        {active.map(renderCard)}
        {finished.length > 0 && (
          <>
            <h3 className="pt-2 text-xs font-medium tracking-wide text-slate-500 uppercase">
              Empty / needs replacement
            </h3>
            {finished.map(renderCard)}
          </>
        )}
      </div>
    </div>
  )
}

export default VialInventory
