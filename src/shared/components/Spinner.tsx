import { Loader2 } from 'lucide-react'
import { cn } from '@/shared/lib/cn'

export function Spinner({ className }: { className?: string }) {
  return <Loader2 className={cn('h-5 w-5 animate-spin text-[var(--text-muted)]', className)} />
}

export function LoadingBlock({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-16 text-sm text-[var(--text-muted)]">
      <Spinner />
      {label}
    </div>
  )
}
