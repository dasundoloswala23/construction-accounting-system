import { Link } from 'react-router'
import { ChevronRight } from 'lucide-react'

export interface BreadcrumbItem {
  label: string
  to?: string
}

export function Breadcrumb({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav className="flex items-center gap-1.5 text-sm text-[var(--text-muted)]">
      {items.map((item, i) => (
        <span key={i} className="flex items-center gap-1.5">
          {i > 0 && <ChevronRight className="h-3.5 w-3.5" />}
          {item.to ? (
            <Link to={item.to} className="hover:text-[var(--text-primary)]">
              {item.label}
            </Link>
          ) : (
            <span className={i === items.length - 1 ? 'font-medium text-[var(--text-primary)]' : ''}>{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  )
}
