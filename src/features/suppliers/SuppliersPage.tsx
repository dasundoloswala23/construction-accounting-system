import { useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { Link } from 'react-router'
import { Plus, Search, Phone, Mail, MapPin, Eye, Pencil, ShoppingCart, Trash2 } from 'lucide-react'
import { orderBy } from 'firebase/firestore'
import { useCollection } from '@/shared/hooks/useCollection'
import { Card, Button, StatusBadge, Breadcrumb, ConfirmDialog, EmptyState, LoadingBlock } from '@/shared/components'
import type { Supplier } from '@/shared/types/entities'
import { formatCurrency } from '@/shared/lib/currency'
import { canEdit } from '@/shared/lib/permissions'
import { useAuth } from '@/app/providers/AuthProvider'
import { SupplierFormModal } from './components/SupplierFormModal'
import { SupplierViewModal } from './components/SupplierViewModal'
import { deleteSupplier } from './api'

type SupplierWithId = Supplier & { id: string }

export function SuppliersPage() {
  const { appUser } = useAuth()
  const editable = canEdit(appUser?.role ?? 'manager', 'supplierManagement')
  const { data: suppliers, loading } = useCollection<Supplier>('suppliers', [orderBy('companyName')])
  const [search, setSearch] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [viewing, setViewing] = useState<SupplierWithId | undefined>(undefined)
  const [editing, setEditing] = useState<SupplierWithId | undefined>(undefined)
  const [deleting, setDeleting] = useState<SupplierWithId | undefined>(undefined)
  const [busy, setBusy] = useState(false)

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return suppliers
    return suppliers.filter((s) => s.companyName.toLowerCase().includes(q) || s.contactName.toLowerCase().includes(q))
  }, [suppliers, search])

  async function onDelete() {
    if (!deleting) return
    setBusy(true)
    try {
      await deleteSupplier(deleting.id)
      toast.success('Supplier deleted')
      setDeleting(undefined)
    } catch {
      toast.error('Could not delete supplier')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-4">
      <Breadcrumb items={[{ label: 'Home', to: '/dashboard' }, { label: 'Supplier Management' }]} />
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--text-primary)]">Supplier Management</h1>
          <p className="mt-1 text-sm text-[var(--text-muted)]">{suppliers.length} suppliers</p>
        </div>
        {editable && (
          <Button
            onClick={() => {
              setEditing(undefined)
              setFormOpen(true)
            }}
          >
            <Plus className="h-4 w-4" /> Add Supplier
          </Button>
        )}
      </div>

      <div className="relative max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search suppliers…"
          className="h-10 w-full rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] pl-9 pr-3 text-sm outline-none focus:border-brand-500"
        />
      </div>

      {loading ? (
        <LoadingBlock />
      ) : filtered.length === 0 ? (
        <EmptyState title="No suppliers yet" description="Add your first supplier to start creating purchase orders." />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((s) => (
            <Card key={s.id} className="p-5">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-600 text-sm font-semibold text-white">
                    {s.companyName.charAt(0)}
                  </div>
                  <div>
                    <div className="font-semibold text-[var(--text-primary)]">{s.companyName}</div>
                    <div className="text-xs text-[var(--text-muted)]">{s.contactName}</div>
                  </div>
                </div>
                {s.vatRegistered && <StatusBadge tone="success">VAT</StatusBadge>}
              </div>

              <div className="mt-4 space-y-1.5 text-sm text-[var(--text-secondary)]">
                {s.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-3.5 w-3.5 text-[var(--text-muted)]" /> {s.phone}
                  </div>
                )}
                {s.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-3.5 w-3.5 text-[var(--text-muted)]" /> {s.email}
                  </div>
                )}
                {s.address && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-3.5 w-3.5 text-[var(--text-muted)]" /> {s.address}
                  </div>
                )}
                {s.tin && <div className="text-xs text-[var(--text-muted)]">TIN: {s.tin}</div>}
              </div>

              {s.outstandingBalance > 0 && (
                <div className="mt-3 rounded-lg bg-warning-50 px-3 py-2 dark:bg-warning-500/10">
                  <div className="text-xs text-warning-600">Outstanding Balance</div>
                  <div className="text-sm font-semibold text-warning-600">{formatCurrency(s.outstandingBalance)}</div>
                </div>
              )}

              <div className="mt-4 flex items-center gap-1 border-t border-[var(--border-default)] pt-3 text-sm">
                <button onClick={() => setViewing(s)} className="flex items-center gap-1 rounded-md px-2 py-1 text-[var(--text-secondary)] hover:bg-[var(--bg-surface-muted)]">
                  <Eye className="h-3.5 w-3.5" /> View
                </button>
                {editable && (
                  <button
                    onClick={() => {
                      setEditing(s)
                      setFormOpen(true)
                    }}
                    className="flex items-center gap-1 rounded-md px-2 py-1 text-[var(--text-secondary)] hover:bg-[var(--bg-surface-muted)]"
                  >
                    <Pencil className="h-3.5 w-3.5" /> Edit
                  </button>
                )}
                <Link to="/purchase-orders" className="flex items-center gap-1 rounded-md px-2 py-1 text-[var(--text-secondary)] hover:bg-[var(--bg-surface-muted)]">
                  <ShoppingCart className="h-3.5 w-3.5" /> Orders
                </Link>
                {editable && (
                  <button onClick={() => setDeleting(s)} className="ml-auto flex items-center gap-1 rounded-md px-2 py-1 text-danger-500 hover:bg-danger-50">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      <SupplierFormModal open={formOpen} onClose={() => setFormOpen(false)} supplier={editing} />
      <SupplierViewModal open={!!viewing} onClose={() => setViewing(undefined)} supplier={viewing} />
      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(undefined)}
        onConfirm={onDelete}
        loading={busy}
        title="Delete supplier?"
        description={`This will permanently remove "${deleting?.companyName}".`}
      />
    </div>
  )
}
