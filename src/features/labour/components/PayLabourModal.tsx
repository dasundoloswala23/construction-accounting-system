import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { Modal, Button } from '@/shared/components'
import { TextField, TextareaField } from '@/shared/components/form'
import { useAuth } from '@/app/providers/AuthProvider'
import type { Labour } from '@/shared/types/entities'
import { payLabour } from '../api'

type LabourWithId = Labour & { id: string }

interface FormValues {
  amount: number
  notes: string
}

export function PayLabourModal({ open, onClose, worker }: { open: boolean; onClose: () => void; worker?: LabourWithId }) {
  const { user } = useAuth()
  const {
    register,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm<FormValues>({ defaultValues: { amount: 0, notes: '' } })

  async function onSubmit(values: FormValues) {
    if (!worker) return
    if (values.amount <= 0) {
      toast.error('Enter a valid amount')
      return
    }
    try {
      await payLabour(worker.id, values.amount, worker.constructionSiteId, values.notes, user?.uid ?? '')
      toast.success('Payment recorded')
      reset()
      onClose()
    } catch {
      toast.error('Could not record payment')
    }
  }

  if (!worker) return null

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Pay ${worker.fullName}`}
      subtitle={`Outstanding: LKR ${worker.outstandingBalance.toLocaleString()}`}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit(onSubmit)} loading={isSubmitting}>
            Record Payment
          </Button>
        </>
      }
    >
      <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
        <TextField label="Amount (LKR)" type="number" step="0.01" required {...register('amount', { valueAsNumber: true })} />
        <TextareaField label="Notes" {...register('notes')} />
      </form>
    </Modal>
  )
}
