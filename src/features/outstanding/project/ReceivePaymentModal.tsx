import { useState } from 'react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { orderBy, Timestamp } from 'firebase/firestore'
import { Modal, Button, FileUpload } from '@/shared/components'
import { TextField, SelectField } from '@/shared/components/form'
import { useCollection } from '@/shared/hooks/useCollection'
import { useFileUpload } from '@/shared/hooks/useFileUpload'
import { useAuth } from '@/app/providers/AuthProvider'
import type { BankAccount, PaymentAttachment, Project } from '@/shared/types/entities'
import { todayInputValue } from '@/shared/lib/dates'
import { receivePayment, type ReceivePaymentInput } from '../api'

type ProjectWithId = Project & { id: string }

const empty: ReceivePaymentInput = { amount: 0, paymentType: 'cash', date: todayInputValue() }

export function ReceivePaymentModal({ open, onClose, project }: { open: boolean; onClose: () => void; project: ProjectWithId }) {
  const { user, appUser } = useAuth()
  const { data: bankAccounts } = useCollection<BankAccount>('bank_accounts', [orderBy('bankName')])
  const { uploadFile, uploading, progress } = useFileUpload()
  const [attachments, setAttachments] = useState<PaymentAttachment[]>([])
  const [uploadingType, setUploadingType] = useState<PaymentAttachment['type'] | null>(null)

  const {
    register,
    watch,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm<ReceivePaymentInput>({ defaultValues: empty })

  const values = watch()

  async function onAttachmentUpload(type: PaymentAttachment['type'], file: File) {
    setUploadingType(type)
    try {
      const { downloadURL, fileName } = await uploadFile(`projects/${project.id}/payments`, file)
      setAttachments((prev) => [
        ...prev.filter((a) => a.type !== type),
        { type, downloadURL, fileName, uploadedBy: user?.uid ?? '', uploadedDate: Timestamp.now() },
      ])
      toast.success('Attachment uploaded')
    } catch {
      toast.error('Upload failed')
    } finally {
      setUploadingType(null)
    }
  }

  async function onSubmit(input: ReceivePaymentInput) {
    if (input.amount <= 0) {
      toast.error('Enter a valid amount')
      return
    }
    if (input.paymentType === 'bank_transfer' && !input.bankAccountId) {
      toast.error('Select a bank account')
      return
    }
    if (input.paymentType === 'cheque' && !input.chequeNumber) {
      toast.error('Enter the cheque number')
      return
    }
    try {
      const bankAccountName = bankAccounts.find((b) => b.id === input.bankAccountId)?.bankName
      await receivePayment(project, { ...input, bankName: bankAccountName }, attachments, {
        uid: user?.uid ?? '',
        name: appUser?.displayName ?? 'Unknown',
      })
      toast.success('Payment recorded')
      reset(empty)
      setAttachments([])
      onClose()
    } catch {
      toast.error('Could not record payment')
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Receive Payment"
      subtitle={project.projectName}
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
        <div className="grid grid-cols-2 gap-4">
          <TextField label="Date" type="date" required {...register('date')} />
          <TextField label="Amount (LKR)" type="number" step="0.01" required {...register('amount', { valueAsNumber: true })} />
        </div>

        <SelectField
          label="Payment Type"
          options={[
            { value: 'cash', label: 'Cash' },
            { value: 'bank_transfer', label: 'Bank Transfer' },
            { value: 'cheque', label: 'Cheque' },
            { value: 'card', label: 'Card' },
          ]}
          {...register('paymentType')}
        />

        {values.paymentType === 'cash' && <TextField label="Cash Received By" {...register('cashReceivedBy')} />}

        {values.paymentType === 'bank_transfer' && (
          <div className="grid grid-cols-2 gap-4 rounded-lg bg-[var(--bg-surface-muted)] p-3">
            <SelectField
              label="Bank Account"
              placeholder="Select account…"
              options={bankAccounts.map((b) => ({ value: b.id, label: `${b.bankName} — ${b.accountNumber}` }))}
              {...register('bankAccountId')}
            />
            <TextField label="Reference Number" {...register('referenceNumber')} />
          </div>
        )}

        {values.paymentType === 'cheque' && (
          <div className="grid grid-cols-2 gap-4 rounded-lg bg-[var(--bg-surface-muted)] p-3">
            <TextField label="Cheque Number" required {...register('chequeNumber')} />
            <SelectField
              label="Bank Account"
              placeholder="Select account…"
              options={bankAccounts.map((b) => ({ value: b.id, label: `${b.bankName} — ${b.accountNumber}` }))}
              {...register('bankAccountId')}
            />
            <TextField label="Cheque Date" type="date" {...register('chequeDate')} />
            <TextField label="Due Date" type="date" {...register('chequeDueDate')} />
            <p className="col-span-2 text-xs text-[var(--text-muted)]">
              Status starts as <span className="font-medium">Pending Clearance</span> — the bank balance only increases once it's marked cleared in
              Cheque Management.
            </p>
          </div>
        )}

        <div className="space-y-3 border-t border-[var(--border-default)] pt-4">
          <p className="text-sm font-medium text-[var(--text-primary)]">Attachments</p>
          <div className="grid grid-cols-2 gap-4">
            <FileUpload
              label="Bank Slip"
              fileName={attachments.find((a) => a.type === 'bankSlip')?.fileName}
              progress={uploadingType === 'bankSlip' ? progress : undefined}
              onFileSelected={(f) => onAttachmentUpload('bankSlip', f)}
            />
            <FileUpload
              label="Cheque Image"
              fileName={attachments.find((a) => a.type === 'chequeImage')?.fileName}
              progress={uploadingType === 'chequeImage' ? progress : undefined}
              onFileSelected={(f) => onAttachmentUpload('chequeImage', f)}
            />
            <FileUpload
              label="Customer PO"
              fileName={attachments.find((a) => a.type === 'customerPO')?.fileName}
              progress={uploadingType === 'customerPO' ? progress : undefined}
              onFileSelected={(f) => onAttachmentUpload('customerPO', f)}
            />
            <FileUpload
              label="Other"
              fileName={attachments.find((a) => a.type === 'other')?.fileName}
              progress={uploadingType === 'other' ? progress : undefined}
              onFileSelected={(f) => onAttachmentUpload('other', f)}
            />
          </div>
          {uploading && <p className="text-xs text-[var(--text-muted)]">Uploading…</p>}
        </div>
      </form>
    </Modal>
  )
}
