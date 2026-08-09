import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { orderBy, where, Timestamp } from 'firebase/firestore'
import { Modal, Button, FileUpload, ConfirmDialog } from '@/shared/components'
import { TextField, SelectField } from '@/shared/components/form'
import { useCollection } from '@/shared/hooks/useCollection'
import { useFileUpload } from '@/shared/hooks/useFileUpload'
import { useAuth } from '@/app/providers/AuthProvider'
import type { BankAccount, PaymentAttachment, PaymentAllocation, Project, ProjectDocument } from '@/shared/types/entities'
import { formatCurrency } from '@/shared/lib/currency'
import { todayInputValue } from '@/shared/lib/dates'
import { receivePayment, type ReceivePaymentInput } from '../api'

type ProjectWithId = Project & { id: string }
type InvoiceWithId = ProjectDocument & { id: string }

const empty: ReceivePaymentInput = { amount: 0, paymentType: 'cash', date: todayInputValue() }

export function ReceivePaymentModal({ open, onClose, project }: { open: boolean; onClose: () => void; project: ProjectWithId }) {
  const { user, appUser } = useAuth()
  const { data: bankAccounts } = useCollection<BankAccount>('bank_accounts', [orderBy('bankName')])
  const { data: invoiceDocs } = useCollection<ProjectDocument>('project_documents', [where('projectId', '==', project.id), where('type', '==', 'invoice')])
  const { uploadFile, uploading, progress } = useFileUpload()
  const [attachments, setAttachments] = useState<PaymentAttachment[]>([])
  const [uploadingType, setUploadingType] = useState<PaymentAttachment['type'] | null>(null)
  const [allocations, setAllocations] = useState<Record<string, number>>({})
  const [confirmCredit, setConfirmCredit] = useState<{ amount: number; input: ReceivePaymentInput } | null>(null)

  const {
    register,
    watch,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm<ReceivePaymentInput>({ defaultValues: empty })

  const values = watch()

  // Only invoices still owed something — an invoice with no remaining balance
  // isn't offered as an allocation target. Sorted oldest-first for auto-fill.
  const openInvoices = useMemo(
    () =>
      (invoiceDocs as InvoiceWithId[])
        .filter((inv) => (inv.invoiceAmount ?? 0) - (inv.receivedAmount ?? 0) > 0)
        .sort((a, b) => (a.invoiceDate?.toMillis() ?? 0) - (b.invoiceDate?.toMillis() ?? 0)),
    [invoiceDocs]
  )

  useEffect(() => {
    if (!open) setAllocations({})
  }, [open])

  const totalAllocated = Object.values(allocations).reduce((s, v) => s + (v || 0), 0)
  const unallocated = Math.max(values.amount - totalAllocated, 0)

  function autoFillAllocations() {
    let remaining = values.amount
    const next: Record<string, number> = {}
    for (const inv of openInvoices) {
      if (remaining <= 0) break
      const balance = (inv.invoiceAmount ?? 0) - (inv.receivedAmount ?? 0)
      const take = Math.min(balance, remaining)
      next[inv.id] = take
      remaining -= take
    }
    setAllocations(next)
  }

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

  function buildAllocations(): PaymentAllocation[] {
    return openInvoices
      .filter((inv) => (allocations[inv.id] || 0) > 0)
      .map((inv) => ({ invoiceId: inv.id, invoiceNumber: inv.invoiceNumber ?? '', amount: allocations[inv.id] }))
  }

  async function submitPayment(input: ReceivePaymentInput) {
    const bankAccountName = bankAccounts.find((b) => b.id === input.bankAccountId)?.bankName
    await receivePayment(
      project,
      { ...input, bankName: bankAccountName, allocations: openInvoices.length > 0 ? buildAllocations() : undefined },
      attachments,
      { uid: user?.uid ?? '', name: appUser?.displayName ?? 'Unknown' }
    )
    toast.success('Payment recorded')
    reset(empty)
    setAttachments([])
    setAllocations({})
    onClose()
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
    if (totalAllocated > input.amount) {
      toast.error('Allocated amount cannot exceed the payment amount')
      return
    }
    try {
      // Open invoices exist but some (or all) of this payment isn't matched to
      // one — confirm before it's recorded as unallocated project credit rather
      // than silently applied.
      if (openInvoices.length > 0 && unallocated > 0) {
        setConfirmCredit({ amount: unallocated, input })
        return
      }
      await submitPayment(input)
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

        {openInvoices.length > 0 && (
          <div className="space-y-3 rounded-lg border border-[var(--border-default)] p-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-[var(--text-primary)]">Allocate to Invoices</p>
              <Button type="button" size="sm" variant="outline" onClick={autoFillAllocations}>
                Auto-fill (oldest first)
              </Button>
            </div>
            {openInvoices.map((inv) => {
              const balance = (inv.invoiceAmount ?? 0) - (inv.receivedAmount ?? 0)
              return (
                <div key={inv.id} className="flex items-center justify-between gap-3 text-sm">
                  <div>
                    <div className="font-medium text-[var(--text-primary)]">{inv.invoiceNumber || inv.fileName}</div>
                    <div className="text-xs text-[var(--text-muted)]">Balance: {formatCurrency(balance)}</div>
                  </div>
                  <input
                    type="number"
                    step="0.01"
                    className="h-9 w-32 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] px-2 text-right text-sm outline-none focus:border-brand-500"
                    value={allocations[inv.id] ?? ''}
                    onChange={(e) => setAllocations((prev) => ({ ...prev, [inv.id]: Number(e.target.value) || 0 }))}
                  />
                </div>
              )
            })}
            <p className={`text-xs ${unallocated > 0 ? 'text-warning-600' : 'text-[var(--text-muted)]'}`}>
              {formatCurrency(totalAllocated)} allocated
              {unallocated > 0 && ` · ${formatCurrency(unallocated)} will be recorded as unallocated project credit`}
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

      <ConfirmDialog
        open={!!confirmCredit}
        onClose={() => setConfirmCredit(null)}
        onConfirm={async () => {
          if (!confirmCredit) return
          try {
            await submitPayment(confirmCredit.input)
          } catch {
            toast.error('Could not record payment')
          } finally {
            setConfirmCredit(null)
          }
        }}
        title="Record as project credit?"
        description={`${confirmCredit ? formatCurrency(confirmCredit.amount) : ''} of this payment isn't allocated to any invoice and will be recorded as unallocated credit on this project instead of reducing an invoice balance. Continue?`}
        confirmLabel="Record Payment"
        danger={false}
      />
    </Modal>
  )
}
