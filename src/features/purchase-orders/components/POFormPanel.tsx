import { useEffect } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import toast from 'react-hot-toast'
import { Plus, X } from 'lucide-react'
import { orderBy } from 'firebase/firestore'
import { SidePanel, Button } from '@/shared/components'
import { SelectField, CheckboxField, TextField, inputBaseClass } from '@/shared/components/form'
import { useCollection } from '@/shared/hooks/useCollection'
import type { Supplier, ConstructionSite, BankAccount } from '@/shared/types/entities'
import { formatCurrency } from '@/shared/lib/currency'
import { todayInputValue } from '@/shared/lib/dates'
import { useAuth } from '@/app/providers/AuthProvider'
import { createPurchaseOrder, type POFormInput } from '../api'

const PAYMENT_METHODS: { value: POFormInput['paymentMethod']; label: string }[] = [
  { value: 'cash', label: 'Cash' },
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'cheque', label: 'Cheque' },
  { value: 'credit', label: 'Credit' },
  { value: 'debit_card', label: 'Debit Card' },
  { value: 'credit_card', label: 'Credit Card' },
]

const emptyLine = { code: '', product: '', comment: '', qty: 1, unitPrice: 0, total: 0 }

const empty: POFormInput = {
  supplierId: '',
  supplierName: '',
  constructionSiteId: '',
  siteName: '',
  lineItems: [emptyLine],
  vatEnabled: false,
  vatPercent: 18,
  paymentMethod: 'cash',
  date: todayInputValue(),
}

export function POFormPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { user } = useAuth()
  const { data: suppliers } = useCollection<Supplier>('suppliers', [orderBy('companyName')])
  const { data: sites } = useCollection<ConstructionSite>('construction_sites', [orderBy('name')])
  const { data: bankAccounts } = useCollection<BankAccount>('bank_accounts', [orderBy('bankName')])

  const {
    register,
    control,
    watch,
    setValue,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm<POFormInput>({ defaultValues: empty })

  const { fields, append, remove } = useFieldArray({ control, name: 'lineItems' })
  const values = watch()

  useEffect(() => {
    if (open) reset(empty)
  }, [open, reset])

  const subtotal = values.lineItems.reduce((sum, li) => sum + (Number(li.qty) || 0) * (Number(li.unitPrice) || 0), 0)
  const grandTotal = values.vatEnabled ? subtotal * (1 + (Number(values.vatPercent) || 0) / 100) : subtotal

  function onSupplierChange(id: string) {
    const s = suppliers.find((s) => s.id === id)
    setValue('supplierId', id)
    setValue('supplierName', s?.companyName ?? '')
  }

  function onSiteChange(id: string) {
    const s = sites.find((s) => s.id === id)
    setValue('constructionSiteId', id)
    setValue('siteName', s?.name ?? '')
  }

  async function onSubmit(formValues: POFormInput) {
    if (!formValues.supplierId) {
      toast.error('Select a supplier')
      return
    }
    if (!formValues.constructionSiteId) {
      toast.error('Select a construction site')
      return
    }
    try {
      await createPurchaseOrder(formValues, user?.uid ?? '')
      toast.success('Purchase order created')
      onClose()
    } catch {
      toast.error('Could not create purchase order')
    }
  }

  return (
    <SidePanel
      open={open}
      onClose={onClose}
      title="New Purchase Order"
      subtitle="Fill in the details below"
      size="lg"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit(onSubmit)} loading={isSubmitting}>
            Add Purchase Order
          </Button>
        </>
      }
    >
      <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
        <div>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[var(--text-muted)]">Supplier Information</h3>
          <div className="space-y-4">
            <SelectField
              label="Supplier"
              required
              placeholder="Search supplier…"
              options={suppliers.map((s) => ({ value: s.id, label: s.companyName }))}
              value={values.supplierId}
              onChange={(e) => onSupplierChange(e.target.value)}
            />
            <SelectField
              label="Construction Site"
              required
              placeholder="Select site…"
              options={sites.map((s) => ({ value: s.id, label: s.name }))}
              value={values.constructionSiteId}
              onChange={(e) => onSiteChange(e.target.value)}
            />
          </div>
        </div>

        <div>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[var(--text-muted)]">Products</h3>
          <div className="space-y-3">
            <div className="grid grid-cols-[1fr_1.4fr_1fr_0.6fr_0.8fr_auto] gap-2 text-xs font-semibold uppercase text-[var(--text-muted)]">
              <span>Code</span>
              <span>Product</span>
              <span>Comment</span>
              <span>Qty</span>
              <span>Unit Price</span>
              <span />
            </div>
            {fields.map((field, index) => (
              <div key={field.id} className="grid grid-cols-[1fr_1.4fr_1fr_0.6fr_0.8fr_auto] gap-2">
                <input className={inputBaseClass} placeholder="Code" {...register(`lineItems.${index}.code`)} />
                <input className={inputBaseClass} placeholder="Product" {...register(`lineItems.${index}.product`)} />
                <input className={inputBaseClass} placeholder="Comment" {...register(`lineItems.${index}.comment`)} />
                <input type="number" className={inputBaseClass} {...register(`lineItems.${index}.qty`, { valueAsNumber: true })} />
                <input type="number" step="0.01" className={inputBaseClass} {...register(`lineItems.${index}.unitPrice`, { valueAsNumber: true })} />
                {fields.length > 1 && (
                  <button type="button" onClick={() => remove(index)} className="rounded-md p-1.5 text-danger-500 hover:bg-danger-50">
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
            <Button type="button" variant="outline" size="sm" className="w-full" onClick={() => append(emptyLine)}>
              <Plus className="h-4 w-4" /> Add Row
            </Button>
          </div>
        </div>

        <div className="space-y-4 border-t border-[var(--border-default)] pt-4">
          <CheckboxField label="Apply VAT" {...register('vatEnabled')} />
          {values.vatEnabled && <TextField label="VAT Percentage" type="number" step="0.1" {...register('vatPercent', { valueAsNumber: true })} />}
          <div className="grid grid-cols-2 gap-4">
            <SelectField label="Payment Method" options={PAYMENT_METHODS} {...register('paymentMethod')} />
            <TextField label="Date" type="date" {...register('date')} />
          </div>

          {values.paymentMethod === 'cheque' && (
            <div className="grid grid-cols-2 gap-4 rounded-lg bg-[var(--bg-surface-muted)] p-3">
              <TextField label="Cheque Number" {...register('chequeNumber')} />
              <SelectField
                label="Drawn On"
                placeholder="Select bank account…"
                options={bankAccounts.map((b) => ({ value: b.id, label: `${b.bankName} — ${b.accountNumber}` }))}
                value={values.chequeBankAccountId}
                onChange={(e) => {
                  const acc = bankAccounts.find((b) => b.id === e.target.value)
                  setValue('chequeBankAccountId', e.target.value)
                  setValue('chequeBankName', acc?.bankName ?? '')
                }}
              />
              <TextField label="Cheque Date" type="date" {...register('chequeDate')} />
              <TextField label="Due Date" type="date" {...register('chequeDueDate')} />
            </div>
          )}

          <div className="rounded-lg bg-[var(--bg-surface-muted)] p-4">
            <div className="flex justify-between text-sm">
              <span className="text-[var(--text-secondary)]">Subtotal</span>
              <span className="font-medium">{formatCurrency(subtotal)}</span>
            </div>
            <div className="mt-2 flex justify-between border-t border-[var(--border-default)] pt-2 text-base font-semibold">
              <span>Grand Total</span>
              <span>{formatCurrency(grandTotal)}</span>
            </div>
          </div>
        </div>
      </form>
    </SidePanel>
  )
}
