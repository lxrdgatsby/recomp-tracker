import { useState } from 'react'
import { DashboardView } from './components/dashboard/DashboardView'
import { Disclaimer } from './components/layout/Disclaimer'
import { InstallAppButton } from './components/layout/InstallAppButton'
import { Sidebar } from './components/layout/Sidebar'
import { PeptidesView } from './components/peptides/PeptidesView'
import { PlanView } from './components/plan/PlanView'
import { ProfileView } from './components/profile/ProfileView'
import { ProgressView } from './components/progress/ProgressView'
import { WorkoutsView } from './components/workouts/WorkoutsView'
import { useTrackerStore } from './hooks/useTrackerStore'
import type { ViewId } from './types'

export default function App() {
  const [view, setView] = useState<ViewId>('dashboard')
  const store = useTrackerStore()

  const renderView = () => {
    switch (view) {
      case 'dashboard':
        return (
          <DashboardView state={store.state} onLogWeight={store.logWeight} />
        )
      case 'profile':
        return (
          <ProfileView
            state={store.state}
            onUpdateProfile={store.updateProfile}
            onSetPeptides={store.setPeptides}
          />
        )
      case 'peptides':
        return (
          <PeptidesView
            state={store.state}
            onToggleInjection={store.toggleInjection}
          />
        )
      case 'plan':
        return <PlanView state={store.state} />
      case 'workouts':
        return (
          <WorkoutsView
            state={store.state}
            onToggleWorkout={store.toggleWorkout}
          />
        )
      case 'progress':
        return <ProgressView state={store.state} />
    }
  }

  return (
    <div className="flex min-h-screen bg-navy-950">
      <Sidebar
        active={view}
        onNavigate={setView}
        onExport={store.exportData}
      />

      <div className="flex min-h-screen flex-1 flex-col">
        <header className="no-print flex items-center justify-between border-b border-slate-800/80 bg-navy-900/50 px-4 py-4 lg:hidden">
          <div>
            <h1 className="text-lg font-bold text-white">
              Peptide<span className="text-teal-400">Tracker</span>
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <InstallAppButton />
            <button
              type="button"
              onClick={store.exportData}
              className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs text-slate-400"
            >
              Export
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto px-4 py-6 pb-24 lg:px-8 lg:pb-8">
          <div className="mx-auto max-w-5xl">{renderView()}</div>
          <Disclaimer />
        </main>
      </div>
    </div>
  )
}