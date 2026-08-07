import type { LucideIcon } from 'lucide-react'
import { TrendingDown, TrendingUp } from 'lucide-react'
import { Card } from './Card'
import { cn } from '@/shared/lib/cn'

interface KpiTileProps {
  icon: LucideIcon
  label: string
  value: string
  sublabel?: string
  accentColor?: string
  iconBg?: string
  iconColor?: string
  trend?: { value: number; direction: 'up' | 'down' }
}

export function KpiTile({ icon: Icon, label, value, sublabel, accentColor, iconBg, iconColor, trend }: KpiTileProps) {
  const trendPositive = trend?.direction === 'up'
  return (
    <Card accentColor={accentColor} className="p-5">
      <div className="flex items-start justify-between">
        <div
          className="flex h-10 w-10 items-center justify-center rounded-lg"
          style={{ backgroundColor: iconBg ?? 'var(--bg-surface-muted)', color: iconColor ?? 'var(--text-secondary)' }}
        >
          <Icon className="h-5 w-5" />
        </div>
        {trend && (
          <span
            className={cn(
              'flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium',
              trendPositive ? 'bg-accent-50 text-accent-700' : 'bg-danger-50 text-danger-600'
            )}
          >
            {trendPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {trend.value}%
          </span>
        )}
      </div>
      <div className="mt-4 text-2xl font-semibold text-[var(--text-primary)]">{value}</div>
      <div className="mt-1 text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">{label}</div>
      {sublabel && <div className="mt-0.5 text-xs text-[var(--text-muted)]">{sublabel}</div>}
    </Card>
  )
}
