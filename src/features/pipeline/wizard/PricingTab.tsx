import type { UseFormRegister, UseFormWatch } from 'react-hook-form'
import { Card, CardHeader, CardBody } from '@/shared/components'
import { TextField, CheckboxField } from '@/shared/components/form'
import { formatCurrency } from '@/shared/lib/currency'
import { computePricing, type QuotationFormValues } from '../schema'

export function PricingTab({ register, watch }: { register: UseFormRegister<QuotationFormValues>; watch: UseFormWatch<QuotationFormValues> }) {
  const values = watch()
  const { subtotal, vatAmount, grandTotal, advanceRequired } = computePricing(values)

  return (
    <Card>
      <CardHeader title="Pricing, VAT & Advance" />
      <CardBody className="space-y-6">
        <div className="space-y-3">
          <div className="text-sm font-medium text-[var(--text-primary)]">VAT Settings</div>
          <CheckboxField label="Apply VAT to this quotation" {...register('vatEnabled')} />
          <div className="max-w-xs">
            <TextField label="VAT Percentage" type="number" step="0.1" {...register('vatPercent', { valueAsNumber: true })} />
          </div>
          <p className="text-sm text-[var(--text-muted)]">
            VAT Amount: <span className="font-semibold text-[var(--text-primary)]">{formatCurrency(vatAmount)}</span>
          </p>
        </div>

        <div className="space-y-3 border-t border-[var(--border-default)] pt-5">
          <div className="text-sm font-medium text-[var(--text-primary)]">Advance Payment</div>
          <div className="max-w-xs">
            <TextField label="Advance Percentage" type="number" step="1" {...register('advancePercent', { valueAsNumber: true })} />
          </div>
          <p className="text-sm text-[var(--text-muted)]">
            Advance Required: <span className="font-semibold text-[var(--text-primary)]">{formatCurrency(advanceRequired)}</span>
          </p>
        </div>

        <div className="rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface-muted)] p-4">
          <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">Pricing Summary</div>
          <div className="flex justify-between border-b border-[var(--border-default)] py-2 text-sm">
            <span className="text-[var(--text-secondary)]">Subtotal ({values.workItems.length} items)</span>
            <span className="font-medium text-[var(--text-primary)]">{formatCurrency(subtotal)}</span>
          </div>
          <div className="flex justify-between border-b border-[var(--border-default)] py-2 text-sm">
            <span className="text-[var(--text-secondary)]">VAT ({values.vatEnabled ? values.vatPercent : 0}%)</span>
            <span className="font-medium text-[var(--text-primary)]">{formatCurrency(vatAmount)}</span>
          </div>
          <div className="flex justify-between rounded-b-lg bg-brand-600 -mx-4 -mb-4 mt-1 px-4 py-3 text-white">
            <span className="font-semibold">Grand Total</span>
            <span className="font-semibold">{formatCurrency(grandTotal)}</span>
          </div>
          <div className="mt-3 flex justify-between rounded-lg bg-accent-50 px-3 py-2 text-sm text-accent-700 dark:bg-accent-500/10 dark:text-accent-500">
            <span>Advance Required ({values.advancePercent}%)</span>
            <span className="font-semibold">{formatCurrency(advanceRequired)}</span>
          </div>
        </div>
      </CardBody>
    </Card>
  )
}
