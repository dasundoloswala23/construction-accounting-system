import { useState } from 'react'
import { useParams, useSearchParams } from 'react-router'
import { LayoutGrid, DollarSign, FileText, Receipt, FolderOpen, Clock } from 'lucide-react'
import { useDocument } from '@/shared/hooks/useDocument'
import { Breadcrumb, Tabs, LoadingBlock, StatusBadge } from '@/shared/components'
import type { Project } from '@/shared/types/entities'
import { OverviewTab } from './OverviewTab'
import { PaymentsTab } from './PaymentsTab'
import { InvoicesTab } from './InvoicesTab'
import { ReceiptsTab } from './ReceiptsTab'
import { DocumentsTab } from './DocumentsTab'
import { TimelineTab } from './TimelineTab'

const TABS = [
  { key: 'overview', label: 'Overview', icon: LayoutGrid },
  { key: 'payments', label: 'Payments', icon: DollarSign },
  { key: 'invoices', label: 'Invoices', icon: FileText },
  { key: 'receipts', label: 'Receipts', icon: Receipt },
  { key: 'documents', label: 'Documents', icon: FolderOpen },
  { key: 'timeline', label: 'Timeline', icon: Clock },
]

export function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [searchParams, setSearchParams] = useSearchParams()
  const [tab, setTab] = useState(searchParams.get('tab') ?? 'overview')
  const { data: project, loading } = useDocument<Project>(id ? `projects/${id}` : null)

  function changeTab(key: string) {
    setTab(key)
    setSearchParams({ tab: key }, { replace: true })
  }

  if (loading) return <LoadingBlock />
  if (!project) return <p className="py-10 text-center text-sm text-[var(--text-muted)]">Project not found.</p>

  return (
    <div className="space-y-4">
      <Breadcrumb items={[{ label: 'Home', to: '/dashboard' }, { label: 'Outstanding', to: '/outstanding' }, { label: project.projectName }]} />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--text-primary)]">{project.projectName}</h1>
          <p className="mt-1 text-sm text-[var(--text-muted)]">{project.customer.companyName}</p>
        </div>
        <StatusBadge tone={project.status === 'completed' ? 'success' : 'info'}>{project.status === 'completed' ? 'Completed' : project.pipelineStage.replace(/_/g, ' ')}</StatusBadge>
      </div>

      <Tabs tabs={TABS} active={tab} onChange={changeTab} variant="underline" />

      {tab === 'overview' && <OverviewTab project={project} />}
      {tab === 'payments' && <PaymentsTab project={project} />}
      {tab === 'invoices' && <InvoicesTab project={project} />}
      {tab === 'receipts' && <ReceiptsTab project={project} />}
      {tab === 'documents' && <DocumentsTab project={project} />}
      {tab === 'timeline' && <TimelineTab projectId={project.id} />}
    </div>
  )
}
