import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { formatCurrencyCompact } from '@/shared/lib/currency'

export interface IncomeExpenseProfitPoint {
  month: string
  income: number
  expenses: number
  profit: number
}

/** Values are in millions of LKR. Extends the Dashboard's two-series chart with a
 * dashed profit line, matching the Reports Overview reference design. */
export function IncomeExpenseProfitChart({ data }: { data: IncomeExpenseProfitPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="repIncomeFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#16a34a" stopOpacity={0.18} />
            <stop offset="100%" stopColor="#16a34a" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="repExpensesFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#dc2626" stopOpacity={0.14} />
            <stop offset="100%" stopColor="#dc2626" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border-default)" vertical={false} />
        <XAxis dataKey="month" tick={{ fill: 'var(--text-muted)', fontSize: 12 }} axisLine={{ stroke: 'var(--border-default)' }} tickLine={false} />
        <YAxis
          tick={{ fill: 'var(--text-muted)', fontSize: 12 }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v: number) => formatCurrencyCompact(v * 1_000_000)}
          width={70}
        />
        <Tooltip
          contentStyle={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: 8, fontSize: 13 }}
          formatter={(value: unknown) => formatCurrencyCompact(Number(value) * 1_000_000)}
        />
        <Legend wrapperStyle={{ fontSize: 13 }} />
        <Area type="monotone" dataKey="expenses" name="Expenses" stroke="#dc2626" strokeWidth={2} fill="url(#repExpensesFill)" dot={false} />
        <Area type="monotone" dataKey="income" name="Income" stroke="#16a34a" strokeWidth={2} fill="url(#repIncomeFill)" dot={false} />
        <Area type="monotone" dataKey="profit" name="Profit" stroke="#0f1e3d" strokeWidth={1.5} strokeDasharray="5 3" fill="none" dot={false} />
      </AreaChart>
    </ResponsiveContainer>
  )
}
