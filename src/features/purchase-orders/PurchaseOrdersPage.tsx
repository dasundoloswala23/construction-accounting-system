import { useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { Plus, Search, Download, FileSpreadsheet, Eye, Pencil, Copy, CheckCircle2, Trash2 } from 'lucide-react'
import { orderBy } from 'firebase/firestore'
import { useCollection } from '@/shared/hooks/useCollection'
import { Card, CardBody, Button, DataTable, StatusBadge, Breadcrumb, ConfirmDialog } from '@/shared/components'
import type { DataTableColumn } from '@/shared/components'
import type { PurchaseOrder } from '@/shared/types/entities'
import { formatCurrency } from '@/shared/lib/currency'
import { formatDate } from '@/shared/lib/dates'
import { canEdit } from '@/shared/lib/permissions'
import { useAuth } from '@/app/providers/AuthProvider'
import { POFormPanel } from './components/POFormPanel'
import { updatePurchaseOrderStatus, deletePurchaseOrder } from './api'

type POWithId = PurchaseOrder & { id: string }

const STATUS_FLOW: Record<PurchaseOrder['status'], PurchaseOrder['status'] | null> = {
  draft: 'pending',
  pending: 'approved',
  approved: 'paid',
  paid: null,
}

export function PurchaseOrdersPage() {
  const { appUser } = useAuth()
  const editable = canEdit(appUser?.role ?? 'manager', 'purchaseOrders')
  const { data: orders, loading } = useCollection<PurchaseOrder>('purchase_orders', [orderBy('date', 'desc')])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [panelOpen, setPanelOpen] = useState(false)
  const [deleting, setDeleting] = useState<POWithId | undefined>(undefined)
  const [busy, setBusy] = useState(false)

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return orders.filter((po) => {
      const matchesSearch = !q || po.poNumber.toLowerCase().includes(q) || po.supplierName.toLowerCase().includes(q)
      const matchesStatus = !statusFilter || po.status === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [orders, search, statusFilter])

  async function onDelete() {
    if (!deleting) return
    setBusy(true)
    try {
      await deletePurchaseOrder(deleting.id)
      toast.success('Purchase order deleted')
      setDeleting(undefined)
    } catch {
      toast.error('Could not delete purchase order')
    } finally {
      setBusy(false)
    }
  }

  async function advanceStatus(po: POWithId) {
    const next = STATUS_FLOW[po.status]
    if (!next) return
    try {
      await updatePurchaseOrderStatus(po.id, next)
      toast.success(`Marked as ${next}`)
    } catch {
      toast.error('Could not update status')
    }
  }

  async function handleExportExcel() {
    const { exportToExcel } = await import('@/shared/lib/exporters')
    exportToExcel(
      'purchase-orders',
      'Purchase Orders',
      filtered.map((po) => ({
        'PO Number': po.poNumber,
        Supplier: po.supplierName,
        Site: po.siteName,
        Total: po.grandTotal,
        VAT: po.vatEnabled ? `${po.vatPercent}%` : 'No VAT',
        Payment: po.paymentMethod,
        Date: formatDate(po.date),
        Status: po.status,
      }))
    )
  }

  async function handleExportPdf() {
    const { exportTableToPdf } = await import('@/shared/lib/exporters')
    exportTableToPdf(
      'purchase-orders',
      'Purchase Orders',
      ['PO Number', 'Supplier', 'Site', 'Total', 'Payment', 'Date', 'Status'],
      filtered.map((po) => [po.poNumber, po.supplierName, po.siteName, formatCurrency(po.grandTotal), po.paymentMethod, formatDate(po.date), po.status])
    )
  }

  const columns: DataTableColumn<POWithId>[] = [
    { key: 'poNumber', header: 'PO Number', render: (po) => <span className="font-medium">{po.poNumber}</span> },
    { key: 'supplier', header: 'Supplier', render: (po) => po.supplierName },
    { key: 'site', header: 'Site', render: (po) => <span className="text-[var(--text-muted)]">{po.siteName}</span> },
    { key: 'total', header: 'Total', render: (po) => formatCurrency(po.grandTotal) },
    { key: 'vat', header: 'VAT', render: (po) => <StatusBadge tone={po.vatEnabled ? 'info' : 'neutral'}>{po.vatEnabled ? `${po.vatPercent}%` : 'No VAT'}</StatusBadge> },
    { key: 'payment', header: 'Payment', render: (po) => po.paymentMethod.replace(/_/g, ' ') },
    { key: 'date', header: 'Date', render: (po) => formatDate(po.date) },
    { key: 'status', header: 'Status', render: (po) => <StatusBadge>{po.status}</StatusBadge> },
    {
      key: 'actions',
      header: '',
      render: (po) => (
        <div className="flex justify-end gap-1">
          <button className="rounded-md p-1.5 text-[var(--text-muted)] hover:bg-[var(--bg-surface-muted)]">
            <Eye className="h-4 w-4" />
          </button>
          {editable && (
            <>
              <button className="rounded-md p-1.5 text-[var(--text-muted)] hover:bg-[var(--bg-surface-muted)]">
                <Pencil className="h-4 w-4" />
              </button>
              <button className="rounded-md p-1.5 text-[var(--text-muted)] hover:bg-[var(--bg-surface-muted)]">
                <Copy className="h-4 w-4" />
              </button>
              {STATUS_FLOW[po.status] && (
                <button onClick={() => advanceStatus(po)} className="rounded-md p-1.5 text-accent-600 hover:bg-accent-50" title={`Mark ${STATUS_FLOW[po.status]}`}>
                  <CheckCircle2 className="h-4 w-4" />
                </button>
              )}
              <button onClick={() => setDeleting(po)} className="rounded-md p-1.5 text-danger-500 hover:bg-danger-50">
                <Trash2 className="h-4 w-4" />
              </button>
            </>
          )}
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-4">
      <Breadcrumb items={[{ label: 'Home', to: '/dashboard' }, { label: 'Purchase Orders' }]} />
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--text-primary)]">Purchase Orders</h1>
          <p className="mt-1 text-sm text-[var(--text-muted)]">{orders.length} total orders</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportPdf}>
            <Download className="h-4 w-4" /> PDF
          </Button>
          <Button variant="outline" onClick={handleExportExcel}>
            <FileSpreadsheet className="h-4 w-4" /> Excel
          </Button>
          {editable && (
            <Button onClick={() => setPanelOpen(true)}>
              <Plus className="h-4 w-4" /> Add Purchase Order
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardBody className="flex flex-wrap gap-3 border-b border-[var(--border-default)] p-4">
          <div className="relative max-w-md flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search PO number or supplier…"
              className="h-10 w-full rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] pl-9 pr-3 text-sm outline-none focus:border-brand-500"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-10 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] px-3 text-sm"
          >
            <option value="">All Statuses</option>
            <option value="draft">Draft</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="paid">Paid</option>
          </select>
        </CardBody>
        <CardBody className="p-0">
          <DataTable columns={columns} data={filtered} keyField={(po) => po.id} loading={loading} emptyTitle="No purchase orders yet" />
        </CardBody>
      </Card>

      <POFormPanel open={panelOpen} onClose={() => setPanelOpen(false)} />
      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(undefined)}
        onConfirm={onDelete}
        loading={busy}
        title="Delete purchase order?"
        description={`This will permanently remove ${deleting?.poNumber}.`}
      />
    </div>
  )
}
