import { useState } from 'react'
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  FileText,
  Users,
  UserCheck,
  Building2,
  HardHat,
  Download,
  FileSpreadsheet,
  Printer,
} from 'lucide-react'
import { Breadcrumb, Card, CardHeader, CardBody, KpiTile, Tabs, DataTable, Button, StatusBadge } from '@/shared/components'
import type { DataTableColumn } from '@/shared/components'
import { formatCurrency, formatCurrencyCompact, formatPercent } from '@/shared/lib/currency'
import { formatDate } from '@/shared/lib/dates'
import { useCollection } from '@/shared/hooks/useCollection'
import type { ConstructionSite } from '@/shared/types/entities'
import { IncomeExpenseProfitChart } from './components/IncomeExpenseProfitChart'
import { PieBreakdownChart } from './components/PieBreakdownChart'
import { BarBreakdownChart } from './components/BarBreakdownChart'
import { ComparisonBarChart } from './components/ComparisonBarChart'
import { SiteIncomeExpenseChart } from './components/SiteIncomeExpenseChart'
import { MonthlyBarChart } from './components/MonthlyBarChart'
import { DebtorAgingChart } from './components/DebtorAgingChart'
import { useReportsData } from './useReportsData'
import {
  REPORT_RANGES,
  type ReportRange,
  buildFinancialSummaryRows,
  buildIncomeStatementRows,
  buildExpenseStatementRows,
  buildVatReportRows,
  buildOutstandingReportRows,
  buildDebtorReportRows,
  buildSupplierReportRows,
  buildSiteReportRows,
  buildLabourReportRows,
  toPdfTable,
} from './api'
import type { ProjectPayment, PurchaseOrder, VatInvoice, Project, Labour } from '@/shared/types/entities'

type ReportTab = 'overview' | 'income' | 'expenses' | 'vat' | 'suppliers' | 'debtors' | 'sites' | 'labour'

const TABS: { key: ReportTab; label: string }[] = [
  { key: 'overview', label: 'Overview' },
  { key: 'income', label: 'Income' },
  { key: 'expenses', label: 'Expenses' },
  { key: 'vat', label: 'VAT' },
  { key: 'suppliers', label: 'Suppliers' },
  { key: 'debtors', label: 'Debtors' },
  { key: 'sites', label: 'Sites' },
  { key: 'labour', label: 'Labour' },
]

async function downloadExcel(fileName: string, sheetName: string, rows: Record<string, unknown>[]) {
  const { exportToExcel } = await import('@/shared/lib/exporters')
  exportToExcel(fileName, sheetName, rows)
}

async function downloadPdf(fileName: string, title: string, rows: Record<string, string | number>[]) {
  const { exportTableToPdf } = await import('@/shared/lib/exporters')
  const { headers, body } = toPdfTable(rows)
  exportTableToPdf(fileName, title, headers, body)
}

function TrendBadge({ value }: { value: number | null }) {
  if (value === null) return null
  const positive = value >= 0
  return (
    <span className={`text-xs font-semibold ${positive ? 'text-accent-600' : 'text-danger-500'}`}>
      {positive ? '+' : ''}
      {value.toFixed(0)}%
    </span>
  )
}

export function ReportsPage() {
  const [tab, setTab] = useState<ReportTab>('overview')
  const [range, setRange] = useState<ReportRange>('thisMonth')
  const [siteId, setSiteId] = useState('all')
  const { data: sites } = useCollection<ConstructionSite>('construction_sites', [])
  const d = useReportsData(range, siteId)

  const reports = [
    { key: 'financial-summary', title: 'Financial Summary', description: 'Monthly income, expenses and net profit.', rows: () => buildFinancialSummaryRows(d.filteredPayments, d.filteredPOs) },
    { key: 'income-statement', title: 'Income Statement', description: 'All completed customer payments in range.', rows: () => buildIncomeStatementRows(d.filteredPayments) },
    { key: 'expense-statement', title: 'Expense Statement', description: 'All purchase orders in range.', rows: () => buildExpenseStatementRows(d.filteredPOs) },
    { key: 'vat-report', title: 'VAT Report', description: 'VAT collected per supplier invoice in range.', rows: () => buildVatReportRows(d.filteredVat) },
    { key: 'outstanding-report', title: 'Outstanding Report', description: 'Every project still owed money.', rows: () => buildOutstandingReportRows(d.debtorProjects) },
    { key: 'debtor-report', title: 'Debtor Report', description: 'Customer-level receivables.', rows: () => buildDebtorReportRows(d.debtorProjects) },
    { key: 'supplier-report', title: 'Supplier Report', description: 'Spend and outstanding per supplier.', rows: () => buildSupplierReportRows(d.suppliers, d.filteredPOs) },
    { key: 'site-report', title: 'Site Report', description: 'Budget vs spend per construction site.', rows: () => buildSiteReportRows(d.sites) },
    { key: 'labour-report', title: 'Labour Report', description: 'Payments and outstanding per worker.', rows: () => buildLabourReportRows(d.labour) },
  ]

  const incomeColumns: DataTableColumn<ProjectPayment & { id: string }>[] = [
    { key: 'date', header: 'Date', render: (p) => formatDate(p.date) },
    { key: 'customer', header: 'Customer', render: (p) => p.customerName ?? 'Unknown' },
    { key: 'site', header: 'Site', render: (p) => p.siteName ?? '' },
    { key: 'method', header: 'Method', render: (p) => p.paymentType.replace(/_/g, ' ') },
    { key: 'amount', header: 'Amount', render: (p) => formatCurrency(p.amount) },
  ]

  const expenseColumns: DataTableColumn<PurchaseOrder & { id: string }>[] = [
    { key: 'date', header: 'Date', render: (po) => formatDate(po.date) },
    { key: 'poNumber', header: 'PO Number', render: (po) => po.poNumber },
    { key: 'supplier', header: 'Supplier', render: (po) => po.supplierName },
    { key: 'site', header: 'Site', render: (po) => po.siteName },
    { key: 'status', header: 'Status', render: (po) => po.status },
    { key: 'amount', header: 'Amount', render: (po) => formatCurrency(po.grandTotal) },
  ]

  const vatColumns: DataTableColumn<VatInvoice & { id: string }>[] = [
    { key: 'date', header: 'Date', render: (v) => formatDate(v.invoiceDate) },
    { key: 'supplier', header: 'Supplier', render: (v) => v.supplierName },
    { key: 'invoiceNumber', header: 'Invoice Number', render: (v) => v.invoiceNumber },
    { key: 'vatAmount', header: 'VAT Amount', render: (v) => formatCurrency(v.vatAmount) },
    { key: 'totalAmount', header: 'Total Amount', render: (v) => formatCurrency(v.totalAmount) },
  ]

  const supplierColumns: DataTableColumn<(typeof d.supplierSummary)[number]>[] = [
    { key: 'name', header: 'Supplier', render: (s) => s.name },
    { key: 'vat', header: 'VAT', render: (s) => (s.vatRegistered ? <StatusBadge tone="success">VAT</StatusBadge> : <StatusBadge>No VAT</StatusBadge>) },
    { key: 'orders', header: 'Orders', render: (s) => String(s.orders) },
    { key: 'spend', header: 'Total Spend', render: (s) => formatCurrency(s.spend) },
    { key: 'outstanding', header: 'Outstanding', render: (s) => (s.outstanding > 0 ? <span className="text-danger-500">{formatCurrency(s.outstanding)}</span> : <span className="text-accent-600">Clear</span>) },
  ]

  const debtorColumns: DataTableColumn<Project & { id: string }>[] = [
    { key: 'project', header: 'Project', render: (p) => p.projectName },
    { key: 'customer', header: 'Customer', render: (p) => p.customer.companyName },
    { key: 'contractValue', header: 'Contract Value', render: (p) => formatCurrency(p.contractValue) },
    { key: 'received', header: 'Received', render: (p) => formatCurrency(p.receivedAmount) },
    { key: 'outstanding', header: 'Outstanding', render: (p) => formatCurrency(p.outstandingAmount) },
  ]

  const siteColumns: DataTableColumn<(typeof d.sitePerformance)[number]>[] = [
    { key: 'name', header: 'Site', render: (s) => s.name },
    { key: 'contractValue', header: 'Contract Value', render: (s) => formatCurrency(s.contractValue) },
    { key: 'received', header: 'Received', render: (s) => formatCurrency(s.received) },
    { key: 'spent', header: 'Spent', render: (s) => formatCurrency(s.spent) },
    { key: 'margin', header: 'Margin', render: (s) => <StatusBadge tone={s.margin > 40 ? 'success' : s.margin > 15 ? 'info' : 'warning'}>{Math.round(s.margin)}%</StatusBadge> },
    {
      key: 'utilization',
      header: 'Budget Used',
      render: (s) => (
        <div className="flex min-w-[100px] items-center gap-2">
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-[var(--bg-surface-muted)]">
            <div className="h-full rounded-full bg-brand-600" style={{ width: `${Math.min(s.utilization, 100)}%` }} />
          </div>
          <span className="w-9 text-right text-xs">{Math.round(s.utilization)}%</span>
        </div>
      ),
    },
  ]

  const labourColumns: DataTableColumn<Labour & { id: string }>[] = [
    { key: 'name', header: 'Name', render: (l) => l.fullName },
    { key: 'role', header: 'Role', render: (l) => l.role },
    { key: 'site', header: 'Site', render: (l) => l.siteName ?? '' },
    { key: 'paid', header: 'Total Paid', render: (l) => formatCurrency(l.totalPaidAllTime) },
    { key: 'outstanding', header: 'Outstanding', render: (l) => (l.outstandingBalance > 0 ? <span className="text-danger-500">{formatCurrency(l.outstandingBalance)}</span> : <span className="text-accent-600">Clear</span>) },
    { key: 'status', header: 'Status', render: (l) => (l.outstandingBalance > 0 ? <StatusBadge tone="warning">Outstanding</StatusBadge> : <StatusBadge tone="success">Clear</StatusBadge>) },
  ]

  return (
    <div className="space-y-4">
      <Breadcrumb items={[{ label: 'Home', to: '/dashboard' }, { label: 'Reports & Analytics' }]} />
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--text-primary)]">Reports & Analytics</h1>
          <p className="mt-1 text-sm text-[var(--text-muted)]">Financial intelligence for Waterman Construction</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={siteId}
            onChange={(e) => setSiteId(e.target.value)}
            className="h-10 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] px-3 text-sm text-[var(--text-primary)] outline-none focus:border-brand-500"
          >
            <option value="all">All Sites</option>
            {sites.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
          {REPORT_RANGES.map((r) => (
            <button
              key={r.key}
              onClick={() => setRange(r.key)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                range === r.key ? 'bg-brand-600 text-white' : 'bg-[var(--bg-surface-muted)] text-[var(--text-secondary)] hover:bg-[var(--border-default)]'
              }`}
            >
              {r.label}
            </button>
          ))}
          <Button variant="outline" onClick={() => window.print()}>
            <Printer className="h-4 w-4" /> Print
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-t-4 border-t-accent-500 p-5">
          <div className="flex items-start justify-between">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent-50 text-accent-600 dark:bg-accent-500/15">
              <TrendingUp className="h-4 w-4" />
            </div>
            <TrendBadge value={d.trendBadges.income} />
          </div>
          <div className="mt-2 text-xl font-bold text-[var(--text-primary)]">{formatCurrencyCompact(d.totalIncome)}</div>
          <div className="mt-0.5 text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">Total Income</div>
          <div className="text-xs text-[var(--text-muted)]">{d.selectedSite?.name ?? 'All sites'}</div>
        </Card>
        <Card className="border-t-4 border-t-danger-500 p-5">
          <div className="flex items-start justify-between">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-danger-50 text-danger-500 dark:bg-danger-500/15">
              <TrendingDown className="h-4 w-4" />
            </div>
            <TrendBadge value={d.trendBadges.expenses} />
          </div>
          <div className="mt-2 text-xl font-bold text-[var(--text-primary)]">{formatCurrencyCompact(d.totalExpenses)}</div>
          <div className="mt-0.5 text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">Total Expenses</div>
          <div className="text-xs text-[var(--text-muted)]">{d.selectedSite?.name ?? 'All sites'}</div>
        </Card>
        <Card className="border-t-4 border-t-brand-900 p-5">
          <div className="flex items-start justify-between">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--bg-surface-muted)] text-[var(--text-primary)]">
              <Wallet className="h-4 w-4" />
            </div>
            <TrendBadge value={d.trendBadges.profit} />
          </div>
          <div className="mt-2 text-xl font-bold text-[var(--text-primary)]">{formatCurrencyCompact(d.netProfit)}</div>
          <div className="mt-0.5 text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">Net Profit</div>
          <div className="text-xs text-[var(--text-muted)]">{formatPercent(d.profitMargin, 0)} margin</div>
        </Card>
        <Card className="border-t-4 border-t-[#6366f1] p-5">
          <div className="flex items-start justify-between">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#6366f118] text-[#6366f1]">
              <FileText className="h-4 w-4" />
            </div>
            <TrendBadge value={d.trendBadges.vat} />
          </div>
          <div className="mt-2 text-xl font-bold text-[var(--text-primary)]">{formatCurrencyCompact(d.totalVat)}</div>
          <div className="mt-0.5 text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">VAT Paid</div>
          <div className="text-xs text-[var(--text-muted)]">{d.vatSupplierCount} supplier{d.vatSupplierCount === 1 ? '' : 's'}</div>
        </Card>
      </div>

      <Tabs tabs={TABS} active={tab} onChange={(k) => setTab(k as ReportTab)} variant="underline" />

      {tab === 'overview' && (
        <div className="space-y-4">
          <Card>
            <CardHeader title="Income vs Expenses vs Profit" subtitle="Last 6 months" />
            <CardBody>
              <IncomeExpenseProfitChart data={d.trend} />
            </CardBody>
          </Card>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader title="Expense by Site" />
              <CardBody>
                {d.expensesBySite.length === 0 ? (
                  <p className="text-sm text-[var(--text-muted)]">No purchase orders in this range.</p>
                ) : (
                  <PieBreakdownChart data={d.expensesBySite} />
                )}
              </CardBody>
            </Card>
            <Card>
              <CardHeader title="Top Suppliers by Spend" />
              <CardBody>
                {d.expensesBySupplier.length === 0 ? (
                  <p className="text-sm text-[var(--text-muted)]">No purchase orders in this range.</p>
                ) : (
                  <BarBreakdownChart data={d.expensesBySupplier} color="#dc2626" />
                )}
              </CardBody>
            </Card>
          </div>
          <Card>
            <CardHeader title="Construction Site Performance" />
            <CardBody className="p-0">
              <DataTable columns={siteColumns} data={d.sitePerformance} keyField={(s) => s.id} emptyTitle="No construction sites yet" />
            </CardBody>
          </Card>
        </div>
      )}

      {tab === 'income' && (
        <div className="space-y-4">
          <KpiTile icon={TrendingUp} label="Total Income" value={formatCurrencyCompact(d.totalIncome)} accentColor="#16a34a" iconBg="#ecfdf3" iconColor="#16a34a" />
          <Card>
            <CardHeader title="Income by Payment Method" />
            <CardBody>
              {d.incomeByMethod.length === 0 ? (
                <p className="text-sm text-[var(--text-muted)]">No income recorded in this range.</p>
              ) : (
                <BarBreakdownChart data={d.incomeByMethod} color="#16a34a" />
              )}
            </CardBody>
          </Card>
          <Card>
            <CardHeader title="Income Records" />
            <CardBody className="p-0">
              <DataTable
                columns={incomeColumns}
                data={d.filteredPayments}
                keyField={(p) => p.id}
                emptyTitle="No income in this range"
                footer={
                  d.filteredPayments.length > 0 && (
                    <div className="flex justify-between border-t border-[var(--border-default)] bg-[var(--bg-surface-muted)] px-4 py-3 text-sm font-semibold text-[var(--text-primary)]">
                      <span>Total</span>
                      <span className="text-accent-600">{formatCurrency(d.totalIncome)}</span>
                    </div>
                  )
                }
              />
            </CardBody>
          </Card>
        </div>
      )}

      {tab === 'expenses' && (
        <div className="space-y-4">
          <KpiTile icon={TrendingDown} label="Total Expenses" value={formatCurrencyCompact(d.totalExpenses)} accentColor="#dc2626" iconBg="#fef2f2" iconColor="#dc2626" />
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader title="Top Suppliers by Spend" />
              <CardBody>
                {d.expensesBySupplier.length === 0 ? (
                  <p className="text-sm text-[var(--text-muted)]">No purchase orders in this range.</p>
                ) : (
                  <BarBreakdownChart data={d.expensesBySupplier} color="#dc2626" />
                )}
              </CardBody>
            </Card>
            <Card>
              <CardHeader title="Expense by Site" />
              <CardBody>
                {d.expensesBySite.length === 0 ? (
                  <p className="text-sm text-[var(--text-muted)]">No purchase orders in this range.</p>
                ) : (
                  <div className="space-y-3">
                    {d.expensesBySite.map((s) => {
                      const total = d.expensesBySite.reduce((sum, x) => sum + x.value, 0)
                      const pct = total > 0 ? Math.round((s.value / total) * 100) : 0
                      return (
                        <div key={s.label}>
                          <div className="flex justify-between text-sm">
                            <span className="font-medium text-[var(--text-primary)]">{s.label}</span>
                            <span className="text-[var(--text-muted)]">
                              {pct}% · <span className="font-semibold text-[var(--text-primary)]">{formatCurrencyCompact(s.value)}</span>
                            </span>
                          </div>
                          <div className="mt-1 h-2 overflow-hidden rounded-full bg-[var(--bg-surface-muted)]">
                            <div className="h-full rounded-full bg-danger-500" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </CardBody>
            </Card>
          </div>
          <Card>
            <CardHeader title="Purchase Orders" />
            <CardBody className="p-0">
              <DataTable columns={expenseColumns} data={d.filteredPOs} keyField={(po) => po.id} emptyTitle="No purchase orders in this range" />
            </CardBody>
          </Card>
        </div>
      )}

      {tab === 'vat' && (
        <div className="space-y-4">
          <KpiTile icon={FileText} label="Total VAT" value={formatCurrencyCompact(d.totalVat)} accentColor="#d97706" iconBg="#fffbeb" iconColor="#d97706" />
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader title="Top Suppliers by VAT" />
              <CardBody>
                {d.vatBySupplier.length === 0 ? (
                  <p className="text-sm text-[var(--text-muted)]">No VAT invoices in this range.</p>
                ) : (
                  <BarBreakdownChart data={d.vatBySupplier} color="#d97706" />
                )}
              </CardBody>
            </Card>
            <Card>
              <CardHeader title="VAT by Supplier" />
              <CardBody className="space-y-2">
                {d.vatBySupplier.length === 0 ? (
                  <p className="text-sm text-[var(--text-muted)]">No VAT invoices in this range.</p>
                ) : (
                  d.vatBySupplier.map((s) => (
                    <div key={s.label} className="flex items-center justify-between rounded-xl bg-[var(--bg-surface-muted)] p-3">
                      <div>
                        <div className="text-sm font-medium text-[var(--text-primary)]">{s.label}</div>
                        <div className="font-mono text-xs text-[var(--text-muted)]">{s.tin}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-[var(--text-primary)]">{formatCurrency(s.value)}</div>
                        <div className="text-xs text-[var(--text-muted)]">{formatPercent(s.rate, 0)} VAT</div>
                      </div>
                    </div>
                  ))
                )}
              </CardBody>
            </Card>
          </div>
          <Card>
            <CardHeader title="VAT Invoices" />
            <CardBody className="p-0">
              <DataTable columns={vatColumns} data={d.filteredVat} keyField={(v) => v.id} emptyTitle="No VAT invoices in this range" />
            </CardBody>
          </Card>
        </div>
      )}

      {tab === 'suppliers' && (
        <div className="space-y-4">
          <KpiTile icon={Users} label="Total Payables Outstanding" value={formatCurrencyCompact(d.totalSupplierOutstanding)} accentColor="#d97706" iconBg="#fffbeb" iconColor="#d97706" />
          <Card>
            <CardHeader title="Top Suppliers by Outstanding" />
            <CardBody>
              {d.topSuppliersOutstanding.length === 0 ? (
                <p className="text-sm text-[var(--text-muted)]">No suppliers yet.</p>
              ) : (
                <BarBreakdownChart data={d.topSuppliersOutstanding} color="#d97706" />
              )}
            </CardBody>
          </Card>
          <Card>
            <CardHeader title="Supplier Summary" />
            <CardBody className="p-0">
              <DataTable columns={supplierColumns} data={d.supplierSummary} keyField={(s) => s.id} emptyTitle="No suppliers yet" />
            </CardBody>
          </Card>
        </div>
      )}

      {tab === 'debtors' && (
        <div className="space-y-4">
          <KpiTile icon={UserCheck} label="Total Receivables Outstanding" value={formatCurrencyCompact(d.totalReceivablesOutstanding)} accentColor="#7c3aed" iconBg="#f3e8ff" iconColor="#7c3aed" />
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader title="Debtor Aging" subtitle="By invoice date — no formal due date tracked yet" />
              <CardBody>
                <DebtorAgingChart data={d.debtorAging} />
              </CardBody>
            </Card>
            <Card>
              <CardHeader title="Aging Breakdown" />
              <CardBody className="space-y-3">
                {d.debtorAging.map((b, i) => {
                  const total = d.debtorAging.reduce((s, x) => s + x.amount, 0)
                  const pct = total > 0 ? Math.round((b.amount / total) * 100) : 0
                  const colors = ['bg-accent-500', 'bg-warning-500', 'bg-danger-500', 'bg-[#7f1d1d]']
                  return (
                    <div key={b.bucket}>
                      <div className="flex justify-between text-sm">
                        <span className="font-medium text-[var(--text-primary)]">{b.bucket}</span>
                        <span className="text-[var(--text-muted)]">
                          {pct}% · <span className="font-semibold text-[var(--text-primary)]">{formatCurrency(b.amount)}</span>
                        </span>
                      </div>
                      <div className="mt-1 h-2.5 overflow-hidden rounded-full bg-[var(--bg-surface-muted)]">
                        <div className={`h-full rounded-full ${colors[i]}`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  )
                })}
                <div className="flex justify-between border-t border-[var(--border-default)] pt-3 text-sm font-semibold text-[var(--text-primary)]">
                  <span>Total Receivables</span>
                  <span>{formatCurrency(d.debtorAging.reduce((s, b) => s + b.amount, 0))}</span>
                </div>
              </CardBody>
            </Card>
          </div>
          <Card>
            <CardHeader title="Projects With Outstanding Balance" />
            <CardBody className="p-0">
              <DataTable columns={debtorColumns} data={d.debtorProjects} keyField={(p) => p.id} emptyTitle="No outstanding projects" />
            </CardBody>
          </Card>
        </div>
      )}

      {tab === 'sites' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <KpiTile icon={Building2} label="Total Budget" value={formatCurrencyCompact(d.totalBudget)} accentColor="var(--text-muted)" iconBg="var(--bg-surface-muted)" iconColor="var(--text-primary)" />
            <KpiTile icon={Building2} label="Total Spent" value={formatCurrencyCompact(d.totalSpent)} accentColor="#16a34a" iconBg="#ecfdf3" iconColor="#16a34a" />
          </div>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader title="Income vs Expenses by Site" />
              <CardBody>
                {d.incomeExpenseBySite.length === 0 ? <p className="text-sm text-[var(--text-muted)]">No construction sites yet.</p> : <SiteIncomeExpenseChart data={d.incomeExpenseBySite} />}
              </CardBody>
            </Card>
            <Card>
              <CardHeader title="Budget vs Spent by Site" />
              <CardBody>
                {d.siteBudgetVsSpent.length === 0 ? <p className="text-sm text-[var(--text-muted)]">No construction sites yet.</p> : <ComparisonBarChart data={d.siteBudgetVsSpent} />}
              </CardBody>
            </Card>
          </div>
          <Card>
            <CardHeader title="Site Performance" />
            <CardBody className="p-0">
              <DataTable columns={siteColumns} data={d.sitePerformance} keyField={(s) => s.id} emptyTitle="No construction sites yet" />
            </CardBody>
          </Card>
        </div>
      )}

      {tab === 'labour' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <KpiTile icon={HardHat} label="Total Paid" value={formatCurrencyCompact(d.totalLabourPaid)} accentColor="#16a34a" iconBg="#ecfdf3" iconColor="#16a34a" />
            <KpiTile icon={HardHat} label="Total Outstanding" value={formatCurrencyCompact(d.totalLabourOutstanding)} accentColor="#d97706" iconBg="#fffbeb" iconColor="#d97706" />
          </div>
          <Card>
            <CardHeader title="Monthly Labour Payments" subtitle="Last 6 months" />
            <CardBody>
              <MonthlyBarChart data={d.labourMonthlyPaid} />
            </CardBody>
          </Card>
          <Card>
            <CardHeader title="Top Workers by Outstanding" />
            <CardBody>
              {d.topLabourOutstanding.length === 0 ? (
                <p className="text-sm text-[var(--text-muted)]">No labour records yet.</p>
              ) : (
                <BarBreakdownChart data={d.topLabourOutstanding} color="#d97706" />
              )}
            </CardBody>
          </Card>
          <Card>
            <CardHeader title="Labour Payment Summary" />
            <CardBody className="p-0">
              <DataTable columns={labourColumns} data={d.labour} keyField={(l) => l.id} emptyTitle="No labour records yet" />
            </CardBody>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader title="Download Reports" subtitle="Export the current date range as PDF or Excel" />
        <CardBody>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {reports.map((r) => (
              <div key={r.key} className="rounded-lg border border-[var(--border-default)] p-4">
                <div className="text-sm font-semibold text-[var(--text-primary)]">{r.title}</div>
                <div className="mt-1 text-xs text-[var(--text-muted)]">{r.description}</div>
                <div className="mt-3 flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => downloadPdf(r.key, r.title, r.rows())}>
                    <Download className="h-3.5 w-3.5" /> PDF
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => downloadExcel(r.key, r.title, r.rows())}>
                    <FileSpreadsheet className="h-3.5 w-3.5" /> Excel
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>
    </div>
  )
}
