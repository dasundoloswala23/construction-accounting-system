import { useState } from 'react'
import toast from 'react-hot-toast'
import { Plus, Building2, Eye, Pencil, Trash2, MapPin } from 'lucide-react'
import { orderBy } from 'firebase/firestore'
import { useCollection } from '@/shared/hooks/useCollection'
import { Card, Button, StatusBadge, Breadcrumb, ConfirmDialog, EmptyState, LoadingBlock } from '@/shared/components'
import type { ConstructionSite } from '@/shared/types/entities'
import { formatCurrencyCompact, formatPercent } from '@/shared/lib/currency'
import { formatDate } from '@/shared/lib/dates'
import { canEdit } from '@/shared/lib/permissions'
import { useAuth } from '@/app/providers/AuthProvider'
import { SiteFormModal } from './components/SiteFormModal'
import { deleteSite } from './api'

type SiteWithId = ConstructionSite & { id: string }

export function ConstructionSitesPage() {
  const { appUser } = useAuth()
  const editable = canEdit(appUser?.role ?? 'manager', 'constructionSites')
  const { data: sites, loading } = useCollection<ConstructionSite>('construction_sites', [orderBy('name')])
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<SiteWithId | undefined>(undefined)
  const [deleting, setDeleting] = useState<SiteWithId | undefined>(undefined)
  const [busy, setBusy] = useState(false)

  const activeCount = sites.filter((s) => s.status === 'active').length

  async function onDelete() {
    if (!deleting) return
    setBusy(true)
    try {
      await deleteSite(deleting.id)
      toast.success('Site deleted')
      setDeleting(undefined)
    } catch {
      toast.error('Could not delete site')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-4">
      <Breadcrumb items={[{ label: 'Home', to: '/dashboard' }, { label: 'Construction Sites' }]} />
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--text-primary)]">Construction Sites</h1>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            {activeCount} active, {sites.length} total
          </p>
        </div>
        {editable && (
          <Button
            onClick={() => {
              setEditing(undefined)
              setFormOpen(true)
            }}
          >
            <Plus className="h-4 w-4" /> Add Site
          </Button>
        )}
      </div>

      {loading ? (
        <LoadingBlock />
      ) : sites.length === 0 ? (
        <EmptyState title="No construction sites yet" description="Add your first site to start tracking budgets and projects." />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sites.map((site) => {
            const utilization = site.budget > 0 ? Math.round((site.spentToDate / site.budget) * 100) : 0
            const overBudget = utilization >= 100
            return (
              <Card key={site.id} className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-600 text-white">
                      <Building2 className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="font-semibold text-[var(--text-primary)]">{site.name}</div>
                      <div className="flex items-center gap-1 text-xs text-[var(--text-muted)]">
                        <MapPin className="h-3 w-3" /> {site.location}
                      </div>
                    </div>
                  </div>
                  <StatusBadge tone={site.status === 'active' ? 'success' : site.status === 'completed' ? 'info' : 'warning'}>{site.status}</StatusBadge>
                </div>

                <div className="mt-3 text-sm text-[var(--text-secondary)]">{site.client}</div>
                {site.description && <p className="mt-1 text-sm text-[var(--text-muted)]">{site.description}</p>}

                <div className="mt-4">
                  <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
                    <span>Budget Utilization</span>
                    <span className={overBudget ? 'font-semibold text-danger-500' : 'font-semibold text-[var(--text-primary)]'}>
                      {formatPercent(utilization)}
                    </span>
                  </div>
                  <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-[var(--bg-surface-muted)]">
                    <div
                      className={overBudget ? 'h-full bg-danger-500' : 'h-full bg-accent-500'}
                      style={{ width: `${Math.min(utilization, 100)}%` }}
                    />
                  </div>
                  <div className="mt-1.5 flex items-center justify-between text-xs text-[var(--text-muted)]">
                    <span>Spent: {formatCurrencyCompact(site.spentToDate)}</span>
                    <span>Budget: {formatCurrencyCompact(site.budget)}</span>
                  </div>
                </div>

                <div className="mt-3 text-xs text-[var(--text-muted)]">
                  {formatDate(site.startDate)} — {formatDate(site.endDate)}
                </div>

                <div className="mt-4 flex items-center gap-1 border-t border-[var(--border-default)] pt-3 text-sm">
                  <button className="flex items-center gap-1 rounded-md px-2 py-1 text-[var(--text-secondary)] hover:bg-[var(--bg-surface-muted)]">
                    <Eye className="h-3.5 w-3.5" /> View
                  </button>
                  {editable && (
                    <>
                      <button
                        onClick={() => {
                          setEditing(site)
                          setFormOpen(true)
                        }}
                        className="flex items-center gap-1 rounded-md px-2 py-1 text-[var(--text-secondary)] hover:bg-[var(--bg-surface-muted)]"
                      >
                        <Pencil className="h-3.5 w-3.5" /> Edit
                      </button>
                      <button onClick={() => setDeleting(site)} className="ml-auto flex items-center gap-1 rounded-md px-2 py-1 text-danger-500 hover:bg-danger-50">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </>
                  )}
                </div>
              </Card>
            )
          })}
        </div>
      )}

      <SiteFormModal open={formOpen} onClose={() => setFormOpen(false)} site={editing} />
      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(undefined)}
        onConfirm={onDelete}
        loading={busy}
        title="Delete site?"
        description={`This will permanently remove "${deleting?.name}".`}
      />
    </div>
  )
}
