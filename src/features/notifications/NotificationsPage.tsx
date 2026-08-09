import { useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { orderBy } from 'firebase/firestore'
import { Bell, CreditCard, TrendingUp, AlertTriangle, Eye, X, CheckCheck } from 'lucide-react'
import { useCollection } from '@/shared/hooks/useCollection'
import { Breadcrumb, Button, KpiTile, StatusBadge, EmptyState, LoadingBlock } from '@/shared/components'
import type { AppNotification, NotificationType } from '@/shared/types/entities'
import { formatCurrency } from '@/shared/lib/currency'
import { formatDateLong } from '@/shared/lib/dates'
import { markNotificationRead, markAllRead } from './api'

type NotificationWithId = AppNotification & { id: string }

const TYPE_ICON: Record<NotificationType, typeof Bell> = {
  cheque_due: Bell,
  credit_due: CreditCard,
  receivable: TrendingUp,
  overdue: AlertTriangle,
}

const TYPE_BG: Record<NotificationType, string> = {
  cheque_due: 'bg-warning-50 dark:bg-warning-500/10',
  credit_due: 'bg-info-50 dark:bg-info-500/10',
  receivable: 'bg-accent-50 dark:bg-accent-500/10',
  overdue: 'bg-danger-50 dark:bg-danger-500/10',
}

export function NotificationsPage() {
  const { data: notifications, loading } = useCollection<AppNotification>('notifications', [orderBy('createdAt', 'desc')])
  const [filter, setFilter] = useState<'all' | NotificationType>('all')

  const filtered = useMemo(() => (filter === 'all' ? notifications : notifications.filter((n) => n.type === filter)), [notifications, filter])
  const unreadCount = notifications.filter((n) => !n.read).length

  const byType = (type: NotificationType) => notifications.filter((n) => n.type === type)
  const chequeDue = byType('cheque_due')
  const creditDue = byType('credit_due')
  const receivable = byType('receivable')
  const overdue = byType('overdue')

  async function onAction(n: NotificationWithId) {
    try {
      await markNotificationRead(n.id)
      toast.success(n.actionType === 'Paid' ? 'Marked paid' : n.actionType === 'Received' ? 'Marked received' : 'Acknowledged')
    } catch {
      toast.error('Could not update')
    }
  }

  async function onMarkAllRead() {
    try {
      await markAllRead(notifications)
      toast.success('All notifications marked read')
    } catch {
      toast.error('Could not update')
    }
  }

  return (
    <div className="space-y-4">
      <Breadcrumb items={[{ label: 'Home', to: '/dashboard' }, { label: 'Notifications' }]} />
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-semibold text-[var(--text-primary)]">Notifications</h1>
          {unreadCount > 0 && <StatusBadge tone="danger">{unreadCount} unread</StatusBadge>}
        </div>
        <Button variant="outline" onClick={onMarkAllRead}>
          <CheckCheck className="h-4 w-4" /> Mark All Read
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiTile icon={Bell} label="Today's Cheques" value={formatCurrency(chequeDue.reduce((s, n) => s + n.amount, 0))} sublabel={`${chequeDue.length} items`} accentColor="#d97706" iconBg="#fffbeb" iconColor="#d97706" />
        <KpiTile icon={CreditCard} label="Credit Due" value={formatCurrency(creditDue.reduce((s, n) => s + n.amount, 0))} sublabel={`${creditDue.length} items`} accentColor="#2563eb" iconBg="#eff6ff" iconColor="#2563eb" />
        <KpiTile icon={TrendingUp} label="Receivable" value={formatCurrency(receivable.reduce((s, n) => s + n.amount, 0))} sublabel={`${receivable.length} items`} accentColor="#16a34a" iconBg="#ecfdf3" iconColor="#16a34a" />
        <KpiTile icon={AlertTriangle} label="Overdue" value={formatCurrency(overdue.reduce((s, n) => s + n.amount, 0))} sublabel={`${overdue.length} items`} accentColor="#dc2626" iconBg="#fef2f2" iconColor="#dc2626" />
      </div>

      <div className="flex flex-wrap gap-2">
        {(
          [
            { key: 'all', label: 'All' },
            { key: 'cheque_due', label: 'Cheques' },
            { key: 'credit_due', label: 'Credit' },
            { key: 'receivable', label: 'Receivables' },
            { key: 'overdue', label: 'Overdue' },
          ] as const
        ).map((t) => (
          <button
            key={t.key}
            onClick={() => setFilter(t.key)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              filter === t.key ? 'bg-brand-600 text-white' : 'bg-[var(--bg-surface-muted)] text-[var(--text-secondary)] hover:bg-[var(--border-default)]'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <LoadingBlock />
      ) : filtered.length === 0 ? (
        <EmptyState title="No notifications" description="Overdue cheques and payments are flagged here automatically every day." />
      ) : (
        <div className="space-y-3">
          {filtered.map((n) => {
            const Icon = TYPE_ICON[n.type]
            return (
              <div key={n.id} className={`flex items-center justify-between gap-4 rounded-xl border border-[var(--border-default)] p-4 ${TYPE_BG[n.type]}`}>
                <div className="flex items-start gap-3">
                  <Icon className="mt-0.5 h-5 w-5 shrink-0 text-[var(--text-secondary)]" />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-[var(--text-primary)]">{n.title}</span>
                      <StatusBadge>{n.type.replace(/_/g, ' ')}</StatusBadge>
                      {!n.read && <span className="h-2 w-2 rounded-full bg-brand-600" />}
                    </div>
                    <p className="text-sm text-[var(--text-secondary)]">{n.description}</p>
                    <p className="mt-0.5 text-xs text-[var(--text-muted)]">
                      {formatCurrency(n.amount)} · {formatDateLong(n.createdAt)}
                      {n.refId && ` · ${n.refId}`}
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {n.actionType && n.actionType !== 'None' && !n.read && (
                    <Button size="sm" variant="accent" onClick={() => onAction(n)}>
                      {n.actionType}
                    </Button>
                  )}
                  <button className="rounded-md p-1.5 text-[var(--text-muted)] hover:bg-white/60">
                    <Eye className="h-4 w-4" />
                  </button>
                  <button onClick={() => markNotificationRead(n.id)} className="rounded-md p-1.5 text-[var(--text-muted)] hover:bg-white/60">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
