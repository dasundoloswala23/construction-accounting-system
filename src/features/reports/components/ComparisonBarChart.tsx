import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { formatCurrencyCompact } from '@/shared/lib/currency'

export interface ComparisonPoint {
  label: string
  budget: number
  spent: number
}

/** Two-series comparison (budget vs spent, same unit/axis) for the Construction Sites tab. */
export function ComparisonBarChart({ data }: { data: ComparisonPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border-default)" vertical={false} />
        <XAxis dataKey="label" tick={{ fill: 'var(--text-muted)', fontSize: 12 }} axisLine={{ stroke: 'var(--border-default)' }} tickLine={false} />
        <YAxis
          tick={{ fill: 'var(--text-muted)', fontSize: 12 }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v: number) => formatCurrencyCompact(v)}
          width={70}
        />
        <Tooltip
          contentStyle={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: 8, fontSize: 13 }}
          formatter={(value: unknown) => formatCurrencyCompact(Number(value))}
        />
        <Legend wrapperStyle={{ fontSize: 13 }} />
        <Bar dataKey="budget" name="Budget" fill="#0f1e3d" radius={[4, 4, 0, 0]} maxBarSize={32} />
        <Bar dataKey="spent" name="Spent" fill="#16a34a" radius={[4, 4, 0, 0]} maxBarSize={32} />
      </BarChart>
    </ResponsiveContainer>
  )
}
