import { useState } from 'react'
import { useNavigate } from 'react-router'
import { FileBarChart, Wallet, TrendingUp, AlertTriangle, Clock, CheckCircle2, Plus, Search } from 'lucide-react'
import { useCollection } from '@/shared/hooks/useCollection'
import { Breadcrumb, Button, KpiTile, Tabs } from '@/shared/components'
import type { Project } from '@/shared/types/entities'
import { formatCurrencyCompact } from '@/shared/lib/currency'
import { canEdit } from '@/shared/lib/permissions'
import { useAuth } from '@/app/providers/AuthProvider'
import { SupplierOutstandingTab } from './components/SupplierOutstandingTab'
import { CustomerOutstandingTab } from './components/CustomerOutstandingTab'

export function OutstandingPage() {
  const navigate = useNavigate()
  const { appUser } = useAuth()
  const editable = canEdit(appUser?.role ?? 'manager', 'outstanding')
  const { data: projects } = useCollection<Project>('projects', [])
  const [tab, setTab] = useState<'supplier' | 'customer'>('customer')
  const [search, setSearch] = useState('')

  const totalContractValue = projects.reduce((s, p) => s + p.contractValue, 0)
  const outstanding = projects.reduce((s, p) => s + p.outstandingAmount, 0)
  const received = projects.reduce((s, p) => s + p.receivedAmount, 0)
  const overdue = projects.reduce((s, p) => s + p.overdueAmount, 0)
  const waitingPayment = projects.filter((p) => p.status === 'active' && p.outstandingAmount > 0).length
  const completed = projects.filter((p) => p.status === 'completed').length

  return (
    <div className="space-y-4">
      <Breadcrumb items={[{ label: 'Home', to: '/dashboard' }, { label: 'Outstanding' }]} />
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="text-2xl font-semibold text-[var(--text-primary)]">Outstanding</h1>
        {editable && (
          <Button onClick={() => navigate('/business-pipeline/new')}>
            <Plus className="h-4 w-4" /> New Project
          </Button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <KpiTile icon={FileBarChart} label="Total Contract Value" value={formatCurrencyCompact(totalContractValue)} accentColor="var(--text-muted)" iconBg="var(--bg-surface-muted)" iconColor="var(--text-primary)" />
        <KpiTile icon={Wallet} label="Outstanding" value={formatCurrencyCompact(outstanding)} accentColor="#d97706" iconBg="#fffbeb" iconColor="#d97706" />
        <KpiTile icon={TrendingUp} label="Received" value={formatCurrencyCompact(received)} accentColor="#16a34a" iconBg="#ecfdf3" iconColor="#16a34a" />
        <KpiTile icon={AlertTriangle} label="Overdue" value={formatCurrencyCompact(overdue)} accentColor="#dc2626" iconBg="#fef2f2" iconColor="#dc2626" />
        <KpiTile icon={Clock} label="Waiting Payment" value={String(waitingPayment)} accentColor="var(--text-muted)" iconBg="var(--bg-surface-muted)" iconColor="var(--text-primary)" />
        <KpiTile icon={CheckCircle2} label="Completed" value={String(completed)} accentColor="#16a34a" iconBg="#ecfdf3" iconColor="#16a34a" />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Tabs
          tabs={[
            { key: 'customer', label: 'Customer Outstanding' },
            { key: 'supplier', label: 'Supplier Outstanding' },
          ]}
          active={tab}
          onChange={(k) => setTab(k as 'supplier' | 'customer')}
        />
        {tab === 'customer' && (
          <div className="relative w-full max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search customer, project, PO…"
              className="h-10 w-full rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] pl-9 pr-3 text-sm outline-none focus:border-brand-500"
            />
          </div>
        )}
      </div>

      {tab === 'customer' ? <CustomerOutstandingTab search={search} /> : <SupplierOutstandingTab />}
    </div>
  )
}
