import type { Peptide, Profile, TrackerState } from '../types'

export const STORAGE_KEY = 'recomp-tracker-v1'
export const CYCLE_DAYS = 90
export const TOTAL_WEEKS = 13

export const DEFAULT_PROFILE: Profile = {
  currentWeight: 195,
  goalWeight: 175,
  height: '',
  startDate: new Date().toISOString().slice(0, 10),
  weeklyLossTarget: 0.875,
}

export const DEFAULT_PEPTIDES: Peptide[] = [
  {
    id: 'retatrutide',
    name: 'Retatrutide',
    dose: '2mg',
    frequency: 'weekly',
    timing: 'Sunday AM, fasted',
    notes: 'Titrate per protocol. Rotate injection sites.',
  },
  {
    id: 'tesamorelin',
    name: 'Tesamorelin',
    dose: '2mg',
    frequency: 'daily',
    timing: 'Before bed',
    notes: 'Abdominal injection preferred.',
  },
  {
    id: 'aod9604',
    name: 'AOD9604',
    dose: '300mcg',
    frequency: 'daily',
    timing: 'Morning, fasted',
    notes: 'Take 30 min before food.',
  },
  {
    id: 'bpc157',
    name: 'BPC-157',
    dose: '250mcg',
    frequency: 'daily',
    timing: 'Morning or post-workout',
    notes: 'SubQ near injury site if applicable.',
  },
]

export const DEFAULT_STATE: TrackerState = {
  profile: DEFAULT_PROFILE,
  peptides: DEFAULT_PEPTIDES,
  weightHistory: [],
  injectionLogs: [],
  workoutCompletions: [],
}