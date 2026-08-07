import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import { Plus, FileText, Clock, CheckCircle2, XCircle, Briefcase, DollarSign, Building2, BarChart3 } from 'lucide-react'
import { where } from 'firebase/firestore'
import { useCollection } from '@/shared/hooks/useCollection'
import { Breadcrumb, Button, KpiTile } from '@/shared/components'
import type { Quotation, Project } from '@/shared/types/entities'
import { formatCurrencyCompact } from '@/shared/lib/currency'
import { canEdit } from '@/shared/lib/permissions'
import { useAuth } from '@/app/providers/AuthProvider'
import { PipelineCard, type PipelineCardModel } from './components/PipelineCard'

type QuotationWithId = Quotation & { id: string }
type ProjectWithId = Project & { id: string }

export function PipelinePage() {
  const navigate = useNavigate()
  const { appUser } = useAuth()
  const editable = canEdit(appUser?.role ?? 'manager', 'businessPipeline')
  const { data: pendingQuotations, loading: loadingQ } = useCollection<Quotation>('quotations', [
    where('status', 'in', ['draft', 'submitted', 'rejected']),
  ])
  const { data: projects, loading: loadingP } = useCollection<Project>('projects', [])
  const [search, setSearch] = useState('')

  const cards = useMemo<PipelineCardModel[]>(() => {
    const fromQuotations: PipelineCardModel[] = pendingQuotations.map((q: QuotationWithId) => ({
      id: q.id,
      kind: 'quotation',
      quotationNumber: q.quotationNumber,
      title: q.projectName,
      customerName: q.customer.companyName,
      amount: q.pricing.grandTotal,
      createdAt: q.createdAt.toDate(),
      validUntil: q.validUntil.toDate(),
      currentStageKey: q.status === 'rejected' ? 'submitted' : q.status,
      stoppedAt: q.status === 'rejected' ? 'submitted' : undefined,
    }))
    const fromProjects: PipelineCardModel[] = projects.map((p: ProjectWithId) => ({
      id: p.id,
      kind: 'project',
      quotationNumber: p.quotationNumber,
      title: p.projectName,
      customerName: p.customer.companyName,
      amount: p.contractValue,
      createdAt: p.createdAt.toDate(),
      currentStageKey: p.pipelineStage,
      projectStatus: p.status,
    }))
    const all = [...fromQuotations, ...fromProjects].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    const q = search.trim().toLowerCase()
    if (!q) return all
    return all.filter((c) => c.title.toLowerCase().includes(q) || c.customerName.toLowerCase().includes(q) || c.quotationNumber.toLowerCase().includes(q))
  }, [pendingQuotations, projects, search])

  const counts = {
    draft: pendingQuotations.filter((q) => q.status === 'draft').length,
    submitted: pendingQuotations.filter((q) => q.status === 'submitted').length,
    rejected: pendingQuotations.filter((q) => q.status === 'rejected').length,
    approved: projects.filter((p) => p.pipelineStage === 'approved').length,
    poReceived: projects.filter((p) => p.pipelineStage === 'po_received').length,
    advanceReceived: projects.filter((p) => p.pipelineStage === 'advance_received').length,
    active: projects.filter((p) => p.status === 'active' && ['active', 'invoiced'].includes(p.pipelineStage)).length,
    completed: projects.filter((p) => p.status === 'completed').length,
  }

  const totalPipelineValue = pendingQuotations.reduce((s, q) => s + q.pricing.grandTotal, 0) + projects.reduce((s, p) => s + p.contractValue, 0)
  const activeProjectRevenue = projects.filter((p) => p.status === 'active').reduce((s, p) => s + p.contractValue, 0)
  const outstandingReceivables = projects.reduce((s, p) => s + p.outstandingAmount, 0)

  return (
    <div className="space-y-4">
      <Breadcrumb items={[{ label: 'Home', to: '/dashboard' }, { label: 'Business Pipeline' }]} />
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--text-primary)]">Business Pipeline & Quotations</h1>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            {pendingQuotations.length + projects.length} quotations · Pipeline: <span className="font-semibold text-accent-600">{formatCurrencyCompact(totalPipelineValue)}</span>
          </p>
        </div>
        {editable && (
          <Button onClick={() => navigate('/business-pipeline/new')}>
            <Plus className="h-4 w-4" /> New Quotation
          </Button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
        <MiniStat icon={FileText} label="Draft" value={counts.draft} />
        <MiniStat icon={Clock} label="Submitted" value={counts.submitted} />
        <MiniStat icon={CheckCircle2} label="Approved" value={counts.approved} />
        <MiniStat icon={XCircle} label="Rejected" value={counts.rejected} />
        <MiniStat icon={Briefcase} label="PO Received" value={counts.poReceived} />
        <MiniStat icon={DollarSign} label="Advance Received" value={counts.advanceReceived} />
        <MiniStat icon={Building2} label="Active Projects" value={counts.active} />
        <MiniStat icon={BarChart3} label="Completed" value={counts.completed} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <KpiTile icon={BarChart3} label="Total Pipeline Value" value={formatCurrencyCompact(totalPipelineValue)} accentColor="#16a34a" iconBg="#ecfdf3" iconColor="#16a34a" />
        <KpiTile icon={Building2} label="Active Project Revenue" value={formatCurrencyCompact(activeProjectRevenue)} accentColor="#0f1e3d" iconBg="var(--bg-surface-muted)" iconColor="var(--text-primary)" />
        <KpiTile icon={DollarSign} label="Outstanding Receivables" value={formatCurrencyCompact(outstandingReceivables)} accentColor="#d97706" iconBg="#fffbeb" iconColor="#d97706" />
      </div>

      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search quotation, project, or customer…"
        className="h-10 w-full max-w-md rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] px-3 text-sm outline-none focus:border-brand-500"
      />

      {!loadingQ && !loadingP && cards.length === 0 && <p className="py-10 text-center text-sm text-[var(--text-muted)]">No quotations yet.</p>}

      <div className="space-y-4">
        {cards.map((card) => (
          <PipelineCard key={`${card.kind}-${card.id}`} model={card} />
        ))}
      </div>
    </div>
  )
}

function MiniStat({ icon: Icon, label, value }: { icon: typeof FileText; label: string; value: number }) {
  return (
    <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-3">
      <Icon className="h-4 w-4 text-[var(--text-muted)]" />
      <div className="mt-2 text-xl font-semibold text-[var(--text-primary)]">{value}</div>
      <div className="text-xs text-[var(--text-muted)]">{label}</div>
    </div>
  )
}
