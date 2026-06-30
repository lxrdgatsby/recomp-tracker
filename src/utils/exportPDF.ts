import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { buildCheckInSummary } from './checkInInsights'
import { getCheckInHistory } from './checkInStorage'
import {
  generate90DayPlan,
  get90DayPlan,
  getOnboardingData,
  type Generated90DayPlan,
  type OnboardingData,
} from './onboardingStorage'

const EMERALD: [number, number, number] = [16, 185, 129]
const PAGE_BOTTOM = 280

type DocWithTable = jsPDF & { lastAutoTable?: { finalY: number } }

function tableEndY(doc: jsPDF, fallback: number): number {
  return (doc as DocWithTable).lastAutoTable?.finalY ?? fallback
}

function ensureSpace(doc: jsPDF, y: number, needed = 40): number {
  if (y + needed > PAGE_BOTTOM) {
    doc.addPage()
    return 20
  }
  return y
}

function sectionTitle(doc: jsPDF, title: string, y: number): number {
  y = ensureSpace(doc, y, 24)
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text(title, 20, y)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(11)
  return y + 10
}

function bodyText(doc: jsPDF, text: string, y: number): number {
  const lines = doc.splitTextToSize(text, 170)
  y = ensureSpace(doc, y, lines.length * 6 + 4)
  doc.text(lines, 20, y)
  return y + lines.length * 6 + 6
}

function resolvePlan(): Generated90DayPlan | null {
  const saved = get90DayPlan()
  if (saved) return saved
  const onboarding = getOnboardingData()
  if (onboarding) return generate90DayPlan(onboarding)
  return null
}

function addOnboardingSection(
  doc: jsPDF,
  onboarding: OnboardingData,
  startY: number
): number {
  let y = sectionTitle(doc, 'Profile & Onboarding', startY)

  const profileRows: string[][] = [
    ['Experience', onboarding.experience || '—'],
    ['Current Weight', onboarding.currentWeight ? `${onboarding.currentWeight} lbs` : '—'],
    ['Goal Weight', onboarding.goalWeight ? `${onboarding.goalWeight} lbs` : '—'],
    ['Gender', onboarding.gender || '—'],
    ['Age', onboarding.age || '—'],
    ['Training', onboarding.training?.length ? onboarding.training.join(', ') : '—'],
    ['Goals', onboarding.goals?.length ? onboarding.goals.join(', ') : '—'],
    ['Habits / Notes', onboarding.habits?.trim() || '—'],
  ]

  y = ensureSpace(doc, y, 60)
  autoTable(doc, {
    startY: y,
    head: [['Field', 'Value']],
    body: profileRows,
    theme: 'striped',
    headStyles: { fillColor: EMERALD },
    styles: { fontSize: 10 },
    columnStyles: { 0: { cellWidth: 50 } },
  })

  y = tableEndY(doc, y) + 10

  if (onboarding.peptides?.length) {
    y = ensureSpace(doc, y, 40)
    autoTable(doc, {
      startY: y,
      head: [['Peptide', 'Status']],
      body: onboarding.peptides.map((p) => [p.name, p.status]),
      theme: 'striped',
      headStyles: { fillColor: EMERALD },
      styles: { fontSize: 10 },
    })
    y = tableEndY(doc, y) + 10
  }

  return y
}

function addPlanSection(
  doc: jsPDF,
  plan: Generated90DayPlan,
  startY: number
): number {
  let y = sectionTitle(doc, '90-Day Plan', startY)

  y = bodyText(
    doc,
    `Start: ${plan.startDate} → Goal: ${plan.goalDate} · Target: ${plan.targetWeeklyLoss} lbs/week · ${plan.nutritionFocus}`,
    y
  )

  if (plan.peptides.length > 0) {
    y = ensureSpace(doc, y, 40)
    autoTable(doc, {
      startY: y,
      head: [['Peptide', 'Status']],
      body: plan.peptides.map((p) => [p.name, p.status]),
      theme: 'striped',
      headStyles: { fillColor: EMERALD },
      styles: { fontSize: 10 },
    })
    y = tableEndY(doc, y) + 8
  }

  if (plan.training?.length) {
    y = bodyText(doc, `Training focus: ${plan.training.join(', ')}`, y)
  }

  y = ensureSpace(doc, y, 50)
  autoTable(doc, {
    startY: y,
    head: [['Week', 'Target Weight']],
    body: plan.milestones.map((m) => [`Week ${m.week}`, `${m.targetWeight} lbs`]),
    theme: 'striped',
    headStyles: { fillColor: EMERALD },
    styles: { fontSize: 10 },
  })

  return tableEndY(doc, y) + 12
}

function addCheckInsSection(
  doc: jsPDF,
  checkIns: ReturnType<typeof getCheckInHistory>,
  startY: number
): number {
  let y = sectionTitle(doc, 'Daily Check-ins', startY)

  const summary = buildCheckInSummary(checkIns)
  if (summary) {
    y = bodyText(doc, summary, y)
  }

  if (checkIns.length === 0) {
    return bodyText(doc, 'No check-ins logged yet.', y)
  }

  y = ensureSpace(doc, y, 50)
  autoTable(doc, {
    startY: y,
    head: [['Date', 'Weight', 'Energy', 'Hunger', 'Mood', 'Side Effects', 'Notes']],
    body: checkIns.map((c) => [
      c.date.split('T')[0],
      c.weight ? `${c.weight} lbs` : '—',
      `${c.energy}/10`,
      `${c.hunger}/10`,
      c.mood || '—',
      c.sideEffects.trim() || '—',
      c.notes.trim() || '—',
    ]),
    theme: 'striped',
    headStyles: { fillColor: EMERALD },
    styles: { fontSize: 8 },
  })

  return tableEndY(doc, y) + 12
}

function addDoseCalculatorSection(doc: jsPDF, startY: number): number {
  try {
    const raw = localStorage.getItem('doseCalculator')
    if (!raw) return startY
    const data = JSON.parse(raw) as {
      vialMg?: number
      bacWaterUnits?: number
      bacWaterMl?: number
      targetDoseMg?: number
    }
    const bacWaterMl =
      data.bacWaterUnits != null
        ? data.bacWaterUnits / 100
        : data.bacWaterMl
    if (!data.vialMg && !bacWaterMl && !data.targetDoseMg) return startY

    let y = sectionTitle(doc, 'Dose Calculator', startY)
    const concentration =
      data.vialMg && bacWaterMl
        ? (data.vialMg / bacWaterMl).toFixed(2)
        : '—'
    const units =
      data.targetDoseMg && data.vialMg && bacWaterMl
        ? Math.round((data.targetDoseMg / data.vialMg) * bacWaterMl * 100)
        : '—'

    y = ensureSpace(doc, y, 40)
    autoTable(doc, {
      startY: y,
      head: [['Setting', 'Value']],
      body: [
        ['Vial size', data.vialMg != null ? `${data.vialMg} mg` : '—'],
        [
          'BAC water',
          data.bacWaterUnits != null
            ? `${data.bacWaterUnits} units (${bacWaterMl} ml)`
            : bacWaterMl != null
              ? `${bacWaterMl} ml`
              : '—',
        ],
        ['Target dose', data.targetDoseMg != null ? `${data.targetDoseMg} mg` : '—'],
        ['Concentration', concentration !== '—' ? `${concentration} mg/ml` : '—'],
        ['Syringe units (U-100)', units !== '—' ? `${units} units` : '—'],
      ],
      theme: 'striped',
      headStyles: { fillColor: EMERALD },
      styles: { fontSize: 10 },
    })

    return tableEndY(doc, y) + 12
  } catch {
    return startY
  }
}

export function exportFullReport() {
  const doc = new jsPDF()
  const onboarding = getOnboardingData()
  const plan = resolvePlan()
  const checkIns = [...getCheckInHistory()].sort((a, b) =>
    a.date.localeCompare(b.date)
  )
  const reportDate = new Date().toISOString().split('T')[0]

  doc.setFontSize(20)
  doc.setFont('helvetica', 'bold')
  doc.text('PeptideTracker - Complete Report', 20, 20)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(11)
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, 20, 28)

  let y = 42

  if (onboarding) {
    y = addOnboardingSection(doc, onboarding, y)
  } else {
    y = bodyText(
      doc,
      'No onboarding profile saved. Complete onboarding to include goals and stack details.',
      y
    )
  }

  if (plan) {
    y = addPlanSection(doc, plan, y)
  }

  y = addCheckInsSection(doc, checkIns, y)
  y = addDoseCalculatorSection(doc, y)

  doc.save(`PeptideTracker-Report-${reportDate}.pdf`)
}