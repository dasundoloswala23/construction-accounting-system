import { TrendingUp, TrendingDown, Landmark, AlertCircle, Users, ShoppingCart, Building2 } from 'lucide-react'
import { Card, CardHeader, CardBody, StatusBadge, KpiTile } from '@/shared/components'
import { formatCurrency, formatCurrencyCompact } from '@/shared/lib/currency'
import { useAuth } from '@/app/providers/AuthProvider'
import { IncomeExpenseChart } from './components/IncomeExpenseChart'
import { PurchaseOrdersChart } from './components/PurchaseOrdersChart'
import { UpcomingCheques } from './components/UpcomingCheques'
import { AlertsList } from './components/AlertsList'
import { useDashboardData } from './useDashboardData'

export function DashboardPage() {
  const { appUser } = useAuth()
  const today = new Date()
  const hour = today.getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'
  const d = useDashboardData()

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--text-primary)]">{greeting}, {appUser?.displayName?.split(' ')[0] ?? 'there'} 👋</h1>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            {today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
        </div>
        <span className="flex items-center gap-1.5 rounded-full bg-accent-50 px-3 py-1.5 text-sm font-medium text-accent-700 dark:bg-accent-500/15 dark:text-accent-500">
          <span className="h-2 w-2 rounded-full bg-accent-500" /> System Online
        </span>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <KpiTile
          icon={TrendingUp}
          label="Monthly Income"
          value={formatCurrencyCompact(d.monthlyIncome)}
          sublabel={today.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          accentColor="#16a34a"
          iconBg="#ecfdf3"
          iconColor="#16a34a"
        />
        <KpiTile
          icon={TrendingDown}
          label="Monthly Expenses"
          value={formatCurrencyCompact(d.monthlyExpenses)}
          sublabel={today.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          accentColor="#dc2626"
          iconBg="#fef2f2"
          iconColor="#dc2626"
        />
        <KpiTile
          icon={Landmark}
          label="Bank Balance"
          value={formatCurrencyCompact(d.bankBalance)}
          sublabel="Across all accounts"
          accentColor="var(--text-muted)"
          iconBg="var(--bg-surface-muted)"
          iconColor="var(--text-primary)"
        />
        <KpiTile
          icon={AlertCircle}
          label="Outstanding Payables"
          value={formatCurrencyCompact(d.outstandingPayables)}
          accentColor="#d97706"
          iconBg="#fffbeb"
          iconColor="#d97706"
        />
        <KpiTile
          icon={Users}
          label="Outstanding Receivables"
          value={formatCurrencyCompact(d.outstandingReceivables)}
          accentColor="#7c3aed"
          iconBg="#f3e8ff"
          iconColor="#7c3aed"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <KpiTile
          icon={ShoppingCart}
          label="Purchase Orders"
          value={String(d.purchaseOrdersCount)}
          sublabel={`${d.purchaseOrdersThisMonth} this month`}
          accentColor="#16a34a"
          iconBg="#ecfdf3"
          iconColor="#16a34a"
        />
        <KpiTile
          icon={Users}
          label="Total Suppliers"
          value={String(d.totalSuppliers)}
          accentColor="var(--text-muted)"
          iconBg="var(--bg-surface-muted)"
          iconColor="var(--text-primary)"
        />
        <KpiTile
          icon={Building2}
          label="Construction Sites"
          value={String(d.totalSites)}
          sublabel={`${d.activeSites} active`}
          accentColor="var(--text-muted)"
          iconBg="var(--bg-surface-muted)"
          iconColor="var(--text-primary)"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Income vs Expenses" subtitle="Monthly comparison" />
          <CardBody>
            <IncomeExpenseChart data={d.trend} />
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="Purchase Orders" subtitle="Orders per month" />
          <CardBody>
            <PurchaseOrdersChart data={d.poPerMonth} />
          </CardBody>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="Recent Purchase Orders" />
          <CardBody className="p-0">
            {d.recentPurchaseOrders.length === 0 ? (
              <p className="px-5 py-6 text-sm text-[var(--text-muted)]">No purchase orders yet.</p>
            ) : (
              <div className="divide-y divide-[var(--border-default)]">
                {d.recentPurchaseOrders.map((po) => (
                  <div key={po.poNo} className="flex items-center justify-between px-5 py-3">
                    <div>
                      <div className="text-sm font-medium text-[var(--text-primary)]">{po.poNo}</div>
                      <div className="text-xs text-[var(--text-muted)]">
                        {po.supplier} · {po.site}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-[var(--text-primary)]">{formatCurrency(po.amount)}</div>
                      <StatusBadge>{po.status}</StatusBadge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="Recent Income" />
          <CardBody className="p-0">
            {d.recentIncome.length === 0 ? (
              <p className="px-5 py-6 text-sm text-[var(--text-muted)]">No income recorded yet.</p>
            ) : (
              <div className="divide-y divide-[var(--border-default)]">
                {d.recentIncome.map((inc, i) => (
                  <div key={i} className="flex items-center justify-between px-5 py-3">
                    <div>
                      <div className="text-sm font-medium text-[var(--text-primary)]">{inc.customer}</div>
                      <div className="text-xs text-[var(--text-muted)]">{inc.site}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-accent-600">{formatCurrency(inc.amount)}</div>
                      <StatusBadge tone="info">{inc.method}</StatusBadge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="Upcoming Cheques" />
          <CardBody>
            <UpcomingCheques cheques={d.upcomingCheques} />
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="Today's Alerts" />
          <CardBody>
            <AlertsList alerts={d.alerts} />
          </CardBody>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="p-5">
          <div className="text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">Today's Payments</div>
          <div className="mt-2 text-2xl font-semibold text-danger-500">{formatCurrency(d.todaysPayments)}</div>
          <div className="mt-1 text-xs text-[var(--text-muted)]">{d.todaysPaymentsCount} transactions</div>
        </Card>
        <Card className="p-5">
          <div className="text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">Today's Receivables</div>
          <div className="mt-2 text-2xl font-semibold text-accent-600">{formatCurrency(d.todaysReceivables)}</div>
          <div className="mt-1 text-xs text-[var(--text-muted)]">{d.todaysReceivablesCount} received</div>
        </Card>
        <Card className="p-5">
          <div className="text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">Overdue Payments</div>
          <div className="mt-2 text-2xl font-semibold text-warning-600">{formatCurrency(d.overduePayments)}</div>
          <div className="mt-1 text-xs text-[var(--text-muted)]">{d.overduePaymentsCount} cheques</div>
        </Card>
      </div>
    </div>
  )
}
