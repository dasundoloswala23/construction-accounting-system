import { useState } from 'react'
import toast from 'react-hot-toast'
import { where } from 'firebase/firestore'
import { useCollection } from '@/shared/hooks/useCollection'
import { DataTable, StatusBadge, CurrencyText, Button, ConfirmDialog } from '@/shared/components'
import type { DataTableColumn } from '@/shared/components'
import type { PurchaseOrder } from '@/shared/types/entities'
import { formatDate, isOverdue } from '@/shared/lib/dates'
import { canEdit } from '@/shared/lib/permissions'
import { useAuth } from '@/app/providers/AuthProvider'
import { updatePurchaseOrderStatus } from '@/features/purchase-orders/api'

type POWithId = PurchaseOrder & { id: string }

export function SupplierOutstandingTab() {
  const { appUser } = useAuth()
  const editable = canEdit(appUser?.role ?? 'manager', 'outstanding')
  const { data: pending, loading } = useCollection<PurchaseOrder>('purchase_orders', [where('status', '!=', 'paid')])
  const [paying, setPaying] = useState<POWithId | undefined>(undefined)
  const [busy, setBusy] = useState(false)

  async function confirmPay() {
    if (!paying) return
    setBusy(true)
    try {
      await updatePurchaseOrderStatus(paying.id, 'paid')
      toast.success('Marked as paid')
      setPaying(undefined)
    } catch {
      toast.error('Could not update')
    } finally {
      setBusy(false)
    }
  }

  const columns: DataTableColumn<POWithId>[] = [
    { key: 'supplier', header: 'Supplier', render: (po) => po.supplierName },
    { key: 'invoice', header: 'PO Number', render: (po) => <span className="font-mono text-xs">{po.poNumber}</span> },
    { key: 'total', header: 'Total', render: (po) => <CurrencyText amount={po.grandTotal} /> },
    { key: 'paid', header: 'Paid', render: () => <CurrencyText amount={0} tone="default" /> },
    { key: 'remaining', header: 'Remaining', render: (po) => <CurrencyText amount={po.grandTotal} tone="negative" /> },
    { key: 'date', header: 'Date', render: (po) => formatDate(po.date) },
    {
      key: 'status',
      header: 'Status',
      render: (po) => <StatusBadge tone={isOverdue(po.date) ? 'danger' : 'warning'}>{isOverdue(po.date) ? 'Overdue' : po.status}</StatusBadge>,
    },
    ...(editable
      ? [
          {
            key: 'actions',
            header: '',
            render: (po: POWithId) => (
              <Button size="sm" variant="accent" onClick={() => setPaying(po)}>
                Pay
              </Button>
            ),
          } satisfies DataTableColumn<POWithId>,
        ]
      : []),
  ]

  return (
    <>
      <DataTable columns={columns} data={pending} keyField={(po) => po.id} loading={loading} emptyTitle="No outstanding supplier payables" />
      <ConfirmDialog
        open={!!paying}
        onClose={() => setPaying(undefined)}
        onConfirm={confirmPay}
        loading={busy}
        danger={false}
        confirmLabel="Mark Paid"
        title="Mark purchase order as paid?"
        description={`${paying?.poNumber} — ${paying ? new Intl.NumberFormat('en-LK', { style: 'currency', currency: 'LKR', maximumFractionDigits: 0 }).format(paying.grandTotal) : ''}`}
      />
    </>
  )
}
