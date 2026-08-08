import { useState } from 'react'
import toast from 'react-hot-toast'
import { isToday } from 'date-fns'
import { Plus, Users, DollarSign, AlertCircle, Wallet, Eye, Pencil, Trash2 } from 'lucide-react'
import { useCollection } from '@/shared/hooks/useCollection'
import { Card, Button, KpiTile, CurrencyText, Breadcrumb, ConfirmDialog, EmptyState, LoadingBlock } from '@/shared/components'
import type { Labour, LabourPayment } from '@/shared/types/entities'
import { formatCurrency } from '@/shared/lib/currency'
import { canEdit } from '@/shared/lib/permissions'
import { useAuth } from '@/app/providers/AuthProvider'
import { LabourFormModal } from './components/LabourFormModal'
import { PayLabourModal } from './components/PayLabourModal'
import { deleteLabour } from './api'

type LabourWithId = Labour & { id: string }

export function LabourPage() {
  const { appUser } = useAuth()
  const editable = canEdit(appUser?.role ?? 'manager', 'labourManagement')
  const { data: workers, loading } = useCollection<Labour>('labour', [])
  const { data: allPayments } = useCollection<LabourPayment>('labour_payments', [])

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<LabourWithId | undefined>(undefined)
  const [paying, setPaying] = useState<LabourWithId | undefined>(undefined)
  const [deleting, setDeleting] = useState<LabourWithId | undefined>(undefined)
  const [busy, setBusy] = useState(false)

  const todaysPayments = allPayments.filter((p) => isToday(p.date.toDate())).reduce((s, p) => s + p.amount, 0)
  const totalOutstanding = workers.reduce((s, w) => s + w.outstandingBalance, 0)
  const totalPaidAllTime = workers.reduce((s, w) => s + w.totalPaidAllTime, 0)

  function todaysPaymentFor(workerId: string) {
    return allPayments.filter((p) => p.workerId === workerId && isToday(p.date.toDate())).reduce((s, p) => s + p.amount, 0)
  }

  async function onDelete() {
    if (!deleting) return
    setBusy(true)
    try {
      await deleteLabour(deleting.id)
      toast.success('Worker removed')
      setDeleting(undefined)
    } catch {
      toast.error('Could not remove worker')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-4">
      <Breadcrumb items={[{ label: 'Home', to: '/dashboard' }, { label: 'Labour Management' }]} />
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--text-primary)]">Labour Management</h1>
          <p className="mt-1 text-sm text-[var(--text-muted)]">{workers.length} workers registered</p>
        </div>
        {editable && (
          <Button
            onClick={() => {
              setEditing(undefined)
              setFormOpen(true)
            }}
          >
            <Plus className="h-4 w-4" /> Add Labour
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiTile icon={Users} label="Total Workers" value={String(workers.length)} accentColor="var(--text-muted)" iconBg="var(--bg-surface-muted)" iconColor="var(--text-primary)" />
        <KpiTile icon={DollarSign} label="Today's Payments" value={formatCurrency(todaysPayments)} accentColor="#16a34a" iconBg="#ecfdf3" iconColor="#16a34a" />
        <KpiTile icon={AlertCircle} label="Total Outstanding" value={formatCurrency(totalOutstanding)} accentColor="#dc2626" iconBg="#fef2f2" iconColor="#dc2626" />
        <KpiTile icon={Wallet} label="Total Paid (All Time)" value={formatCurrency(totalPaidAllTime)} accentColor="var(--text-muted)" iconBg="var(--bg-surface-muted)" iconColor="var(--text-primary)" />
      </div>

      {loading ? (
        <LoadingBlock />
      ) : workers.length === 0 ? (
        <EmptyState title="No workers registered yet" description="Add your first worker to start tracking labour payments." />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {workers.map((w) => (
            <Card key={w.id} className="p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-600 text-sm font-semibold text-white">
                  {w.fullName.charAt(0)}
                </div>
                <div>
                  <div className="font-semibold text-[var(--text-primary)]">{w.fullName}</div>
                  <div className="text-xs text-[var(--text-muted)]">
                    {w.role}
                    {w.siteName && ` · ${w.siteName}`}
                  </div>
                </div>
              </div>
              {w.phone && <div className="mt-2 text-sm text-[var(--text-secondary)]">{w.phone}</div>}

              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-lg bg-danger-50 px-3 py-2 dark:bg-danger-500/10">
                  <div className="text-xs text-danger-600">Outstanding</div>
                  <CurrencyText amount={w.outstandingBalance} tone="negative" className="text-sm" />
                </div>
                <div className="rounded-lg bg-accent-50 px-3 py-2 dark:bg-accent-500/10">
                  <div className="text-xs text-accent-700">Today</div>
                  <CurrencyText amount={todaysPaymentFor(w.id)} tone="positive" className="text-sm" />
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-1 border-t border-[var(--border-default)] pt-3 text-sm">
                <button className="flex items-center gap-1 rounded-md px-2 py-1 text-[var(--text-secondary)] hover:bg-[var(--bg-surface-muted)]">
                  <Eye className="h-3.5 w-3.5" /> View
                </button>
                {editable && (
                  <>
                    <button
                      onClick={() => {
                        setEditing(w)
                        setFormOpen(true)
                      }}
                      className="flex items-center gap-1 rounded-md px-2 py-1 text-[var(--text-secondary)] hover:bg-[var(--bg-surface-muted)]"
                    >
                      <Pencil className="h-3.5 w-3.5" /> Edit
                    </button>
                    <Button size="sm" variant="accent" onClick={() => setPaying(w)}>
                      <DollarSign className="h-3.5 w-3.5" /> Pay
                    </Button>
                    <button onClick={() => setDeleting(w)} className="ml-auto rounded-md p-1.5 text-danger-500 hover:bg-danger-50">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      <LabourFormModal open={formOpen} onClose={() => setFormOpen(false)} worker={editing} />
      <PayLabourModal open={!!paying} onClose={() => setPaying(undefined)} worker={paying} />
      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(undefined)}
        onConfirm={onDelete}
        loading={busy}
        title="Remove worker?"
        description={`This will remove "${deleting?.fullName}" from Labour Management.`}
      />
    </div>
  )
}
