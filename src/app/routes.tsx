import { Routes, Route, Navigate } from 'react-router'
import { AppLayout } from './AppLayout'
import { ProtectedRoute } from './ProtectedRoute'
import { RequireModule } from './RequireModule'
import { LoginPage } from '@/features/auth/LoginPage'
import { SettingsPage } from '@/features/settings/SettingsPage'
import { DashboardPage } from '@/features/dashboard/DashboardPage'
import { ProductsPage } from '@/features/products/ProductsPage'
import { SuppliersPage } from '@/features/suppliers/SuppliersPage'
import { ConstructionSitesPage } from '@/features/construction-sites/ConstructionSitesPage'
import { BankAccountsPage } from '@/features/bank-accounts/BankAccountsPage'
import { PipelineRoutes } from '@/features/pipeline/PipelineRoutes'
import { PurchaseOrdersPage } from '@/features/purchase-orders/PurchaseOrdersPage'
import { OutstandingRoutes } from '@/features/outstanding/OutstandingRoutes'
import { IncomePage } from '@/features/income/IncomePage'
import { LabourPage } from '@/features/labour/LabourPage'
import { ChequeManagementPage } from '@/features/cheques/ChequeManagementPage'
import { VatSuppliersPage } from '@/features/vat-suppliers/VatSuppliersPage'
import { DebtorsPage } from '@/features/debtors/DebtorsPage'
import { NotificationsPage } from '@/features/notifications/NotificationsPage'
import { ReportsPage } from '@/features/reports/ReportsPage'

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
        <Route
          path="/dashboard"
          element={
            <RequireModule moduleKey="dashboard">
              <DashboardPage />
            </RequireModule>
          }
        />
        <Route
          path="/business-pipeline/*"
          element={
            <RequireModule moduleKey="businessPipeline">
              <PipelineRoutes />
            </RequireModule>
          }
        />
        <Route
          path="/purchase-orders"
          element={
            <RequireModule moduleKey="purchaseOrders">
              <PurchaseOrdersPage />
            </RequireModule>
          }
        />
        <Route
          path="/suppliers"
          element={
            <RequireModule moduleKey="supplierManagement">
              <SuppliersPage />
            </RequireModule>
          }
        />
        <Route
          path="/products"
          element={
            <RequireModule moduleKey="products">
              <ProductsPage />
            </RequireModule>
          }
        />
        <Route
          path="/construction-sites"
          element={
            <RequireModule moduleKey="constructionSites">
              <ConstructionSitesPage />
            </RequireModule>
          }
        />
        <Route
          path="/income"
          element={
            <RequireModule moduleKey="income">
              <IncomePage />
            </RequireModule>
          }
        />
        <Route
          path="/bank-accounts"
          element={
            <RequireModule moduleKey="bankAccounts">
              <BankAccountsPage />
            </RequireModule>
          }
        />
        <Route
          path="/labour"
          element={
            <RequireModule moduleKey="labourManagement">
              <LabourPage />
            </RequireModule>
          }
        />
        <Route
          path="/outstanding/*"
          element={
            <RequireModule moduleKey="outstanding">
              <OutstandingRoutes />
            </RequireModule>
          }
        />
        <Route
          path="/debtors"
          element={
            <RequireModule moduleKey="debtors">
              <DebtorsPage />
            </RequireModule>
          }
        />
        <Route
          path="/cheques"
          element={
            <RequireModule moduleKey="chequeManagement">
              <ChequeManagementPage />
            </RequireModule>
          }
        />
        <Route
          path="/vat-suppliers"
          element={
            <RequireModule moduleKey="vatSuppliers">
              <VatSuppliersPage />
            </RequireModule>
          }
        />
        <Route
          path="/notifications"
          element={
            <RequireModule moduleKey="notifications">
              <NotificationsPage />
            </RequireModule>
          }
        />
        <Route
          path="/reports"
          element={
            <RequireModule moduleKey="reports">
              <ReportsPage />
            </RequireModule>
          }
        />
        <Route
          path="/settings/*"
          element={
            <RequireModule moduleKey="settings">
              <SettingsPage />
            </RequireModule>
          }
        />

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Route>
    </Routes>
  )
}
