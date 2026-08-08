import { useMemo, useState } from 'react'
import { FileText, Download, Eye } from 'lucide-react'
import { useCollection } from '@/shared/hooks/useCollection'
import { Card, Breadcrumb, KpiTile, Button, EmptyState, LoadingBlock } from '@/shared/components'
import type { VatInvoice } from '@/shared/types/entities'
import { formatCurrency, formatCurrencyCompact } from '@/shared/lib/currency'
import { formatDateLong } from '@/shared/lib/dates'

export function VatSuppliersPage() {
  const { data: invoices, loading } = useCollection<VatInvoice>('vat_invoices', [])
  const [search, setSearch] = useState('')

  const bySupplier = useMemo(() => {
    const map = new Map<string, { supplierId: string; supplierName: string; totalVat: number; count: number; lastInvoice: VatInvoice | null }>()
    for (const inv of invoices) {
      const entry = map.get(inv.supplierId) ?? { supplierId: inv.supplierId, supplierName: inv.supplierName, totalVat: 0, count: 0, lastInvoice: null }
      entry.totalVat += inv.vatAmount
      entry.count += 1
      if (!entry.lastInvoice || inv.invoiceDate.toMillis() > entry.lastInvoice.invoiceDate.toMillis()) entry.lastInvoice = inv
      map.set(inv.supplierId, entry)
    }
    const all = Array.from(map.values())
    const q = search.trim().toLowerCase()
    return q ? all.filter((s) => s.supplierName.toLowerCase().includes(q)) : all
  }, [invoices, search])

  const totalVatPaid = invoices.reduce((s, i) => s + i.vatAmount, 0)

  return (
    <div className="space-y-4">
      <Breadcrumb items={[{ label: 'Home', to: '/dashboard' }, { label: 'VAT Suppliers' }]} />
      <h1 className="text-2xl font-semibold text-[var(--text-primary)]">VAT Suppliers</h1>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <KpiTile icon={FileText} label="Total VAT Paid" value={formatCurrencyCompact(totalVatPaid)} accentColor="var(--text-muted)" iconBg="var(--bg-surface-muted)" iconColor="var(--text-primary)" />
        <KpiTile icon={FileText} label="VAT Suppliers" value={String(bySupplier.length)} accentColor="#16a34a" iconBg="#ecfdf3" iconColor="#16a34a" />
        <KpiTile icon={FileText} label="Tax Invoices" value={String(invoices.length)} accentColor="#7c3aed" iconBg="#f3e8ff" iconColor="#7c3aed" />
      </div>

      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search supplier or TIN…"
        className="h-10 w-full max-w-md rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] px-3 text-sm outline-none focus:border-brand-500"
      />

      {loading ? (
        <LoadingBlock />
      ) : bySupplier.length === 0 ? (
        <EmptyState title="No VAT invoices yet" description="VAT invoices are generated automatically when a Purchase Order with VAT applied is created." />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {bySupplier.map((s) => (
            <Card key={s.supplierId} className="p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-600 text-white">
                  <FileText className="h-5 w-5" />
                </div>
                <div className="font-semibold text-[var(--text-primary)]">{s.supplierName}</div>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div>
                  <div className="text-xs text-[var(--text-muted)]">Total VAT</div>
                  <div className="text-sm font-semibold text-[var(--text-primary)]">{formatCurrency(s.totalVat)}</div>
                </div>
                <div>
                  <div className="text-xs text-[var(--text-muted)]">Invoices</div>
                  <div className="text-sm font-semibold text-[var(--text-primary)]">{s.count}</div>
                </div>
              </div>
              {s.lastInvoice && <div className="mt-2 text-xs text-[var(--text-muted)]">Last invoice: {formatDateLong(s.lastInvoice.invoiceDate)}</div>}
              <div className="mt-4 flex gap-2 border-t border-[var(--border-default)] pt-3">
                {s.lastInvoice?.downloadURL ? (
                  <a href={s.lastInvoice.downloadURL} target="_blank" rel="noreferrer">
                    <Button size="sm" variant="outline">
                      <Download className="h-3.5 w-3.5" /> Tax Invoice
                    </Button>
                  </a>
                ) : (
                  <Button size="sm" variant="outline" disabled>
                    <Download className="h-3.5 w-3.5" /> Tax Invoice
                  </Button>
                )}
                <Button size="sm" variant="ghost">
                  <Eye className="h-3.5 w-3.5" /> View
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
