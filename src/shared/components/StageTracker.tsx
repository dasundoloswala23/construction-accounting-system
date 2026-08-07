import { Check } from 'lucide-react'
import { cn } from '@/shared/lib/cn'

export interface StageTrackerStage {
  key: string
  label: string
}

/**
 * Numbered horizontal stage tracker used on the Business Pipeline board
 * (Draft -> Submitted -> Approved -> PO -> Advance -> Active -> Invoiced -> Done).
 * `stoppedAt` renders everything from that stage onward in the danger color,
 * for rejected quotations that never continue past a given point.
 */
export function StageTracker({
  stages,
  currentKey,
  stoppedAt,
}: {
  stages: StageTrackerStage[]
  currentKey: string
  stoppedAt?: string
}) {
  const currentIndex = stages.findIndex((s) => s.key === currentKey)
  const stoppedIndex = stoppedAt ? stages.findIndex((s) => s.key === stoppedAt) : -1

  return (
    <div className="flex items-start">
      {stages.map((stage, i) => {
        const isDone = stoppedIndex === -1 && i < currentIndex
        const isCurrent = i === currentIndex
        const isStopped = stoppedIndex !== -1 && i === stoppedIndex
        const isPastStop = stoppedIndex !== -1 && i > stoppedIndex

        return (
          <div key={stage.key} className="flex flex-1 flex-col items-center last:flex-none">
            <div className="flex w-full items-center">
              <div
                className={cn(
                  'flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold',
                  isDone && 'bg-accent-600 text-white',
                  isCurrent && !isStopped && 'bg-brand-600 text-white',
                  isStopped && 'bg-danger-500 text-white',
                  !isDone && !isCurrent && !isStopped && !isPastStop && 'bg-[var(--bg-surface-muted)] text-[var(--text-muted)]',
                  isPastStop && 'bg-[var(--bg-surface-muted)] text-[var(--text-muted)] opacity-50'
                )}
              >
                {isDone ? <Check className="h-3.5 w-3.5" /> : i + 1}
              </div>
              {i < stages.length - 1 && (
                <div className={cn('h-0.5 flex-1', isDone ? 'bg-accent-600' : 'bg-[var(--border-default)]')} />
              )}
            </div>
            <span
              className={cn(
                'mt-1.5 text-[11px] font-medium',
                isStopped ? 'text-danger-500' : isCurrent ? 'text-brand-600 dark:text-accent-500' : 'text-[var(--text-muted)]'
              )}
            >
              {stage.label}
            </span>
          </div>
        )
      })}
    </div>
  )
}
