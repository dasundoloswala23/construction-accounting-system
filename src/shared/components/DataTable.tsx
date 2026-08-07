import type { ReactNode } from 'react'
import { cn } from '@/shared/lib/cn'
import { LoadingBlock } from './Spinner'
import { EmptyState } from './EmptyState'

export interface DataTableColumn<T> {
  key: string
  header: string
  render: (row: T) => ReactNode
  className?: string
  headerClassName?: string
}

interface DataTableProps<T> {
  columns: DataTableColumn<T>[]
  data: T[]
  keyField: (row: T) => string
  loading?: boolean
  emptyTitle?: string
  emptyDescription?: string
  onRowClick?: (row: T) => void
  footer?: ReactNode
}

export function DataTable<T>({
  columns,
  data,
  keyField,
  loading,
  emptyTitle = 'Nothing here yet',
  emptyDescription,
  onRowClick,
  footer,
}: DataTableProps<T>) {
  if (loading) return <LoadingBlock />
  if (data.length === 0) return <EmptyState title={emptyTitle} description={emptyDescription} />

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[720px] border-collapse text-sm">
        <thead>
          <tr className="border-b border-[var(--border-default)] text-left">
            {columns.map((col) => (
              <th
                key={col.key}
                className={cn(
                  'whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]',
                  col.headerClassName
                )}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr
              key={keyField(row)}
              onClick={() => onRowClick?.(row)}
              className={cn(
                'border-b border-[var(--border-default)] last:border-0',
                onRowClick && 'cursor-pointer hover:bg-[var(--bg-surface-muted)]'
              )}
            >
              {columns.map((col) => (
                <td key={col.key} className={cn('px-4 py-3 text-[var(--text-primary)]', col.className)}>
                  {col.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {footer}
    </div>
  )
}
