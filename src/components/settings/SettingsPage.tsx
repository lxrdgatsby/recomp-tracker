import { useAuth } from '../../contexts/AuthContext'
import { useAppContext } from '../../pages/AppLayout'
import { RemindersCard } from '../reminders/RemindersCard'
import {
  clearAllLocalData,
  exportAllLocalData,
} from '../../utils/appDataStorage'

export function SettingsPage() {
  const { user } = useAuth()
  const { state } = useAppContext()

  const handleExportJson = () => {
    exportAllLocalData(state, user?.id)
  }

  const handleExportPdf = async () => {
    const { exportFullReport } = await import('../../lib/exportPDF')
    exportFullReport()
  }

  const handleClear = () => {
    const confirmed = window.confirm(
      'Clear all local app data? This removes check-ins, calculator settings, cached chat, and tracker state. Your account stays signed in — cloud data in Supabase is not deleted.'
    )
    if (!confirmed) return
    clearAllLocalData(user?.id)
    window.location.reload()
  }

  return (
    <div className="pb-8 text-white">
      <div className="pt-2 pb-6">
        <h1 className="text-3xl font-semibold tracking-tight">Settings</h1>
        <p className="text-slate-400">Manage local data and exports</p>
      </div>

      <div className="mb-6">
        <RemindersCard />
      </div>

      <div className="space-y-4">
        <button
          type="button"
          onClick={handleExportPdf}
          className="w-full rounded-2xl bg-emerald-500/10 py-4 text-sm font-medium text-emerald-400 transition-colors hover:bg-emerald-500/20"
        >
          Export Full Report (PDF)
        </button>

        <button
          type="button"
          onClick={handleExportJson}
          className="w-full rounded-2xl bg-white/10 py-4 text-sm font-medium transition-colors hover:bg-white/20"
        >
          Export All Data (JSON)
        </button>

        <button
          type="button"
          onClick={handleClear}
          className="w-full rounded-2xl bg-red-500/10 py-4 text-sm font-medium text-red-400 transition-colors hover:bg-red-500/20"
        >
          Clear All Local Data
        </button>
      </div>

      <p className="mt-6 text-xs leading-relaxed text-slate-500">
        Export includes tracker state, onboarding, 90-day plan, check-ins, dose
        calculator, injection sites, and local chat history. Clearing local data
        does not delete your Supabase profile or remote conversations.
      </p>
    </div>
  )
}

export default SettingsPage