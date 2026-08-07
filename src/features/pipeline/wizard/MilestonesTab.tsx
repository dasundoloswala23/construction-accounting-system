import { useFieldArray, type Control, type UseFormRegister, type UseFormWatch } from 'react-hook-form'
import { CheckCircle2, Plus, Trash2, AlertCircle } from 'lucide-react'
import { Card, CardHeader, CardBody, Button } from '@/shared/components'
import { TextField } from '@/shared/components/form'
import { formatCurrency } from '@/shared/lib/currency'
import { computePricing, type QuotationFormValues } from '../schema'

export function MilestonesTab({
  control,
  register,
  watch,
}: {
  control: Control<QuotationFormValues>
  register: UseFormRegister<QuotationFormValues>
  watch: UseFormWatch<QuotationFormValues>
}) {
  const { fields, append, remove } = useFieldArray({ control, name: 'milestones' })
  const values = watch()
  const { grandTotal } = computePricing(values)
  const totalPercent = values.milestones.reduce((sum, m) => sum + (Number(m.percent) || 0), 0)
  const isFullyAllocated = Math.abs(totalPercent - 100) < 0.01

  return (
    <Card>
      <CardHeader
        title="Payment Milestones"
        action={
          <span className={`flex items-center gap-1.5 text-sm font-medium ${isFullyAllocated ? 'text-accent-600' : 'text-warning-600'}`}>
            {isFullyAllocated ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
            {totalPercent.toFixed(0)}% allocated
          </span>
        }
      />
      <CardBody className="space-y-4">
        {fields.map((field, index) => {
          const percent = Number(values.milestones[index]?.percent) || 0
          return (
            <div key={field.id} className="rounded-lg bg-[var(--bg-surface-muted)] p-4">
              <div className="flex items-start gap-4">
                <div className="mt-6 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-600 text-xs font-semibold text-white">
                  {index + 1}
                </div>
                <div className="grid flex-1 grid-cols-3 gap-4">
                  <TextField label="Milestone Label" {...register(`milestones.${index}.label`)} />
                  <TextField label="Percentage (%)" type="number" step="1" {...register(`milestones.${index}.percent`, { valueAsNumber: true })} />
                  <TextField label="Due Date" type="date" {...register(`milestones.${index}.dueDate`)} />
                </div>
                {fields.length > 1 && (
                  <button type="button" onClick={() => remove(index)} className="mt-6 rounded-md p-1.5 text-danger-500 hover:bg-danger-50">
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
              <div className="ml-10 mt-1 text-sm font-medium text-accent-600">{formatCurrency((grandTotal * percent) / 100)}</div>
            </div>
          )
        })}
        <Button type="button" variant="outline" size="sm" className="w-full" onClick={() => append({ label: '', percent: 0, dueDate: '' })}>
          <Plus className="h-4 w-4" /> Add Milestone
        </Button>
        {!isFullyAllocated && <p className="text-sm text-warning-600">Milestones must total 100% before submitting.</p>}
      </CardBody>
    </Card>
  )
}
