import { formatCurrency } from '@/shared/lib/currency'
import { EmptyState } from '@/shared/components'

export interface UpcomingCheque {
  party: string
  bank: string
  amount: number
  date: string
}

export function UpcomingCheques({ cheques }: { cheques: UpcomingCheque[] }) {
  if (cheques.length === 0) return <EmptyState title="No upcoming cheques" />
  return (
    <div className="divide-y divide-[var(--border-default)]">
      {cheques.map((c, i) => (
        <div key={i} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
          <div>
            <div className="text-sm font-medium text-[var(--text-primary)]">{c.party}</div>
            <div className="text-xs text-[var(--text-muted)]">
              {c.date} · {c.bank}
            </div>
          </div>
          <div className="text-sm font-semibold text-[var(--text-primary)]">{formatCurrency(c.amount)}</div>
        </div>
      ))}
    </div>
  )
}
