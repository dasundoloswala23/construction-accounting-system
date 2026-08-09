import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import { formatCurrencyCompact } from '@/shared/lib/currency'

export interface PieSlice {
  label: string
  value: number
}

// Fixed categorical order, reused from the accent colors already established
// across the Dashboard/Reports KPI tiles — never cycled per-render.
const PALETTE = ['#0f1e3d', '#16a34a', '#d97706', '#7c3aed', '#2563eb', '#dc2626', '#64748b']

export function PieBreakdownChart({ data }: { data: PieSlice[] }) {
  const total = data.reduce((s, d) => s + d.value, 0)
  return (
    <div className="flex items-center gap-4">
      <ResponsiveContainer width={160} height={160}>
        <PieChart>
          <Pie data={data} cx="50%" cy="50%" innerRadius={44} outerRadius={72} dataKey="value" paddingAngle={data.length > 1 ? 2 : 0} isAnimationActive={false}>
            {data.map((_, i) => (
              <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(v: unknown) => formatCurrencyCompact(Number(v))} contentStyle={{ borderRadius: 8, fontSize: 12 }} />
        </PieChart>
      </ResponsiveContainer>
      <div className="flex-1 space-y-2">
        {data.map((d, i) => (
          <div key={d.label} className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-sm" style={{ background: PALETTE[i % PALETTE.length] }} />
              <span className="text-[var(--text-secondary)]">{d.label}</span>
            </div>
            <span className="font-medium text-[var(--text-primary)]">
              {formatCurrencyCompact(d.value)} {total > 0 && <span className="text-[var(--text-muted)]">({Math.round((d.value / total) * 100)}%)</span>}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
