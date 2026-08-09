import { useMemo } from 'react'
import { format, startOfMonth, subMonths } from 'date-fns'
import { useCollection } from '@/shared/hooks/useCollection'
import type { ProjectPayment, PurchaseOrder, VatInvoice, Supplier, Project, ConstructionSite, Labour } from '@/shared/types/entities'
import { type ReportRange, rangeStart, inRange } from './api'

function topN<T>(items: T[], value: (item: T) => number, n: number) {
  return [...items].sort((a, b) => value(b) - value(a)).slice(0, n)
}

export function useReportsData(range: ReportRange) {
  const { data: payments, loading: loadingPayments } = useCollection<ProjectPayment>('project_payments', [])
  const { data: purchaseOrders, loading: loadingPOs } = useCollection<PurchaseOrder>('purchase_orders', [])
  const { data: vatInvoices, loading: loadingVat } = useCollection<VatInvoice>('vat_invoices', [])
  const { data: suppliers, loading: loadingSuppliers } = useCollection<Supplier>('suppliers', [])
  const { data: projects, loading: loadingProjects } = useCollection<Project>('projects', [])
  const { data: sites, loading: loadingSites } = useCollection<ConstructionSite>('construction_sites', [])
  const { data: labour, loading: loadingLabour } = useCollection<Labour>('labour', [])

  const now = useMemo(() => new Date(), [])
  const start = useMemo(() => rangeStart(range, now), [range, now])

  const completedPayments = useMemo(() => payments.filter((p) => p.status === 'completed'), [payments])
  const filteredPayments = useMemo(() => completedPayments.filter((p) => inRange(p.date, start)), [completedPayments, start])
  const filteredPOs = useMemo(() => purchaseOrders.filter((po) => inRange(po.date, start)), [purchaseOrders, start])
  const filteredVat = useMemo(() => vatInvoices.filter((v) => inRange(v.invoiceDate, start)), [vatInvoices, start])

  const totalIncome = useMemo(() => filteredPayments.reduce((s, p) => s + p.amount, 0), [filteredPayments])
  const totalExpenses = useMemo(() => filteredPOs.reduce((s, po) => s + po.grandTotal, 0), [filteredPOs])
  const netProfit = totalIncome - totalExpenses
  const profitMargin = totalIncome > 0 ? (netProfit / totalIncome) * 100 : 0

  // Trend is a rolling 6-month view independent of the range filter — a single-month
  // filter would otherwise collapse the trend chart to one bar.
  const trend = useMemo(() => {
    const months = Array.from({ length: 6 }, (_, i) => subMonths(now, 5 - i))
    return months.map((m) => {
      const label = format(m, 'MMM')
      const s = startOfMonth(m)
      const e = startOfMonth(subMonths(m, -1))
      const income = completedPayments.filter((p) => p.date.toDate() >= s && p.date.toDate() < e).reduce((sum, p) => sum + p.amount, 0)
      const expenses = purchaseOrders.filter((po) => po.date.toDate() >= s && po.date.toDate() < e).reduce((sum, po) => sum + po.grandTotal, 0)
      return { month: label, income: income / 1_000_000, expenses: expenses / 1_000_000 }
    })
  }, [completedPayments, purchaseOrders, now])

  const incomeByMethod = useMemo(() => {
    const map = new Map<string, number>()
    for (const p of filteredPayments) map.set(p.paymentType, (map.get(p.paymentType) ?? 0) + p.amount)
    return Array.from(map.entries()).map(([label, value]) => ({ label: label.replace(/_/g, ' '), value }))
  }, [filteredPayments])

  const expensesBySupplier = useMemo(() => {
    const map = new Map<string, number>()
    for (const po of filteredPOs) map.set(po.supplierName, (map.get(po.supplierName) ?? 0) + po.grandTotal)
    return topN(Array.from(map.entries()).map(([label, value]) => ({ label, value })), (r) => r.value, 5)
  }, [filteredPOs])

  const totalVat = useMemo(() => filteredVat.reduce((s, v) => s + v.vatAmount, 0), [filteredVat])
  const vatBySupplier = useMemo(() => {
    const map = new Map<string, number>()
    for (const v of filteredVat) map.set(v.supplierName, (map.get(v.supplierName) ?? 0) + v.vatAmount)
    return topN(Array.from(map.entries()).map(([label, value]) => ({ label, value })), (r) => r.value, 5)
  }, [filteredVat])

  const totalSupplierOutstanding = useMemo(() => suppliers.reduce((s, sup) => s + sup.outstandingBalance, 0), [suppliers])
  const topSuppliersOutstanding = useMemo(
    () => topN(suppliers, (s) => s.outstandingBalance, 5).map((s) => ({ label: s.companyName, value: s.outstandingBalance })),
    [suppliers]
  )

  const debtorProjects = useMemo(() => projects.filter((p) => p.outstandingAmount > 0), [projects])
  const totalReceivablesOutstanding = useMemo(() => debtorProjects.reduce((s, p) => s + p.outstandingAmount, 0), [debtorProjects])
  const topDebtors = useMemo(
    () => topN(debtorProjects, (p) => p.outstandingAmount, 5).map((p) => ({ label: p.projectName, value: p.outstandingAmount })),
    [debtorProjects]
  )

  const totalBudget = useMemo(() => sites.reduce((s, site) => s + site.budget, 0), [sites])
  const totalSpent = useMemo(() => sites.reduce((s, site) => s + site.spentToDate, 0), [sites])
  const siteBudgetVsSpent = useMemo(() => sites.map((s) => ({ label: s.name, budget: s.budget, spent: s.spentToDate })), [sites])

  const totalLabourPaid = useMemo(() => labour.reduce((s, l) => s + l.totalPaidAllTime, 0), [labour])
  const totalLabourOutstanding = useMemo(() => labour.reduce((s, l) => s + l.outstandingBalance, 0), [labour])
  const topLabourOutstanding = useMemo(
    () => topN(labour, (l) => l.outstandingBalance, 5).map((l) => ({ label: l.fullName, value: l.outstandingBalance })),
    [labour]
  )

  return {
    loading: loadingPayments || loadingPOs || loadingVat || loadingSuppliers || loadingProjects || loadingSites || loadingLabour,
    filteredPayments,
    filteredPOs,
    filteredVat,
    suppliers,
    debtorProjects,
    sites,
    labour,
    totalIncome,
    totalExpenses,
    netProfit,
    profitMargin,
    trend,
    incomeByMethod,
    expensesBySupplier,
    totalVat,
    vatBySupplier,
    totalSupplierOutstanding,
    topSuppliersOutstanding,
    totalReceivablesOutstanding,
    topDebtors,
    totalBudget,
    totalSpent,
    siteBudgetVsSpent,
    totalLabourPaid,
    totalLabourOutstanding,
    topLabourOutstanding,
  }
}
