import { describe, expect, it } from 'vitest'
import { getProtocolHeader } from './protocolHeader'

describe('getProtocolHeader', () => {
  it('uses stored start Sunday and live LA date: Sat Sep 5 2026 is Week 2', () => {
    const { dateLabel, week } = getProtocolHeader(
      '2026-08-23',
      new Date('2026-09-05T18:00:00Z'), // 11:00 PDT
    )
    expect(dateLabel).toBe('Sat, Sep 5')
    expect(week).toBe(2)
  })

  it('rolls to Week 3 on the next Sunday without a hardcoded date', () => {
    const { dateLabel, week } = getProtocolHeader(
      '2026-08-23',
      new Date('2026-09-06T18:00:00Z'),
    )
    expect(dateLabel).toBe('Sun, Sep 6')
    expect(week).toBe(3)
  })

  it('falls back to 2026-08-23 when no start is stored', () => {
    expect(getProtocolHeader(undefined, new Date('2026-09-05T18:00:00Z')).week).toBe(2)
    expect(getProtocolHeader('', new Date('2026-09-05T18:00:00Z')).week).toBe(2)
  })

  it('week 1 is the start Sunday through the following Saturday', () => {
    expect(getProtocolHeader('2026-08-23', new Date('2026-08-23T18:00:00Z')).week).toBe(1)
    expect(getProtocolHeader('2026-08-23', new Date('2026-08-29T18:00:00Z')).week).toBe(1)
    expect(getProtocolHeader('2026-08-23', new Date('2026-08-30T18:00:00Z')).week).toBe(2)
  })

  it('caps week at 13 after day 90', () => {
    const after = getProtocolHeader('2026-08-23', new Date('2026-12-01T18:00:00Z'))
    expect(after.week).toBe(13)
    expect(after.dateLabel).toBe('Tue, Dec 1')
  })
})
