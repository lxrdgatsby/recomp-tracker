import { Plus, Trash2 } from 'lucide-react'
import type { Peptide, PeptideFrequency, Profile, TrackerState } from '../../types'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'
import { Input } from '../ui/Input'

interface ProfileViewProps {
  state: TrackerState
  onUpdateProfile: (profile: Partial<Profile>) => void
  onSetPeptides: (peptides: Peptide[]) => void
}

function newPeptide(): Peptide {
  return {
    id: crypto.randomUUID(),
    name: '',
    dose: '',
    frequency: 'daily',
    timing: '',
    notes: '',
  }
}

export function ProfileView({
  state,
  onUpdateProfile,
  onSetPeptides,
}: ProfileViewProps) {
  const { profile, peptides } = state

  const updatePeptide = (id: string, patch: Partial<Peptide>) => {
    onSetPeptides(
      peptides.map((p) => (p.id === id ? { ...p, ...patch } : p))
    )
  }

  const removePeptide = (id: string) => {
    onSetPeptides(peptides.filter((p) => p.id !== id))
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">Profile & Stack</h2>
        <p className="mt-1 text-sm text-slate-400">
          Configure your stats and peptide protocol
        </p>
      </div>

      <Card title="Body Stats">
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Current Weight (lbs)"
            type="number"
            step="0.1"
            value={profile.currentWeight}
            onChange={(e) =>
              onUpdateProfile({ currentWeight: parseFloat(e.target.value) || 0 })
            }
          />
          <Input
            label="Goal Weight (lbs)"
            type="number"
            step="0.1"
            value={profile.goalWeight}
            onChange={(e) =>
              onUpdateProfile({ goalWeight: parseFloat(e.target.value) || 0 })
            }
          />
          <Input
            label="Height (optional)"
            placeholder={`e.g. 5'11"`}
            value={profile.height ?? ''}
            onChange={(e) => onUpdateProfile({ height: e.target.value })}
          />
          <Input
            label="Start Date"
            type="date"
            value={profile.startDate}
            onChange={(e) => onUpdateProfile({ startDate: e.target.value })}
          />
          <Input
            label="Expected Weekly Loss (lbs)"
            type="number"
            step="0.05"
            min="0.25"
            max="2"
            value={profile.weeklyLossTarget}
            onChange={(e) =>
              onUpdateProfile({
                weeklyLossTarget: parseFloat(e.target.value) || 0.875,
              })
            }
          />
        </div>
      </Card>

      <Card
        title="Peptide Stack"
        action={
          <Button
            size="sm"
            variant="secondary"
            onClick={() => onSetPeptides([...peptides, newPeptide()])}
          >
            <Plus size={14} />
            Add Peptide
          </Button>
        }
      >
        <div className="space-y-4">
          {peptides.map((p) => (
            <div
              key={p.id}
              className="rounded-lg border border-slate-800 bg-navy-950/50 p-4"
            >
              <div className="mb-3 flex items-center justify-between">
                <span className="text-sm font-medium text-teal-400">
                  {p.name || 'New Peptide'}
                </span>
                <button
                  type="button"
                  onClick={() => removePeptide(p.id)}
                  className="text-slate-600 transition-colors hover:text-red-400"
                  aria-label="Remove peptide"
                >
                  <Trash2 size={16} />
                </button>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <Input
                  label="Name"
                  value={p.name}
                  onChange={(e) => updatePeptide(p.id, { name: e.target.value })}
                />
                <Input
                  label="Dose"
                  placeholder="e.g. 2mg"
                  value={p.dose}
                  onChange={(e) => updatePeptide(p.id, { dose: e.target.value })}
                />
                <label className="block space-y-1.5">
                  <span className="text-xs font-medium tracking-wide text-slate-400 uppercase">
                    Frequency
                  </span>
                  <select
                    value={p.frequency}
                    onChange={(e) =>
                      updatePeptide(p.id, {
                        frequency: e.target.value as PeptideFrequency,
                      })
                    }
                    className="w-full rounded-lg border border-slate-700 bg-navy-950 px-3 py-2 text-sm text-slate-100 focus:border-teal-500/60 focus:outline-none"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                  </select>
                </label>
                <Input
                  label="Timing"
                  placeholder="e.g. Morning fasted"
                  value={p.timing ?? ''}
                  onChange={(e) => updatePeptide(p.id, { timing: e.target.value })}
                />
                <div className="sm:col-span-2">
                  <Input
                    label="Notes"
                    value={p.notes ?? ''}
                    onChange={(e) => updatePeptide(p.id, { notes: e.target.value })}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}