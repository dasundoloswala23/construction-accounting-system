import { where } from 'firebase/firestore'
import { Printer, Mail } from 'lucide-react'
import { useCollection } from '@/shared/hooks/useCollection'
import { Card, CardHeader, CardBody, DataTable, CurrencyText } from '@/shared/components'
import type { DataTableColumn } from '@/shared/components'
import type { Project, Receipt } from '@/shared/types/entities'
import { formatDateLong } from '@/shared/lib/dates'

type ProjectWithId = Project & { id: string }
type ReceiptWithId = Receipt & { id: string }

export function ReceiptsTab({ project }: { project: ProjectWithId }) {
  const { data: receipts, loading } = useCollection<Receipt>('receipts', [where('projectId', '==', project.id)])

  const columns: DataTableColumn<ReceiptWithId>[] = [
    { key: 'receiptNo', header: 'Receipt No', render: (r) => <span className="font-mono text-xs font-medium">{r.receiptNo}</span> },
    { key: 'date', header: 'Date', render: (r) => formatDateLong(r.date) },
    { key: 'amount', header: 'Amount', render: (r) => <CurrencyText amount={r.amount} tone="positive" /> },
    { key: 'method', header: 'Method', render: (r) => r.method.replace(/_/g, ' ') },
    { key: 'reference', header: 'Reference', render: (r) => r.reference || '—' },
    {
      key: 'actions',
      header: '',
      render: () => (
        <div className="flex justify-end gap-1">
          <button onClick={() => window.print()} className="rounded-md p-1.5 text-[var(--text-muted)] hover:bg-[var(--bg-surface-muted)]" title="Print">
            <Printer className="h-4 w-4" />
          </button>
          <button className="rounded-md p-1.5 text-[var(--text-muted)] hover:bg-[var(--bg-surface-muted)]" title="Email">
            <Mail className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ]

  return (
    <Card>
      <CardHeader title="Receipts" subtitle="Generated from the Payments tab" />
      <CardBody className="p-0">
        <DataTable columns={columns} data={receipts} keyField={(r) => r.id} loading={loading} emptyTitle="No receipts generated yet" />
      </CardBody>
    </Card>
  )
}
