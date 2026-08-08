import { useMemo } from 'react'
import { useNavigate } from 'react-router'
import { Eye, DollarSign, Clock, Upload, Receipt as ReceiptIcon } from 'lucide-react'
import { useCollection } from '@/shared/hooks/useCollection'
import { Card, StatusBadge, CurrencyText } from '@/shared/components'
import type { Project } from '@/shared/types/entities'
import { formatPercent } from '@/shared/lib/currency'

export function CustomerOutstandingTab({ search }: { search: string }) {
  const { data: projects, loading } = useCollection<Project>('projects', [])
  const navigate = useNavigate()

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return projects
    return projects.filter(
      (p) => p.projectName.toLowerCase().includes(q) || p.customer.companyName.toLowerCase().includes(q) || p.quotationNumber.toLowerCase().includes(q)
    )
  }, [projects, search])

  if (loading) return null
  if (filtered.length === 0) return <p className="py-10 text-center text-sm text-[var(--text-muted)]">No active projects yet.</p>

  return (
    <div className="space-y-4">
      {filtered.map((p) => {
        const progress = p.contractValue > 0 ? Math.round((p.receivedAmount / p.contractValue) * 100) : 0
        return (
          <Card key={p.id} className="p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
                  <span className="font-mono">{p.quotationNumber}</span>
                  {p.poNumber && <span>· PO {p.poNumber}</span>}
                </div>
                <h3 className="mt-1 text-lg font-semibold text-[var(--text-primary)]">{p.projectName}</h3>
                <p className="text-sm text-[var(--text-muted)]">{p.customer.companyName}</p>
              </div>
              <StatusBadge tone={p.status === 'completed' ? 'success' : p.outstandingAmount > 0 ? 'warning' : 'success'}>
                {p.status === 'completed' ? 'Completed' : p.outstandingAmount > 0 ? 'Waiting Payment' : 'Fully Paid'}
              </StatusBadge>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
              <div>
                <div className="text-xs text-[var(--text-muted)]">Contract Value</div>
                <CurrencyText amount={p.contractValue} />
              </div>
              <div>
                <div className="text-xs text-[var(--text-muted)]">Received</div>
                <CurrencyText amount={p.receivedAmount} tone="positive" />
              </div>
              <div>
                <div className="text-xs text-[var(--text-muted)]">Outstanding</div>
                <CurrencyText amount={p.outstandingAmount} tone={p.outstandingAmount > 0 ? 'negative' : 'default'} />
              </div>
            </div>

            <div className="mt-3">
              <div className="flex justify-between text-xs text-[var(--text-muted)]">
                <span>Collected</span>
                <span>{formatPercent(progress)}</span>
              </div>
              <div className="mt-1 h-2 overflow-hidden rounded-full bg-[var(--bg-surface-muted)]">
                <div className="h-full bg-accent-500" style={{ width: `${Math.min(progress, 100)}%` }} />
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-1 border-t border-[var(--border-default)] pt-3 text-sm">
              <button
                onClick={() => navigate(`/outstanding/projects/${p.id}`)}
                className="flex items-center gap-1 rounded-md px-2 py-1.5 text-[var(--text-secondary)] hover:bg-[var(--bg-surface-muted)]"
              >
                <Eye className="h-3.5 w-3.5" /> View
              </button>
              <button
                onClick={() => navigate(`/outstanding/projects/${p.id}?tab=payments`)}
                className="flex items-center gap-1 rounded-md px-2 py-1.5 text-[var(--text-secondary)] hover:bg-[var(--bg-surface-muted)]"
              >
                <DollarSign className="h-3.5 w-3.5" /> Receive Payment
              </button>
              <button
                onClick={() => navigate(`/outstanding/projects/${p.id}?tab=timeline`)}
                className="flex items-center gap-1 rounded-md px-2 py-1.5 text-[var(--text-secondary)] hover:bg-[var(--bg-surface-muted)]"
              >
                <Clock className="h-3.5 w-3.5" /> Timeline
              </button>
              <button
                onClick={() => navigate(`/outstanding/projects/${p.id}?tab=invoices`)}
                className="flex items-center gap-1 rounded-md px-2 py-1.5 text-[var(--text-secondary)] hover:bg-[var(--bg-surface-muted)]"
              >
                <Upload className="h-3.5 w-3.5" /> Upload Invoice
              </button>
              <button
                onClick={() => navigate(`/outstanding/projects/${p.id}?tab=receipts`)}
                className="flex items-center gap-1 rounded-md px-2 py-1.5 text-[var(--text-secondary)] hover:bg-[var(--bg-surface-muted)]"
              >
                <ReceiptIcon className="h-3.5 w-3.5" /> Receipts
              </button>
            </div>
          </Card>
        )
      })}
    </div>
  )
}
