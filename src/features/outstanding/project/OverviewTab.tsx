import { useState } from 'react'
import toast from 'react-hot-toast'
import { Card, CardHeader, CardBody, CurrencyText, Button } from '@/shared/components'
import { TextField } from '@/shared/components/form'
import type { Project } from '@/shared/types/entities'
import { formatPercent } from '@/shared/lib/currency'
import { canEdit } from '@/shared/lib/permissions'
import { useAuth } from '@/app/providers/AuthProvider'
import { setProjectEngineer } from '../api'

type ProjectWithId = Project & { id: string }

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs text-[var(--text-muted)]">{label}</div>
      <div className="text-sm font-medium text-[var(--text-primary)]">{value || '—'}</div>
    </div>
  )
}

export function OverviewTab({ project }: { project: ProjectWithId }) {
  const { appUser } = useAuth()
  const editable = canEdit(appUser?.role ?? 'manager', 'outstanding')
  const [engineer, setEngineer] = useState(project.engineer ?? '')
  const [saving, setSaving] = useState(false)

  const progress = project.contractValue > 0 ? Math.round((project.receivedAmount / project.contractValue) * 100) : 0

  async function saveEngineer() {
    setSaving(true)
    try {
      await setProjectEngineer(project.id, engineer)
      toast.success('Engineer updated')
    } catch {
      toast.error('Could not save')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <Card className="lg:col-span-2">
        <CardHeader title="Project Overview" />
        <CardBody className="grid grid-cols-2 gap-5 sm:grid-cols-3">
          <Field label="Quotation Number" value={project.quotationNumber} />
          <Field label="PO Number" value={project.poNumber ?? ''} />
          <Field label="Customer" value={project.customer.companyName} />
          <Field label="Contact" value={project.customer.contactName ?? ''} />
          <Field label="Phone" value={project.customer.phone ?? ''} />
          <Field label="Email" value={project.customer.email ?? ''} />
        </CardBody>
        <CardBody className="border-t border-[var(--border-default)]">
          <div className="flex items-end gap-3">
            <div className="flex-1">
              <TextField label="Engineer" value={engineer} onChange={(e) => setEngineer(e.target.value)} disabled={!editable} />
            </div>
            {editable && (
              <Button variant="outline" onClick={saveEngineer} loading={saving}>
                Save
              </Button>
            )}
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Financials" />
        <CardBody className="space-y-4">
          <div className="flex justify-between">
            <span className="text-sm text-[var(--text-muted)]">Contract Value</span>
            <CurrencyText amount={project.contractValue} />
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-[var(--text-muted)]">Advance Required</span>
            <CurrencyText amount={project.advanceRequiredAmount} />
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-[var(--text-muted)]">Received</span>
            <CurrencyText amount={project.receivedAmount} tone="positive" />
          </div>
          <div className="flex justify-between border-t border-[var(--border-default)] pt-3">
            <span className="text-sm font-medium text-[var(--text-primary)]">Outstanding</span>
            <CurrencyText amount={project.outstandingAmount} tone={project.outstandingAmount > 0 ? 'negative' : 'default'} />
          </div>
          <div>
            <div className="flex justify-between text-xs text-[var(--text-muted)]">
              <span>Progress</span>
              <span>{formatPercent(progress)}</span>
            </div>
            <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-[var(--bg-surface-muted)]">
              <div className="h-full bg-accent-500" style={{ width: `${Math.min(progress, 100)}%` }} />
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  )
}
