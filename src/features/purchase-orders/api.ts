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
  vatOverridden?: boolean
  vatOverrideReason?: string
  paymentMethod: PaymentMethod
  /** Which account paid it, when paymentMethod is bank_transfer. */
  bankAccountId?: string
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

export async function createPurchaseOrder(input: POFormInput, createdBy: string, status?: PurchaseOrderStatus) {
  const lineItems = input.lineItems.map((li) => ({ ...li, total: li.qty * li.unitPrice }))
  const { subtotal, grandTotal } = computeTotals(lineItems, input.vatEnabled, input.vatPercent)
  const poNumber = await nextFormattedNumber('purchase_order', 'PO')

  // Cash and bank transfers settle in this same batch (the debit rows below), so
  // the PO is already paid the moment it is created. Leaving it 'pending' would
  // make onPurchaseOrderWrite add it to the supplier's payables as well — money
  // out of the account *and* still shown as owed. Cheques stay pending until
  // onChequeStatusChange clears them; credit stays pending because it really is.
  const settledOnCreate =
    input.paymentMethod === 'cash' || (input.paymentMethod === 'bank_transfer' && !!input.bankAccountId)
  const poStatus: PurchaseOrderStatus = status ?? (settledOnCreate ? 'paid' : 'pending')

  const batch = writeBatch(db)
  const poRef = doc(collection(db, 'purchase_orders'))
  const date = Timestamp.fromDate(new Date(input.date))
  batch.set(poRef, {
    poNumber,
    supplierId: input.supplierId,
    supplierName: input.supplierName,
    constructionSiteId: input.constructionSiteId,
    siteName: input.siteName,
    lineItems,
    vatEnabled: input.vatEnabled,
    vatPercent: input.vatPercent,
    vatOverridden: input.vatOverridden ?? false,
    vatOverrideReason: input.vatOverrideReason ?? '',
    subtotal,
    grandTotal,
    paymentMethod: input.paymentMethod,
    bankAccountId: input.paymentMethod === 'bank_transfer' ? (input.bankAccountId ?? '') : '',
    status: poStatus,
    date,
    createdBy,
  })

  if (input.paymentMethod === 'bank_transfer' && input.bankAccountId) {
    batch.set(doc(collection(db, 'bank_transactions')), {
      bankAccountId: input.bankAccountId,
      type: 'debit',
      amount: grandTotal,
      source: 'po_payment',
      sourceRef: poRef.id,
      date,
      balanceAfter: 0, // filled in by onBankTransactionWrite
      createdBy,
    })
  } else if (input.paymentMethod === 'cash') {
    batch.set(doc(collection(db, 'cash_transactions')), {
      type: 'debit',
      amount: grandTotal,
      source: 'po_payment',
      sourceRef: poRef.id,
      date,
      balanceAfter: 0, // filled in by onCashTransactionWrite
      createdBy,
    })
  }

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
