import { TrendingUp, TrendingDown, Landmark, AlertCircle, Users, ShoppingCart, Building2 } from 'lucide-react'
import { Card, CardHeader, CardBody, StatusBadge, KpiTile } from '@/shared/components'
import { formatCurrency, formatCurrencyCompact } from '@/shared/lib/currency'
import { IncomeExpenseChart } from './components/IncomeExpenseChart'
import { PurchaseOrdersChart } from './components/PurchaseOrdersChart'
import { UpcomingCheques } from './components/UpcomingCheques'
import { AlertsList } from './components/AlertsList'
import {
  mockIncomeExpenseTrend,
  mockPurchaseOrdersPerMonth,
  mockRecentPurchaseOrders,
  mockRecentIncome,
  mockUpcomingCheques,
  mockAlerts,
} from './mockData'

export function DashboardPage() {
  const today = new Date()

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--text-primary)]">Good morning, Admin 👋</h1>
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
          value={formatCurrencyCompact(6_500_000)}
          sublabel="August 2026"
          accentColor="#16a34a"
          iconBg="#ecfdf3"
          iconColor="#16a34a"
          trend={{ value: 12, direction: 'up' }}
        />
        <KpiTile
          icon={TrendingDown}
          label="Monthly Expenses"
          value={formatCurrencyCompact(3_900_000)}
          sublabel="August 2026"
          accentColor="#dc2626"
          iconBg="#fef2f2"
          iconColor="#dc2626"
          trend={{ value: 4, direction: 'down' }}
        />
        <KpiTile
          icon={Landmark}
          label="Bank Balance"
          value={formatCurrencyCompact(18_400_000)}
          sublabel="Across 4 accounts"
          accentColor="var(--text-muted)"
          iconBg="var(--bg-surface-muted)"
          iconColor="var(--text-primary)"
        />
        <KpiTile
          icon={AlertCircle}
          label="Outstanding Payables"
          value={formatCurrencyCompact(2_100_000)}
          sublabel="12 pending invoices"
          accentColor="#d97706"
          iconBg="#fffbeb"
          iconColor="#d97706"
          trend={{ value: 2, direction: 'up' }}
        />
        <KpiTile
          icon={Users}
          label="Outstanding Receivables"
          value={formatCurrencyCompact(4_700_000)}
          sublabel="8 clients"
          accentColor="#7c3aed"
          iconBg="#f3e8ff"
          iconColor="#7c3aed"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <KpiTile
          icon={ShoppingCart}
          label="Purchase Orders"
          value="284"
          sublabel="47 this month"
          accentColor="#16a34a"
          iconBg="#ecfdf3"
          iconColor="#16a34a"
          trend={{ value: 15, direction: 'up' }}
        />
        <KpiTile icon={Users} label="Total Suppliers" value="47" sublabel="5 new this month" accentColor="var(--text-muted)" iconBg="var(--bg-surface-muted)" iconColor="var(--text-primary)" />
        <KpiTile
          icon={Building2}
          label="Construction Sites"
          value="6"
          sublabel="4 active"
          accentColor="var(--text-muted)"
          iconBg="var(--bg-surface-muted)"
          iconColor="var(--text-primary)"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Income vs Expenses" subtitle="Monthly comparison 2026" />
          <CardBody>
            <IncomeExpenseChart data={mockIncomeExpenseTrend} />
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="Purchase Orders" subtitle="Orders per month" />
          <CardBody>
            <PurchaseOrdersChart data={mockPurchaseOrdersPerMonth} />
          </CardBody>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="Recent Purchase Orders" />
          <CardBody className="p-0">
            <div className="divide-y divide-[var(--border-default)]">
              {mockRecentPurchaseOrders.map((po) => (
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
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="Recent Income" />
          <CardBody className="p-0">
            <div className="divide-y divide-[var(--border-default)]">
              {mockRecentIncome.map((inc, i) => (
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
          </CardBody>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="Upcoming Cheques" />
          <CardBody>
            <UpcomingCheques cheques={mockUpcomingCheques} />
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="Today's Alerts" />
          <CardBody>
            <AlertsList alerts={mockAlerts} />
          </CardBody>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="p-5">
          <div className="text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">Today's Payments</div>
          <div className="mt-2 text-2xl font-semibold text-danger-500">{formatCurrency(485_000)}</div>
          <div className="mt-1 text-xs text-[var(--text-muted)]">3 transactions</div>
        </Card>
        <Card className="p-5">
          <div className="text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">Today's Receivables</div>
          <div className="mt-2 text-2xl font-semibold text-accent-600">{formatCurrency(2_500_000)}</div>
          <div className="mt-1 text-xs text-[var(--text-muted)]">1 received</div>
        </Card>
        <Card className="p-5">
          <div className="text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">Overdue Payments</div>
          <div className="mt-2 text-2xl font-semibold text-warning-600">{formatCurrency(820_000)}</div>
          <div className="mt-1 text-xs text-[var(--text-muted)]">2 suppliers</div>
        </Card>
      </div>
    </div>
  )
}
