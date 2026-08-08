import { useState } from 'react'
import toast from 'react-hot-toast'
import { Modal, Button, StatusBadge, CurrencyText } from '@/shared/components'
import { SelectField, TextField } from '@/shared/components/form'
import { useAuth } from '@/app/providers/AuthProvider'
import type { Cheque, ChequeStatus } from '@/shared/types/entities'
import { formatDate, todayInputValue } from '@/shared/lib/dates'
import { updateChequeStatus } from '../api'

type ChequeWithId = Cheque & { id: string }

const STATUS_OPTIONS: { value: ChequeStatus; label: string }[] = [
  { value: 'pending', label: 'Pending' },
  { value: 'post_dated', label: 'Post-Dated' },
  { value: 'cleared', label: 'Cleared' },
  { value: 'bounced', label: 'Bounced' },
]

export function UpdateChequeStatusModal({ open, onClose, cheque }: { open: boolean; onClose: () => void; cheque?: ChequeWithId }) {
  const { user } = useAuth()
  const [status, setStatus] = useState<ChequeStatus>('pending')
  const [date, setDate] = useState(todayInputValue())
  const [saving, setSaving] = useState(false)

  if (!cheque) return null

  async function onSave() {
    if (!cheque) return
    setSaving(true)
    try {
      await updateChequeStatus(cheque.id, status, date, user?.uid ?? '')
      toast.success(`Updated to ${status.replace(/_/g, ' ')}`)
      onClose()
    } catch {
      toast.error('Could not update cheque')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Update Cheque Status"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={onSave} loading={saving}>
            Update to {status.replace(/_/g, ' ')}
          </Button>
        </>
      }
    >
      <div className="mb-4 rounded-lg bg-[var(--bg-surface-muted)] p-3">
        <div className="font-mono text-xs text-[var(--text-muted)]">{cheque.chequeNumber}</div>
        <div className="text-sm font-medium text-[var(--text-primary)]">
          {cheque.party} · <CurrencyText amount={cheque.amount} className="inline" />
        </div>
        <div className="mt-1 flex items-center gap-2 text-xs text-[var(--text-muted)]">
          Due: {formatDate(cheque.dueDate)} <StatusBadge>{cheque.status.replace(/_/g, ' ')}</StatusBadge>
        </div>
      </div>
      <div className="space-y-4">
        <SelectField label="New Status" options={STATUS_OPTIONS} value={status} onChange={(e) => setStatus(e.target.value as ChequeStatus)} />
        <TextField label="Date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      </div>
    </Modal>
  )
}
