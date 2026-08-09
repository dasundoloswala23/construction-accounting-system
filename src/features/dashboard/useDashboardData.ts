import { useMemo } from 'react'
import { format, isToday, startOfMonth, subMonths } from 'date-fns'
import { useCollection } from '@/shared/hooks/useCollection'
import type {
  ProjectPayment,
  PurchaseOrder,
  BankAccount,
  Supplier,
  Project,
  ConstructionSite,
  Cheque,
} from '@/shared/types/entities'

/** Real aggregates for the Dashboard, replacing the mock data used while the
 * shared component patterns (KpiTile/chart) were being built. Client-side
 * aggregation is fine at this data scale; revisit with denormalized rollups
 * if the collections grow large enough for this to matter. */
export function useDashboardData() {
  const { data: payments, loading: loadingPayments } = useCollection<ProjectPayment>('project_payments', [])
  const { data: purchaseOrders, loading: loadingPOs } = useCollection<PurchaseOrder>('purchase_orders', [])
  const { data: bankAccounts } = useCollection<BankAccount>('bank_accounts', [])
  const { data: suppliers } = useCollection<Supplier>('suppliers', [])
  const { data: projects } = useCollection<Project>('projects', [])
  const { data: sites } = useCollection<ConstructionSite>('construction_sites', [])
  const { data: cheques } = useCollection<Cheque>('cheques', [])

  // Stable for the component's lifetime — this is a dashboard snapshot, not a
  // live clock, so it doesn't need to track the actual current millisecond.
  const now = useMemo(() => new Date(), [])
  const monthStart = useMemo(() => startOfMonth(now), [now])

  const monthlyIncome = useMemo(
    () => payments.filter((p) => p.status === 'completed' && p.date.toDate() >= monthStart).reduce((s, p) => s + p.amount, 0),
    [payments, monthStart]
  )
  const monthlyExpenses = useMemo(
    () => purchaseOrders.filter((po) => po.date.toDate() >= monthStart).reduce((s, po) => s + po.grandTotal, 0),
    [purchaseOrders, monthStart]
  )
  const bankBalance = useMemo(() => bankAccounts.reduce((s, b) => s + b.currentBalance, 0), [bankAccounts])
  const outstandingPayables = useMemo(() => suppliers.reduce((s, sup) => s + sup.outstandingBalance, 0), [suppliers])
  const outstandingReceivables = useMemo(() => projects.reduce((s, p) => s + p.outstandingAmount, 0), [projects])
  const activeSites = useMemo(() => sites.filter((s) => s.status === 'active').length, [sites])

  const trend = useMemo(() => {
    const months = Array.from({ length: 8 }, (_, i) => subMonths(now, 7 - i))
    return months.map((m) => {
      const label = format(m, 'MMM')
      const start = startOfMonth(m)
      const end = startOfMonth(subMonths(m, -1))
      const income = payments
        .filter((p) => p.status === 'completed' && p.date.toDate() >= start && p.date.toDate() < end)
        .reduce((s, p) => s + p.amount, 0)
      const expenses = purchaseOrders.filter((po) => po.date.toDate() >= start && po.date.toDate() < end).reduce((s, po) => s + po.grandTotal, 0)
      return { month: label, income: income / 1_000_000, expenses: expenses / 1_000_000 }
    })
  }, [payments, purchaseOrders, now])

  const poPerMonth = useMemo(() => {
    const months = Array.from({ length: 5 }, (_, i) => subMonths(now, 4 - i))
    return months.map((m) => {
      const label = format(m, 'MMM')
      const start = startOfMonth(m)
      const end = startOfMonth(subMonths(m, -1))
      const orders = purchaseOrders.filter((po) => po.date.toDate() >= start && po.date.toDate() < end).length
      return { month: label, orders }
    })
  }, [purchaseOrders, now])

  const recentPurchaseOrders = useMemo(
    () =>
      [...purchaseOrders]
        .sort((a, b) => b.date.toMillis() - a.date.toMillis())
        .slice(0, 4)
        .map((po) => ({ poNo: po.poNumber, supplier: po.supplierName, site: po.siteName, amount: po.grandTotal, status: po.status })),
    [purchaseOrders]
  )

  const recentIncome = useMemo(
    () =>
      [...payments]
        .filter((p) => p.status === 'completed')
        .sort((a, b) => b.date.toMillis() - a.date.toMillis())
        .slice(0, 3)
        .map((p) => ({
          customer: p.customerName ?? 'Unknown',
          site: p.siteName ?? '',
          amount: p.amount,
          method: p.paymentType.replace(/_/g, ' '),
          date: format(p.date.toDate(), 'yyyy-MM-dd'),
        })),
    [payments]
  )

  const upcomingCheques = useMemo(
    () =>
      [...cheques]
        .filter((c) => ['pending', 'post_dated'].includes(c.status))
        .sort((a, b) => a.dueDate.toMillis() - b.dueDate.toMillis())
        .slice(0, 5)
        .map((c) => ({ party: c.party, bank: c.bank, amount: c.amount, date: format(c.dueDate.toDate(), 'yyyy-MM-dd') })),
    [cheques]
  )

  const alerts = useMemo(() => {
    const list: { type: 'warning' | 'danger' | 'success' | 'info'; text: string }[] = []
    const dueTomorrow = cheques.filter((c) => {
      const days = Math.round((c.dueDate.toDate().getTime() - now.getTime()) / 86_400_000)
      return ['pending', 'post_dated'].includes(c.status) && days >= 0 && days <= 1
    })
    if (dueTomorrow.length > 0) list.push({ type: 'warning', text: `${dueTomorrow.length} cheque${dueTomorrow.length > 1 ? 's' : ''} due soon` })

    const bounced = cheques.filter((c) => c.status === 'bounced')
    if (bounced.length > 0) list.push({ type: 'danger', text: `${bounced.length} bounced cheque${bounced.length > 1 ? 's' : ''} need attention` })

    const lastIncome = [...payments].filter((p) => p.status === 'completed').sort((a, b) => b.date.toMillis() - a.date.toMillis())[0]
    if (lastIncome) list.push({ type: 'success', text: `Income received from ${lastIncome.customerName ?? 'a customer'}` })

    if (list.length === 0) list.push({ type: 'info', text: 'No alerts right now — everything looks up to date.' })
    return list
  }, [cheques, payments, now])

  const todaysReceivables = useMemo(
    () => payments.filter((p) => p.status === 'completed' && isToday(p.date.toDate())).reduce((s, p) => s + p.amount, 0),
    [payments]
  )
  const todaysReceivablesCount = payments.filter((p) => p.status === 'completed' && isToday(p.date.toDate())).length
  const todaysPayments = useMemo(
    () => cheques.filter((c) => c.direction === 'outgoing' && c.status === 'cleared' && c.clearedDate && isToday(c.clearedDate.toDate())).reduce((s, c) => s + c.amount, 0),
    [cheques]
  )
  const todaysPaymentsCount = cheques.filter((c) => c.direction === 'outgoing' && c.status === 'cleared' && c.clearedDate && isToday(c.clearedDate.toDate())).length
  const overduePayments = useMemo(() => cheques.filter((c) => c.status === 'overdue' || c.status === 'bounced').reduce((s, c) => s + c.amount, 0), [cheques])
  const overduePaymentsCount = cheques.filter((c) => c.status === 'overdue' || c.status === 'bounced').length

  return {
    todaysReceivables,
    todaysReceivablesCount,
    todaysPayments,
    todaysPaymentsCount,
    overduePayments,
    overduePaymentsCount,
    loading: loadingPayments || loadingPOs,
    monthlyIncome,
    monthlyExpenses,
    bankBalance,
    outstandingPayables,
    outstandingReceivables,
    purchaseOrdersCount: purchaseOrders.length,
    purchaseOrdersThisMonth: purchaseOrders.filter((po) => po.date.toDate() >= monthStart).length,
    totalSuppliers: suppliers.length,
    activeSites,
    totalSites: sites.length,
    trend,
    poPerMonth,
    recentPurchaseOrders,
    recentIncome,
    upcomingCheques,
    alerts,
  }
}
