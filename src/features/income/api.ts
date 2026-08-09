import { collection, doc, updateDoc, writeBatch, Timestamp } from 'firebase/firestore'
import { db } from '@/shared/lib/firebase'
import type { PaymentMethod } from '@/shared/types/entities'

export interface AddIncomeInput {
  customerName: string
  constructionSiteId?: string
  siteName?: string
  referenceNumber?: string
  amount: number
  paymentMethod: PaymentMethod
  bankAccountId?: string
  date: string
  dueDate?: string
  notes?: string
  receivedBy: string
}

export async function addIncome(input: AddIncomeInput) {
  const isCredit = input.paymentMethod === 'credit'
  const date = Timestamp.fromDate(new Date(input.date))

  const batch = writeBatch(db)
  const paymentRef = doc(collection(db, 'project_payments'))
  batch.set(paymentRef, {
    projectId: '',
    customerName: input.customerName,
    siteName: input.siteName ?? '',
    date,
    amount: input.amount,
    paymentType: input.paymentMethod,
    bankAccountId: input.paymentMethod === 'bank_transfer' ? (input.bankAccountId ?? '') : '',
    referenceNumber: input.referenceNumber ?? '',
    receivedBy: input.receivedBy,
    status: isCredit ? 'pending_clearance' : 'completed',
    expectedDate: isCredit && input.dueDate ? Timestamp.fromDate(new Date(input.dueDate)) : null,
    attachments: [],
    allocations: [],
    createdAt: Timestamp.now(),
  })

  if (input.paymentMethod === 'bank_transfer' && input.bankAccountId) {
    batch.set(doc(collection(db, 'bank_transactions')), {
      bankAccountId: input.bankAccountId,
      type: 'credit',
      amount: input.amount,
      source: 'project_payment',
      sourceRef: paymentRef.id,
      date,
      balanceAfter: 0, // filled in by onBankTransactionWrite
      createdBy: input.receivedBy,
    })
  } else if (input.paymentMethod === 'cash') {
    batch.set(doc(collection(db, 'cash_transactions')), {
      type: 'credit',
      amount: input.amount,
      source: 'project_payment',
      sourceRef: paymentRef.id,
      date,
      balanceAfter: 0, // filled in by onCashTransactionWrite
      createdBy: input.receivedBy,
    })
  }

  await batch.commit()
  return paymentRef.id
}

export function markIncomeReceived(id: string) {
  return updateDoc(doc(db, 'project_payments', id), { status: 'completed' })
}
