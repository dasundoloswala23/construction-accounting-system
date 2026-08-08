import { orderBy, where } from 'firebase/firestore'
import { Check } from 'lucide-react'
import { useCollection } from '@/shared/hooks/useCollection'
import { Card, CardHeader, CardBody, CurrencyText, LoadingBlock, EmptyState } from '@/shared/components'
import type { TimelineEvent } from '@/shared/types/entities'
import { formatDateLong } from '@/shared/lib/dates'

type EventWithId = TimelineEvent & { id: string }

const LABELS: Record<TimelineEvent['type'], string> = {
  quotation_created: 'Quotation Created',
  submitted: 'Quotation Submitted',
  approved: 'Quotation Approved',
  rejected: 'Quotation Rejected',
  po_uploaded: 'PO Uploaded',
  advance_received: 'Advance Received',
  receipt_generated: 'Receipt Generated',
  invoice_uploaded: 'Invoice Uploaded',
  progress_payment: 'Progress Payment',
  final_payment: 'Final Payment',
  project_closed: 'Project Closed',
}

export function TimelineTab({ projectId }: { projectId: string }) {
  const { data: events, loading } = useCollection<TimelineEvent>('timeline', [where('projectId', '==', projectId), orderBy('timestamp', 'asc')])

  return (
    <Card>
      <CardHeader title="Timeline" subtitle="A permanent, immutable record — nothing here can be edited or deleted except by an admin" />
      <CardBody>
        {loading ? (
          <LoadingBlock />
        ) : events.length === 0 ? (
          <EmptyState title="No timeline events yet" />
        ) : (
          <ol className="space-y-0">
            {events.map((event: EventWithId, i) => (
              <li key={event.id} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent-600 text-white">
                    <Check className="h-3.5 w-3.5" />
                  </span>
                  {i < events.length - 1 && <span className="w-px flex-1 bg-[var(--border-default)]" />}
                </div>
                <div className="pb-6">
                  <div className="text-sm font-medium text-[var(--text-primary)]">{LABELS[event.type] ?? event.type}</div>
                  <div className="text-xs text-[var(--text-muted)]">
                    {formatDateLong(event.timestamp)} · {event.actorName}
                  </div>
                  {event.meta && 'amount' in event.meta && (
                    <div className="mt-1 text-sm font-medium text-accent-600">
                      <CurrencyText amount={Number(event.meta.amount)} tone="positive" />
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ol>
        )}
      </CardBody>
    </Card>
  )
}
