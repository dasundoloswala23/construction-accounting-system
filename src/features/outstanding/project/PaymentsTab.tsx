import { useState } from 'react'
import toast from 'react-hot-toast'
import { orderBy, where } from 'firebase/firestore'
import { Plus, Receipt as ReceiptIcon } from 'lucide-react'
import { useCollection } from '@/shared/hooks/useCollection'
import { Card, CardHeader, CardBody, DataTable, StatusBadge, CurrencyText, Button } from '@/shared/components'
import type { DataTableColumn } from '@/shared/components'
import type { Project, ProjectPayment, Receipt } from '@/shared/types/entities'
import { formatDateLong } from '@/shared/lib/dates'
import { canEdit } from '@/shared/lib/permissions'
import { useAuth } from '@/app/providers/AuthProvider'
import { ReceivePaymentModal } from './ReceivePaymentModal'
import { generateReceipt } from '../api'

type ProjectWithId = Project & { id: string }
type PaymentWithId = ProjectPayment & { id: string }

export function PaymentsTab({ project }: { project: ProjectWithId }) {
  const { user, appUser } = useAuth()
  const editable = canEdit(appUser?.role ?? 'manager', 'outstanding')
  const { data: payments, loading } = useCollection<ProjectPayment>('project_payments', [where('projectId', '==', project.id), orderBy('date', 'desc')])
  const { data: receipts } = useCollection<Receipt>('receipts', [where('projectId', '==', project.id)])
  const [modalOpen, setModalOpen] = useState(false)
  const [generating, setGenerating] = useState<string | null>(null)

  async function onGenerateReceipt(payment: PaymentWithId) {
    setGenerating(payment.id)
    try {
      const { receiptNo } = await generateReceipt(project, payment.id, payment.amount, payment.paymentType, payment.referenceNumber || project.quotationNumber, {
        uid: user?.uid ?? '',
        name: appUser?.displayName ?? 'Unknown',
      })
      toast.success(`Receipt ${receiptNo} generated`)
    } catch {
      toast.error('Could not generate receipt')
    } finally {
      setGenerating(null)
    }
  }

  const columns: DataTableColumn<PaymentWithId>[] = [
    { key: 'date', header: 'Date', render: (p) => formatDateLong(p.date) },
    { key: 'reference', header: 'Reference', render: (p) => p.referenceNumber || '—' },
    { key: 'type', header: 'Payment Type', render: (p) => p.paymentType.replace(/_/g, ' ') },
    { key: 'amount', header: 'Amount', render: (p) => <CurrencyText amount={p.amount} tone="positive" /> },
    { key: 'receivedBy', header: 'Received By', render: (p) => (p.receivedBy === user?.uid ? appUser?.displayName ?? '—' : p.receivedBy) },
    { key: 'status', header: 'Status', render: (p) => <StatusBadge>{p.status.replace(/_/g, ' ')}</StatusBadge> },
    {
      key: 'receipt',
      header: 'Receipt',
      render: (p) => {
        const receipt = receipts.find((r) => r.paymentId === p.id)
        if (receipt) return <span className="font-mono text-xs text-accent-600">{receipt.receiptNo}</span>
        if (!editable || p.status !== 'completed') return '—'
        return (
          <Button size="sm" variant="outline" loading={generating === p.id} onClick={() => onGenerateReceipt(p)}>
            <ReceiptIcon className="h-3.5 w-3.5" /> Generate
          </Button>
        )
      },
    },
  ]

  return (
    <Card>
      <CardHeader
        title="Payments"
        action={
          editable && (
            <Button size="sm" onClick={() => setModalOpen(true)}>
              <Plus className="h-4 w-4" /> Receive Payment
            </Button>
          )
        }
      />
      <CardBody className="p-0">
        <DataTable columns={columns} data={payments} keyField={(p) => p.id} loading={loading} emptyTitle="No payments recorded yet" />
      </CardBody>
      <ReceivePaymentModal open={modalOpen} onClose={() => setModalOpen(false)} project={project} />
    </Card>
  )
}
