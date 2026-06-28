import { Building2, Syringe, TrendingUp, Users } from 'lucide-react'

const STATS = [
  {
    label: 'Active Users',
    value: '124',
    icon: Users,
    colorClass: 'text-emerald-400',
  },
  {
    label: 'Avg Adherence',
    value: '81%',
    icon: TrendingUp,
    colorClass: 'text-blue-400',
  },
  {
    label: 'Top Peptide',
    value: 'Retatrutide',
    icon: Syringe,
    colorClass: 'text-emerald-400',
  },
] as const

export function CompanyDashboard() {
  return (
    <div className="pb-8 text-white">
      <div className="mb-6 flex items-start gap-3 pt-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
          <Building2 size={20} className="text-emerald-400" />
        </div>
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">
            Company Dashboard
          </h2>
          <p className="text-sm text-slate-400">
            White-label analytics preview for peptide companies
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {STATS.map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl border border-white/10 bg-white/5 p-4"
          >
            <div className="mb-2 flex items-center gap-2 text-xs tracking-widest text-slate-400 uppercase">
              <stat.icon size={14} className={stat.colorClass} />
              {stat.label}
            </div>
            <div className={`text-2xl font-semibold ${stat.colorClass}`}>
              {stat.value}
            </div>
          </div>
        ))}
      </div>

      <p className="mt-6 text-sm text-slate-400">
        This view can be white-labeled for peptide companies — custom branding,
        cohort analytics, adherence reporting, and protocol performance at a
        glance.
      </p>

      <div className="mt-6 rounded-2xl border border-dashed border-white/15 bg-white/[0.02] p-5 text-xs text-slate-500">
        Demo data shown. Connect Supabase aggregates or your analytics pipeline
        to populate live metrics.
      </div>
    </div>
  )
}

export default CompanyDashboard