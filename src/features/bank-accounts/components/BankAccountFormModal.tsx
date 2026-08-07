import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { Modal, Button } from '@/shared/components'
import { TextField, TextareaField, SelectField } from '@/shared/components/form'
import type { BankAccount } from '@/shared/types/entities'
import { addBankAccount, updateBankAccount, type BankAccountFormInput } from '../api'

type AccountWithId = BankAccount & { id: string }

const empty: BankAccountFormInput = { bankName: '', accountNumber: '', branch: '', openingBalance: 0, description: '', status: 'active' }

export function BankAccountFormModal({ open, onClose, account }: { open: boolean; onClose: () => void; account?: AccountWithId }) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<BankAccountFormInput>({ defaultValues: empty })

  useEffect(() => {
    if (open) {
      reset(
        account
          ? {
              bankName: account.bankName,
              accountNumber: account.accountNumber,
              branch: account.branch,
              openingBalance: account.openingBalance,
              description: account.description,
              status: account.status,
            }
          : empty
      )
    }
  }, [open, account, reset])

  async function onSubmit(values: BankAccountFormInput) {
    try {
      if (account) {
        await updateBankAccount(account.id, values)
        toast.success('Bank account updated')
      } else {
        await addBankAccount(values)
        toast.success('Bank account added')
      }
      onClose()
    } catch {
      toast.error('Could not save bank account')
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={account ? 'Edit Bank Account' : 'Add Bank Account'}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit(onSubmit)} loading={isSubmitting}>
            {account ? 'Save' : 'Add Account'}
          </Button>
        </>
      }
    >
      <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
        <TextField
          label="Bank Name"
          required
          placeholder="e.g. Bank of Ceylon"
          error={errors.bankName?.message}
          {...register('bankName', { required: 'Bank name is required' })}
        />
        <TextField
          label="Account Number"
          required
          placeholder="Account number"
          error={errors.accountNumber?.message}
          {...register('accountNumber', { required: 'Account number is required' })}
        />
        <div className="grid grid-cols-2 gap-4">
          <TextField label="Branch" placeholder="Branch name" {...register('branch')} />
          <TextField label="Opening Balance (LKR)" type="number" step="1000" disabled={!!account} {...register('openingBalance')} />
        </div>
        <TextareaField label="Description" placeholder="Account purpose…" {...register('description')} />
        <SelectField
          label="Status"
          options={[
            { value: 'active', label: 'Active' },
            { value: 'inactive', label: 'Inactive' },
          ]}
          {...register('status')}
        />
      </form>
    </Modal>
  )
}
