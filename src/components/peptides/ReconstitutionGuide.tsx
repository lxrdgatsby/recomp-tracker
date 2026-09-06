import { useState } from 'react'
import { ChevronDown, Syringe } from 'lucide-react'
import { RECONSTITUTION_FAQ_QUESTION } from '../../constants/reconstitutionGuide'

export { RECONSTITUTION_FAQ_QUESTION }

type ReconstitutionGuideVariant = 'peptides' | 'content' | 'compact'

interface ReconstitutionGuideProps {
  variant?: ReconstitutionGuideVariant
}

function GuideSections() {
  return (
    <div className="space-y-4 text-sm leading-relaxed">
      <section className="rounded-2xl border border-white/10 bg-black/20 p-4">
        <h4 className="mb-2 font-semibold text-emerald-400">1. Prepare</h4>
        <ul className="list-disc space-y-1 pl-4 text-slate-300">
          <li>Wash hands and disinfect workspace.</li>
          <li>Wipe both vial tops with alcohol swabs.</li>
          <li>Let vials reach room temperature.</li>
          <li>Use bacteriostatic water only.</li>
        </ul>
      </section>

      <section className="rounded-2xl border border-white/10 bg-black/20 p-4">
        <h4 className="mb-2 font-semibold text-emerald-400">2. Add BAC Water</h4>
        <ul className="mb-3 space-y-1 text-slate-300">
          <li>
            <strong className="text-white">5mg vial</strong>: 100 units (1mL)
          </li>
          <li>
            <strong className="text-white">10mg vial</strong>: 200 units (2mL)
          </li>
          <li>
            <strong className="text-white">15mg vial</strong>: 300 units (3mL)
          </li>
        </ul>
        <p className="text-slate-300">
          Draw air into syringe, inject into BAC water vial, then draw exact
          amount. Insert needle at an angle into peptide vial (tilted on side).
          Slowly release water <strong className="text-white">down the inner wall</strong>.
          Never squirt directly on powder.
        </p>
      </section>

      <section className="rounded-2xl border border-white/10 bg-black/20 p-4">
        <h4 className="mb-2 font-semibold text-emerald-400">3. Mix</h4>
        <p className="text-slate-300">
          Gently swirl or roll vial until fully dissolved.{' '}
          <span className="font-semibold text-emerald-400">Never shake.</span> Let
          sit if needed.
        </p>
      </section>

      <section className="rounded-2xl border border-white/10 bg-black/20 p-4">
        <h4 className="mb-2 font-semibold text-emerald-400">4. Finish</h4>
        <ul className="list-disc space-y-1 pl-4 text-slate-300">
          <li>
            Inspect: Must be clear. Cloudy, particles, or discoloration = discard.
          </li>
          <li>Refrigerate immediately for 30 minutes before first use.</li>
          <li>
            Store in fridge (36–46°F / 2–8°C). Use within 28–30 days.
          </li>
        </ul>
      </section>

      <section className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4">
        <h4 className="mb-1 font-semibold text-amber-300/90">Safety</h4>
        <p className="text-slate-400">
          When in doubt, throw it out. These are research peptides only — consult
          a healthcare professional.
        </p>
      </section>
    </div>
  )
}

export function ReconstitutionGuide({
  variant = 'peptides',
}: ReconstitutionGuideProps) {
  if (variant === 'compact') {
    return (
      <div className="rounded-xl border border-teal-500/20 bg-teal-500/5 p-3 text-xs text-slate-400">
        <p className="font-medium text-teal-300">U-100 insulin syringe basics</p>
        <p className="mt-1">
          100 units = 1mL. 5mg → 100u, 10mg → 200u, 15mg → 300u BAC water.
        </p>
      </div>
    )
  }

  if (variant === 'content') {
    return (
      <div>
        <p className="mb-4 text-xs text-slate-500">
          U-100 syringe • 100 units = 1mL
        </p>
        <GuideSections />
      </div>
    )
  }

  return <PeptidesGuideAccordion />
}

function PeptidesGuideAccordion() {
  const [open, setOpen] = useState(false)

  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls="reconstitution-guide-panel"
        className="flex w-full cursor-pointer items-center justify-between gap-3 text-left transition-opacity duration-200 hover:opacity-90 active:opacity-75"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-2xl bg-emerald-500/10">
            <Syringe className="text-emerald-400" size={20} />
          </div>
          <div>
            <span className="block font-medium text-white">Reconstitution Guide</span>
            <span className="block text-xs text-slate-400">
              U-100 syringe • 100 units = 1mL
            </span>
          </div>
        </div>
        <ChevronDown
          className={`shrink-0 text-slate-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          size={20}
          aria-hidden="true"
        />
      </button>

      <div
        id="reconstitution-guide-panel"
        role="region"
        aria-hidden={!open}
        className={`grid transition-[grid-template-rows,opacity] duration-200 ${
          open ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
        }`}
      >
        <div className="overflow-hidden">
          <div className="mt-4">
            <GuideSections />
          </div>
        </div>
      </div>
    </div>
  )
}