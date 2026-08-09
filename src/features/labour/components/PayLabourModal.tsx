import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { orderBy } from 'firebase/firestore'
import { Modal, Button } from '@/shared/components'
import { TextField, TextareaField, SelectField } from '@/shared/components/form'
import { useCollection } from '@/shared/hooks/useCollection'
import { useDocument } from '@/shared/hooks/useDocument'
import { useAuth } from '@/app/providers/AuthProvider'
import type { BankAccount, CashAccount, Company, Labour } from '@/shared/types/entities'
import { formatCurrency } from '@/shared/lib/currency'
import { payLabour } from '../api'

type LabourWithId = Labour & { id: string }

interface FormValues {
  amount: number
  notes: string
  paymentMethod: 'cash' | 'bank_transfer'
  bankAccountId: string
}

export function PayLabourModal({ open, onClose, worker }: { open: boolean; onClose: () => void; worker?: LabourWithId }) {
  const { user } = useAuth()
  const { data: bankAccounts } = useCollection<BankAccount>('bank_accounts', [orderBy('bankName')])
  const { data: company } = useDocument<Company>('companies/main')
  const { data: cashAccount } = useDocument<CashAccount>('cash_accounts/main')
  const {
    register,
    watch,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm<FormValues>({ defaultValues: { amount: 0, notes: '', paymentMethod: 'cash', bankAccountId: '' } })

  const values = watch()
  const selectedBankAccount = bankAccounts.find((b) => b.id === values.bankAccountId)
  const availableBalance = values.paymentMethod === 'cash' ? (cashAccount?.currentBalance ?? 0) : (selectedBankAccount?.currentBalance ?? 0)
  const insufficientBalance =
    !company?.allowOverdraft && values.amount > availableBalance && (values.paymentMethod === 'cash' || !!values.bankAccountId)

  async function onSubmit(formValues: FormValues) {
    if (!worker) return
    if (formValues.amount <= 0) {
      toast.error('Enter a valid amount')
      return
    }
    if (formValues.paymentMethod === 'bank_transfer' && !formValues.bankAccountId) {
      toast.error('Select a bank account')
      return
    }
    if (insufficientBalance) {
      toast.error(`Insufficient ${formValues.paymentMethod === 'cash' ? 'cash' : 'bank'} balance for this payment`)
      return
    }
    try {
      await payLabour({
        workerId: worker.id,
        amount: formValues.amount,
        constructionSiteId: worker.constructionSiteId,
        notes: formValues.notes,
        paymentMethod: formValues.paymentMethod,
        bankAccountId: formValues.bankAccountId,
        createdBy: user?.uid ?? '',
      })
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
        <SelectField
          label="Payment Method"
          options={[
            { value: 'cash', label: 'Cash' },
            { value: 'bank_transfer', label: 'Bank Transfer' },
          ]}
          {...register('paymentMethod')}
        />
        {values.paymentMethod === 'bank_transfer' && (
          <SelectField
            label="Paid From"
            placeholder="Select bank account…"
            options={bankAccounts.map((b) => ({ value: b.id, label: `${b.bankName} — ${b.accountNumber} (${formatCurrency(b.currentBalance)})` }))}
            {...register('bankAccountId')}
          />
        )}
        {insufficientBalance && (
          <p className="text-xs font-medium text-danger-500">
            Insufficient {values.paymentMethod === 'cash' ? 'cash' : 'bank'} balance — available {formatCurrency(availableBalance)}.
          </p>
        )}
        <TextareaField label="Notes" {...register('notes')} />
      </form>
    </Modal>
  )
}
