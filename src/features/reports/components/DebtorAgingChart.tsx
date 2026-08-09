import { BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { formatCurrencyCompact } from '@/shared/lib/currency'

export interface AgingBucket {
  bucket: string
  amount: number
}

// Status-style palette (good -> critical) — reserved for this severity meaning,
// not reused as a generic categorical set elsewhere.
const COLORS = ['#16a34a', '#d97706', '#dc2626', '#7f1d1d']

export function DebtorAgingChart({ data }: { data: AgingBucket[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border-default)" vertical={false} />
        <XAxis dataKey="bucket" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={{ stroke: 'var(--border-default)' }} tickLine={false} />
        <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={(v: number) => formatCurrencyCompact(v)} width={60} />
        <Tooltip
          contentStyle={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: 8, fontSize: 13 }}
          formatter={(value: unknown) => formatCurrencyCompact(Number(value))}
        />
        <Bar dataKey="amount" name="Outstanding" radius={[6, 6, 0, 0]} maxBarSize={56}>
          {data.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
