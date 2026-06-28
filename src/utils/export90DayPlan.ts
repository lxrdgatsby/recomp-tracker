import { addDays, format, parseISO } from 'date-fns'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { CYCLE_DAYS } from '../constants/defaults'
import type { TrackerState } from '../types'
import type { CheckInData } from './checkInStorage'
import { getCheckInHistory } from './checkInStorage'
import { getMilestones, getStartWeight } from './calculations'
import {
  generate90DayPlan,
  get90DayPlan,
  getOnboardingData,
  type Generated90DayPlan,
} from './onboardingStorage'

export function getPlanForExport(state: TrackerState): Generated90DayPlan {
  const saved = get90DayPlan()
  if (saved) return saved

  const onboarding = getOnboardingData()
  if (onboarding) return generate90DayPlan(onboarding)

  const startWeight = getStartWeight(state.profile, state.weightHistory)
  const milestones = getMilestones(state.profile, startWeight)

  return {
    startDate: state.profile.startDate,
    goalDate: format(
      addDays(parseISO(state.profile.startDate), CYCLE_DAYS),
      'yyyy-MM-dd'
    ),
    targetWeeklyLoss: String(state.profile.weeklyLossTarget),
    peptides: state.peptides.map((p) => ({
      name: p.name,
      status: p.frequency === 'weekly' ? 'Weekly' : 'Daily',
    })),
    training: [],
    nutritionFocus: 'High protein (~1g per lb goal weight)',
    milestones: milestones.map((m) => ({
      week: m.week,
      targetWeight: String(m.projectedWeight),
    })),
  }
}

export function export90DayPlan(
  plan: Generated90DayPlan,
  checkIns: CheckInData[] = getCheckInHistory()
) {
  const doc = new jsPDF()

  doc.setFontSize(18)
  doc.text('PeptideTracker - 90 Day Recomp Plan', 20, 20)

  doc.setFontSize(12)
  doc.text(`Goal: ${plan.targetWeeklyLoss} lbs/week`, 20, 35)
  doc.text(`Start: ${plan.startDate} → Goal: ${plan.goalDate}`, 20, 42)
  doc.text(plan.nutritionFocus, 20, 49)

  if (plan.peptides.length > 0) {
    const peptideLine = plan.peptides.map((p) => `${p.name} (${p.status})`).join(', ')
    const lines = doc.splitTextToSize(`Peptides: ${peptideLine}`, 170)
    doc.text(lines, 20, 56)
  }

  const milestoneRows = plan.milestones.map((m) => [
    `Week ${m.week}`,
    `${m.targetWeight} lbs`,
  ])

  autoTable(doc, {
    startY: 72,
    head: [['Week', 'Target Weight']],
    body: milestoneRows,
    theme: 'striped',
    headStyles: { fillColor: [16, 185, 129] },
  })

  if (checkIns.length > 0) {
    const finalY =
      (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable
        ?.finalY ?? 72

    doc.setFontSize(14)
    doc.text('Recent Check-ins', 20, finalY + 14)

    const checkInRows = checkIns.slice(-10).map((c) => [
      c.date.split('T')[0],
      c.weight ? `${c.weight} lbs` : '—',
      `${c.energy}/10`,
      `${c.hunger}/10`,
      c.sideEffects.trim() || '—',
    ])

    autoTable(doc, {
      startY: finalY + 18,
      head: [['Date', 'Weight', 'Energy', 'Hunger', 'Side Effects']],
      body: checkInRows,
      theme: 'striped',
      headStyles: { fillColor: [16, 185, 129] },
      styles: { fontSize: 9 },
    })
  }

  doc.save('90-Day-Recomp-Plan.pdf')
}