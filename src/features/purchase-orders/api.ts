import { collection, deleteDoc, doc, updateDoc, writeBatch, Timestamp } from 'firebase/firestore'
import { db } from '@/shared/lib/firebase'
import { nextFormattedNumber } from '@/shared/lib/sequence'
import type { PurchaseOrderLineItem, PurchaseOrderStatus, PaymentMethod } from '@/shared/types/entities'

export interface POFormInput {
  supplierId: string
  supplierName: string
  constructionSiteId: string
  siteName: string
  lineItems: PurchaseOrderLineItem[]
  vatEnabled: boolean
  vatPercent: number
  paymentMethod: PaymentMethod
  date: string
  chequeNumber?: string
  chequeDate?: string
  chequeDueDate?: string
  chequeBankAccountId?: string
  chequeBankName?: string
}

function computeTotals(lineItems: PurchaseOrderLineItem[], vatEnabled: boolean, vatPercent: number) {
  const subtotal = lineItems.reduce((sum, item) => sum + item.qty * item.unitPrice, 0)
  const grandTotal = vatEnabled ? subtotal * (1 + vatPercent / 100) : subtotal
  return { subtotal, grandTotal }
}

export async function createPurchaseOrder(input: POFormInput, createdBy: string, status: PurchaseOrderStatus = 'pending') {
  const lineItems = input.lineItems.map((li) => ({ ...li, total: li.qty * li.unitPrice }))
  const { subtotal, grandTotal } = computeTotals(lineItems, input.vatEnabled, input.vatPercent)
  const poNumber = await nextFormattedNumber('purchase_order', 'PO')

  const batch = writeBatch(db)
  const poRef = doc(collection(db, 'purchase_orders'))
  batch.set(poRef, {
    poNumber,
    supplierId: input.supplierId,
    supplierName: input.supplierName,
    constructionSiteId: input.constructionSiteId,
    siteName: input.siteName,
    lineItems,
    vatEnabled: input.vatEnabled,
    vatPercent: input.vatPercent,
    subtotal,
    grandTotal,
    paymentMethod: input.paymentMethod,
    status,
    date: Timestamp.fromDate(new Date(input.date)),
    createdBy,
  })

  if (input.vatEnabled) {
    const vatInvoiceRef = doc(collection(db, 'vat_invoices'))
    batch.set(vatInvoiceRef, {
      supplierId: input.supplierId,
      supplierName: input.supplierName,
      invoiceNumber: poNumber,
      invoiceDate: Timestamp.fromDate(new Date(input.date)),
      vatAmount: grandTotal - subtotal,
      totalAmount: grandTotal,
      poId: poRef.id,
    })
  }

  if (input.paymentMethod === 'cheque' && input.chequeNumber) {
    const chequeRef = doc(collection(db, 'cheques'))
    batch.set(chequeRef, {
      direction: 'outgoing',
      sourceType: 'purchase_order',
      sourceRef: poRef.id,
      party: input.supplierName,
      bank: input.chequeBankName ?? '',
      bankAccountId: input.chequeBankAccountId ?? '',
      chequeNumber: input.chequeNumber,
      chequeDate: Timestamp.fromDate(new Date(input.chequeDate || input.date)),
      dueDate: Timestamp.fromDate(new Date(input.chequeDueDate || input.date)),
      amount: grandTotal,
      reference: poNumber,
      status: 'pending',
      updatedBy: createdBy,
      createdAt: Timestamp.now(),
    })
  }

  await batch.commit()
  return poRef.id
}

export function updatePurchaseOrderStatus(id: string, status: PurchaseOrderStatus) {
  return updateDoc(doc(db, 'purchase_orders', id), { status })
}

export function deletePurchaseOrder(id: string) {
  return deleteDoc(doc(db, 'purchase_orders', id))
}
