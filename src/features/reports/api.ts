import type { Timestamp } from 'firebase/firestore'
import { startOfMonth, subMonths } from 'date-fns'
import type { ProjectPayment, PurchaseOrder, VatInvoice } from '@/shared/types/entities'
import { formatDate } from '@/shared/lib/dates'

export type ReportRange = 'thisMonth' | 'last3Months' | 'allTime'

export const REPORT_RANGES: { key: ReportRange; label: string }[] = [
  { key: 'thisMonth', label: 'This Month' },
  { key: 'last3Months', label: 'Last 3 Months' },
  { key: 'allTime', label: 'All Time' },
]

export function rangeStart(range: ReportRange, now: Date): Date | null {
  if (range === 'thisMonth') return startOfMonth(now)
  if (range === 'last3Months') return startOfMonth(subMonths(now, 2))
  return null
}

export function inRange(date: Timestamp, start: Date | null): boolean {
  return start === null || date.toDate() >= start
}

/** Rows for the Financial Summary download — one row per calendar month present in the data. */
export function buildFinancialSummaryRows(payments: ProjectPayment[], purchaseOrders: PurchaseOrder[]) {
  const map = new Map<string, { month: string; income: number; expenses: number }>()
  for (const p of payments) {
    if (p.status !== 'completed') continue
    const key = formatDate(p.date, 'yyyy-MM')
    const entry = map.get(key) ?? { month: key, income: 0, expenses: 0 }
    entry.income += p.amount
    map.set(key, entry)
  }
  for (const po of purchaseOrders) {
    const key = formatDate(po.date, 'yyyy-MM')
    const entry = map.get(key) ?? { month: key, income: 0, expenses: 0 }
    entry.expenses += po.grandTotal
    map.set(key, entry)
  }
  return Array.from(map.values())
    .sort((a, b) => a.month.localeCompare(b.month))
    .map((r) => ({ Month: r.month, Income: r.income, Expenses: r.expenses, 'Net Profit': r.income - r.expenses }))
}

export function buildIncomeStatementRows(payments: ProjectPayment[]) {
  return payments
    .filter((p) => p.status === 'completed')
    .map((p) => ({
      Date: formatDate(p.date),
      Customer: p.customerName ?? 'Unknown',
      Site: p.siteName ?? '',
      Amount: p.amount,
      Method: p.paymentType.replace(/_/g, ' '),
    }))
}

export function buildExpenseStatementRows(purchaseOrders: PurchaseOrder[]) {
  return purchaseOrders.map((po) => ({
    Date: formatDate(po.date),
    'PO Number': po.poNumber,
    Supplier: po.supplierName,
    Site: po.siteName,
    Amount: po.grandTotal,
    Status: po.status,
  }))
}

export function buildVatReportRows(invoices: VatInvoice[]) {
  return invoices.map((inv) => ({
    Date: formatDate(inv.invoiceDate),
    Supplier: inv.supplierName,
    'Invoice Number': inv.invoiceNumber,
    'VAT Amount': inv.vatAmount,
    'Total Amount': inv.totalAmount,
  }))
}

/** Shared by every export button: derive PDF table headers/rows from the same record shape used for Excel. */
export function toPdfTable(rows: Record<string, string | number>[]): { headers: string[]; body: (string | number)[][] } {
  const headers = rows.length > 0 ? Object.keys(rows[0]) : []
  return { headers, body: rows.map((r) => headers.map((h) => r[h])) }
}
