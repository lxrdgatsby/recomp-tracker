import { useMemo } from 'react'
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { getCheckInHistory } from '../../utils/checkInStorage'

interface AnalyticsPoint {
  day: number
  date: string
  weight: number | null
  energy: number | null
}

interface AdvancedAnalyticsProps {
  refreshKey?: number
}

const TOOLTIP_STYLE = {
  background: '#0a0a0a',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 12,
  color: '#e2e8f0',
}

function buildAnalyticsData(): AnalyticsPoint[] {
  const checkIns = [...getCheckInHistory()].sort((a, b) =>
    a.date.localeCompare(b.date)
  )

  return checkIns.map((c, i) => {
    const weight = parseFloat(c.weight)
    const energy = parseInt(c.energy, 10)
    return {
      day: i + 1,
      date: c.date.split('T')[0],
      weight: !isNaN(weight) && weight > 0 ? weight : null,
      energy: !isNaN(energy) ? energy : null,
    }
  })
}

export function AdvancedAnalytics({ refreshKey = 0 }: AdvancedAnalyticsProps) {
  const data = useMemo(() => {
    void refreshKey
    return buildAnalyticsData()
  }, [refreshKey])

  const hasWeight = data.some((d) => d.weight != null)
  const hasEnergy = data.some((d) => d.energy != null)
  const hasData = data.length > 0 && (hasWeight || hasEnergy)

  const weightDomain = useMemo((): [number, number] | undefined => {
    const weights = data.map((d) => d.weight).filter((w): w is number => w != null)
    if (weights.length === 0) return undefined
    const min = Math.floor(Math.min(...weights) - 4)
    const max = Math.ceil(Math.max(...weights) + 4)
    return [min, Math.max(max, min + 8)]
  }, [data])

  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
      <h3 className="mb-4 font-semibold">Weight & Energy Trends</h3>

      {!hasData ? (
        <p className="text-sm text-slate-400">
          Log a few check-ins to see weight and energy trends.
        </p>
      ) : (
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
              <XAxis
                dataKey="date"
                stroke="#666"
                tick={{ fill: '#94a3b8', fontSize: 10 }}
                axisLine={{ stroke: '#334155' }}
              />
              {hasWeight && (
                <YAxis
                  yAxisId="weight"
                  domain={weightDomain}
                  stroke="#10b981"
                  tick={{ fill: '#10b981', fontSize: 11 }}
                  axisLine={{ stroke: '#334155' }}
                  label={{
                    value: 'lbs',
                    angle: -90,
                    position: 'insideLeft',
                    fill: '#10b981',
                    fontSize: 10,
                  }}
                />
              )}
              {hasEnergy && (
                <YAxis
                  yAxisId="energy"
                  orientation="right"
                  domain={[0, 10]}
                  stroke="#3b82f6"
                  tick={{ fill: '#3b82f6', fontSize: 11 }}
                  axisLine={{ stroke: '#334155' }}
                  label={{
                    value: 'energy',
                    angle: 90,
                    position: 'insideRight',
                    fill: '#3b82f6',
                    fontSize: 10,
                  }}
                />
              )}
              <Tooltip
                contentStyle={TOOLTIP_STYLE}
                labelStyle={{ color: '#94a3b8' }}
                formatter={(value, name) => {
                  if (value == null) return ['—', name]
                  if (name === 'Weight') return [`${value} lbs`, name]
                  if (name === 'Energy') return [`${value}/10`, name]
                  return [String(value), name]
                }}
              />
              <Legend
                wrapperStyle={{ fontSize: 12, color: '#94a3b8' }}
              />
              {hasWeight && (
                <Line
                  yAxisId="weight"
                  type="natural"
                  dataKey="weight"
                  name="Weight"
                  stroke="#10b981"
                  strokeWidth={3}
                  dot={{ fill: '#10b981', r: 4 }}
                  activeDot={{ r: 5 }}
                  connectNulls
                />
              )}
              {hasEnergy && (
                <Line
                  yAxisId="energy"
                  type="natural"
                  dataKey="energy"
                  name="Energy"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={{ fill: '#3b82f6', r: 3 }}
                  activeDot={{ r: 4 }}
                  connectNulls
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}

export default AdvancedAnalytics