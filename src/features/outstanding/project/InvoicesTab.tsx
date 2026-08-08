import { useState } from 'react'
import { orderBy, where } from 'firebase/firestore'
import { Plus, FileText } from 'lucide-react'
import { useCollection } from '@/shared/hooks/useCollection'
import { Card, CardHeader, CardBody, DataTable, CurrencyText, Button } from '@/shared/components'
import type { DataTableColumn } from '@/shared/components'
import type { Project, ProjectDocument } from '@/shared/types/entities'
import { formatDateLong } from '@/shared/lib/dates'
import { canEdit } from '@/shared/lib/permissions'
import { useAuth } from '@/app/providers/AuthProvider'
import { UploadInvoiceModal } from './UploadInvoiceModal'

type ProjectWithId = Project & { id: string }
type DocWithId = ProjectDocument & { id: string }

export function InvoicesTab({ project }: { project: ProjectWithId }) {
  const { appUser } = useAuth()
  const editable = canEdit(appUser?.role ?? 'manager', 'outstanding')
  const { data: invoices, loading } = useCollection<ProjectDocument>('project_documents', [
    where('projectId', '==', project.id),
    where('type', '==', 'invoice'),
    orderBy('uploadedAt', 'desc'),
  ])
  const [modalOpen, setModalOpen] = useState(false)

  const columns: DataTableColumn<DocWithId>[] = [
    { key: 'invoiceNumber', header: 'Invoice Number', render: (d) => d.invoiceNumber || '—' },
    { key: 'date', header: 'Date', render: (d) => (d.invoiceDate ? formatDateLong(d.invoiceDate) : '—') },
    { key: 'amount', header: 'Amount', render: (d) => (d.invoiceAmount ? <CurrencyText amount={d.invoiceAmount} /> : '—') },
    { key: 'comments', header: 'Comments', render: (d) => d.comments || '—' },
    {
      key: 'file',
      header: '',
      render: (d) => (
        <a href={d.downloadURL} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-sm text-brand-600 hover:underline">
          <FileText className="h-3.5 w-3.5" /> View
        </a>
      ),
    },
  ]

  return (
    <Card>
      <CardHeader
        title="Invoices"
        action={
          editable && (
            <Button size="sm" onClick={() => setModalOpen(true)}>
              <Plus className="h-4 w-4" /> Upload Invoice
            </Button>
          )
        }
      />
      <CardBody className="p-0">
        <DataTable columns={columns} data={invoices} keyField={(d) => d.id} loading={loading} emptyTitle="No invoices uploaded yet" />
      </CardBody>
      <UploadInvoiceModal open={modalOpen} onClose={() => setModalOpen(false)} project={project} />
    </Card>
  )
}
