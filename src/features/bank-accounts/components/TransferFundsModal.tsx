import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { orderBy } from 'firebase/firestore'
import { Modal, Button } from '@/shared/components'
import { TextField, SelectField } from '@/shared/components/form'
import { useCollection } from '@/shared/hooks/useCollection'
import { useDocument } from '@/shared/hooks/useDocument'
import { useAuth } from '@/app/providers/AuthProvider'
import type { BankAccount, Company } from '@/shared/types/entities'
import { formatCurrency } from '@/shared/lib/currency'
import { todayInputValue } from '@/shared/lib/dates'
import { transferBetweenBanks, type TransferFundsInput } from '../api'

const empty: TransferFundsInput = { fromAccountId: '', toAccountId: '', amount: 0, date: todayInputValue(), reference: '' }

export function TransferFundsModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { user } = useAuth()
  const { data: bankAccounts } = useCollection<BankAccount>('bank_accounts', [orderBy('bankName')])
  const { data: company } = useDocument<Company>('companies/main')
  const {
    register,
    watch,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm<TransferFundsInput>({ defaultValues: empty })

  const values = watch()

  useEffect(() => {
    if (open) reset(empty)
  }, [open, reset])

  const fromAccount = bankAccounts.find((b) => b.id === values.fromAccountId)
  const insufficientBalance = !company?.allowOverdraft && !!fromAccount && values.amount > fromAccount.currentBalance

  async function onSubmit(input: TransferFundsInput) {
    if (!input.fromAccountId || !input.toAccountId) {
      toast.error('Select both accounts')
      return
    }
    if (input.fromAccountId === input.toAccountId) {
      toast.error('Choose two different accounts')
      return
    }
    if (input.amount <= 0) {
      toast.error('Enter a valid amount')
      return
    }
    if (insufficientBalance) {
      toast.error('Insufficient balance in the source account')
      return
    }
    try {
      await transferBetweenBanks(input, user?.uid ?? '')
      toast.success('Transfer recorded')
      onClose()
    } catch {
      toast.error('Could not record transfer')
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Transfer Funds"
      subtitle="Move money between two of your bank accounts"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit(onSubmit)} loading={isSubmitting}>
            Transfer
          </Button>
        </>
      }
    >
      <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
        <SelectField
          label="From Account"
          placeholder="Select source account…"
          options={bankAccounts.map((b) => ({ value: b.id, label: `${b.bankName} — ${b.accountNumber} (${formatCurrency(b.currentBalance)})` }))}
          {...register('fromAccountId')}
        />
        <SelectField
          label="To Account"
          placeholder="Select destination account…"
          options={bankAccounts.map((b) => ({ value: b.id, label: `${b.bankName} — ${b.accountNumber}` }))}
          {...register('toAccountId')}
        />
        <div className="grid grid-cols-2 gap-4">
          <TextField label="Amount (LKR)" type="number" step="0.01" required {...register('amount', { valueAsNumber: true })} />
          <TextField label="Date" type="date" {...register('date')} />
        </div>
        <TextField label="Reference" placeholder="Optional note" {...register('reference')} />
        {insufficientBalance && (
          <p className="text-xs font-medium text-danger-500">
            Insufficient balance — {fromAccount?.bankName} only has {formatCurrency(fromAccount?.currentBalance ?? 0)}.
          </p>
        )}
      </form>
    </Modal>
  )
}
