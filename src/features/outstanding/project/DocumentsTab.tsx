import { useState } from 'react'
import toast from 'react-hot-toast'
import { orderBy, where } from 'firebase/firestore'
import { FileText, Trash2, Download } from 'lucide-react'
import { useCollection } from '@/shared/hooks/useCollection'
import { Card, CardHeader, CardBody, FileUpload, ConfirmDialog } from '@/shared/components'
import { useFileUpload } from '@/shared/hooks/useFileUpload'
import { useAuth } from '@/app/providers/AuthProvider'
import type { Project, ProjectDocument, ProjectDocumentType } from '@/shared/types/entities'
import { canEdit } from '@/shared/lib/permissions'
import { uploadProjectDocument, deleteProjectDocument } from '../api'

type ProjectWithId = Project & { id: string }
type DocWithId = ProjectDocument & { id: string }

const CATEGORIES: { type: ProjectDocumentType; label: string }[] = [
  { type: 'customerPO', label: 'Customer PO' },
  { type: 'quotation', label: 'Quotation' },
  { type: 'bankSlip', label: 'Bank Slips' },
  { type: 'drawing', label: 'Drawings' },
  { type: 'other', label: 'Other' },
]

export function DocumentsTab({ project }: { project: ProjectWithId }) {
  const { user, appUser } = useAuth()
  const editable = canEdit(appUser?.role ?? 'manager', 'outstanding')
  const { data: documents, loading } = useCollection<ProjectDocument>('project_documents', [where('projectId', '==', project.id), orderBy('uploadedAt', 'desc')])
  const { uploadFile } = useFileUpload()
  const [deleting, setDeleting] = useState<DocWithId | undefined>(undefined)
  const [busy, setBusy] = useState(false)

  async function onUpload(type: ProjectDocumentType, file: File) {
    try {
      const { downloadURL, fileName } = await uploadFile(`projects/${project.id}/documents`, file)
      await uploadProjectDocument(project.id, type, downloadURL, fileName, { uid: user?.uid ?? '', name: appUser?.displayName ?? 'Unknown' })
      toast.success('Document uploaded')
    } catch {
      toast.error('Upload failed')
    }
  }

  async function onDelete() {
    if (!deleting) return
    setBusy(true)
    try {
      await deleteProjectDocument(deleting.id)
      toast.success('Document deleted')
      setDeleting(undefined)
    } catch {
      toast.error('Could not delete')
    } finally {
      setBusy(false)
    }
  }

  if (loading) return null

  return (
    <div className="space-y-4">
      {editable && (
        <Card>
          <CardHeader title="Upload Document" />
          <CardBody className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {CATEGORIES.map((c) => (
              <FileUpload key={c.type} label={c.label} onFileSelected={(f) => onUpload(c.type, f)} />
            ))}
          </CardBody>
        </Card>
      )}

      <Card>
        <CardHeader title="All Documents" subtitle={`${documents.length} files`} />
        <CardBody className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {documents.length === 0 && <p className="text-sm text-[var(--text-muted)]">No documents uploaded yet.</p>}
          {documents.map((doc) => (
            <div key={doc.id} className="flex items-center justify-between rounded-lg border border-[var(--border-default)] p-3">
              <div className="flex items-center gap-2 overflow-hidden">
                <FileText className="h-4 w-4 shrink-0 text-[var(--text-muted)]" />
                <div className="overflow-hidden">
                  <div className="truncate text-sm font-medium text-[var(--text-primary)]">{doc.fileName}</div>
                  <div className="text-xs capitalize text-[var(--text-muted)]">{doc.type.replace(/([A-Z])/g, ' $1')}</div>
                </div>
              </div>
              <div className="flex shrink-0 gap-1">
                <a href={doc.downloadURL} target="_blank" rel="noreferrer" className="rounded-md p-1.5 text-[var(--text-muted)] hover:bg-[var(--bg-surface-muted)]">
                  <Download className="h-4 w-4" />
                </a>
                {editable && (
                  <button onClick={() => setDeleting(doc)} className="rounded-md p-1.5 text-danger-500 hover:bg-danger-50">
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </CardBody>
      </Card>

      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(undefined)}
        onConfirm={onDelete}
        loading={busy}
        title="Delete document?"
        description={`This will remove "${deleting?.fileName}" from the project.`}
      />
    </div>
  )
}
