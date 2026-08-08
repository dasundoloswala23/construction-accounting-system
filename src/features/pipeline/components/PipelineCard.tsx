import { Link } from 'react-router'
import toast from 'react-hot-toast'
import { Card, StatusBadge, StageTracker, CurrencyText, Button } from '@/shared/components'
import { PIPELINE_STAGES } from '@/shared/types/entities'
import type { PipelineStage } from '@/shared/types/entities'
import { formatDate } from '@/shared/lib/dates'
import { canEdit } from '@/shared/lib/permissions'
import { useAuth } from '@/app/providers/AuthProvider'
import { approveQuotation, rejectQuotation, submitQuotation, advanceProjectStage, nextPipelineStage, closeProject } from '../api'

export interface PipelineCardModel {
  id: string
  kind: 'quotation' | 'project'
  quotationNumber: string
  title: string
  customerName: string
  siteLabel?: string
  amount: number
  createdAt: Date
  validUntil?: Date
  currentStageKey: PipelineStage
  stoppedAt?: PipelineStage
  projectStatus?: 'active' | 'completed'
}

export function PipelineCard({ model }: { model: PipelineCardModel }) {
  const { user, appUser } = useAuth()
  const editable = canEdit(appUser?.role ?? 'manager', 'businessPipeline')
  const actor = { uid: user?.uid ?? '', name: appUser?.displayName ?? 'Unknown' }

  async function handle(action: () => Promise<unknown>, successMsg: string) {
    try {
      await action()
      toast.success(successMsg)
    } catch {
      toast.error('Action failed')
    }
  }

  const isRejected = model.stoppedAt !== undefined
  const isDone = model.kind === 'project' && model.currentStageKey === 'done'

  return (
    <Card className={`border-l-4 p-5 ${isRejected ? 'border-l-danger-500' : 'border-l-accent-500'}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-[var(--text-muted)]">{model.quotationNumber}</span>
            <StatusBadge tone={isRejected ? 'danger' : model.kind === 'quotation' ? 'warning' : 'success'}>
              {isRejected ? 'Rejected' : model.kind === 'quotation' ? model.currentStageKey : model.projectStatus === 'completed' ? 'Completed' : 'Active'}
            </StatusBadge>
          </div>
          <h3 className="mt-1 text-lg font-semibold text-[var(--text-primary)]">{model.title}</h3>
          <p className="text-sm text-[var(--text-muted)]">
            {model.customerName}
            {model.siteLabel && ` · ${model.siteLabel}`}
          </p>
          <p className="mt-1 text-xs text-[var(--text-muted)]">
            Created: {formatDate(model.createdAt)}
            {model.validUntil && ` · Valid until: ${formatDate(model.validUntil)}`}
          </p>
        </div>
        <div className="text-right">
          <CurrencyText amount={model.amount} className="text-xl" />
        </div>
      </div>

      <div className="mt-5">
        <StageTracker stages={PIPELINE_STAGES} currentKey={model.currentStageKey} stoppedAt={model.stoppedAt} />
      </div>

      {editable && (
        <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-[var(--border-default)] pt-3">
          {model.kind === 'quotation' && model.currentStageKey === 'draft' && !isRejected && (
            <>
              <Link to={`/business-pipeline/${model.id}/edit`} className="text-sm font-medium text-brand-600 hover:underline">
                Edit
              </Link>
              <Button size="sm" onClick={() => handle(() => submitQuotation(model.id, actor), 'Quotation submitted')}>
                Submit
              </Button>
            </>
          )}
          {model.kind === 'quotation' && model.currentStageKey === 'submitted' && (
            <>
              <Button size="sm" variant="accent" onClick={() => handle(() => approveQuotation(model.id, actor), 'Quotation approved')}>
                Approve
              </Button>
              <Button size="sm" variant="danger" onClick={() => handle(() => rejectQuotation(model.id, actor), 'Quotation rejected')}>
                Reject
              </Button>
            </>
          )}
          {model.kind === 'project' && model.projectStatus === 'active' && (
            <>
              {nextPipelineStage(model.currentStageKey as PipelineStage) && (
                <Button
                  size="sm"
                  onClick={() => {
                    const next = nextPipelineStage(model.currentStageKey as PipelineStage)
                    if (next) handle(() => advanceProjectStage(model.id, next, actor), `Moved to ${next.replace(/_/g, ' ')}`)
                  }}
                >
                  Advance to {nextPipelineStage(model.currentStageKey as PipelineStage)?.replace(/_/g, ' ')}
                </Button>
              )}
              {isDone && (
                <Button size="sm" variant="accent" onClick={() => handle(() => closeProject(model.id, actor), 'Project closed')}>
                  Close Project
                </Button>
              )}
            </>
          )}
        </div>
      )}
    </Card>
  )
}
