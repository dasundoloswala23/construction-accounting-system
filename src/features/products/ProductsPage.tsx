import { useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { Plus, Pencil, Trash2, Search } from 'lucide-react'
import { orderBy } from 'firebase/firestore'
import { useCollection } from '@/shared/hooks/useCollection'
import { Card, CardBody, Button, DataTable, StatusBadge, Breadcrumb, ConfirmDialog } from '@/shared/components'
import type { DataTableColumn } from '@/shared/components'
import type { Product } from '@/shared/types/entities'
import { canEdit } from '@/shared/lib/permissions'
import { useAuth } from '@/app/providers/AuthProvider'
import { ProductFormPanel } from './components/ProductFormPanel'
import { deleteProduct } from './api'

type ProductWithId = Product & { id: string }

export function ProductsPage() {
  const { appUser } = useAuth()
  const editable = canEdit(appUser?.role ?? 'manager', 'products')
  const { data: products, loading } = useCollection<Product>('products', [orderBy('name')])
  const [search, setSearch] = useState('')
  const [panelOpen, setPanelOpen] = useState(false)
  const [editing, setEditing] = useState<ProductWithId | undefined>(undefined)
  const [deleting, setDeleting] = useState<ProductWithId | undefined>(undefined)
  const [busy, setBusy] = useState(false)

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return products
    return products.filter((p) => p.code.toLowerCase().includes(q) || p.name.toLowerCase().includes(q) || p.category?.toLowerCase().includes(q))
  }, [products, search])

  async function onDelete() {
    if (!deleting) return
    setBusy(true)
    try {
      await deleteProduct(deleting.id)
      toast.success('Product deleted')
      setDeleting(undefined)
    } catch {
      toast.error('Could not delete product')
    } finally {
      setBusy(false)
    }
  }

  const columns: DataTableColumn<ProductWithId>[] = [
    {
      key: 'code',
      header: 'Code',
      render: (p) => <span className="font-mono text-xs font-medium text-accent-700 dark:text-accent-500">{p.code}</span>,
    },
    {
      key: 'name',
      header: 'Product Name',
      render: (p) => (
        <div>
          <div className="font-medium">{p.name}</div>
          {p.description && <div className="text-xs text-[var(--text-muted)]">{p.description}</div>}
        </div>
      ),
    },
    { key: 'category', header: 'Category', render: (p) => (p.category ? <StatusBadge tone="neutral">{p.category}</StatusBadge> : '—') },
    { key: 'unit', header: 'Unit', render: (p) => p.unit || '—' },
    { key: 'status', header: 'Status', render: (p) => <StatusBadge>{p.status}</StatusBadge> },
    ...(editable
      ? [
          {
            key: 'actions',
            header: '',
            render: (p: ProductWithId) => (
              <div className="flex justify-end gap-1">
                <button
                  onClick={() => {
                    setEditing(p)
                    setPanelOpen(true)
                  }}
                  className="rounded-md p-1.5 text-[var(--text-muted)] hover:bg-[var(--bg-surface-muted)]"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button onClick={() => setDeleting(p)} className="rounded-md p-1.5 text-danger-500 hover:bg-danger-50">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ),
          } satisfies DataTableColumn<ProductWithId>,
        ]
      : []),
  ]

  return (
    <div className="space-y-4">
      <Breadcrumb items={[{ label: 'Home', to: '/dashboard' }, { label: 'Products' }]} />
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--text-primary)]">Products</h1>
          <p className="mt-1 text-sm text-[var(--text-muted)]">{products.length} products in catalog</p>
        </div>
        {editable && (
          <Button
            onClick={() => {
              setEditing(undefined)
              setPanelOpen(true)
            }}
          >
            <Plus className="h-4 w-4" /> Add Product
          </Button>
        )}
      </div>

      <Card>
        <CardBody className="border-b border-[var(--border-default)] p-4">
          <div className="relative max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by code or name…"
              className="h-10 w-full rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] pl-9 pr-3 text-sm outline-none focus:border-brand-500"
            />
          </div>
        </CardBody>
        <CardBody className="p-0">
          <DataTable columns={columns} data={filtered} keyField={(p) => p.id} loading={loading} emptyTitle="No products yet" />
        </CardBody>
      </Card>

      <ProductFormPanel open={panelOpen} onClose={() => setPanelOpen(false)} product={editing} />
      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(undefined)}
        onConfirm={onDelete}
        loading={busy}
        title="Delete product?"
        description={`This will permanently remove "${deleting?.name}" from the catalog.`}
      />
    </div>
  )
}
