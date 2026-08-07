import type { LucideIcon } from 'lucide-react'
import { cn } from '@/shared/lib/cn'

export interface TabItem {
  key: string
  label: string
  icon?: LucideIcon
}

export function Tabs({
  tabs,
  active,
  onChange,
  variant = 'pill',
}: {
  tabs: TabItem[]
  active: string
  onChange: (key: string) => void
  variant?: 'pill' | 'underline'
}) {
  if (variant === 'underline') {
    return (
      <div className="flex gap-6 border-b border-[var(--border-default)] overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => onChange(tab.key)}
            className={cn(
              'flex items-center gap-1.5 whitespace-nowrap border-b-2 px-1 pb-3 text-sm font-medium transition-colors',
              active === tab.key
                ? 'border-brand-600 text-brand-600 dark:border-accent-500 dark:text-accent-500'
                : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            )}
          >
            {tab.icon && <tab.icon className="h-4 w-4" />}
            {tab.label}
          </button>
        ))}
      </div>
    )
  }

  return (
    <div className="flex flex-wrap gap-2">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          onClick={() => onChange(tab.key)}
          className={cn(
            'flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-colors',
            active === tab.key
              ? 'bg-brand-600 text-white'
              : 'bg-[var(--bg-surface-muted)] text-[var(--text-secondary)] hover:bg-[var(--border-default)]'
          )}
        >
          {tab.icon && <tab.icon className="h-4 w-4" />}
          {tab.label}
        </button>
      ))}
    </div>
  )
}
