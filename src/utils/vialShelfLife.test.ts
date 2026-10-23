import { describe, expect, it } from 'vitest'
import {
  describeShelfLife,
  expirationForOpened,
  RECONSTITUTED_SHELF_LIFE_DAYS,
} from './vialShelfLife'

describe('reconstituted shelf life', () => {
  it('expires 28 days after the opened date', () => {
    expect(RECONSTITUTED_SHELF_LIFE_DAYS).toBe(28)
    expect(expirationForOpened('2026-10-25')).toBe('2026-11-22')
    expect(expirationForOpened('2026-10-01')).toBe('2026-10-29')
  })

  it('shows days left and Expired from the opened date', () => {
    const live = describeShelfLife({ mixedDate: '2026-10-25', isPowder: false }, '2026-11-10')
    expect(live.expiresIso).toBe('2026-11-22')
    expect(live.statusLabel).toBe('12 days left')
    expect(live.expired).toBe(false)

    const last = describeShelfLife({ mixedDate: '2026-10-25', isPowder: false }, '2026-11-22')
    expect(last.statusLabel).toBe('0 days left')

    const past = describeShelfLife({ mixedDate: '2026-10-25', isPowder: false }, '2026-11-23')
    expect(past.statusLabel).toBe('Expired')
    expect(past.expired).toBe(true)
  })

  it('leaves expiration blank when the vial is still powder or has no opened date', () => {
    expect(describeShelfLife({ mixedDate: '2026-10-25', isPowder: true }).expiresLabel).toBeNull()
    expect(describeShelfLife({ mixedDate: '', isPowder: false }).openedLabel).toBe('—')
    expect(describeShelfLife({ mixedDate: '', isPowder: false }).expiresLabel).toBeNull()
  })
})
