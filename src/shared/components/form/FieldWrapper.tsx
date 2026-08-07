import type { ReactNode } from 'react'
import { cn } from '@/shared/lib/cn'

export function FieldWrapper({
  label,
  required,
  error,
  className,
  children,
}: {
  label?: string
  required?: boolean
  error?: string
  className?: string
  children: ReactNode
}) {
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      {label && (
        <label className="text-sm font-medium text-[var(--text-primary)]">
          {label}
          {required && <span className="text-danger-500"> *</span>}
        </label>
      )}
      {children}
      {error && <p className="text-xs text-danger-500">{error}</p>}
    </div>
  )
}

export const inputBaseClass =
  'h-10 w-full rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] px-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none transition-colors focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20'
