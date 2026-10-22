import {
  PEPTIDE_CATALOG,
  defaultBacForCatalog,
  getCatalogEntry,
  isVialSizeOption,
} from '../constants/peptideCatalog'
import { getReconstitutionCompound, RECONSTITUTION_TABLE } from '../constants/reconstitutionTable'
import { PROTOCOL_PEPTIDE_OPTIONS } from './vialInventory'
import { u100UnitsFromMg } from '../utils/doseMath'
import { parseDoseToMg } from '../utils/recompProtocol'

export type NewVialCompound = {
  id: string
  name: string
}

export type NewVialFill = {
  vialMg: string
  bacMl: string
  /** Typical starting dose. Display only — not written into remaining mg. */
  helper: string | null
}

/** Catalog order, then dose-calculator compounds that are not in the catalog. */
export function newVialCompounds(): NewVialCompound[] {
  const seen = new Set<string>()
  const compounds: NewVialCompound[] = []
  for (const entry of PEPTIDE_CATALOG) {
    seen.add(entry.id)
    compounds.push({ id: entry.id, name: entry.name })
  }
  for (const row of RECONSTITUTION_TABLE) {
    if (seen.has(row.id)) continue
    seen.add(row.id)
    compounds.push({ id: row.id, name: row.name })
  }
  for (const option of PROTOCOL_PEPTIDE_OPTIONS) {
    if (seen.has(option.id)) continue
    seen.add(option.id)
    compounds.push({ id: option.id, name: option.name })
  }
  return compounds
}

function catalogHasVialDefault(id: string): boolean {
  const entry = getCatalogEntry(id)
  if (!entry) return false
  if (entry.defaultBacWaterUnits) return true
  const mg = parseDoseToMg(entry.defaultDose)
  if (!isVialSizeOption(mg)) return false
  return entry.doseOptions.every((dose) => isVialSizeOption(parseDoseToMg(dose)))
}

export function fillForNewVial(id: string): NewVialFill {
  const empty: NewVialFill = { vialMg: '', bacMl: '', helper: null }
  if (!id) return empty

  const table = getReconstitutionCompound(id)
  if (table && table.vialMg != null && table.vialMg > 0 && table.bacMl != null && table.bacMl > 0) {
    const draw = table.keyDraws[0]
    const doseMg = draw?.desiredMg ?? table.defaultDoseMg
    const units =
      draw?.units ??
      (doseMg != null ? u100UnitsFromMg(doseMg, table.vialMg, table.bacMl) : null)
    const start = draw?.label
      ? `Typical start: ${draw.label}`
      : doseMg != null && units != null
        ? `Typical start: ${doseMg} mg ≈ ${units} units on U-100`
        : null
    const helper = [start, table.note].filter(Boolean).join('. ') || null
    return {
      vialMg: String(table.vialMg),
      bacMl: String(table.bacMl),
      helper,
    }
  }

  const preset = PROTOCOL_PEPTIDE_OPTIONS.find((option) => option.id === id)
  if (preset && preset.defaultVialMg > 0 && preset.defaultBacMl > 0) {
    const units =
      preset.targetDoseMg > 0
        ? u100UnitsFromMg(preset.targetDoseMg, preset.defaultVialMg, preset.defaultBacMl)
        : null
    const helper =
      preset.targetDoseMg > 0 && units != null
        ? `Typical start: ${preset.targetDoseMg} mg ≈ ${units} units on U-100`
        : null
    return {
      vialMg: String(preset.defaultVialMg),
      bacMl: String(preset.defaultBacMl),
      helper,
    }
  }

  const entry = getCatalogEntry(id)
  if (entry && catalogHasVialDefault(entry.id)) {
    const mg = parseDoseToMg(entry.defaultDose)
    const bacMl = defaultBacForCatalog(entry) / 100
    return {
      vialMg: String(mg),
      bacMl: String(bacMl),
      helper: null,
    }
  }

  return empty
}
