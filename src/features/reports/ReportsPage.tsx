import { useState } from 'react'
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  Percent,
  FileText,
  Users,
  Building2,
  HardHat,
  Download,
  FileSpreadsheet,
} from 'lucide-react'
import { Breadcrumb, Card, CardHeader, CardBody, KpiTile, Tabs, DataTable, Button } from '@/shared/components'
import type { DataTableColumn } from '@/shared/components'
import { formatCurrency, formatCurrencyCompact, formatPercent } from '@/shared/lib/currency'
import { formatDate } from '@/shared/lib/dates'
import { IncomeExpenseChart } from '@/features/dashboard/components/IncomeExpenseChart'
import { BarBreakdownChart } from './components/BarBreakdownChart'
import { ComparisonBarChart } from './components/ComparisonBarChart'
import { useReportsData } from './useReportsData'
import {
  REPORT_RANGES,
  type ReportRange,
  buildFinancialSummaryRows,
  buildIncomeStatementRows,
  buildExpenseStatementRows,
  buildVatReportRows,
  toPdfTable,
} from './api'
import type { ProjectPayment, PurchaseOrder, VatInvoice, Supplier, Project, ConstructionSite, Labour } from '@/shared/types/entities'

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

export function ReportsPage() {
  const [tab, setTab] = useState<ReportTab>('overview')
  const [range, setRange] = useState<ReportRange>('thisMonth')
  const d = useReportsData(range)

  const reports = [
    {
      key: 'financial-summary',
      title: 'Financial Summary',
      description: 'Monthly income, expenses and net profit.',
      rows: () => buildFinancialSummaryRows(d.filteredPayments, d.filteredPOs),
    },
    {
      key: 'income-statement',
      title: 'Income Statement',
      description: 'All completed customer payments in range.',
      rows: () => buildIncomeStatementRows(d.filteredPayments),
    },
    {
      key: 'expense-statement',
      title: 'Expense Statement',
      description: 'All purchase orders in range.',
      rows: () => buildExpenseStatementRows(d.filteredPOs),
    },
    {
      key: 'vat-report',
      title: 'VAT Report',
      description: 'VAT collected per supplier invoice in range.',
      rows: () => buildVatReportRows(d.filteredVat),
    },
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

  const supplierColumns: DataTableColumn<Supplier & { id: string }>[] = [
    { key: 'name', header: 'Company', render: (s) => s.companyName },
    { key: 'vat', header: 'VAT Registered', render: (s) => (s.vatRegistered ? 'Yes' : 'No') },
    { key: 'outstanding', header: 'Outstanding', render: (s) => formatCurrency(s.outstandingBalance) },
  ]

  const debtorColumns: DataTableColumn<Project & { id: string }>[] = [
    { key: 'project', header: 'Project', render: (p) => p.projectName },
    { key: 'customer', header: 'Customer', render: (p) => p.customer.companyName },
    { key: 'contractValue', header: 'Contract Value', render: (p) => formatCurrency(p.contractValue) },
    { key: 'received', header: 'Received', render: (p) => formatCurrency(p.receivedAmount) },
    { key: 'outstanding', header: 'Outstanding', render: (p) => formatCurrency(p.outstandingAmount) },
  ]

  const siteColumns: DataTableColumn<ConstructionSite & { id: string }>[] = [
    { key: 'name', header: 'Site', render: (s) => s.name },
    { key: 'status', header: 'Status', render: (s) => s.status },
    { key: 'budget', header: 'Budget', render: (s) => formatCurrency(s.budget) },
    { key: 'spent', header: 'Spent', render: (s) => formatCurrency(s.spentToDate) },
  ]

  const labourColumns: DataTableColumn<Labour & { id: string }>[] = [
    { key: 'name', header: 'Name', render: (l) => l.fullName },
    { key: 'role', header: 'Role', render: (l) => l.role },
    { key: 'site', header: 'Site', render: (l) => l.siteName ?? '' },
    { key: 'paid', header: 'Total Paid', render: (l) => formatCurrency(l.totalPaidAllTime) },
    { key: 'outstanding', header: 'Outstanding', render: (l) => formatCurrency(l.outstandingBalance) },
  ]

  return (
    <div className="space-y-4">
      <Breadcrumb items={[{ label: 'Home', to: '/dashboard' }, { label: 'Reports & Analytics' }]} />
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="text-2xl font-semibold text-[var(--text-primary)]">Reports & Analytics</h1>
        <div className="flex gap-2">
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
        </div>
      </div>

      <Card>
        <CardHeader title="Downloadable Reports" subtitle="Export the current date range as PDF or Excel" />
        <CardBody>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
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

      <Tabs tabs={TABS} active={tab} onChange={(k) => setTab(k as ReportTab)} variant="underline" />

      {tab === 'overview' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <KpiTile icon={TrendingUp} label="Total Income" value={formatCurrencyCompact(d.totalIncome)} accentColor="#16a34a" iconBg="#ecfdf3" iconColor="#16a34a" />
            <KpiTile icon={TrendingDown} label="Total Expenses" value={formatCurrencyCompact(d.totalExpenses)} accentColor="#dc2626" iconBg="#fef2f2" iconColor="#dc2626" />
            <KpiTile icon={Wallet} label="Net Profit" value={formatCurrencyCompact(d.netProfit)} accentColor="#2563eb" iconBg="#eff6ff" iconColor="#2563eb" />
            <KpiTile icon={Percent} label="Profit Margin" value={formatPercent(d.profitMargin, 1)} accentColor="#7c3aed" iconBg="#f3e8ff" iconColor="#7c3aed" />
          </div>
          <Card>
            <CardHeader title="Income vs Expenses" subtitle="Last 6 months" />
            <CardBody>
              <IncomeExpenseChart data={d.trend} />
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
              <DataTable columns={incomeColumns} data={d.filteredPayments} keyField={(p) => p.id} emptyTitle="No income in this range" />
            </CardBody>
          </Card>
        </div>
      )}

      {tab === 'expenses' && (
        <div className="space-y-4">
          <KpiTile icon={TrendingDown} label="Total Expenses" value={formatCurrencyCompact(d.totalExpenses)} accentColor="#dc2626" iconBg="#fef2f2" iconColor="#dc2626" />
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
            <CardHeader title="All Suppliers" />
            <CardBody className="p-0">
              <DataTable columns={supplierColumns} data={d.suppliers} keyField={(s) => s.id} emptyTitle="No suppliers yet" />
            </CardBody>
          </Card>
        </div>
      )}

      {tab === 'debtors' && (
        <div className="space-y-4">
          <KpiTile icon={Users} label="Total Receivables Outstanding" value={formatCurrencyCompact(d.totalReceivablesOutstanding)} accentColor="#7c3aed" iconBg="#f3e8ff" iconColor="#7c3aed" />
          <Card>
            <CardHeader title="Top Debtors by Outstanding" />
            <CardBody>
              {d.topDebtors.length === 0 ? (
                <p className="text-sm text-[var(--text-muted)]">No outstanding balances.</p>
              ) : (
                <BarBreakdownChart data={d.topDebtors} color="#7c3aed" />
              )}
            </CardBody>
          </Card>
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
          <Card>
            <CardHeader title="Budget vs Spent by Site" />
            <CardBody>
              {d.siteBudgetVsSpent.length === 0 ? (
                <p className="text-sm text-[var(--text-muted)]">No construction sites yet.</p>
              ) : (
                <ComparisonBarChart data={d.siteBudgetVsSpent} />
              )}
            </CardBody>
          </Card>
          <Card>
            <CardHeader title="All Sites" />
            <CardBody className="p-0">
              <DataTable columns={siteColumns} data={d.sites} keyField={(s) => s.id} emptyTitle="No construction sites yet" />
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
            <CardHeader title="All Workers" />
            <CardBody className="p-0">
              <DataTable columns={labourColumns} data={d.labour} keyField={(l) => l.id} emptyTitle="No labour records yet" />
            </CardBody>
          </Card>
        </div>
      )}
    </div>
  )
}
