import { AlertTriangle, Check, FlaskConical, Package, Pencil, Plus, Trash2 } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import type { InjectionLog, Peptide } from '../../types'
import type { Vial } from '../../types/v2'
import { EmptyState } from '../ui/EmptyState'
import { useToast } from '../ui/Toast'
import { loadVials, saveVials } from '../../utils/inventoryStorage'
import { removeInventoryVial, stackPeptideForNewVial } from '../../lib/vialInventory'
import { generateId } from '../../lib/generateId'
import {
  endPeptideNow,
  rememberRemovedPeptide,
  rememberRemovedVial,
  removedVialIdSet,
  withoutRemovedVials,
} from '../../lib/removedCompounds'
import {
  calcConcentrationMgPerMl,
  formatMg,
} from '../../utils/vialMath'
import {
  addReplacementVial,
  applyVialEdits,
  doseMgForDate,
  getActiveVialForPeptide,
  formatVialDoseStock,
  isReplacedVial,
  peptideIdOf,
  retireVial,
  vialDoseStock,
  vialIsClosed,
} from '../../utils/vialUsage'
import { formatUnits } from '../../utils/doseMath'
import { fillForNewVial, newVialCompounds } from '../../lib/newVialDefaults'
import {
  describeShelfLife,
  formatVialDate,
  todayIso,
  withShelfLife,
} from '../../utils/vialShelfLife'

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
  /** Second argument is the peptide list when Remove takes a compound off the stack. */
  onInventoryChange?: (vials: Vial[], peptides?: Peptide[]) => void
}

function peptideMatchesVial(peptide: Peptide, vial: Vial): boolean {
  const id = (vial.compoundId || '').trim()
  if (id && peptide.id === id) return true
  return peptide.name.trim().toLowerCase() === vial.compoundName.trim().toLowerCase()
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
  const [vials, setVials] = useState<Vial[]>(() =>
    withoutRemovedVials(initialVials && initialVials.length > 0 ? initialVials : loadVials())
  )
  const [creating, setCreating] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [replacingId, setReplacingId] = useState<string | null>(null)
  const [compoundName, setCompoundName] = useState('')
  const [catalogId, setCatalogId] = useState('')
  const [compoundQuery, setCompoundQuery] = useState('')
  const [doseHelper, setDoseHelper] = useState<string | null>(null)
  const [vialMg, setVialMg] = useState('')
  const [bacMl, setBacMl] = useState('')
  const [isPowder, setIsPowder] = useState(false)
  const [mixedDate, setMixedDate] = useState(todayIso)
  const [notes, setNotes] = useState('')

  const planStart = startDate || todayIso()
  const today = todayIso()

  const commit = (next: Vial[], nextPeptides?: Peptide[]) => {
    const stamped = next.map((vial) => withShelfLife(vial))
    saveVials(stamped)
    setVials(stamped)
    onInventoryChange?.(stamped, nextPeptides)
    onChange?.()
  }

  useEffect(() => {
    if (!initialVials || initialVials.length === 0) return
    setVials(withoutRemovedVials(initialVials))
  }, [initialVials])

  useEffect(() => {
    const onData = () => {
      setVials((current) => {
        const removed = removedVialIdSet()
        const stored = loadVials().filter((vial) => !removed.has(vial.id))
        const base = stored.length > 0 ? stored : current
        return base.filter((vial) => !removed.has(vial.id))
      })
    }
    window.addEventListener('pt-data-updated', onData)
    return () => window.removeEventListener('pt-data-updated', onData)
  }, [])

  const peptideById = useMemo(() => {
    const map = new Map<string, Peptide>()
    for (const p of peptides) map.set(p.id, p)
    return map
  }, [peptides])

  const stackNames = useMemo(
    () => peptides.map((p) => p.name).filter(Boolean),
    [peptides]
  )
  const libraryCompounds = useMemo(() => newVialCompounds(), [])
  const compoundChoices = useMemo(() => {
    const query = compoundQuery.trim().toLowerCase()
    const matched = query
      ? libraryCompounds.filter(
          (compound) =>
            compound.name.toLowerCase().includes(query) ||
            compound.id.includes(query)
        )
      : libraryCompounds
    if (!catalogId || matched.some((compound) => compound.id === catalogId)) return matched
    const selected = libraryCompounds.find((compound) => compound.id === catalogId)
    return selected ? [selected, ...matched] : matched
  }, [catalogId, compoundQuery, libraryCompounds])

  const expiredOpen = useMemo(
    () =>
      vials.filter(
        (v) =>
          v.compoundId !== 'test-cyp' &&
          !isReplacedVial(v) &&
          v.remainingMg > 0.001 &&
          !v.depleted &&
          describeShelfLife(v, today).expired
      ),
    [vials, today]
  )

  const active = useMemo(() => {
    const expiredIds = new Set(expiredOpen.map((vial) => vial.id))
    const live = vials.filter(
      (v) =>
        !expiredIds.has(v.id) &&
        (v.compoundId === 'test-cyp' ||
          (!isReplacedVial(v) && v.remainingMg > 0.001))
    )
    return [...live].sort((a, b) =>
      (b.mixedDate || '').localeCompare(a.mixedDate || '')
    )
  }, [vials, expiredOpen])

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
    setCatalogId('')
    setCompoundQuery('')
    setDoseHelper(null)
    setVialMg('')
    setBacMl('')
    setIsPowder(false)
    setMixedDate(todayIso())
    setNotes('')
  }

  const fillFromVial = (v: Vial, mixed = v.isPowder === false) => {
    setCompoundName(v.compoundName)
    setVialMg(v.vialMg > 0 ? String(v.vialMg) : '10')
    setBacMl(v.bacWaterMl > 0 ? String(v.bacWaterMl) : '2')
    setIsPowder(!mixed)
    const opened = (v.mixedDate || '').slice(0, 10)
    setMixedDate(mixed ? opened || todayIso() : opened)
    setNotes(v.notes || '')
  }

  const chooseCompound = (id: string) => {
    setCatalogId(id)
    if (!id) {
      setCompoundName('')
      setVialMg('')
      setBacMl('')
      setDoseHelper(null)
      return
    }
    const compound = libraryCompounds.find((entry) => entry.id === id)
    const fill = fillForNewVial(id)
    setCompoundName(compound?.name ?? '')
    setVialMg(fill.vialMg)
    setBacMl(fill.bacMl)
    setDoseHelper(fill.helper)
  }

  const openCreate = () => {
    resetForm()
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
        mixedDate: isPowder ? '' : mixedDate.trim() || todayIso(),
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

  const sameCompound = (vial: Vial, compoundId: string | undefined, name: string) => {
    if (compoundId && vial.compoundId === compoundId) return true
    return vial.compoundName.trim().toLowerCase() === name.toLowerCase()
  }

  const handleSaveCreate = () => {
    const name = compoundName.trim()
    const mg = parseFloat(vialMg)
    const ml = parseFloat(bacMl) || 0
    if (!name || !mg || mg <= 0) return
    const peptide = peptides.find(
      (p) => p.name.toLowerCase() === name.toLowerCase() || p.id === catalogId
    )
    const opened = isPowder ? '' : mixedDate.trim() || todayIso()
    const compoundId = catalogId || peptide?.id
    const created: Vial = withShelfLife({
      id: generateId(),
      compoundName: name,
      compoundId,
      vialMg: mg,
      bacWaterMl: isPowder ? 0 : ml,
      concentrationMgPerMl: isPowder ? 0 : calcConcentrationMgPerMl(mg, ml),
      mixedDate: opened,
      isPowder,
      remainingMg: mg,
      notes: notes.trim() || undefined,
      createdAt: new Date().toISOString(),
      depleted: false,
    })
    const removed = removedVialIdSet()
    const closed = vials.filter(
      (vial) =>
        sameCompound(vial, compoundId, name) &&
        (removed.has(vial.id) || vialIsClosed(vial, today))
    )
    for (const vial of closed) rememberRemovedVial(vial.id)
    const kept = vials.filter(
      (vial) => !closed.some((row) => row.id === vial.id) && !removedVialIdSet().has(vial.id)
    )
    const nextPeptides = isPowder ? peptides : stackPeptideForNewVial(peptides, created)
    commit(
      [created, ...kept],
      nextPeptides === peptides ? undefined : nextPeptides
    )
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

  const handleRemove = (id: string) => {
    const vial = vials.find((row) => row.id === id)
    if (!vial) return
    if (!confirm('Remove this vial from your inventory and active stack?')) return
    rememberRemovedVial(vial.id)
    removeInventoryVial(vial.id)
    let peptideChanged = false
    const nextPeptides = peptides.map((peptide) => {
      if (!peptideMatchesVial(peptide, vial)) return peptide
      rememberRemovedPeptide(peptide.id)
      const ended = endPeptideNow(peptide)
      if (ended !== peptide) peptideChanged = true
      return ended
    })
    const nextVials = vials.filter((row) => row.id !== id)
    if (editingId === id || replacingId === id) resetForm()
    commit(nextVials, peptideChanged ? nextPeptides : undefined)
    toast(`${vial.compoundName} removed`)
  }

  const doseHintFor = (name: string) =>
    defaultDoseByName[name] ?? typicalDoseMg

  const formFields = (mode: 'edit' | 'replace' | 'create') => (
    <div className="mt-3 space-y-3">
      {mode === 'create' ? (
        <div className="space-y-2">
          <label className="block text-xs text-slate-400">
            Search
            <input
              value={compoundQuery}
              onChange={(e) => setCompoundQuery(e.target.value)}
              placeholder="Search peptides…"
              className={FIELD}
            />
          </label>
          <label className="block text-xs text-slate-400">
            Compound
            <select
              aria-label="Compound"
              value={catalogId}
              onChange={(e) => chooseCompound(e.target.value)}
              className={FIELD}
            >
              <option value="">Select peptide…</option>
              {compoundChoices.map((compound) => (
                <option key={compound.id} value={compound.id}>
                  {compound.name}
                </option>
              ))}
            </select>
          </label>
        </div>
      ) : (
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
      )}
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
          onClick={() => {
            setIsPowder(false)
            setMixedDate((value) => value || todayIso())
          }}
          className={`min-h-11 rounded-2xl text-sm font-medium ${
            !isPowder ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/5 text-slate-400'
          }`}
        >
          Mixed
        </button>
      </div>
      {mode === 'create' ? (
        <p className="text-sm text-emerald-400">
          Concentration: {previewConc > 0 ? `${previewConc} mg/mL` : '—'}
        </p>
      ) : (
        !isPowder &&
        previewConc > 0 && (
          <p className="text-sm text-emerald-400">Concentration: {previewConc} mg/mL</p>
        )
      )}
      {mode === 'create' && doseHelper && (
        <p className="text-xs leading-relaxed text-slate-400">{doseHelper}</p>
      )}
      <label className="block text-xs text-slate-400">
        Opened date
        <input
          type="date"
          aria-label="Opened date"
          value={mixedDate}
          onChange={(e) => setMixedDate(e.target.value)}
          className={FIELD}
        />
      </label>
      <p className="text-xs text-slate-400">
        {(() => {
          const preview = describeShelfLife(
            { mixedDate: isPowder ? '' : mixedDate, isPowder },
            today
          )
          if (!preview.expiresLabel || !preview.statusLabel) return 'Expires: —'
          return `Expires: ${preview.expiresLabel} · ${preview.statusLabel}`
        })()}
      </p>
      {mode === 'edit' && editingId && (
        <button
          type="button"
          onClick={() => handleRemove(editingId)}
          className="inline-flex min-h-10 items-center gap-1 rounded-xl bg-red-500/10 px-3 text-xs text-red-300"
        >
          <Trash2 size={12} /> Remove
        </button>
      )}
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
    const stock = vialDoseStock(
      vial,
      peptide,
      planStart,
      new Date(),
      dose.doseMg > 0 ? dose.doseMg : doseHintFor(vial.compoundName)
    )
    const left = stock.remaining
    const stockLabel = formatVialDoseStock(stock.total, stock.remaining)
    const low = !empty && !replaced && peptideId !== 'test-cyp' && left != null && left <= 3
    const editing = editingId === vial.id
    const replacing = replacingId === vial.id
    const shelf = describeShelfLife(vial, today)
    const expired = !vial.isPowder && shelf.expired
    const status = replaced
      ? 'Replaced'
      : empty
        ? 'Empty'
        : expired
          ? 'Expired'
          : vial.isPowder
            ? 'Powder'
            : 'Mixed'
    const statusClass = empty || expired
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
            {!editing && !replacing && (
              <>
                <div className="mt-0.5 text-xs text-slate-400">
                  Opened: {shelf.openedLabel}
                  {replaced && vial.replacedAt
                    ? ` · Replaced ${formatVialDate(vial.replacedAt)}`
                    : empty && vial.finishedAt
                      ? ` · Empty ${formatVialDate(vial.finishedAt)}`
                      : ''}
                </div>
                {shelf.expiresLabel && shelf.statusLabel && (
                  <div className={`mt-0.5 text-xs ${shelf.expired ? 'text-red-300' : 'text-slate-400'}`}>
                    Expires: {shelf.expiresLabel} · {shelf.statusLabel}
                  </div>
                )}
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
                    {stockLabel && (
                      <div className={`mt-0.5 font-semibold ${empty ? 'text-red-300' : 'text-emerald-400'}`}>
                        {stockLabel}
                      </div>
                    )}
                  </div>
                )}
                {peptideId === 'test-cyp' && stockLabel && (
                  <div className={`mt-2 text-sm font-semibold ${empty ? 'text-red-300' : 'text-emerald-400'}`}>
                    {stockLabel}
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
            <button
              type="button"
              onClick={() => handleRemove(vial.id)}
              className="inline-flex min-h-10 items-center gap-1 rounded-xl bg-red-500/10 px-3 text-xs text-red-300"
            >
              <Trash2 size={12} /> Remove
            </button>
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
        {expiredOpen.length > 0 && (
          <>
            <h3 className="pt-2 text-xs font-medium tracking-wide text-slate-500 uppercase">
              Archived
            </h3>
            {expiredOpen.map(renderCard)}
          </>
        )}
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
