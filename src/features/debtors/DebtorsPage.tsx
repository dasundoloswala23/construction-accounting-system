import { useState } from 'react'
import { AlertCircle, Search } from 'lucide-react'
import { useCollection } from '@/shared/hooks/useCollection'
import { Breadcrumb, KpiTile } from '@/shared/components'
import type { Project } from '@/shared/types/entities'
import { formatCurrencyCompact } from '@/shared/lib/currency'
import { CustomerOutstandingTab } from '@/features/outstanding/components/CustomerOutstandingTab'

/** Thin reuse of Outstanding's Customer Outstanding view, filtered to only
 * customers who currently owe money (per the plan: Debtors is a filtered
 * re-export of Outstanding's customer-receivables data, not a new collection). */
export function DebtorsPage() {
  const { data: projects } = useCollection<Project>('projects', [])
  const [search, setSearch] = useState('')

  const debtors = projects.filter((p) => p.outstandingAmount > 0)
  const totalOwed = debtors.reduce((s, p) => s + p.outstandingAmount, 0)

  return (
    <div className="space-y-4">
      <Breadcrumb items={[{ label: 'Home', to: '/dashboard' }, { label: 'Debtors' }]} />
      <h1 className="text-2xl font-semibold text-[var(--text-primary)]">Debtors</h1>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <KpiTile icon={AlertCircle} label="Total Owed" value={formatCurrencyCompact(totalOwed)} accentColor="#dc2626" iconBg="#fef2f2" iconColor="#dc2626" />
        <KpiTile icon={AlertCircle} label="Debtor Count" value={String(debtors.length)} accentColor="var(--text-muted)" iconBg="var(--bg-surface-muted)" iconColor="var(--text-primary)" />
      </div>

      <div className="relative max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search customer, project, PO…"
          className="h-10 w-full rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] pl-9 pr-3 text-sm outline-none focus:border-brand-500"
        />
      </div>

      <CustomerOutstandingTab search={search} onlyOutstanding emptyMessage="No outstanding debtors right now." />
    </div>
  )
}
