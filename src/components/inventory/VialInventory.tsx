import { AlertTriangle, Check, FlaskConical, Package, Pencil, Plus } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import type { InjectionLog, Peptide } from '../../types'
import type { Vial } from '../../types/v2'
import { EmptyState } from '../ui/EmptyState'
import { useToast } from '../ui/Toast'
import { loadVials, saveVials } from '../../utils/inventoryStorage'
import {
  calcConcentrationMgPerMl,
  formatMg,
} from '../../utils/vialMath'
import {
  addReplacementVial,
  applyVialEdits,
  doseMgForDate,
  getActiveVialForPeptide,
  isReplacedVial,
  peptideIdOf,
  remainingDosesForVial,
  retireVial,
} from '../../utils/vialUsage'
import { formatUnits } from '../../utils/doseMath'

const FIELD =
  'mt-1 w-full rounded-2xl border border-white/15 bg-[#0a0a0a] px-3 py-3 text-base text-white'

interface VialInventoryProps {
  typicalDoseMg?: number
  defaultDoseByName?: Record<string, number>
  peptides?: Peptide[]
  startDate?: string
  initialVials?: Vial[]
  injectionLogs?: InjectionLog[]
  onChange?: () => void
  onInventoryChange?: (vials: Vial[]) => void
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

function todayIso(): string {
  const n = new Date()
  return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}-${String(n.getDate()).padStart(2, '0')}`
}

export function VialInventory({
  typicalDoseMg = 0.5,
  defaultDoseByName = {},
  peptides = [],
  startDate,
  initialVials,
  injectionLogs = [],
  onChange,
  onInventoryChange,
}: VialInventoryProps) {
  const { toast } = useToast()
  const [vials, setVials] = useState<Vial[]>(
    () => (initialVials && initialVials.length > 0 ? initialVials : loadVials())
  )
  const [creating, setCreating] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [replacingId, setReplacingId] = useState<string | null>(null)
  const [compoundName, setCompoundName] = useState('')
  const [vialMg, setVialMg] = useState('10')
  const [bacMl, setBacMl] = useState('2')
  const [isPowder, setIsPowder] = useState(false)
  const [mixedDate, setMixedDate] = useState(todayIso)
  const [notes, setNotes] = useState('')

  const planStart = startDate || todayIso()
  const today = todayIso()

  const commit = (next: Vial[]) => {
    saveVials(next)
    setVials(next)
    onInventoryChange?.(next)
    onChange?.()
  }

  useEffect(() => {
    if (initialVials && initialVials.length > 0) setVials(initialVials)
  }, [initialVials])

  useEffect(() => {
    const onData = () => {
      if (initialVials && initialVials.length > 0) setVials(initialVials)
      else setVials(loadVials())
    }
    window.addEventListener('pt-data-updated', onData)
    return () => window.removeEventListener('pt-data-updated', onData)
  }, [initialVials])

  const peptideById = useMemo(() => {
    const map = new Map<string, Peptide>()
    for (const p of peptides) map.set(p.id, p)
    return map
  }, [peptides])

  const stackNames = useMemo(
    () => peptides.map((p) => p.name).filter(Boolean),
    [peptides]
  )

  const active = useMemo(() => {
    const live = vials.filter(
      (v) =>
        v.compoundId === 'test-cyp' ||
        (!isReplacedVial(v) && v.remainingMg > 0.001)
    )
    return [...live].sort((a, b) =>
      (b.mixedDate || '').localeCompare(a.mixedDate || '')
    )
  }, [vials])

  const finished = useMemo(
    () =>
      vials.filter(
        (v) =>
          v.compoundId !== 'test-cyp' &&
          (isReplacedVial(v) || v.remainingMg <= 0.001)
      ),
    [vials]
  )

  const finishedNeedsReplacement = useMemo(
    () =>
      finished.filter((v) => !getActiveVialForPeptide(vials, peptideIdOf(v))),
    [finished, vials]
  )
  const finishedArchived = useMemo(
    () =>
      finished.filter((v) => Boolean(getActiveVialForPeptide(vials, peptideIdOf(v)))),
    [finished, vials]
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
    setReplacingId(null)
    setCreating(false)
    setCompoundName('')
    setVialMg('10')
    setBacMl('2')
    setIsPowder(false)
    setMixedDate(todayIso())
    setNotes('')
  }

  const fillFromVial = (v: Vial, mixed = v.isPowder === false) => {
    setCompoundName(v.compoundName)
    setVialMg(v.vialMg > 0 ? String(v.vialMg) : '10')
    setBacMl(v.bacWaterMl > 0 ? String(v.bacWaterMl) : '2')
    setIsPowder(!mixed)
    setMixedDate((v.mixedDate || todayIso()).slice(0, 10))
    setNotes(v.notes || '')
  }

  const openCreate = () => {
    resetForm()
    setCompoundName(stackNames[0] || 'Retatrutide')
    setCreating(true)
  }

  const openEdit = (v: Vial) => {
    setReplacingId(null)
    setCreating(false)
    setEditingId(v.id)
    fillFromVial(v)
  }

  const openReplacement = (v: Vial) => {
    setEditingId(null)
    setCreating(false)
    setReplacingId(v.id)
    fillFromVial(v, true)
    setMixedDate(todayIso())
    setNotes('')
  }

  const handleSaveEdit = () => {
    if (!editingId) return
    const mg = parseFloat(vialMg)
    const ml = parseFloat(bacMl) || 0
    if (!compoundName.trim() || !mg || mg <= 0) return
    const next = applyVialEdits(
      vials,
      editingId,
      {
        compoundName: compoundName.trim(),
        vialMg: mg,
        bacWaterMl: isPowder ? 0 : ml,
        isPowder,
        mixedDate,
        notes: notes.trim() || undefined,
      },
      injectionLogs,
      peptides,
      planStart
    )
    commit(next)
    toast(`${compoundName.trim()} vial updated`)
    resetForm()
  }

  const handleSaveReplacement = () => {
    const old = vials.find((v) => v.id === replacingId)
    if (!old) return
    const mg = parseFloat(vialMg)
    const ml = parseFloat(bacMl) || 0
    if (!mg || mg <= 0 || ml <= 0) return
    const next = addReplacementVial(vials, old, {
      vialMg: mg,
      bacWaterMl: ml,
      mixedDate: mixedDate || todayIso(),
      notes: notes.trim() || undefined,
    })
    commit(next)
    toast(`Replacement ${old.compoundName} vial added`)
    resetForm()
  }

  const handleSaveCreate = () => {
    const name = compoundName.trim()
    const mg = parseFloat(vialMg)
    const ml = parseFloat(bacMl) || 0
    if (!name || !mg || mg <= 0) return
    const peptide = peptides.find(
      (p) => p.name.toLowerCase() === name.toLowerCase() || p.id === name
    )
    const created: Vial = {
      id: `vial-${peptide?.id ?? name}-${Date.now()}`,
      compoundName: name,
      compoundId: peptide?.id,
      vialMg: mg,
      bacWaterMl: isPowder ? 0 : ml,
      concentrationMgPerMl: isPowder ? 0 : calcConcentrationMgPerMl(mg, ml),
      mixedDate,
      isPowder,
      remainingMg: mg,
      notes: notes.trim() || undefined,
      createdAt: new Date().toISOString(),
      depleted: false,
    }
    commit([created, ...vials])
    toast(`${name} vial added`)
    resetForm()
  }

  const handleFinished = (vial: Vial) => {
    if (!confirm('Retire this vial?')) return
    const next = retireVial(vials, vial.id, today)
    commit(next)
    toast(`${vial.compoundName} retired`)
    if (confirm('Add replacement now?')) {
      const retired = next.find((v) => v.id === vial.id) ?? vial
      openReplacement(retired)
    }
  }

  const doseHintFor = (name: string) =>
    defaultDoseByName[name] ?? typicalDoseMg

  const formFields = (mode: 'edit' | 'replace' | 'create') => (
    <div className="mt-3 space-y-3">
      <label className="block text-xs text-slate-400">
        Compound
        <input
          value={compoundName}
          onChange={(e) => setCompoundName(e.target.value)}
          list="vial-compound-names"
          className={FIELD}
        />
        <datalist id="vial-compound-names">
          {stackNames.map((n) => (
            <option key={n} value={n} />
          ))}
        </datalist>
      </label>
      <div className="grid grid-cols-2 gap-3">
        <label className="block text-xs text-slate-400">
          Vial mg
          <input
            type="number"
            inputMode="decimal"
            value={vialMg}
            onChange={(e) => setVialMg(e.target.value)}
            className={FIELD}
          />
        </label>
        <label className="block text-xs text-slate-400">
          BAC mL
          <input
            type="number"
            inputMode="decimal"
            value={bacMl}
            onChange={(e) => setBacMl(e.target.value)}
            className={FIELD}
            disabled={isPowder}
          />
        </label>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => setIsPowder(true)}
          className={`min-h-11 rounded-2xl text-sm font-medium ${
            isPowder ? 'bg-amber-500/20 text-amber-300' : 'bg-white/5 text-slate-400'
          }`}
        >
          Powder
        </button>
        <button
          type="button"
          onClick={() => setIsPowder(false)}
          className={`min-h-11 rounded-2xl text-sm font-medium ${
            !isPowder ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/5 text-slate-400'
          }`}
        >
          Mixed
        </button>
      </div>
      {!isPowder && previewConc > 0 && (
        <p className="text-sm text-emerald-400">Concentration: {previewConc} mg/mL</p>
      )}
      <label className="block text-xs text-slate-400">
        Opened date
        <input
          type="date"
          value={mixedDate}
          onChange={(e) => setMixedDate(e.target.value)}
          className={FIELD}
        />
      </label>
      <input
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Notes (optional)"
        className={FIELD}
      />
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={resetForm}
          className="min-h-12 rounded-2xl bg-white/5 text-sm text-slate-300"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={
            mode === 'edit'
              ? handleSaveEdit
              : mode === 'replace'
                ? handleSaveReplacement
                : handleSaveCreate
          }
          className="min-h-12 rounded-2xl bg-emerald-500 text-sm font-medium text-black"
        >
          {mode === 'edit' ? 'Save changes' : 'Save vial'}
        </button>
      </div>
    </div>
  )

  const renderCard = (vial: Vial) => {
    const peptideId = peptideIdOf(vial)
    const peptide = peptideById.get(peptideId)
    const replaced = isReplacedVial(vial)
    const empty =
      peptideId !== 'test-cyp' && (replaced || vial.remainingMg <= 0.001)
    const dose = peptide
      ? doseMgForDate(peptide, today, planStart)
      : { doseMg: doseHintFor(vial.compoundName), units: 0 }
    const left = peptide
      ? remainingDosesForVial(vial, peptide, planStart)
      : Math.max(0, Math.floor((vial.remainingMg || 0) / (dose.doseMg || 1)))
    const low = !empty && !replaced && peptideId !== 'test-cyp' && left <= 3
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
    const editing = editingId === vial.id
    const replacing = replacingId === vial.id

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
            {!editing && !replacing && (
              <>
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
                {peptideId !== 'test-cyp' && (
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
              </>
            )}
          </div>
        </div>

        {editing && formFields('edit')}
        {replacing && formFields('replace')}

        {!editing && !replacing && (
          <div className="mt-3 flex flex-wrap gap-2">
            {empty && (
              <button
                type="button"
                onClick={() => openReplacement(vial)}
                className="inline-flex min-h-10 items-center gap-1 rounded-xl bg-emerald-500/15 px-3 text-xs font-medium text-emerald-400"
              >
                <Plus size={12} /> Add replacement
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
                onClick={() => handleFinished(vial)}
                className="inline-flex min-h-10 items-center gap-1 rounded-xl bg-red-500/10 px-3 text-xs text-red-400"
              >
                <Check size={12} /> Finished
              </button>
            )}
          </div>
        )}
      </div>
    )
  }

  const showTopForm = creating && !editingId && !replacingId

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

      {showTopForm && (
        <div className="rounded-3xl border border-emerald-500/20 bg-white/5 p-4">
          <div className="text-sm font-medium text-white">New vial</div>
          {formFields('create')}
        </div>
      )}

      <div className="space-y-3">
        {vials.length === 0 && !showTopForm && (
          <EmptyState
            icon={<FlaskConical size={22} />}
            title="No vials yet"
            description="Track powder and reconstituted stock so remaining doses stay accurate."
            actionLabel="Add first vial"
            onAction={openCreate}
          />
        )}
        {active.map(renderCard)}
        {finishedNeedsReplacement.length > 0 && (
          <>
            <h3 className="pt-2 text-xs font-medium tracking-wide text-slate-500 uppercase">
              Empty / needs replacement
            </h3>
            {finishedNeedsReplacement.map(renderCard)}
          </>
        )}
        {finishedArchived.length > 0 && (
          <details className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
            <summary className="cursor-pointer text-sm text-slate-400">
              Replaced / empty vials ({finishedArchived.length})
            </summary>
            <div className="mt-3 space-y-3">{finishedArchived.map(renderCard)}</div>
          </details>
        )}
      </div>
    </div>
  )
}

export default VialInventory
