import { addDoc, collection, doc, updateDoc, Timestamp } from 'firebase/firestore'
import { db } from '@/shared/lib/firebase'
import type { PaymentMethod } from '@/shared/types/entities'

export interface AddIncomeInput {
  customerName: string
  constructionSiteId?: string
  siteName?: string
  referenceNumber?: string
  amount: number
  paymentMethod: PaymentMethod
  date: string
  dueDate?: string
  notes?: string
  receivedBy: string
}

export function addIncome(input: AddIncomeInput) {
  const isCredit = input.paymentMethod === 'credit'
  return addDoc(collection(db, 'project_payments'), {
    projectId: '',
    customerName: input.customerName,
    siteName: input.siteName ?? '',
    date: Timestamp.fromDate(new Date(input.date)),
    amount: input.amount,
    paymentType: input.paymentMethod,
    referenceNumber: input.referenceNumber ?? '',
    receivedBy: input.receivedBy,
    status: isCredit ? 'pending_clearance' : 'completed',
    expectedDate: isCredit && input.dueDate ? Timestamp.fromDate(new Date(input.dueDate)) : null,
    attachments: [],
    createdAt: Timestamp.now(),
  })
}

export function markIncomeReceived(id: string) {
  return updateDoc(doc(db, 'project_payments', id), { status: 'completed' })
}
