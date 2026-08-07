import { Moon, Sun } from 'lucide-react'
import { Card, CardHeader, CardBody } from '@/shared/components'
import { useThemeStore } from '@/app/providers/themeStore'
import { cn } from '@/shared/lib/cn'

export function ThemeSection() {
  const { theme, setTheme } = useThemeStore()

  return (
    <Card>
      <CardHeader title="Appearance" subtitle="Choose how Waterman ERP looks on this device" />
      <CardBody>
        <div className="flex gap-4">
          {(
            [
              { key: 'light', label: 'Light', icon: Sun },
              { key: 'dark', label: 'Dark', icon: Moon },
            ] as const
          ).map((opt) => (
            <button
              key={opt.key}
              onClick={() => setTheme(opt.key)}
              className={cn(
                'flex w-32 flex-col items-center gap-2 rounded-xl border-2 px-4 py-5 transition-colors',
                theme === opt.key
                  ? 'border-brand-600 bg-brand-50 text-brand-700 dark:bg-brand-600/10'
                  : 'border-[var(--border-default)] text-[var(--text-secondary)] hover:bg-[var(--bg-surface-muted)]'
              )}
            >
              <opt.icon className="h-6 w-6" />
              <span className="text-sm font-medium">{opt.label}</span>
            </button>
          ))}
        </div>
      </CardBody>
    </Card>
  )
}
