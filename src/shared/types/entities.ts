import type { Timestamp } from 'firebase/firestore'

/** Common shape for every Firestore document once read back with its id. */
export interface WithId {
  id: string
}

export type PaymentMethod = 'cash' | 'bank_transfer' | 'cheque' | 'card' | 'credit' | 'debit_card' | 'credit_card'

export type ChequeStatus = 'pending' | 'post_dated' | 'cleared' | 'bounced' | 'overdue'

export type ChequeDirection = 'outgoing' | 'incoming'

// --- Company / Users -------------------------------------------------------

export interface Company {
  name: string
  logoURL?: string
  phone: string
  email: string
  tin: string
  defaultVatPercent: number
  address: string
  currency: 'LKR'
}

export interface AppUser {
  displayName: string
  email: string
  role: 'admin' | 'accountant' | 'manager'
  phone?: string
  avatarURL?: string
  active: boolean
  createdAt: Timestamp
}

// --- Reference data ----------------------------------------------------------

export interface Supplier {
  companyName: string
  contactName: string
  phone: string
  email?: string
  address?: string
  tin?: string
  vatRegistered: boolean
  comments?: string
  outstandingBalance: number
  createdAt: Timestamp
}

export interface Product {
  code: string
  name: string
  category: string
  unit: string
  description?: string
  status: 'active' | 'inactive'
}

export type SiteStatus = 'planning' | 'active' | 'completed'

export interface ConstructionSite {
  name: string
  location: string
  client: string
  description?: string
  startDate: Timestamp
  endDate: Timestamp
  budget: number
  spentToDate: number
  status: SiteStatus
}

// --- Quotations / Business Pipeline ------------------------------------------

export type QuotationStatus = 'draft' | 'submitted' | 'approved' | 'rejected'

export interface WorkItem {
  description: string
  unit: string
  qty: number
  unitPrice: number
  total: number
}

export interface Milestone {
  label: string
  percent: number
  dueDate: Timestamp | null
  amount: number
}

export type QuotationDocumentType = 'boq' | 'clientPO' | 'siteSurvey' | 'other'

export interface QuotationDocument {
  type: QuotationDocumentType
  fileName: string
  downloadURL: string
  uploadedBy: string
  uploadedAt: Timestamp
}

export interface QuotationCustomer {
  companyName: string
  contactName?: string
  phone?: string
  email?: string
  address?: string
}

export interface QuotationPricing {
  vatEnabled: boolean
  vatPercent: number
  subtotal: number
  vatAmount: number
  advancePercent: number
  advanceRequired: number
  grandTotal: number
}

export interface Quotation {
  quotationNumber: string
  projectName: string
  category?: string
  constructionSiteId?: string
  validUntil: Timestamp
  notes?: string
  status: QuotationStatus
  customer: QuotationCustomer
  workItems: WorkItem[]
  pricing: QuotationPricing
  milestones: Milestone[]
  documents: QuotationDocument[]
  createdBy: string
  createdAt: Timestamp
  updatedAt: Timestamp
}

export type PipelineStage =
  | 'draft'
  | 'submitted'
  | 'approved'
  | 'po_received'
  | 'advance_received'
  | 'active'
  | 'invoiced'
  | 'done'

export const PIPELINE_STAGES: { key: PipelineStage; label: string }[] = [
  { key: 'draft', label: 'Draft' },
  { key: 'submitted', label: 'Submitted' },
  { key: 'approved', label: 'Approved' },
  { key: 'po_received', label: 'PO' },
  { key: 'advance_received', label: 'Advance' },
  { key: 'active', label: 'Active' },
  { key: 'invoiced', label: 'Invoiced' },
  { key: 'done', label: 'Done' },
]

export type ProjectStatus = 'active' | 'completed'

export interface Project {
  quotationId: string
  quotationNumber: string
  projectName: string
  poNumber?: string
  constructionSiteId?: string
  customer: QuotationCustomer
  engineer?: string
  contractValue: number
  advanceRequiredAmount: number
  vatPercent: number
  pipelineStage: PipelineStage
  receivedAmount: number
  outstandingAmount: number
  overdueAmount: number
  status: ProjectStatus
  closedAt?: Timestamp | null
  createdAt: Timestamp
  updatedAt: Timestamp
}

// --- Project payments / documents / receipts / timeline ----------------------

export type PaymentStatus = 'completed' | 'pending_clearance' | 'overdue'

export interface PaymentAttachment {
  type: 'invoice' | 'customerPO' | 'bankSlip' | 'chequeImage' | 'receipt' | 'other'
  downloadURL: string
  fileName: string
  uploadedBy: string
  uploadedDate: Timestamp
}

export interface ProjectPayment {
  projectId: string
  projectName?: string
  customerName?: string
  siteName?: string
  date: Timestamp
  amount: number
  paymentType: PaymentMethod
  cashReceivedBy?: string
  bankAccountId?: string
  referenceNumber?: string
  chequeId?: string
  receivedBy: string
  status: PaymentStatus
  expectedDate?: Timestamp | null
  attachments: PaymentAttachment[]
  createdAt: Timestamp
}

export type ProjectDocumentType = 'customerPO' | 'quotation' | 'invoice' | 'bankSlip' | 'receipt' | 'drawing' | 'other'

export interface ProjectDocument {
  projectId: string
  type: ProjectDocumentType
  fileName: string
  downloadURL: string
  uploadedBy: string
  uploadedAt: Timestamp
  comments?: string
  invoiceNumber?: string
  invoiceDate?: Timestamp
  invoiceAmount?: number
}

export interface Receipt {
  receiptNo: string
  projectId: string
  paymentId: string
  customerName: string
  projectName: string
  invoiceRef?: string
  amount: number
  method: PaymentMethod
  reference?: string
  date: Timestamp
  companySnapshot: Pick<Company, 'name' | 'tin' | 'address'>
  createdAt: Timestamp
}

export type TimelineEventType =
  | 'quotation_created'
  | 'submitted'
  | 'approved'
  | 'rejected'
  | 'po_uploaded'
  | 'advance_received'
  | 'receipt_generated'
  | 'invoice_uploaded'
  | 'progress_payment'
  | 'final_payment'
  | 'project_closed'

export interface TimelineEvent {
  projectId: string
  type: TimelineEventType
  actorUid: string
  actorName: string
  timestamp: Timestamp
  meta?: Record<string, string | number>
}

// --- Purchase Orders ---------------------------------------------------------

export type PurchaseOrderStatus = 'draft' | 'pending' | 'approved' | 'paid'

export interface PurchaseOrderLineItem {
  code?: string
  product: string
  comment?: string
  qty: number
  unitPrice: number
  total: number
}

export interface PurchaseOrder {
  poNumber: string
  supplierId: string
  supplierName: string
  constructionSiteId: string
  siteName: string
  lineItems: PurchaseOrderLineItem[]
  vatEnabled: boolean
  vatPercent: number
  subtotal: number
  grandTotal: number
  paymentMethod: PaymentMethod
  status: PurchaseOrderStatus
  date: Timestamp
  createdBy: string
}

// --- Bank ----------------------------------------------------------------------

export interface BankAccount {
  bankName: string
  accountNumber: string
  branch?: string
  openingBalance: number
  currentBalance: number
  description?: string
  status: 'active' | 'inactive'
}

export type BankTransactionSource = 'project_payment' | 'po_payment' | 'cheque_clearance' | 'labour_payment' | 'manual_adjustment'

export interface BankTransaction {
  bankAccountId: string
  type: 'credit' | 'debit'
  amount: number
  source: BankTransactionSource
  sourceRef?: string
  date: Timestamp
  balanceAfter: number
  createdBy: string
}

// --- Labour ----------------------------------------------------------------------

export interface Labour {
  fullName: string
  phone?: string
  role: string
  constructionSiteId?: string
  siteName?: string
  outstandingBalance: number
  totalPaidAllTime: number
}

export interface LabourPayment {
  workerId: string
  amount: number
  date: Timestamp
  constructionSiteId?: string
  notes?: string
  createdBy: string
}

// --- Cheques ---------------------------------------------------------------------

export type ChequeSourceType = 'purchase_order' | 'project_payment'

export interface Cheque {
  direction: ChequeDirection
  sourceType: ChequeSourceType
  sourceRef: string
  party: string
  bank: string
  bankAccountId?: string
  chequeNumber: string
  chequeDate: Timestamp
  dueDate: Timestamp
  amount: number
  reference?: string
  status: ChequeStatus
  clearedDate?: Timestamp | null
  updatedBy: string
  createdAt: Timestamp
}

// --- VAT -------------------------------------------------------------------------

export interface VatInvoice {
  supplierId: string
  supplierName: string
  invoiceNumber: string
  invoiceDate: Timestamp
  vatAmount: number
  totalAmount: number
  poId?: string
  downloadURL?: string
}

// --- Notifications -----------------------------------------------------------------

export type NotificationType = 'cheque_due' | 'credit_due' | 'receivable' | 'overdue'

export interface AppNotification {
  type: NotificationType
  title: string
  description: string
  amount: number
  refType?: string
  refId?: string
  read: boolean
  createdAt: Timestamp
  actionType?: 'Paid' | 'Received' | 'None'
}

// --- Counters ------------------------------------------------------------------------

export interface Counter {
  value: number
}
