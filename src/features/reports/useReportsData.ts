import { useMemo } from 'react'
import { differenceInCalendarDays, format, startOfMonth, subMonths } from 'date-fns'
import { useCollection } from '@/shared/hooks/useCollection'
import type {
  ProjectPayment,
  PurchaseOrder,
  VatInvoice,
  Supplier,
  Project,
  ConstructionSite,
  Labour,
  LabourPayment,
  ProjectDocument,
} from '@/shared/types/entities'
import { type ReportRange, rangeStart, inRange } from './api'

function topN<T>(items: T[], value: (item: T) => number, n: number) {
  return [...items].sort((a, b) => value(b) - value(a)).slice(0, n)
}

/** The equivalent-length period immediately before `start` — used for trend
 * badges. No prior period for "All Time" (there's nothing before it). */
function priorRange(range: ReportRange, start: Date | null, now: Date): { from: Date; to: Date } | null {
  if (!start) return null
  if (range === 'thisMonth') return { from: startOfMonth(subMonths(now, 1)), to: start }
  if (range === 'last3Months') return { from: startOfMonth(subMonths(now, 5)), to: start }
  return null
}

function pctChange(current: number, prior: number): number | null {
  if (prior <= 0) return null
  return ((current - prior) / prior) * 100
}

export function useReportsData(range: ReportRange, siteId: string) {
  const { data: payments, loading: loadingPayments } = useCollection<ProjectPayment>('project_payments', [])
  const { data: purchaseOrders, loading: loadingPOs } = useCollection<PurchaseOrder>('purchase_orders', [])
  const { data: vatInvoices, loading: loadingVat } = useCollection<VatInvoice>('vat_invoices', [])
  const { data: suppliers, loading: loadingSuppliers } = useCollection<Supplier>('suppliers', [])
  const { data: projects, loading: loadingProjects } = useCollection<Project>('projects', [])
  const { data: sites, loading: loadingSites } = useCollection<ConstructionSite>('construction_sites', [])
  const { data: labour, loading: loadingLabour } = useCollection<Labour>('labour', [])
  const { data: labourPayments, loading: loadingLabourPayments } = useCollection<LabourPayment>('labour_payments', [])
  const { data: invoiceDocs, loading: loadingInvoices } = useCollection<ProjectDocument>('project_documents', [])

  const now = useMemo(() => new Date(), [])
  const start = useMemo(() => rangeStart(range, now), [range, now])
  const prior = useMemo(() => priorRange(range, start, now), [range, start, now])
  const selectedSite = useMemo(() => sites.find((s) => s.id === siteId), [sites, siteId])

  const completedPayments = useMemo(() => payments.filter((p) => p.status === 'completed'), [payments])
  const sitedPayments = useMemo(() => {
    if (siteId === 'all') return completedPayments
    const siteName = sites.find((s) => s.id === siteId)?.name
    return completedPayments.filter((p) => p.siteName === siteName)
  }, [completedPayments, sites, siteId])
  const sitedPOs = useMemo(
    () => (siteId === 'all' ? purchaseOrders : purchaseOrders.filter((po) => po.constructionSiteId === siteId)),
    [purchaseOrders, siteId]
  )
  const sitedLabour = useMemo(() => (siteId === 'all' ? labour : labour.filter((l) => l.constructionSiteId === siteId)), [labour, siteId])

  const filteredPayments = useMemo(() => sitedPayments.filter((p) => inRange(p.date, start)), [sitedPayments, start])
  const filteredPOs = useMemo(() => sitedPOs.filter((po) => inRange(po.date, start)), [sitedPOs, start])
  const filteredVat = useMemo(() => vatInvoices.filter((v) => inRange(v.invoiceDate, start)), [vatInvoices, start])

  const priorPayments = useMemo(
    () => (prior ? sitedPayments.filter((p) => p.date.toDate() >= prior.from && p.date.toDate() < prior.to) : []),
    [sitedPayments, prior]
  )
  const priorPOs = useMemo(
    () => (prior ? sitedPOs.filter((po) => po.date.toDate() >= prior.from && po.date.toDate() < prior.to) : []),
    [sitedPOs, prior]
  )
  const priorVat = useMemo(
    () => (prior ? vatInvoices.filter((v) => v.invoiceDate.toDate() >= prior.from && v.invoiceDate.toDate() < prior.to) : []),
    [vatInvoices, prior]
  )

  const totalIncome = useMemo(() => filteredPayments.reduce((s, p) => s + p.amount, 0), [filteredPayments])
  const totalExpenses = useMemo(() => filteredPOs.reduce((s, po) => s + po.grandTotal, 0), [filteredPOs])
  const netProfit = totalIncome - totalExpenses
  const profitMargin = totalIncome > 0 ? (netProfit / totalIncome) * 100 : 0
  const totalVat = useMemo(() => filteredVat.reduce((s, v) => s + v.vatAmount, 0), [filteredVat])
  const vatSupplierCount = useMemo(() => new Set(filteredVat.map((v) => v.supplierId)).size, [filteredVat])

  const priorIncome = useMemo(() => priorPayments.reduce((s, p) => s + p.amount, 0), [priorPayments])
  const priorExpenses = useMemo(() => priorPOs.reduce((s, po) => s + po.grandTotal, 0), [priorPOs])
  const priorVatTotal = useMemo(() => priorVat.reduce((s, v) => s + v.vatAmount, 0), [priorVat])
  const trendBadges = {
    income: pctChange(totalIncome, priorIncome),
    expenses: pctChange(totalExpenses, priorExpenses),
    profit: pctChange(netProfit, priorIncome - priorExpenses),
    vat: pctChange(totalVat, priorVatTotal),
  }

  // Trend is a rolling 6-month view independent of the range filter — a single-month
  // filter would otherwise collapse the trend chart to one bar.
  const trend = useMemo(() => {
    const months = Array.from({ length: 6 }, (_, i) => subMonths(now, 5 - i))
    return months.map((m) => {
      const label = format(m, 'MMM')
      const s = startOfMonth(m)
      const e = startOfMonth(subMonths(m, -1))
      const income = sitedPayments.filter((p) => p.date.toDate() >= s && p.date.toDate() < e).reduce((sum, p) => sum + p.amount, 0)
      const expenses = sitedPOs.filter((po) => po.date.toDate() >= s && po.date.toDate() < e).reduce((sum, po) => sum + po.grandTotal, 0)
      return { month: label, income: income / 1_000_000, expenses: expenses / 1_000_000, profit: (income - expenses) / 1_000_000 }
    })
  }, [sitedPayments, sitedPOs, now])

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

  const expensesBySite = useMemo(() => {
    const map = new Map<string, number>()
    for (const po of filteredPOs) map.set(po.siteName, (map.get(po.siteName) ?? 0) + po.grandTotal)
    return Array.from(map.entries()).map(([label, value]) => ({ label, value }))
  }, [filteredPOs])

  const vatBySupplier = useMemo(() => {
    const map = new Map<string, { supplierId: string; supplierName: string; vat: number; total: number }>()
    for (const v of filteredVat) {
      const entry = map.get(v.supplierId) ?? { supplierId: v.supplierId, supplierName: v.supplierName, vat: 0, total: 0 }
      entry.vat += v.vatAmount
      entry.total += v.totalAmount
      map.set(v.supplierId, entry)
    }
    return topN(Array.from(map.values()), (r) => r.vat, 5).map((r) => ({
      label: r.supplierName,
      value: r.vat,
      tin: suppliers.find((s) => s.id === r.supplierId)?.tin || '—',
      rate: r.total - r.vat > 0 ? (r.vat / (r.total - r.vat)) * 100 : 0,
    }))
  }, [filteredVat, suppliers])

  const totalSupplierOutstanding = useMemo(() => suppliers.reduce((s, sup) => s + sup.outstandingBalance, 0), [suppliers])
  const topSuppliersOutstanding = useMemo(
    () => topN(suppliers, (s) => s.outstandingBalance, 5).map((s) => ({ label: s.companyName, value: s.outstandingBalance })),
    [suppliers]
  )
  const supplierSummary = useMemo(
    () =>
      suppliers.map((s) => {
        const orders = purchaseOrders.filter((po) => po.supplierId === s.id)
        return { id: s.id, name: s.companyName, orders: orders.length, spend: orders.reduce((sum, po) => sum + po.grandTotal, 0), outstanding: s.outstandingBalance, vatRegistered: s.vatRegistered }
      }),
    [suppliers, purchaseOrders]
  )

  const debtorProjects = useMemo(() => projects.filter((p) => p.outstandingAmount > 0), [projects])
  const totalReceivablesOutstanding = useMemo(() => debtorProjects.reduce((s, p) => s + p.outstandingAmount, 0), [debtorProjects])
  const topDebtors = useMemo(
    () => topN(debtorProjects, (p) => p.outstandingAmount, 5).map((p) => ({ label: p.projectName, value: p.outstandingAmount })),
    [debtorProjects]
  )

  // Aging is measured from each open invoice's own date, since we don't track a
  // separate due date — labeled accordingly in the UI rather than implied as a
  // formal payment-terms due date.
  const debtorAging = useMemo(() => {
    const buckets = [
      { bucket: '0–30 days', min: 0, max: 30, amount: 0 },
      { bucket: '31–60 days', min: 31, max: 60, amount: 0 },
      { bucket: '61–90 days', min: 61, max: 90, amount: 0 },
      { bucket: '90+ days', min: 91, max: Infinity, amount: 0 },
    ]
    for (const doc of invoiceDocs) {
      if (doc.type !== 'invoice' || !doc.invoiceDate) continue
      const outstanding = doc.outstandingAmount ?? doc.invoiceAmount ?? 0
      if (outstanding <= 0) continue
      const age = differenceInCalendarDays(now, doc.invoiceDate.toDate())
      const bucket = buckets.find((b) => age >= b.min && age <= b.max)
      if (bucket) bucket.amount += outstanding
    }
    return buckets.map(({ bucket, amount }) => ({ bucket, amount }))
  }, [invoiceDocs, now])

  const totalBudget = useMemo(() => sites.reduce((s, site) => s + site.budget, 0), [sites])
  const totalSpent = useMemo(() => sites.reduce((s, site) => s + site.spentToDate, 0), [sites])
  const siteBudgetVsSpent = useMemo(() => sites.map((s) => ({ label: s.name, budget: s.budget, spent: s.spentToDate })), [sites])
  const sitePerformance = useMemo(
    () =>
      sites.map((s) => {
        const siteProjects = projects.filter((p) => p.constructionSiteId === s.id)
        const contractValue = siteProjects.reduce((sum, p) => sum + p.contractValue, 0)
        const received = siteProjects.reduce((sum, p) => sum + p.receivedAmount, 0)
        const margin = contractValue > 0 ? ((contractValue - s.spentToDate) / contractValue) * 100 : 0
        const utilization = s.budget > 0 ? Math.min((s.spentToDate / s.budget) * 100, 100) : 0
        return { id: s.id, name: s.name, contractValue, received, spent: s.spentToDate, margin, utilization }
      }),
    [sites, projects]
  )
  const incomeExpenseBySite = useMemo(
    () =>
      sites.map((s) => ({
        label: s.name,
        income: projects.filter((p) => p.constructionSiteId === s.id).reduce((sum, p) => sum + p.receivedAmount, 0),
        expenses: s.spentToDate,
      })),
    [sites, projects]
  )

  // A worker's outstandingBalance can go negative (paid more than they were
  // currently owed) — that's a credit to the worker, not a debt Waterman still
  // owes, so it's floored at 0 here rather than netted into "total outstanding".
  const totalLabourPaid = useMemo(() => sitedLabour.reduce((s, l) => s + l.totalPaidAllTime, 0), [sitedLabour])
  const totalLabourOutstanding = useMemo(() => sitedLabour.reduce((s, l) => s + Math.max(l.outstandingBalance, 0), 0), [sitedLabour])
  const topLabourOutstanding = useMemo(
    () =>
      topN(
        sitedLabour.filter((l) => l.outstandingBalance > 0),
        (l) => l.outstandingBalance,
        5
      ).map((l) => ({ label: l.fullName, value: l.outstandingBalance })),
    [sitedLabour]
  )
  const labourMonthlyPaid = useMemo(() => {
    const sitedWorkerIds = new Set(sitedLabour.map((l) => l.id))
    const relevant = siteId === 'all' ? labourPayments : labourPayments.filter((p) => sitedWorkerIds.has(p.workerId))
    const months = Array.from({ length: 6 }, (_, i) => subMonths(now, 5 - i))
    return months.map((m) => {
      const s = startOfMonth(m)
      const e = startOfMonth(subMonths(m, -1))
      const paid = relevant.filter((p) => p.date.toDate() >= s && p.date.toDate() < e).reduce((sum, p) => sum + p.amount, 0)
      return { month: format(m, 'MMM'), paid }
    })
  }, [labourPayments, sitedLabour, siteId, now])

  return {
    loading:
      loadingPayments || loadingPOs || loadingVat || loadingSuppliers || loadingProjects || loadingSites || loadingLabour || loadingLabourPayments || loadingInvoices,
    filteredPayments,
    filteredPOs,
    filteredVat,
    suppliers,
    debtorProjects,
    sites,
    labour: sitedLabour,
    selectedSite,
    totalIncome,
    totalExpenses,
    netProfit,
    profitMargin,
    totalVat,
    vatSupplierCount,
    trendBadges,
    trend,
    incomeByMethod,
    expensesBySupplier,
    expensesBySite,
    vatBySupplier,
    totalSupplierOutstanding,
    topSuppliersOutstanding,
    supplierSummary,
    totalReceivablesOutstanding,
    topDebtors,
    debtorAging,
    totalBudget,
    totalSpent,
    siteBudgetVsSpent,
    sitePerformance,
    incomeExpenseBySite,
    totalLabourPaid,
    totalLabourOutstanding,
    topLabourOutstanding,
    labourMonthlyPaid,
  }
}
