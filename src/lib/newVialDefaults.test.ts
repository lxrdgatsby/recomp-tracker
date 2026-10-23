import { describe, expect, it } from 'vitest'
import { PEPTIDE_CATALOG } from '../constants/peptideCatalog'
import { fillForNewVial, newVialCompounds } from './newVialDefaults'

describe('new vial compound defaults', () => {
  it('lists the whole library, including fused peptides, with nothing implied first', () => {
    const compounds = newVialCompounds()
    const ids = compounds.map((compound) => compound.id)
    expect(ids.slice(0, PEPTIDE_CATALOG.length)).toEqual(PEPTIDE_CATALOG.map((entry) => entry.id))
    expect(ids).toContain('reta-cagri')
    expect(ids).toContain('selank-semax')
    expect(ids).toContain('nad')
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('fills Reta + Cagrilintide as 10 mg / 3 mL and leaves the dose as helper text', () => {
    const fill = fillForNewVial('reta-cagri')
    expect(fill.vialMg).toBe('10')
    expect(fill.bacMl).toBe('3')
    expect(fill.helper).toMatch(/45 u/)
    expect(fill.helper).toMatch(/1\.5 mg/)
  })

  it('fills KLOW as 80 mg / 3 mL with a 1 mg draw', () => {
    const fill = fillForNewVial('klow')
    expect(fill.vialMg).toBe('80')
    expect(fill.bacMl).toBe('3')
    expect(fill.helper).toMatch(/3\.75/)
    expect(fill.helper).toMatch(/1 mg/)
  })

  it('fills Selank + Semax as 10 mg / 3 mL', () => {
    const fill = fillForNewVial('selank-semax')
    expect(fill.vialMg).toBe('10')
    expect(fill.bacMl).toBe('3')
    expect(fill.helper).toMatch(/250 mcg/)
  })

  it('fills Tesamorelin from its own recon, not the fused blend', () => {
    const fill = fillForNewVial('tesamorelin')
    expect(fill.vialMg).toBe('20')
    expect(fill.bacMl).toBe('3')
    expect(fill.helper).not.toMatch(/Cagrilintide/)
  })

  it('leaves BAC blank when the library has no recon default', () => {
    const fill = fillForNewVial('semaglutide')
    expect(fill.vialMg).toBe('')
    expect(fill.bacMl).toBe('')
  })
})
