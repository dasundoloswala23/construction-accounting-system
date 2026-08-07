import {
  LayoutDashboard,
  Briefcase,
  ShoppingCart,
  Users,
  Package,
  Building2,
  TrendingUp,
  Landmark,
  HardHat,
  AlertCircle,
  UserCheck,
  Banknote,
  FileText,
  Bell,
  BarChart3,
  Settings,
  type LucideIcon,
} from 'lucide-react'
import type { ModuleKey } from '@/shared/lib/permissions'

export interface NavItem {
  key: ModuleKey
  label: string
  path: string
  icon: LucideIcon
}

export const NAV_ITEMS: NavItem[] = [
  { key: 'dashboard', label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { key: 'businessPipeline', label: 'Business Pipeline', path: '/business-pipeline', icon: Briefcase },
  { key: 'purchaseOrders', label: 'Purchase Orders', path: '/purchase-orders', icon: ShoppingCart },
  { key: 'supplierManagement', label: 'Supplier Management', path: '/suppliers', icon: Users },
  { key: 'products', label: 'Products', path: '/products', icon: Package },
  { key: 'constructionSites', label: 'Construction Sites', path: '/construction-sites', icon: Building2 },
  { key: 'income', label: 'Income', path: '/income', icon: TrendingUp },
  { key: 'bankAccounts', label: 'Bank Accounts', path: '/bank-accounts', icon: Landmark },
  { key: 'labourManagement', label: 'Labour Management', path: '/labour', icon: HardHat },
  { key: 'outstanding', label: 'Outstanding', path: '/outstanding', icon: AlertCircle },
  { key: 'debtors', label: 'Debtors', path: '/debtors', icon: UserCheck },
  { key: 'chequeManagement', label: 'Cheque Management', path: '/cheques', icon: Banknote },
  { key: 'vatSuppliers', label: 'VAT Suppliers', path: '/vat-suppliers', icon: FileText },
  { key: 'notifications', label: 'Notifications', path: '/notifications', icon: Bell },
  { key: 'reports', label: 'Reports', path: '/reports', icon: BarChart3 },
  { key: 'settings', label: 'Settings', path: '/settings', icon: Settings },
]
