import { Routes, Route, Navigate } from 'react-router'
import { AppLayout } from './AppLayout'
import { ProtectedRoute } from './ProtectedRoute'
import { RequireModule } from './RequireModule'
import { LoginPage } from '@/features/auth/LoginPage'
import { ComingSoon } from '@/shared/components'
import type { ModuleKey } from '@/shared/lib/permissions'

function Placeholder({ title, moduleKey }: { title: string; moduleKey: ModuleKey }) {
  return (
    <RequireModule moduleKey={moduleKey}>
      <ComingSoon title={title} />
    </RequireModule>
  )
}

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Placeholder title="Dashboard" moduleKey="dashboard" />} />
        <Route path="/business-pipeline/*" element={<Placeholder title="Business Pipeline & Quotations" moduleKey="businessPipeline" />} />
        <Route path="/purchase-orders" element={<Placeholder title="Purchase Orders" moduleKey="purchaseOrders" />} />
        <Route path="/suppliers" element={<Placeholder title="Supplier Management" moduleKey="supplierManagement" />} />
        <Route path="/products" element={<Placeholder title="Products" moduleKey="products" />} />
        <Route path="/construction-sites" element={<Placeholder title="Construction Sites" moduleKey="constructionSites" />} />
        <Route path="/income" element={<Placeholder title="Income" moduleKey="income" />} />
        <Route path="/bank-accounts" element={<Placeholder title="Bank Accounts" moduleKey="bankAccounts" />} />
        <Route path="/labour" element={<Placeholder title="Labour Management" moduleKey="labourManagement" />} />
        <Route path="/outstanding/*" element={<Placeholder title="Outstanding" moduleKey="outstanding" />} />
        <Route path="/debtors" element={<Placeholder title="Debtors" moduleKey="debtors" />} />
        <Route path="/cheques" element={<Placeholder title="Cheque Management" moduleKey="chequeManagement" />} />
        <Route path="/vat-suppliers" element={<Placeholder title="VAT Suppliers" moduleKey="vatSuppliers" />} />
        <Route path="/notifications" element={<Placeholder title="Notifications" moduleKey="notifications" />} />
        <Route path="/reports" element={<Placeholder title="Reports & Analytics" moduleKey="reports" />} />
        <Route path="/settings/*" element={<Placeholder title="Settings" moduleKey="settings" />} />

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Route>
    </Routes>
  )
}
