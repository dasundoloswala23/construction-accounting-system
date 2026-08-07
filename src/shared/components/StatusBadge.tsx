import type { ReactNode } from 'react'
import { cn } from '@/shared/lib/cn'

export type BadgeTone = 'success' | 'warning' | 'danger' | 'info' | 'neutral'

const toneClasses: Record<BadgeTone, string> = {
  success: 'bg-accent-50 text-accent-700 dark:bg-accent-500/15 dark:text-accent-500',
  warning: 'bg-warning-50 text-warning-600 dark:bg-warning-500/15 dark:text-warning-500',
  danger: 'bg-danger-50 text-danger-600 dark:bg-danger-500/15 dark:text-danger-500',
  info: 'bg-info-50 text-info-600 dark:bg-info-500/15 dark:text-info-500',
  neutral: 'bg-[var(--bg-surface-muted)] text-[var(--text-secondary)]',
}

/** Maps common status strings across the app to a semantic badge tone. */
export function statusTone(status: string): BadgeTone {
  const s = status.toLowerCase().replace(/[\s_-]/g, '')
  if (['approved', 'paid', 'cleared', 'received', 'active', 'completed', 'current', 'done'].includes(s)) return 'success'
  if (['pending', 'draft', 'duesoon', 'postdated', 'planning', 'waitingpayment'].includes(s)) return 'warning'
  if (['rejected', 'bounced', 'overdue'].includes(s)) return 'danger'
  if (['submitted', 'credit', 'creditdue', 'cheque', 'receivable', 'info'].includes(s)) return 'info'
  return 'neutral'
}

export function StatusBadge({
  tone,
  children,
  className,
}: {
  tone?: BadgeTone
  children: ReactNode
  className?: string
}) {
  const resolvedTone = tone ?? (typeof children === 'string' ? statusTone(children) : 'neutral')
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium capitalize',
        toneClasses[resolvedTone],
        className
      )}
    >
      {children}
    </span>
  )
}
