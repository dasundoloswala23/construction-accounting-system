import { formatCurrency } from '@/shared/lib/currency'
import { cn } from '@/shared/lib/cn'

export function CurrencyText({
  amount,
  tone = 'default',
  className,
}: {
  amount: number
  tone?: 'default' | 'positive' | 'negative'
  className?: string
}) {
  const toneClass =
    tone === 'positive' ? 'text-accent-600' : tone === 'negative' ? 'text-danger-500' : 'text-[var(--text-primary)]'
  return <span className={cn('font-medium tabular-nums', toneClass, className)}>{formatCurrency(amount)}</span>
}
