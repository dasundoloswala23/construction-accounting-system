// Placeholder data so the Dashboard layout/components can be built and reviewed
// before every source collection (income, expenses, POs, etc.) exists. Replaced
// with real aggregate queries in the "Dashboard real wiring" pass once Purchase
// Orders, Outstanding, Bank Accounts and Cheques are all live.

export const mockIncomeExpenseTrend = [
  { month: 'Jan', income: 4.8, expenses: 3.6 },
  { month: 'Feb', income: 5.1, expenses: 3.7 },
  { month: 'Mar', income: 5.6, expenses: 3.9 },
  { month: 'Apr', income: 6.3, expenses: 4.0 },
  { month: 'May', income: 6.9, expenses: 4.1 },
  { month: 'Jun', income: 6.7, expenses: 3.95 },
  { month: 'Jul', income: 7.2, expenses: 4.05 },
  { month: 'Aug', income: 6.5, expenses: 3.9 },
]

export const mockPurchaseOrdersPerMonth = [
  { month: 'Apr', orders: 31 },
  { month: 'May', orders: 38 },
  { month: 'Jun', orders: 24 },
  { month: 'Jul', orders: 52 },
  { month: 'Aug', orders: 47 },
]

export const mockRecentPurchaseOrders = [
  { poNo: 'PO-2026-0891', supplier: 'ABC Steel Pvt Ltd', site: 'Colombo Tower', amount: 485000, status: 'Pending' },
  { poNo: 'PO-2026-0890', supplier: 'Lanka Cement Co', site: 'Galle Highway', amount: 312000, status: 'Approved' },
  { poNo: 'PO-2026-0889', supplier: 'Buildmart Supplies', site: 'Kandy Residences', amount: 178000, status: 'Paid' },
  { poNo: 'PO-2026-0888', supplier: 'Pro Hardware Ltd', site: 'Colombo Tower', amount: 92000, status: 'Approved' },
]

export const mockRecentIncome = [
  { customer: 'Sharma Holdings', site: 'Colombo Tower', amount: 2500000, method: 'Bank Transfer', date: '2026-08-04' },
  { customer: 'Perera Properties', site: 'Galle Highway', amount: 1800000, method: 'Cheque', date: '2026-08-03' },
  { customer: 'Lakshmi Builders', site: 'Kandy Residences', amount: 950000, method: 'Cash', date: '2026-08-01' },
]

export const mockUpcomingCheques = [
  { party: 'ABC Steel Pvt Ltd', bank: 'BOC', amount: 485000, date: '2026-08-08' },
  { party: 'Lanka Cement Co', bank: 'HNB', amount: 312000, date: '2026-08-10' },
  { party: 'ProBuild Concrete', bank: 'Sampath', amount: 220000, date: '2026-08-15' },
]

export const mockAlerts = [
  { type: 'warning' as const, text: '3 cheques due tomorrow' },
  { type: 'danger' as const, text: '2 overdue supplier payments' },
  { type: 'success' as const, text: 'Income received from Sharma Holdings' },
  { type: 'info' as const, text: 'Labour payment due: Kamal Silva — LKR 45,000' },
]
