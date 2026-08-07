import { useFieldArray, type Control, type UseFormRegister, type UseFormWatch } from 'react-hook-form'
import { Plus, X } from 'lucide-react'
import { Card, CardHeader, CardBody, Button } from '@/shared/components'
import { inputBaseClass } from '@/shared/components/form'
import { formatCurrency } from '@/shared/lib/currency'
import type { QuotationFormValues } from '../schema'

export function WorkItemsTab({
  control,
  register,
  watch,
}: {
  control: Control<QuotationFormValues>
  register: UseFormRegister<QuotationFormValues>
  watch: UseFormWatch<QuotationFormValues>
}) {
  const { fields, append, remove } = useFieldArray({ control, name: 'workItems' })
  const workItems = watch('workItems')
  const subtotal = workItems.reduce((sum, item) => sum + (Number(item.qty) || 0) * (Number(item.unitPrice) || 0), 0)

  return (
    <Card>
      <CardHeader title="Work Items / Bill of Quantities" action={<span className="text-sm text-[var(--text-muted)]">{fields.length} items</span>} />
      <CardBody className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-[var(--border-default)] text-left text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                <th className="px-4 py-3">#</th>
                <th className="px-4 py-3">Description</th>
                <th className="px-4 py-3">Unit</th>
                <th className="px-4 py-3">Quantity</th>
                <th className="px-4 py-3">Unit Price (LKR)</th>
                <th className="px-4 py-3 text-right">Total (LKR)</th>
                <th className="px-2 py-3" />
              </tr>
            </thead>
            <tbody>
              {fields.map((field, index) => {
                const item = workItems[index]
                const total = (Number(item?.qty) || 0) * (Number(item?.unitPrice) || 0)
                return (
                  <tr key={field.id} className="border-b border-[var(--border-default)] last:border-0">
                    <td className="px-4 py-2 text-[var(--text-muted)]">{index + 1}</td>
                    <td className="px-4 py-2">
                      <input className={inputBaseClass} placeholder="Work description…" {...register(`workItems.${index}.description`)} />
                    </td>
                    <td className="px-4 py-2 w-24">
                      <input className={inputBaseClass} {...register(`workItems.${index}.unit`)} />
                    </td>
                    <td className="px-4 py-2 w-24">
                      <input type="number" step="0.01" className={inputBaseClass} {...register(`workItems.${index}.qty`, { valueAsNumber: true })} />
                    </td>
                    <td className="px-4 py-2 w-36">
                      <input type="number" step="0.01" className={inputBaseClass} {...register(`workItems.${index}.unitPrice`, { valueAsNumber: true })} />
                    </td>
                    <td className="px-4 py-2 text-right font-medium text-[var(--text-primary)]">{formatCurrency(total)}</td>
                    <td className="px-2 py-2">
                      {fields.length > 1 && (
                        <button type="button" onClick={() => remove(index)} className="rounded-md p-1.5 text-danger-500 hover:bg-danger-50">
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <div className="p-4">
          <Button type="button" variant="outline" size="sm" className="w-full" onClick={() => append({ description: '', unit: 'SqFt', qty: 1, unitPrice: 0 })}>
            <Plus className="h-4 w-4" /> Add Work Item
          </Button>
        </div>
        <div className="flex items-center justify-between border-t border-[var(--border-default)] bg-[var(--bg-surface-muted)] px-5 py-4">
          <span className="text-sm text-[var(--text-secondary)]">Subtotal (before VAT)</span>
          <span className="text-lg font-semibold text-[var(--text-primary)]">{formatCurrency(subtotal)}</span>
        </div>
      </CardBody>
    </Card>
  )
}
