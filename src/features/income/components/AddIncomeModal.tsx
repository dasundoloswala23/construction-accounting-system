import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { orderBy } from 'firebase/firestore'
import { SidePanel, Button } from '@/shared/components'
import { TextField, SelectField, TextareaField } from '@/shared/components/form'
import { useCollection } from '@/shared/hooks/useCollection'
import { useAuth } from '@/app/providers/AuthProvider'
import type { ConstructionSite } from '@/shared/types/entities'
import { todayInputValue } from '@/shared/lib/dates'
import { addIncome, type AddIncomeInput } from '../api'

const empty: Omit<AddIncomeInput, 'receivedBy'> = {
  customerName: '',
  constructionSiteId: '',
  referenceNumber: '',
  amount: 0,
  paymentMethod: 'cash',
  date: todayInputValue(),
  dueDate: '',
  notes: '',
}

export function AddIncomeModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { user } = useAuth()
  const { data: sites } = useCollection<ConstructionSite>('construction_sites', [orderBy('name')])
  const {
    register,
    watch,
    setValue,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm<Omit<AddIncomeInput, 'receivedBy'>>({ defaultValues: empty })

  const values = watch()

  useEffect(() => {
    if (open) reset(empty)
  }, [open, reset])

  async function onSubmit(input: Omit<AddIncomeInput, 'receivedBy'>) {
    if (!input.customerName || input.amount <= 0) {
      toast.error('Enter a customer and a valid amount')
      return
    }
    try {
      await addIncome({ ...input, receivedBy: user?.uid ?? '' })
      toast.success('Income recorded')
      onClose()
    } catch {
      toast.error('Could not record income')
    }
  }

  return (
    <SidePanel
      open={open}
      onClose={onClose}
      title="Add Income"
      subtitle="Record a new payment received"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit(onSubmit)} loading={isSubmitting}>
            Record Income
          </Button>
        </>
      }
    >
      <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
        <TextField label="Customer / Client" required placeholder="Client or company name" {...register('customerName')} />
        <SelectField
          label="Construction Site"
          placeholder="Select site…"
          options={sites.map((s) => ({ value: s.id, label: s.name }))}
          onChange={(e) => {
            const site = sites.find((s) => s.id === e.target.value)
            setValue('constructionSiteId', e.target.value)
            setValue('siteName', site?.name ?? '')
          }}
        />
        <TextField label="Invoice / Reference" placeholder="SLS-2026-XXXX" {...register('referenceNumber')} />
        <div className="grid grid-cols-2 gap-4">
          <TextField label="Amount (LKR)" type="number" step="0.01" required {...register('amount', { valueAsNumber: true })} />
          <TextField label="Date" type="date" {...register('date')} />
        </div>
        <SelectField
          label="Payment Method"
          options={[
            { value: 'cash', label: 'Cash' },
            { value: 'bank_transfer', label: 'Bank Transfer' },
            { value: 'cheque', label: 'Cheque' },
            { value: 'credit', label: 'Credit' },
          ]}
          {...register('paymentMethod')}
        />
        {values.paymentMethod === 'credit' && <TextField label="Due Date" type="date" {...register('dueDate')} />}
        <TextareaField label="Notes" placeholder="Additional notes…" {...register('notes')} />
      </form>
    </SidePanel>
  )
}
