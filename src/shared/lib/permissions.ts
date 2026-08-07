export type Role = 'admin' | 'accountant' | 'manager'

export type ModuleKey =
  | 'dashboard'
  | 'businessPipeline'
  | 'purchaseOrders'
  | 'supplierManagement'
  | 'products'
  | 'constructionSites'
  | 'income'
  | 'bankAccounts'
  | 'labourManagement'
  | 'outstanding'
  | 'debtors'
  | 'chequeManagement'
  | 'vatSuppliers'
  | 'notifications'
  | 'reports'
  | 'settings'

export type AccessLevel = 'none' | 'view' | 'edit'

/**
 * Single source of truth for the Settings > Permissions role matrix.
 * Mirrored (by hand, since Firestore rules can't import TS) in firestore.rules —
 * keep the two in sync when this changes.
 */
const PERMISSION_MATRIX: Record<Role, Record<ModuleKey, AccessLevel>> = {
  admin: {
    dashboard: 'edit',
    businessPipeline: 'edit',
    purchaseOrders: 'edit',
    supplierManagement: 'edit',
    products: 'edit',
    constructionSites: 'edit',
    income: 'edit',
    bankAccounts: 'edit',
    labourManagement: 'edit',
    outstanding: 'edit',
    debtors: 'edit',
    chequeManagement: 'edit',
    vatSuppliers: 'edit',
    notifications: 'edit',
    reports: 'edit',
    settings: 'edit',
  },
  accountant: {
    dashboard: 'view',
    businessPipeline: 'edit',
    purchaseOrders: 'edit',
    supplierManagement: 'edit',
    products: 'edit',
    constructionSites: 'view',
    income: 'edit',
    bankAccounts: 'edit',
    labourManagement: 'view',
    outstanding: 'edit',
    debtors: 'edit',
    chequeManagement: 'edit',
    vatSuppliers: 'edit',
    notifications: 'view',
    reports: 'view',
    settings: 'none',
  },
  manager: {
    dashboard: 'view',
    businessPipeline: 'none',
    purchaseOrders: 'view',
    supplierManagement: 'none',
    products: 'view',
    constructionSites: 'edit',
    income: 'none',
    bankAccounts: 'none',
    labourManagement: 'edit',
    outstanding: 'none',
    debtors: 'none',
    chequeManagement: 'none',
    vatSuppliers: 'none',
    notifications: 'view',
    reports: 'view',
    settings: 'none',
  },
}

export const ROLE_LABELS: Record<Role, string> = {
  admin: 'Admin',
  accountant: 'Accountant',
  manager: 'Manager',
}

export function accessLevel(role: Role, moduleKey: ModuleKey): AccessLevel {
  return PERMISSION_MATRIX[role][moduleKey]
}

export function canView(role: Role, moduleKey: ModuleKey): boolean {
  return accessLevel(role, moduleKey) !== 'none'
}

export function canEdit(role: Role, moduleKey: ModuleKey): boolean {
  return accessLevel(role, moduleKey) === 'edit'
}

export function isAdmin(role: Role): boolean {
  return role === 'admin'
}

export function visibleModules(role: Role): ModuleKey[] {
  return (Object.keys(PERMISSION_MATRIX[role]) as ModuleKey[]).filter((key) => canView(role, key))
}

export { PERMISSION_MATRIX }
