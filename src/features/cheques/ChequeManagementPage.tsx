import { useMemo, useState } from 'react'
import { isToday } from 'date-fns'
import { Clock, TrendingUp, XCircle, Search, Pencil } from 'lucide-react'
import { useCollection } from '@/shared/hooks/useCollection'
import { Card, CardBody, Breadcrumb, DataTable, StatusBadge, CurrencyText, KpiTile } from '@/shared/components'
import type { DataTableColumn } from '@/shared/components'
import type { Cheque } from '@/shared/types/entities'
import { formatCurrencyCompact } from '@/shared/lib/currency'
import { formatDate } from '@/shared/lib/dates'
import { canEdit } from '@/shared/lib/permissions'
import { useAuth } from '@/app/providers/AuthProvider'
import { UpdateChequeStatusModal } from './components/UpdateChequeStatusModal'

type ChequeWithId = Cheque & { id: string }

export function ChequeManagementPage() {
  const { appUser } = useAuth()
  const editable = canEdit(appUser?.role ?? 'manager', 'chequeManagement')
  const { data: cheques, loading } = useCollection<Cheque>('cheques', [])
  const [search, setSearch] = useState('')
  const [directionFilter, setDirectionFilter] = useState<'all' | 'outgoing' | 'incoming'>('all')
  const [statusFilter, setStatusFilter] = useState('')
  const [editing, setEditing] = useState<ChequeWithId | undefined>(undefined)

  const pendingPayable = cheques.filter((c) => c.direction === 'outgoing' && ['pending', 'post_dated'].includes(c.status))
  const pendingReceivable = cheques.filter((c) => c.direction === 'incoming' && ['pending', 'post_dated'].includes(c.status))
  const dueToday = cheques.filter((c) => ['pending', 'post_dated'].includes(c.status) && isToday(c.dueDate.toDate()))
  const bounced = cheques.filter((c) => c.status === 'bounced')

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return cheques.filter((c) => {
      const matchesSearch = !q || c.chequeNumber.toLowerCase().includes(q) || c.party.toLowerCase().includes(q)
      const matchesDirection = directionFilter === 'all' || c.direction === directionFilter
      const matchesStatus = !statusFilter || c.status === statusFilter
      return matchesSearch && matchesDirection && matchesStatus
    })
  }, [cheques, search, directionFilter, statusFilter])

  const totalOut = filtered.filter((c) => c.direction === 'outgoing').reduce((s, c) => s + c.amount, 0)
  const totalIn = filtered.filter((c) => c.direction === 'incoming').reduce((s, c) => s + c.amount, 0)

  const columns: DataTableColumn<ChequeWithId>[] = [
    {
      key: 'direction',
      header: 'Direction',
      render: (c) => <span className={c.direction === 'outgoing' ? 'text-danger-500' : 'text-accent-600'}>{c.direction === 'outgoing' ? '↘ Outgoing' : '↗ Incoming'}</span>,
    },
    { key: 'chequeNo', header: 'Cheque No.', render: (c) => <span className="font-mono text-xs">{c.chequeNumber}</span> },
    { key: 'party', header: 'Party', render: (c) => c.party },
    { key: 'bank', header: 'Bank', render: (c) => c.bank || '—' },
    { key: 'amount', header: 'Amount', render: (c) => <CurrencyText amount={c.amount} tone={c.direction === 'outgoing' ? 'negative' : 'positive'} /> },
    { key: 'chequeDate', header: 'Cheque Date', render: (c) => formatDate(c.chequeDate) },
    { key: 'dueDate', header: 'Due Date', render: (c) => formatDate(c.dueDate) },
    { key: 'reference', header: 'Reference', render: (c) => c.reference || '—' },
    { key: 'status', header: 'Status', render: (c) => <StatusBadge>{c.status.replace(/_/g, ' ')}</StatusBadge> },
    ...(editable
      ? [
          {
            key: 'actions',
            header: '',
            render: (c: ChequeWithId) => (
              <button onClick={() => setEditing(c)} className="rounded-md p-1.5 text-[var(--text-muted)] hover:bg-[var(--bg-surface-muted)]">
                <Pencil className="h-4 w-4" />
              </button>
            ),
          } satisfies DataTableColumn<ChequeWithId>,
        ]
      : []),
  ]

  return (
    <div className="space-y-4">
      <Breadcrumb items={[{ label: 'Home', to: '/dashboard' }, { label: 'Cheque Management' }]} />
      <h1 className="text-2xl font-semibold text-[var(--text-primary)]">Cheque Management</h1>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiTile icon={TrendingUp} label="Pending Payable" value={formatCurrencyCompact(pendingPayable.reduce((s, c) => s + c.amount, 0))} sublabel={`${pendingPayable.length} cheques`} accentColor="#dc2626" iconBg="#fef2f2" iconColor="#dc2626" />
        <KpiTile icon={TrendingUp} label="Pending Receivable" value={formatCurrencyCompact(pendingReceivable.reduce((s, c) => s + c.amount, 0))} sublabel={`${pendingReceivable.length} cheques`} accentColor="#16a34a" iconBg="#ecfdf3" iconColor="#16a34a" />
        <KpiTile icon={Clock} label="Due Today" value={String(dueToday.length)} accentColor="var(--text-muted)" iconBg="var(--bg-surface-muted)" iconColor="var(--text-primary)" />
        <KpiTile icon={XCircle} label="Bounced" value={String(bounced.length)} sublabel="Requires action" accentColor="#dc2626" iconBg="#fef2f2" iconColor="#dc2626" />
      </div>

      <Card>
        <CardBody className="flex flex-wrap gap-3 border-b border-[var(--border-default)] p-4">
          <div className="relative max-w-md flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search cheque number or party…"
              className="h-10 w-full rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] pl-9 pr-3 text-sm outline-none focus:border-brand-500"
            />
          </div>
          <select value={directionFilter} onChange={(e) => setDirectionFilter(e.target.value as typeof directionFilter)} className="h-10 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] px-3 text-sm">
            <option value="all">All</option>
            <option value="outgoing">Outgoing</option>
            <option value="incoming">Incoming</option>
          </select>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="h-10 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] px-3 text-sm">
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="post_dated">Post-Dated</option>
            <option value="cleared">Cleared</option>
            <option value="bounced">Bounced</option>
          </select>
        </CardBody>
        <CardBody className="p-0">
          <DataTable
            columns={columns}
            data={filtered}
            keyField={(c) => c.id}
            loading={loading}
            emptyTitle="No cheques yet"
            footer={
              <div className="flex justify-end gap-6 border-t border-[var(--border-default)] px-4 py-3 text-sm">
                <span>
                  {filtered.length} cheques shown · Out: <span className="font-semibold text-danger-500">{formatCurrencyCompact(totalOut)}</span>
                </span>
                <span>
                  In: <span className="font-semibold text-accent-600">{formatCurrencyCompact(totalIn)}</span>
                </span>
              </div>
            }
          />
        </CardBody>
      </Card>

      <UpdateChequeStatusModal open={!!editing} onClose={() => setEditing(undefined)} cheque={editing} />
    </div>
  )
}
