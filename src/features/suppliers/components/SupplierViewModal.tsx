import type { ReactNode } from 'react'
import { Modal, StatusBadge, CurrencyText } from '@/shared/components'
import type { Supplier } from '@/shared/types/entities'

type SupplierWithId = Supplier & { id: string }

function Row({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex justify-between border-b border-[var(--border-default)] py-2.5 last:border-0">
      <span className="text-sm text-[var(--text-muted)]">{label}</span>
      <span className="text-sm font-medium text-[var(--text-primary)]">{value}</span>
    </div>
  )
}

export function SupplierViewModal({ open, onClose, supplier }: { open: boolean; onClose: () => void; supplier?: SupplierWithId }) {
  if (!supplier) return null
  return (
    <Modal open={open} onClose={onClose} title={supplier.companyName} subtitle={supplier.contactName}>
      <Row label="Phone" value={supplier.phone || '—'} />
      <Row label="Email" value={supplier.email || '—'} />
      <Row label="Address" value={supplier.address || '—'} />
      <Row label="TIN Number" value={supplier.tin || '—'} />
      <Row label="VAT Registered" value={<StatusBadge tone={supplier.vatRegistered ? 'success' : 'neutral'}>{supplier.vatRegistered ? 'Yes' : 'No'}</StatusBadge>} />
      <Row label="Outstanding Balance" value={<CurrencyText amount={supplier.outstandingBalance} tone={supplier.outstandingBalance > 0 ? 'negative' : 'default'} />} />
      {supplier.comments && <Row label="Comments" value={supplier.comments} />}
    </Modal>
  )
}
