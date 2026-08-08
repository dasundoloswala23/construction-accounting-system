import { useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { Link } from 'react-router'
import { Plus, Download, TrendingUp, Clock, AlertCircle } from 'lucide-react'
import { orderBy } from 'firebase/firestore'
import { isToday, startOfMonth } from 'date-fns'
import { useCollection } from '@/shared/hooks/useCollection'
import { Card, CardHeader, CardBody, Button, KpiTile, StatusBadge, CurrencyText, DataTable, Tabs } from '@/shared/components'
import type { DataTableColumn } from '@/shared/components'
import type { ProjectPayment } from '@/shared/types/entities'
import { formatCurrencyCompact } from '@/shared/lib/currency'
import { formatDate, formatDateLong } from '@/shared/lib/dates'
import { canEdit } from '@/shared/lib/permissions'
import { useAuth } from '@/app/providers/AuthProvider'
import { AddIncomeModal } from './components/AddIncomeModal'
import { markIncomeReceived } from './api'

type PaymentWithId = ProjectPayment & { id: string }

export function IncomePage() {
  const { appUser } = useAuth()
  const editable = canEdit(appUser?.role ?? 'manager', 'income')
  const { data: payments, loading } = useCollection<ProjectPayment>('project_payments', [orderBy('date', 'desc')])
  const [filter, setFilter] = useState<'all' | 'received' | 'cheque' | 'credit'>('all')
  const [modalOpen, setModalOpen] = useState(false)

  const filtered = useMemo(() => {
    if (filter === 'all') return payments
    if (filter === 'received') return payments.filter((p) => p.status === 'completed' && p.paymentType !== 'cheque')
    if (filter === 'cheque') return payments.filter((p) => p.paymentType === 'cheque')
    return payments.filter((p) => p.paymentType === 'credit')
  }, [payments, filter])

  const todaysIncome = payments.filter((p) => p.status === 'completed' && isToday(p.date.toDate())).reduce((s, p) => s + p.amount, 0)
  const monthStart = startOfMonth(new Date())
  const totalReceived = payments.filter((p) => p.status === 'completed' && p.date.toDate() >= monthStart).reduce((s, p) => s + p.amount, 0)
  const pendingCheques = payments.filter((p) => p.paymentType === 'cheque' && p.status === 'pending_clearance')
  const pendingCredit = payments.filter((p) => p.paymentType === 'credit' && p.status === 'pending_clearance')

  async function onExport() {
    const { exportToExcel } = await import('@/shared/lib/exporters')
    exportToExcel(
      'income',
      'Income',
      filtered.map((p) => ({
        Customer: p.customerName || '',
        Site: p.siteName || '',
        Reference: p.referenceNumber || '',
        Amount: p.amount,
        Method: p.paymentType,
        Status: p.status,
        Date: formatDate(p.date),
      }))
    )
  }

  async function onReceive(id: string) {
    try {
      await markIncomeReceived(id)
      toast.success('Marked as received')
    } catch {
      toast.error('Could not update')
    }
  }

  const columns: DataTableColumn<PaymentWithId>[] = [
    { key: 'customer', header: 'Customer', render: (p) => p.customerName || '—' },
    { key: 'site', header: 'Site', render: (p) => p.siteName || '—' },
    { key: 'reference', header: 'Reference', render: (p) => p.referenceNumber || '—' },
    { key: 'amount', header: 'Amount', render: (p) => <CurrencyText amount={p.amount} tone="positive" /> },
    { key: 'method', header: 'Method', render: (p) => <StatusBadge>{p.paymentType.replace(/_/g, ' ')}</StatusBadge> },
    {
      key: 'status',
      header: 'Status',
      render: (p) => (
        <div>
          <StatusBadge tone={p.status === 'completed' ? 'success' : 'warning'}>{p.status === 'completed' ? 'Received' : p.paymentType}</StatusBadge>
          {p.status !== 'completed' && p.expectedDate && <div className="mt-0.5 text-xs text-[var(--text-muted)]">Due {formatDate(p.expectedDate)}</div>}
        </div>
      ),
    },
    { key: 'date', header: 'Date', render: (p) => formatDateLong(p.date) },
    ...(editable
      ? [
          {
            key: 'actions',
            header: '',
            render: (p: PaymentWithId) =>
              p.status !== 'completed' && p.paymentType === 'credit' ? (
                <Button size="sm" variant="accent" onClick={() => onReceive(p.id)}>
                  Receive
                </Button>
              ) : null,
          } satisfies DataTableColumn<PaymentWithId>,
        ]
      : []),
  ]

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--text-primary)]">Income</h1>
          <p className="mt-1 text-sm text-[var(--text-muted)]">{payments.length} records</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onExport}>
            <Download className="h-4 w-4" /> Export
          </Button>
          {editable && (
            <Button onClick={() => setModalOpen(true)}>
              <Plus className="h-4 w-4" /> Add Income
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiTile icon={TrendingUp} label="Today's Income" value={formatCurrencyCompact(todaysIncome)} accentColor="#16a34a" iconBg="#ecfdf3" iconColor="#16a34a" />
        <KpiTile icon={Download} label="Total Received (Month)" value={formatCurrencyCompact(totalReceived)} accentColor="var(--text-muted)" iconBg="var(--bg-surface-muted)" iconColor="var(--text-primary)" />
        <KpiTile icon={Clock} label="Pending Cheques" value={String(pendingCheques.length)} sublabel={formatCurrencyCompact(pendingCheques.reduce((s, p) => s + p.amount, 0))} accentColor="#d97706" iconBg="#fffbeb" iconColor="#d97706" />
        <KpiTile icon={AlertCircle} label="Pending Credit" value={String(pendingCredit.length)} sublabel={formatCurrencyCompact(pendingCredit.reduce((s, p) => s + p.amount, 0))} accentColor="#dc2626" iconBg="#fef2f2" iconColor="#dc2626" />
      </div>

      {pendingCheques.length > 0 && (
        <Card className="border-l-4 border-l-warning-500 p-4">
          <p className="text-sm text-warning-600">
            {pendingCheques.length} pending cheque{pendingCheques.length > 1 ? 's' : ''} awaiting clearance —{' '}
            <Link to="/cheques" className="font-medium underline">
              clear them in Cheque Management
            </Link>
          </p>
        </Card>
      )}

      <Card>
        <CardHeader
          title="Income Records"
          action={
            <Tabs
              tabs={[
                { key: 'all', label: 'All' },
                { key: 'received', label: 'Received' },
                { key: 'cheque', label: 'Cheque' },
                { key: 'credit', label: 'Credit' },
              ]}
              active={filter}
              onChange={(k) => setFilter(k as typeof filter)}
            />
          }
        />
        <CardBody className="p-0">
          <DataTable columns={columns} data={filtered} keyField={(p) => p.id} loading={loading} emptyTitle="No income records yet" />
        </CardBody>
      </Card>

      <AddIncomeModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  )
}
