import { useState } from 'react'
import { AlertTriangle, CheckCircle2, Info, XCircle, Bell } from 'lucide-react'
import { cn } from '@/shared/lib/cn'

export interface AlertItem {
  type: 'warning' | 'danger' | 'success' | 'info'
  text: string
}

const STYLES: Record<AlertItem['type'], { bg: string; icon: typeof Bell }> = {
  warning: { bg: 'bg-warning-50 dark:bg-warning-500/10', icon: Bell },
  danger: { bg: 'bg-danger-50 dark:bg-danger-500/10', icon: AlertTriangle },
  success: { bg: 'bg-accent-50 dark:bg-accent-500/10', icon: CheckCircle2 },
  info: { bg: 'bg-info-50 dark:bg-info-500/10', icon: Info },
}

export function AlertsList({ alerts }: { alerts: AlertItem[] }) {
  const [dismissed, setDismissed] = useState<Set<number>>(new Set())
  const visible = alerts.filter((_, i) => !dismissed.has(i))

  if (visible.length === 0) {
    return <p className="py-8 text-center text-sm text-[var(--text-muted)]">No alerts right now</p>
  }

  return (
    <div className="space-y-2">
      {alerts.map((alert, i) => {
        if (dismissed.has(i)) return null
        const { bg, icon: Icon } = STYLES[alert.type]
        return (
          <div key={i} className={cn('flex items-center justify-between gap-3 rounded-lg px-3 py-2.5', bg)}>
            <div className="flex items-center gap-2.5 text-sm text-[var(--text-primary)]">
              <Icon className="h-4 w-4 shrink-0" />
              {alert.text}
            </div>
            <div className="flex shrink-0 items-center gap-1.5">
              <button
                onClick={() => setDismissed((s) => new Set(s).add(i))}
                className="rounded-full p-1 text-accent-600 hover:bg-white/60"
                aria-label="Acknowledge"
              >
                <CheckCircle2 className="h-4 w-4" />
              </button>
              <button
                onClick={() => setDismissed((s) => new Set(s).add(i))}
                className="rounded-full p-1 text-danger-500 hover:bg-white/60"
                aria-label="Dismiss"
              >
                <XCircle className="h-4 w-4" />
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
