import type { CheckInData } from './checkInStorage'

export function buildCheckInSummary(checkIns: CheckInData[]): string {
  if (checkIns.length === 0) return ''

  const avgEnergy =
    checkIns.reduce((sum, c) => sum + parseInt(c.energy, 10), 0) /
    checkIns.length
  const avgHunger =
    checkIns.reduce((sum, c) => sum + parseInt(c.hunger, 10), 0) /
    checkIns.length

  const withWeight = checkIns.filter((c) => parseFloat(c.weight) > 0)
  let weightNote = ''
  if (withWeight.length >= 2) {
    const first = parseFloat(withWeight[0].weight)
    const last = parseFloat(withWeight[withWeight.length - 1].weight)
    const delta = Math.round((first - last) * 10) / 10
    if (delta > 0) weightNote = ` Weight down ${delta} lbs across check-ins.`
    else if (delta < 0) weightNote = ` Weight up ${Math.abs(delta)} lbs across check-ins.`
  }

  const sideEffectCount = checkIns.filter((c) => c.sideEffects.trim()).length
  const sideNote =
    sideEffectCount > 0
      ? ` Side effects noted on ${sideEffectCount} of ${checkIns.length} entries.`
      : ''

  return `Average energy: ${avgEnergy.toFixed(1)}/10 · hunger: ${avgHunger.toFixed(1)}/10 over last ${checkIns.length} check-in${checkIns.length === 1 ? '' : 's'}.${weightNote}${sideNote}`
}