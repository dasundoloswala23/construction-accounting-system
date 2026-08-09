import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { formatCurrencyCompact } from '@/shared/lib/currency'

export interface SiteIncomeExpensePoint {
  label: string
  income: number
  expenses: number
}

export function SiteIncomeExpenseChart({ data }: { data: SiteIncomeExpensePoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={Math.max(200, data.length * 44)}>
      <BarChart data={data} layout="vertical" margin={{ top: 4, right: 24, left: 8, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border-default)" horizontal={false} />
        <XAxis type="number" tick={{ fill: 'var(--text-muted)', fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={(v: number) => formatCurrencyCompact(v)} />
        <YAxis type="category" dataKey="label" tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} axisLine={false} tickLine={false} width={110} />
        <Tooltip
          contentStyle={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: 8, fontSize: 13 }}
          formatter={(value: unknown) => formatCurrencyCompact(Number(value))}
        />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Bar dataKey="income" name="Income" fill="#16a34a" radius={[0, 4, 4, 0]} maxBarSize={16} />
        <Bar dataKey="expenses" name="Expenses" fill="#0f1e3d" radius={[0, 4, 4, 0]} maxBarSize={16} />
      </BarChart>
    </ResponsiveContainer>
  )
}
